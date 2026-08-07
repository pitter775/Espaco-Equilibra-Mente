import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function getGoogleConfig(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `${origin}/login/google/callback`;
  return { clientId, redirectUri };
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const salaId = request.nextUrl.searchParams.get("sala_id");
  const anchor = request.nextUrl.searchParams.get("anchor");
  const hash = anchor && /^[a-z0-9_-]+$/i.test(anchor) ? `#${anchor}` : "";
  const redirectAfterLogin = salaId ? `/sala/${salaId}${hash}` : request.headers.get("referer") ?? "/";
  const { clientId, redirectUri } = getGoogleConfig(origin);

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?erro=google", request.url));
  }

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  const response = NextResponse.redirect(url);
  response.cookies.set("eqm-auth-redirect", redirectAfterLogin, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("eqm-google-state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
