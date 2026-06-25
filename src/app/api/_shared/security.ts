import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ZodError, type ZodType } from "zod";
import type { Profile } from "@/lib/types";

const AUTH_ERROR_MESSAGES = new Set([
  "Missing bearer token.",
  "Invalid session.",
  "Profile not found. Complete sign-up before using Mentora.",
]);
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  return NextResponse.json(data, { ...init, headers });
}

export function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

export function streamHeaders(contentType: string) {
  return {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>, maxBytes = 16 * 1024) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json.");
  }

  enforceContentLength(request, maxBytes);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  return schema.parse(payload);
}

export function enforceContentLength(request: Request, maxBytes: number, requireHeader = false) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    if (requireHeader) {
      throw new ApiError(411, "Content-Length header is required.");
    }

    return;
  }

  const bytes = Number(contentLength);
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new ApiError(400, "Invalid Content-Length header.");
  }

  if (bytes > maxBytes) {
    throw new ApiError(413, "Request body is too large.");
  }
}

export function rateLimit(key: string, limit: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function rateLimitKey(request: Request, userId: string, action: string) {
  return `${action}:${userId}`;
}

export async function requireOwnedStudySpace(service: SupabaseClient, profile: Profile, studySpaceId: string) {
  const { data: space, error } = await service
    .from("study_spaces")
    .select("id")
    .eq("id", studySpaceId)
    .eq("tenant_id", profile.tenant_id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!space) {
    throw new ApiError(404, "Study space not found.");
  }

  return space;
}

export function isPdfBuffer(buffer: Buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).equals(Buffer.from("%PDF-"));
}

export function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return "Request body failed validation.";
  }

  if (error instanceof Error && AUTH_ERROR_MESSAGES.has(error.message)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 280);
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message.length > 0) {
      return message.slice(0, 280);
    }
  }

  return fallback;
}

export function errorResponse(error: unknown, fallback = "Request failed.") {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return jsonResponse({ error: "Request body failed validation." }, { status: 400 });
  }

  if (error instanceof Error && AUTH_ERROR_MESSAGES.has(error.message)) {
    return jsonResponse({ error: error.message }, { status: 401 });
  }

  console.error(error);
  return jsonResponse({ error: safeErrorMessage(error, fallback) }, { status: 500 });
}
