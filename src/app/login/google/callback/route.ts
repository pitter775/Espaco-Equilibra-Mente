import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail } from "@/lib/data";
import { getSupabaseAdmin, getSupabaseAnon } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?erro=google", request.url));

  const { data, error } = await getSupabaseAnon().auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?erro=google", request.url));
  }

  const googleData = {
    name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email,
    email: data.user.email,
    photo: data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture ?? null,
  };

  let profile = await getProfileByEmail(googleData.email);

  if (!profile) {
    const { data: created } = await getSupabaseAdmin()
      .from("users")
      .insert({
        id: data.user.id,
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
  response.cookies.set("sb-access-token", data.session.access_token, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set("sb-refresh-token", data.session.refresh_token, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set("eqm-google-data", JSON.stringify(googleData), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });
  response.cookies.delete("eqm-auth-redirect");
  return response;
}
