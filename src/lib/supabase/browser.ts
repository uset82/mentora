"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export function createClient() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      fetch: async (input, init) => {
        try {
          return await fetch(input, init);
        } catch {
          return new Response(JSON.stringify({ error: "Network connection unavailable." }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      },
    },
  });
}
