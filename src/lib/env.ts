import { z } from "zod";

const optionalSecret = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
});

const parsedEnv = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsedEnv.success) {
  const invalid = [...new Set(parsedEnv.error.issues.map((issue) => issue.path[0]).filter(Boolean))];
  throw new Error(`Invalid environment variables: ${invalid.join(", ")}`);
}

export const publicEnv = parsedEnv.data;
