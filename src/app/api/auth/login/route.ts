import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirect_to") ?? "/");
  const { data, error } = await getSupabaseAnon().auth.signInWithPassword({ email, password });
  if (error || !data.session) return NextResponse.redirect(new URL("/login?erro=1", request.url));
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  response.cookies.set("sb-access-token", data.session.access_token, { httpOnly: true, sameSite: "lax", path: "/" });
  response.cookies.set("sb-refresh-token", data.session.refresh_token, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
