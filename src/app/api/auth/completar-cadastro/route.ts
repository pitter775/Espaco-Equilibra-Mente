import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/data";
import { sendPendingRegistrationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const senha = String(form.get("senha") ?? "");
  const senhaConfirmacao = String(form.get("senha_confirmation") ?? "");
  const documento = form.get("documento");
  const aceitouContrato = form.get("aceita_contrato") === "on";

  if (!aceitouContrato) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=contrato", request.url));
  }

  if (senha.length < 8 || senha !== senhaConfirmacao) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=senha", request.url));
  }

  if (!(documento instanceof File) || !documento.name) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=documento", request.url));
  }

  if (documento.size > MAX_DOCUMENT_SIZE || !ALLOWED_DOCUMENT_TYPES.includes(documento.type)) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=documento", request.url));
  }

  const supabase = getSupabaseAdmin();
  let userId = user?.id ?? "";

  if (!userId) {
    const existing = await getProfileByEmail(email);
    if (existing) {
      return NextResponse.redirect(new URL("/completar-cadastro?erro=email", request.url));
    }

    userId = crypto.randomUUID();
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      name: String(form.get("fullname") ?? ""),
      email,
      password: await bcrypt.hash(senha, 12),
      tipo_usuario: "cliente",
      cadastro_completo: false,
      status_aprovacao: "pendente",
    });
    if (userError) return NextResponse.redirect(new URL("/completar-cadastro?erro=cadastro", request.url));
  }

  let documentoUrl = "";
  try {
    const blob = await put(`cadastro/${userId}/${Date.now()}-${safeFileName(documento.name)}`, documento, {
      access: "public",
      addRandomSuffix: true,
    });
    documentoUrl = blob.url;
  } catch {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=documento", request.url));
  }

  const endereco = {
    enderecavel_id: Number.isFinite(Number(userId)) ? Number(userId) : null,
    enderecavel_type: "App\\Models\\User",
    rua: String(form.get("endereco_rua") ?? ""),
    numero: String(form.get("endereco_numero") ?? ""),
    complemento: String(form.get("endereco_complemento") ?? ""),
    bairro: String(form.get("endereco_bairro") ?? ""),
    cidade: String(form.get("endereco_cidade") ?? ""),
    estado: String(form.get("endereco_estado") ?? ""),
    cep: String(form.get("endereco_cep") ?? ""),
  };

  const { data: enderecoCriado } = await supabase.from("enderecos").insert(endereco).select("id").single();

  const { data: pendingUser } = await supabase
    .from("users")
    .update({
      name: String(form.get("fullname") ?? ""),
      photo: String(form.get("photo") ?? user?.photo ?? ""),
      email,
      password: await bcrypt.hash(senha, 12),
      telefone: String(form.get("telefone") ?? ""),
      cpf: String(form.get("cpf") ?? ""),
      sexo: String(form.get("sexo") ?? ""),
      idade: Number(form.get("idade") ?? 0),
      registro_profissional: String(form.get("registro_profissional") ?? ""),
      tipo_registro_profissional: String(form.get("tipo_registro_profissional") ?? "0000000") || "0000000",
      cadastro_completo: true,
      endereco_id: enderecoCriado?.id ?? null,
      documento_tipo: String(form.get("documento_tipo") ?? ""),
      documento_caminho: documentoUrl,
      status_aprovacao: "pendente",
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (pendingUser) {
    const emailResult = await sendPendingRegistrationEmail(pendingUser);
    if (!emailResult.sent) console.error("Erro ao enviar e-mail de cadastro pendente:", emailResult.error);
  }

  const { data: contrato } = await supabase
    .from("contracts")
    .select("versao")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("contratos_usuarios").insert({
    user_id: userId,
    versao_contrato: contrato?.versao ?? "v1.0 - 2025-05-16",
    aceito_em: new Date().toISOString(),
  });

  const response = NextResponse.redirect(new URL(user ? "/" : "/login?cadastro=1", request.url));
  response.cookies.delete("eqm-google-data");
  return response;
}
