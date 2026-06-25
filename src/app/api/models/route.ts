import { z } from "zod";
import { listOpenRouterModels, OpenRouterConnectionError, verifyOpenRouterApiKey } from "@/lib/ai/models";
import { getAuthedProfile } from "@/lib/supabase/service";
import { env } from "@/lib/server-env";
import {
  errorResponse,
  jsonError,
  jsonResponse,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

export async function GET() {
  const models = await listOpenRouterModels();
  return jsonResponse({
    models,
    serverConnected: Boolean(env.OPENROUTER_API_KEY),
  });
}

const connectionSchema = z.object({
  apiKey: z.string().trim().min(20).max(512),
});

export async function POST(request: Request) {
  try {
    const { profile } = await getAuthedProfile(request.headers.get("authorization"));
    const limit = rateLimit(rateLimitKey(request, profile.id, "openrouter-connect"), 8);
    if (!limit.ok) {
      return jsonError("Too many OpenRouter connection attempts. Please wait a minute.", 429);
    }

    const { apiKey } = await parseJsonBody(request, connectionSchema, 2 * 1024);
    const account = await verifyOpenRouterApiKey(apiKey);
    return jsonResponse({ connected: true, account });
  } catch (error) {
    if (error instanceof OpenRouterConnectionError) {
      return jsonError(error.message, error.status);
    }

    return errorResponse(error, "Unable to connect OpenRouter.");
  }
}
