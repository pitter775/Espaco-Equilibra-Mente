import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin, getSupabaseAnon } from "@/lib/supabase";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isAuthId(id: string) {
  return id.includes("-");
}

async function verifyPassword(email: string, password: string) {
  const { error } = await getSupabaseAnon().auth.signInWithPassword({ email, password });
  return !error;
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

    if (isAuthId(user.id)) {
      await supabase.auth.admin.updateUserById(user.id, { email, user_metadata: { name } });
    }

    return redirectTo(request, "status=perfil");
  }

  if (action === "password") {
    const currentPassword = clean(form.get("current_password"));
    const password = clean(form.get("password"));
    const confirmation = clean(form.get("password_confirmation"));
    if (!user.email || !isAuthId(user.id) || password.length < 8 || password !== confirmation) return redirectTo(request, "erro=senha");
    if (!(await verifyPassword(user.email, currentPassword))) return redirectTo(request, "erro=senha");

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) return redirectTo(request, "erro=senha");

    return redirectTo(request, "status=senha");
  }

  if (action === "delete") {
    const currentPassword = clean(form.get("current_password"));
    if (!user.email || !isAuthId(user.id)) return redirectTo(request, "erro=auth");
    if (!(await verifyPassword(user.email, currentPassword))) return redirectTo(request, "erro=excluir");

    await supabase.from("users").delete().eq("id", user.id);
    await supabase.auth.admin.deleteUser(user.id);

    const response = NextResponse.redirect(new URL("/login?conta=excluida", request.url));
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith("sb-") || cookie.name === "eqm-google-data") response.cookies.delete(cookie.name);
    }
    return response;
  }

  return redirectTo(request, "erro=perfil");
}
