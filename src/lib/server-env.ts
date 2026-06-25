import { z } from "zod";

const optionalSecret = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  OPENAI_API_KEY: optionalSecret,
  AI_PROVIDER: z.enum(["openai", "openrouter"]).default("openai"),
  OPENAI_CHAT_MODEL_FAST: z.string().default("gpt-5.4-mini"),
  OPENAI_CHAT_MODEL_QUALITY: z.string().default("gpt-5.5"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OPENROUTER_API_KEY: optionalSecret,
  OPENROUTER_MODEL: z.string().default("openrouter/free"),
  OPENROUTER_OCR_MODEL: z.string().default("nvidia/nemotron-nano-12b-v2-vl:free"),
  OPENROUTER_APP_NAME: z.string().default("Mentora"),
  OPENROUTER_APP_URL: optionalUrl,
});

const parsedEnv = serverEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_CHAT_MODEL_FAST: process.env.OPENAI_CHAT_MODEL_FAST,
  OPENAI_CHAT_MODEL_QUALITY: process.env.OPENAI_CHAT_MODEL_QUALITY,
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
  OPENAI_EMBEDDING_DIMENSIONS: process.env.OPENAI_EMBEDDING_DIMENSIONS,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  OPENROUTER_OCR_MODEL: process.env.OPENROUTER_OCR_MODEL,
  OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
  OPENROUTER_APP_URL: process.env.OPENROUTER_APP_URL,
});

if (typeof window !== "undefined") {
  throw new Error("Server environment variables cannot be imported in the browser.");
}

if (!parsedEnv.success) {
  const invalid = [...new Set(parsedEnv.error.issues.map((issue) => issue.path[0]).filter(Boolean))];
  throw new Error(`Invalid environment variables: ${invalid.join(", ")}`);
}

export const env = parsedEnv.data;

export function assertServerEnv(keys: Array<keyof typeof env>) {
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
