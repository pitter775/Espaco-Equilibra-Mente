import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail } from "@/lib/data";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";
import { setSessionCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

type GoogleUserInfo = {
  email?: string;
  name?: string;
  picture?: string;
};

async function getGoogleUser(code: string, origin: string): Promise<GoogleUserInfo | null> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(origin);
  if (!clientId || !clientSecret) return null;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) return null;
  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) return null;

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) return null;
  return userResponse.json() as Promise<GoogleUserInfo>;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("eqm-google-state")?.value;
  if (!code) return NextResponse.redirect(new URL("/login?erro=google", request.url));
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?erro=google", request.url));
  }

  const googleUser = await getGoogleUser(code, new URL(request.url).origin);
  if (!googleUser?.email) {
    return NextResponse.redirect(new URL("/login?erro=google", request.url));
  }

  const googleData = {
    name: googleUser.name ?? googleUser.email,
    email: googleUser.email,
    photo: googleUser.picture ?? null,
  };

  let profile = await getProfileByEmail(googleData.email);

  if (!profile) {
    const { data: created } = await getSupabaseAdmin()
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        name: googleData.name,
        email: googleData.email,
        photo: googleData.photo,
        tipo_usuario: "cliente",
        cadastro_completo: false,
        status_aprovacao: "pendente",
      })
      .select("*")
      .single();
    profile = created;
  }

  const redirectCookie = request.cookies.get("eqm-auth-redirect")?.value;
  const redirectTo = profile?.cadastro_completo ? redirectCookie || "/" : "/completar-cadastro";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  if (profile?.id) setSessionCookie(response, profile.id);
  response.cookies.set("eqm-google-data", JSON.stringify(googleData), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });
  response.cookies.delete("eqm-auth-redirect");
  response.cookies.delete("eqm-google-state");
  return response;
}
