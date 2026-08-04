import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin, getSupabaseAnon } from "@/lib/supabase";

async function signIn(email: string, password: string) {
  return getSupabaseAnon().auth.signInWithPassword({ email, password });
}

async function createSupabaseAuthFromLegacyUser(email: string, password: string) {
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("users")
    .select("id,name,email,password,tipo_usuario")
    .ilike("email", email)
    .maybeSingle();

  if (!profile?.password) return null;

  const legacyHash = String(profile.password).replace(/^\$2y\$/, "$2a$");
  const passwordMatches = await bcrypt.compare(password, legacyHash).catch(() => false);
  if (!passwordMatches) return null;

  const { error } = await supabase.auth.admin.createUser({
    email: profile.email,
    password,
    email_confirm: true,
    user_metadata: {
      name: profile.name,
      tipo_usuario: profile.tipo_usuario ?? "cliente",
      legacy_user_id: profile.id,
    },
  });

  return !error || error.message.toLowerCase().includes("already") ? String(profile.id) : null;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirect_to") ?? "/");
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

  let { data, error } = await signIn(email, password);

  if (error || !data.session) {
    const legacyUserId = await createSupabaseAuthFromLegacyUser(email, password);
    if (legacyUserId) {
      const retry = await signIn(email, password);
      data = retry.data;
      error = retry.error;

      if (retry.error || !retry.data.session) {
        const response = NextResponse.redirect(new URL(safeRedirect, request.url));
        response.cookies.set("eqm-legacy-user-id", legacyUserId, { httpOnly: true, sameSite: "lax", path: "/" });
        return response;
      }
    }
  }

  if (error || !data.session) {
    const failedUrl = new URL(safeRedirect, request.url);
    failedUrl.searchParams.set("auth_error", "1");
    return NextResponse.redirect(failedUrl);
  }
  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  response.cookies.delete("eqm-legacy-user-id");
  response.cookies.set("sb-access-token", data.session.access_token, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set("sb-refresh-token", data.session.refresh_token, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
