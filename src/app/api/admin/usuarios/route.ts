import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function userPayload(body: Record<string, unknown>) {
  return {
    name: cleanText(body.fullname ?? body.name),
    email: cleanText(body.email),
    tipo_usuario: cleanText(body.perfil ?? body.tipo_usuario) || "cliente",
    cpf: cleanText(body.cpf) || null,
    sexo: cleanText(body.sexo) || null,
    idade: cleanNumber(body.idade),
    photo: cleanText(body.photo) || null,
    telefone: cleanText(body.telefone) || null,
    status: cleanText(body.status) || "ativo",
    registro_profissional: cleanText(body.registro_profissional) || "00",
    tipo_registro_profissional: cleanText(body.tipo_registro_profissional) || "0000000",
    status_aprovacao: cleanText(body.status_aprovacao) || "pendente",
    cadastro_completo: true,
  };
}

function addressPayload(body: Record<string, unknown>, userId: string) {
  if (!cleanText(body.endereco_rua) || !cleanText(body.endereco_numero) || !cleanText(body.endereco_bairro) || !cleanText(body.endereco_cidade) || !cleanText(body.endereco_estado) || !cleanText(body.endereco_cep)) {
    return null;
  }

  return {
    enderecavel_id: Number.isFinite(Number(userId)) ? Number(userId) : null,
    enderecavel_type: "App\\Models\\User",
    rua: cleanText(body.endereco_rua),
    numero: cleanText(body.endereco_numero),
    complemento: cleanText(body.endereco_complemento) || null,
    bairro: cleanText(body.endereco_bairro),
    cidade: cleanText(body.endereco_cidade),
    estado: cleanText(body.endereco_estado),
    cep: cleanText(body.endereco_cep),
  };
}

export async function GET() {
  await requireAdmin();
  const { data } = await getSupabaseAdmin().from("users").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const payload = userPayload(body);
  const senha = cleanText(body.senha ?? body.password);
  if (!payload.name || !payload.email || senha.length < 8) {
    return NextResponse.json({ success: false, message: "Informe nome, e-mail e senha com pelo menos 8 caracteres." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .insert({ id: crypto.randomUUID(), ...payload, password: await bcrypt.hash(senha, 12) })
    .select("*, endereco:enderecos(*)")
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  const endereco = addressPayload(body, data.id);
  if (endereco) {
    const { data: enderecoCriado } = await supabase.from("enderecos").insert(endereco).select("id").single();
    if (enderecoCriado?.id) {
      await supabase.from("users").update({ endereco_id: enderecoCriado.id }).eq("id", data.id);
    }
  }

  revalidatePath("/admin/usuarios");
  return NextResponse.json({ success: true, data });
}
