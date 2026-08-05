import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const salaId = request.nextUrl.searchParams.get("sala_id");
  const anchor = request.nextUrl.searchParams.get("anchor");
  const hash = anchor && /^[a-z0-9_-]+$/i.test(anchor) ? `#${anchor}` : "";
  const redirectAfterLogin = salaId ? `/sala/${salaId}${hash}` : request.headers.get("referer") ?? "/";

  const { data, error } = await getSupabaseAnon().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/login/google/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?erro=google", request.url));
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set("eqm-auth-redirect", redirectAfterLogin, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
