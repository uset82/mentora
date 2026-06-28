import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{ email: string; password: string }>;
  const email = typeof body.email === "string" ? body.email : process.env.NEXT_PUBLIC_MENTORA_DEV_EMAIL;
  const password = typeof body.password === "string" ? body.password : process.env.NEXT_PUBLIC_MENTORA_DEV_PASSWORD;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing dev email or password" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey || !anonKey) {
    return NextResponse.json({ error: "Supabase keys not configured" }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const anonClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // 1. Try creating the user as already confirmed
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Dev User", tenant_name: "Dev Workspace" },
    });

    if (!createError) {
      const userId = createData.user?.id;
      if (userId) {
        // Make sure profile exists even if the trigger didn't run
        const { data: prof } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
        if (!prof) {
          const tenantLabel = "Dev Workspace";
          const slug = tenantLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + userId.slice(0, 8);
          const { data: tenantRow } = await admin.from("tenants").insert({ name: tenantLabel, slug, type: "individual" }).select("id").single();
          const tenantId = tenantRow?.id;
          if (tenantId) {
            await admin.from("profiles").insert({
              id: userId,
              tenant_id: tenantId,
              email,
              full_name: "Dev User",
              role: "student",
              learning_profile: {},
            });
          }
        }
      }

      // For dev convenience: sign in with anon client and return tokens so client can setSession directly
      const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password });
      if (signInErr) {
        return NextResponse.json({ ok: true, action: "created_and_confirmed", user: userId, warning: "sign in after create failed: " + signInErr.message });
      }
      return NextResponse.json({ ok: true, action: "created_and_confirmed", user: userId, session: signInData.session });
    }

    const msg = String(createError.message || "").toLowerCase();

    if (msg.includes("already") || msg.includes("registered")) {
      // 2. User exists — find them and force confirm
      const { data: listData, error: listError } = await admin.auth.admin.listUsers({
        perPage: 200,
        page: 1,
      });

      if (listError) throw listError;

      const existing = listData?.users?.find((user: User) => user.email?.toLowerCase() === email.toLowerCase());

      if (existing) {
        const userId = existing.id;

        // Force confirm the email + password
        const { error: confirmError } = await admin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (confirmError) throw confirmError;

        const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
          password,
        });
        if (passwordError) throw passwordError;

        // Ensure a profile + tenant exists (the trigger sometimes doesn't fire cleanly for admin-created users)
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile) {
          const tenantLabel = "Dev Workspace";
          const slug = tenantLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + userId.slice(0, 8);

          const { data: tenantRow, error: tenantErr } = await admin
            .from("tenants")
            .insert({ name: tenantLabel, slug, type: "individual" })
            .select("id")
            .single();

          if (tenantErr) {
            // If slug collision, try to find existing tenant or continue
            const { data: tenantLookup } = await admin
              .from("tenants")
              .select("id")
              .eq("slug", slug)
              .maybeSingle();
            if (tenantLookup) {
              await admin.from("profiles").insert({
                id: userId,
                tenant_id: tenantLookup.id,
                email,
                full_name: "Dev User",
                role: "student",
                learning_profile: {},
              });
            }
          } else if (tenantRow) {
            await admin.from("profiles").insert({
              id: userId,
              tenant_id: tenantRow.id,
              email,
              full_name: "Dev User",
              role: "student",
              learning_profile: {},
            });
          }
        }

        // For dev convenience: sign in with anon client and return tokens so client can setSession directly
        const { data: signInData2, error: signInErr2 } = await anonClient.auth.signInWithPassword({ email, password });
        if (signInErr2) {
          return NextResponse.json({ ok: true, action: "confirmed_existing", user: userId, warning: "sign in failed: " + signInErr2.message });
        }
        return NextResponse.json({ ok: true, action: "confirmed_existing", user: userId, session: signInData2.session });
      }
    }

    throw createError;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to ensure dev user";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
