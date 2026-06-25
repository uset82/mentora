import { z } from "zod";
import { generateGroundedText } from "@/lib/ai/gateway";
import { isFreeOpenRouterModel } from "@/lib/ai/models";
import { buildToolPrompt, tutorSystemPrompt } from "@/lib/ai/prompts";
import { retrieveCitations } from "@/lib/rag/search";
import { getAuthedProfile } from "@/lib/supabase/service";
import {
  errorResponse,
  jsonError,
  jsonResponse,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const toolSchema = z.object({
  studySpaceId: z.string().uuid(),
  kind: z.enum(["quiz", "flashcards", "apa_summary"]),
  locale: z.enum(["es", "en"]).default("es"),
  model: z.string().trim().min(1).max(160).optional(),
  openRouterApiKey: z.string().trim().min(20).max(512).optional(),
});

const titles = {
  es: {
    quiz: "Quiz generado",
    flashcards: "Flashcards generadas",
    apa_summary: "Resumen APA",
  },
  en: {
    quiz: "Generated quiz",
    flashcards: "Generated flashcards",
    apa_summary: "APA summary",
  },
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  let usageContext:
    | {
        service: Awaited<ReturnType<typeof getAuthedProfile>>["service"];
        profile: Awaited<ReturnType<typeof getAuthedProfile>>["profile"];
        task: z.infer<typeof toolSchema>["kind"];
        provider: string;
        model: string;
      }
    | null = null;

  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, toolSchema);
    const limit = rateLimit(rateLimitKey(request, profile.id, "tools"), 20);
    if (!limit.ok) {
      return jsonError("Too many generation requests. Please wait a minute and try again.", 429);
    }

    if (body.model && !(await isFreeOpenRouterModel(body.model)) && !body.openRouterApiKey) {
      return jsonError("Paid models require the student to connect their own OpenRouter account. Mentora only provides access to free models.", 402);
    }

    await requireOwnedStudySpace(service, profile, body.studySpaceId);

    let provider = "unknown";
    let model = "unknown";
    usageContext = { service, profile, task: body.kind, provider, model };

    const citations = await retrieveCitations({
      service,
      tenantId: profile.tenant_id,
      studySpaceId: body.studySpaceId,
      query: `Generate ${body.kind} from the most important concepts in this study space.`,
      limit: 12,
    });

    if (citations.length === 0) {
      return jsonError("No ready source chunks found for this study space.", 409);
    }

    const aiResult = await generateGroundedText({
      task: body.kind,
      priority: body.kind === "apa_summary" ? "quality" : "cost",
      system: tutorSystemPrompt,
      prompt: buildToolPrompt(body.kind, citations, body.locale, profile.learning_profile),
      model: body.model,
      openRouterApiKey: body.openRouterApiKey,
    });
    provider = aiResult.provider;
    model = aiResult.model;
    usageContext = { service, profile, task: body.kind, provider, model };

    const title = titles[body.locale][body.kind];
    const { data: artifact, error: artifactError } = await service
      .from("generated_artifacts")
      .insert({
        tenant_id: profile.tenant_id,
        user_id: profile.id,
        study_space_id: body.studySpaceId,
        kind: body.kind,
        title,
        content: aiResult.text,
        citations,
      })
      .select("id, study_space_id, kind, title, content, citations, created_at")
      .single();

    if (artifactError || !artifact) {
      throw artifactError ?? new Error("Unable to save generated artifact.");
    }

    await service.from("ai_usage_logs").insert({
      tenant_id: profile.tenant_id,
      user_id: profile.id,
      task: body.kind,
      provider: aiResult.provider,
      model: aiResult.model,
      input_tokens: aiResult.inputTokens,
      output_tokens: aiResult.outputTokens,
      latency_ms: aiResult.latencyMs,
      status: "success",
      metadata: { route_latency_ms: Date.now() - startedAt },
    });

    return jsonResponse({ artifact, provider: aiResult.provider, model: aiResult.model });
  } catch (error) {
    if (usageContext) {
      await usageContext.service.from("ai_usage_logs").insert({
        tenant_id: usageContext.profile.tenant_id,
        user_id: usageContext.profile.id,
        task: usageContext.task,
        provider: usageContext.provider,
        model: usageContext.model,
        latency_ms: Date.now() - startedAt,
        status: "error",
        error_message: safeErrorMessage(error, "Unknown study tool error."),
      });
    }

    return errorResponse(error, "Unable to generate study tool.");
  }
}
