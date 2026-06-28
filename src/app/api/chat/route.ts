import { z } from "zod";
import { generateGroundedText } from "@/lib/ai/gateway";
import { isFreeOpenRouterModel } from "@/lib/ai/models";
import { getAuthedProfile } from "@/lib/supabase/service";
import { SAFETY_LIMITS } from "@/lib/limits";
import {
  generalTutorSystemPrompt,
  tutorSystemPrompt,
  buildGeneralTutorPrompt,
  buildGroundedPrompt,
} from "@/lib/ai/prompts";

import { orchestrateChat } from "@/lib/ai/agents/orchestrator-agent";
import { streamAnswer } from "@/lib/ai/agents/answer-agent";
import {
  errorResponse,
  jsonError,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
  streamHeaders,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const chatSchema = z.object({
  studySpaceId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(["es", "en"]).default("es"),
  model: z.string().trim().min(1).max(160).optional(),
  openRouterApiKey: z.string().trim().min(20).max(512).optional(),
  mode: z.enum(["fast", "tutor", "agent"]).default("fast"),
  selectedDocumentIds: z.array(z.string().uuid()).max(20).default([]),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, chatSchema);
    const limit = rateLimit(rateLimitKey(request, profile.id, "chat"), 30);
    if (!limit.ok) {
      return jsonError("Too many chat requests. Please wait a minute and try again.", 429);
    }

    if (body.model && !(await isFreeOpenRouterModel(body.model)) && !body.openRouterApiKey) {
      return jsonError(
        "Paid models require the student to connect their own OpenRouter account. Mentora only provides access to free models.",
        402
      );
    }

    const encoder = new TextEncoder();
    function encodeEvent(event: string, data: unknown) {
      return encoder.encode(`${JSON.stringify({ event, data })}\n`);
    }

    await requireOwnedStudySpace(service, profile, body.studySpaceId);
    // --- AGENT INTERACTION: Orchestrate chat, fetch ready citations or precomputed outputs ---
    const orchResult = await orchestrateChat({
      service,
      tenantId: profile.tenant_id,
      studySpaceId: body.studySpaceId,
      message: body.message,
      mode: body.mode,
      locale: body.locale,
      selectedDocumentIds: body.selectedDocumentIds,
    });

    const citations = orchResult.citations;
    const responseMeta = {
      sourceCount: orchResult.selectedSourceCount ?? body.selectedDocumentIds.length,
      citationsCount: citations.length,
      mode: body.mode,
      selectedSourceNames: orchResult.selectedSourceNames ?? [],
    };

    // Persist conversation and user message
    const { data: conversation, error: conversationError } = await service
      .from("conversations")
      .insert({
        tenant_id: profile.tenant_id,
        study_space_id: body.studySpaceId,
        user_id: profile.id,
        title: body.message.slice(0, 90),
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      throw conversationError ?? new Error("Unable to create conversation.");
    }

    const { error: userMessageError } = await service.from("messages").insert({
      tenant_id: profile.tenant_id,
      conversation_id: conversation.id,
      user_id: profile.id,
      role: "user",
      content: body.message,
    });

    if (userMessageError) {
      throw userMessageError;
    }

    return new Response(
      new ReadableStream({
        async start(controller) {
          let answer = "";
          let provider = "precomputed";
          let modelUsed = "precomputed";

          try {
            // Enqueue initial metadata details
            controller.enqueue(
              encodeEvent("meta", {
                conversationId: conversation.id,
                citations,
                ...responseMeta,
                provider,
                model: modelUsed,
              })
            );

            if (orchResult.precomputedText) {
              // Respond instantly with cached summary/diagram
              answer = orchResult.precomputedText;
              controller.enqueue(encodeEvent("delta", answer));
            } else {
              // Invoke Answer Agent to stream response
              const aiStream = await streamAnswer({
                message: body.message,
                locale: body.locale,
                citations,
                learningProfile: profile.learning_profile,
                model: body.model,
                openRouterApiKey: body.openRouterApiKey,
              });

              provider = aiStream.provider;
              modelUsed = aiStream.model;

              // Iterate AI stream with a timeout race
              const iterator = aiStream.textStream[Symbol.asyncIterator]();
              const firstResultPromise = iterator.next();
              const firstResult = await Promise.race([
                firstResultPromise,
                new Promise<never>((_, reject) =>
                  setTimeout(
                    () =>
                      reject(
                        new Error(
                          `Tutor model first token timed out after ${SAFETY_LIMITS.FIRST_TOKEN_TIMEOUT}ms.`
                        )
                      ),
                    SAFETY_LIMITS.FIRST_TOKEN_TIMEOUT
                  )
                ),
              ]);

              if (!firstResult.done) {
                const delta = firstResult.value;
                answer += delta;
                controller.enqueue(encodeEvent("delta", delta));
              }

              while (true) {
                const nextResult = await iterator.next();
                if (nextResult.done) {
                  break;
                }
                const delta = nextResult.value;
                answer += delta;
                controller.enqueue(encodeEvent("delta", delta));
              }
            }

            if (!answer.trim()) {
              throw new Error("No output generated. Check the stream for errors.");
            }

            // Store AI answer in database
            const { data: assistantMessage, error: messageError } = await service
              .from("messages")
              .insert({
                tenant_id: profile.tenant_id,
                conversation_id: conversation.id,
                user_id: profile.id,
                role: "assistant",
                content: answer,
                citations,
              })
              .select("id")
              .single();

            if (messageError) {
              throw messageError;
            }

            // Log successful AI logs
            await service.from("ai_usage_logs").insert({
              tenant_id: profile.tenant_id,
              user_id: profile.id,
              task: "tutor_chat",
              provider,
              model: modelUsed,
              status: "success",
              latency_ms: Date.now() - startedAt,
              metadata: {
                route_latency_ms: Date.now() - startedAt,
                mode: body.mode,
                intent: orchResult.intent,
                selected_document_count: body.selectedDocumentIds.length,
              },
            });

            controller.enqueue(
              encodeEvent("done", {
                conversationId: conversation.id,
                messageId: assistantMessage?.id,
                answer,
                citations,
                ...responseMeta,
                provider,
                model: modelUsed,
              })
            );
            controller.close();
          } catch (error) {
            const streamErrorMessage = safeErrorMessage(error, "Unknown chat streaming error.");
            await service.from("ai_usage_logs").insert({
              tenant_id: profile.tenant_id,
              user_id: profile.id,
              task: "tutor_chat",
              provider,
              model: modelUsed,
              latency_ms: Date.now() - startedAt,
              status: "error",
              error_message: streamErrorMessage,
            });

            try {
              // Degrade gracefully with fallback only if we were NOT doing precomputed response
              if (orchResult.precomputedText) {
                throw error;
              }

              const isGeneralChat = citations.length === 0;
              const fallbackSystem = isGeneralChat ? generalTutorSystemPrompt : tutorSystemPrompt;
              const fallbackPrompt = isGeneralChat
                ? buildGeneralTutorPrompt(body.message, body.locale, profile.learning_profile)
                : buildGroundedPrompt(body.message, citations, body.locale, profile.learning_profile);

              const fallback = await generateGroundedText({
                task: "tutor_chat",
                priority: "speed",
                system: fallbackSystem,
                prompt: fallbackPrompt,
                model: body.model ? "openrouter/free" : undefined,
                openRouterApiKey: undefined,
              });
              const fallbackAnswer = fallback.text.trim();

              if (!fallbackAnswer) {
                throw new Error("Fallback model returned an empty answer.");
              }

              const { data: assistantMessage, error: messageError } = await service
                .from("messages")
                .insert({
                  tenant_id: profile.tenant_id,
                  conversation_id: conversation.id,
                  user_id: profile.id,
                  role: "assistant",
                  content: fallbackAnswer,
                  citations,
                })
                .select("id")
                .single();

              if (messageError) {
                throw messageError;
              }

              await service.from("ai_usage_logs").insert({
                tenant_id: profile.tenant_id,
                user_id: profile.id,
                task: "tutor_chat",
                provider: fallback.provider,
                model: fallback.model,
                input_tokens: fallback.inputTokens,
                output_tokens: fallback.outputTokens,
                latency_ms: fallback.latencyMs,
                status: "success",
                metadata: {
                  route_latency_ms: Date.now() - startedAt,
                  fallback_reason: streamErrorMessage,
                },
              });

              controller.enqueue(
                encodeEvent("done", {
                  conversationId: conversation.id,
                  messageId: assistantMessage?.id,
                  answer: fallbackAnswer,
                  citations,
                  ...responseMeta,
                  provider: fallback.provider,
                  model: fallback.model,
                })
              );
            } catch {
              const errorText =
                body.locale === "es"
                  ? "Estoy teniendo problemas para obtener una respuesta completa. Por favor intenta de nuevo."
                  : "I am having trouble getting a complete answer. Please try again.";

              controller.enqueue(
                encodeEvent("error", {
                  error: "Tutor request failed.",
                  answer: errorText,
                  citations,
                  ...responseMeta,
                })
              );
            }
            controller.close();
          }
        },
      }),
      { headers: streamHeaders("application/x-ndjson; charset=utf-8") }
    );
  } catch (error) {
    return errorResponse(error, "Unable to start tutor request.");
  }
}
