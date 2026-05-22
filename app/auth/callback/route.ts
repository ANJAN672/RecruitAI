import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Redirect back to /auth carrying the real reason so it can be shown to the user.
  const fail = (reason: string) =>
    NextResponse.redirect(
      `${origin}/auth?error=auth_callback_error&reason=${encodeURIComponent(reason)}`
    );

  // The provider (Google / Supabase) can redirect back with an error instead of a code.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    console.error("[auth/callback] provider error:", providerError);
    return fail(providerError);
  }

  if (!code) {
    console.error("[auth/callback] no code in callback URL");
    return fail("missing_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return fail(error.message);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv || !forwardedHost) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`https://${forwardedHost}${next}`);
}
