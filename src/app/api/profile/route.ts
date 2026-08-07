import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";
import { clearSessionCookies } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function verifyPassword(userId: string, password: string) {
  const { data } = await getSupabaseAdmin().from("users").select("password").eq("id", userId).maybeSingle();
  if (!data?.password) return false;
  const hash = String(data.password).replace(/^\$2y\$/, "$2a$");
  return bcrypt.compare(password, hash).catch(() => false);
}

function redirectTo(request: NextRequest, query: string) {
  return NextResponse.redirect(new URL(`/profile?${query}`, request.url));
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const form = await request.formData();
  const action = clean(form.get("action"));
  const supabase = getSupabaseAdmin();

  if (action === "profile") {
    const name = clean(form.get("name"));
    const email = clean(form.get("email")).toLowerCase();
    if (!name || !email) return redirectTo(request, "erro=perfil");

    const { error } = await supabase.from("users").update({ name, email }).eq("id", user.id);
    if (error) return redirectTo(request, "erro=perfil");

    return redirectTo(request, "status=perfil");
  }

  if (action === "password") {
    const currentPassword = clean(form.get("current_password"));
    const password = clean(form.get("password"));
    const confirmation = clean(form.get("password_confirmation"));
    if (password.length < 8 || password !== confirmation) return redirectTo(request, "erro=senha");
    if (!(await verifyPassword(user.id, currentPassword))) return redirectTo(request, "erro=senha");

    const { error } = await supabase.from("users").update({ password: await bcrypt.hash(password, 12) }).eq("id", user.id);
    if (error) return redirectTo(request, "erro=senha");

    return redirectTo(request, "status=senha");
  }

  if (action === "delete") {
    const currentPassword = clean(form.get("current_password"));
    if (!(await verifyPassword(user.id, currentPassword))) return redirectTo(request, "erro=excluir");

    await supabase.from("users").delete().eq("id", user.id);

    const response = NextResponse.redirect(new URL("/login?conta=excluida", request.url));
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith("sb-") || cookie.name.startsWith("eqm-")) response.cookies.delete(cookie.name);
    }
    clearSessionCookies(response);
    return response;
  }

  return redirectTo(request, "erro=perfil");
}
