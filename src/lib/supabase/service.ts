import { createClient } from "@supabase/supabase-js";
import { assertServerEnv, env } from "@/lib/server-env";

export function createServiceClient() {
  assertServerEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAuthedProfile(authorization: string | null) {
  assertServerEnv(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

  if (!authorization) {
    throw new Error("Missing bearer token.");
  }

  const bearerMatch = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!bearerMatch) {
    throw new Error("Invalid session.");
  }

  const token = bearerMatch[1];
  const authClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user?.email) {
    throw new Error("Invalid session.");
  }

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, tenant_id, email, full_name, role, learning_profile")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found. Complete sign-up before using Mentora.");
  }

  return { user: userData.user, profile, service, token };
}
