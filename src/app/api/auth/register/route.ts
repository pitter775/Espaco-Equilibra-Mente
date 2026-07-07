import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseAnon } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");
  const telefone = String(form.get("telefone") ?? "");
  const cpf = String(form.get("cpf") ?? "");

  const { data, error } = await getSupabaseAnon().auth.signUp({ email, password, options: { data: { name } } });
  if (error || !data.user) return NextResponse.redirect(new URL("/register?erro=1", request.url));

  await getSupabaseAdmin().from("users").upsert({
    id: data.user.id,
    name,
    email,
    telefone,
    cpf,
    tipo_usuario: "cliente",
    status_aprovacao: "pendente",
    cadastro_completo: true,
  });
  return NextResponse.redirect(new URL("/login?cadastro=1", request.url));
}
