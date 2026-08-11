import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/data";
import { sendPendingRegistrationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

const MAX_DOCUMENT_SIZE = 4 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const BLOB_ACCESS = "private";

const ERROR_MESSAGES: Record<string, string> = {
  senha: "Confira a senha e a confirmacao. A senha precisa ter pelo menos 8 caracteres.",
  documento: "Envie um documento valido em PDF, JPG ou PNG, com ate 4 MB.",
  email: "Este e-mail ja esta cadastrado. Faca login ou use outro e-mail.",
  cadastro: "Nao foi possivel criar seu acesso agora. Tente novamente.",
  contrato: "Voce precisa aceitar os termos do contrato para concluir o cadastro.",
  dados: "Confira os dados informados antes de enviar o cadastro.",
  upload: "Nao foi possivel enviar o documento. Confira a configuracao do Blob na Vercel e tente novamente.",
  fatal: "Nao foi possivel concluir o cadastro agora.",
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calc = (size: number) => {
    const sum = cpf.slice(0, size).split("").reduce((total, digit, index) => total + Number(digit) * (size + 1 - index), 0);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };

  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function wantsJson(request: NextRequest) {
  return request.headers.get("accept")?.includes("application/json") || request.headers.get("x-eqm-debug") === "1";
}

function failureResponse(request: NextRequest, code: string, reason?: string, status = 422) {
  const message = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.fatal;
  if (wantsJson(request)) {
    return NextResponse.json({
      success: false,
      code,
      reason: reason ?? null,
      message: reason ? `${message} Debug: ${reason}` : message,
    }, { status });
  }

  const url = new URL("/completar-cadastro", request.url);
  url.searchParams.set("erro", code);
  if (reason) url.searchParams.set("motivo", reason);
  return NextResponse.redirect(url);
}

function successResponse(request: NextRequest, redirectTo: string) {
  if (wantsJson(request)) {
    return NextResponse.json({ success: true, redirectTo });
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.delete("eqm-google-data");
  return response;
}

function errorReason(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "erro-desconhecido";
  }
  return "erro-desconhecido";
}

export async function POST(request: NextRequest) {
  try {
    return await completeRegistration(request);
  } catch (error) {
    const reason = errorReason(error);
    console.error("[completar-cadastro:fatal]", {
      reason,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return failureResponse(request, "fatal", reason, 500);
  }
}

async function completeRegistration(request: NextRequest) {
  const user = await getCurrentUser();
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const senhaConfirmacao = String(form.get("senha_confirmation") ?? "");
  const documento = form.get("documento");
  const aceitouContrato = form.get("aceita_contrato") === "on";
  const telefone = String(form.get("telefone") ?? "").trim();
  const cpf = String(form.get("cpf") ?? "").trim();
  const cep = String(form.get("endereco_cep") ?? "").trim();
  const numero = String(form.get("endereco_numero") ?? "").trim();
  const idade = String(form.get("idade") ?? "").trim();
  const estado = String(form.get("endereco_estado") ?? "").trim().toUpperCase();
  const telefoneDigits = onlyDigits(telefone);
  const cepDigits = onlyDigits(cep);

  if (!aceitouContrato) {
    return failureResponse(request, "contrato");
  }

  if (senha.length < 8 || senha !== senhaConfirmacao) {
    return failureResponse(request, "senha");
  }

  if (
    !String(form.get("fullname") ?? "").trim() ||
    !email.trim() ||
    telefoneDigits.length < 10 ||
    telefoneDigits.length > 11 ||
    !isValidCpf(cpf) ||
    cepDigits.length !== 8 ||
    !/^\d+$/.test(numero) ||
    !/^\d{1,3}$/.test(idade) ||
    !/^[A-Z]{2}$/.test(estado)
  ) {
    return failureResponse(request, "dados");
  }

  if (!(documento instanceof File) || !documento.name) {
    return failureResponse(request, "documento");
  }

  if (documento.size > MAX_DOCUMENT_SIZE || !ALLOWED_DOCUMENT_TYPES.includes(documento.type)) {
    return failureResponse(request, "documento");
  }

  const supabase = getSupabaseAdmin();
  const isNewUser = !user?.id;
  let userId = user?.id ?? "";

  if (isNewUser) {
    const existing = await getProfileByEmail(email);
    if (existing) {
      return failureResponse(request, "email");
    }

    userId = crypto.randomUUID();
  }

  let documentoUrl = "";
  try {
    const pathname = `cadastro/${userId}/${Date.now()}-${safeFileName(documento.name)}`;
    console.info("[completar-cadastro:upload:start]", {
      pathname,
      access: BLOB_ACCESS,
      fileName: documento.name,
      fileType: documento.type,
      fileSize: documento.size,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
    });

    const blob = await put(pathname, documento, {
      access: BLOB_ACCESS,
      addRandomSuffix: true,
    });
    documentoUrl = blob.url;
    console.info("[completar-cadastro:upload:success]", { pathname: blob.pathname, url: blob.url, access: BLOB_ACCESS });
  } catch (error) {
    const reason = errorReason(error);
    console.error("[completar-cadastro:upload:error]", {
      reason,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      fileName: documento.name,
      fileType: documento.type,
      fileSize: documento.size,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
      access: BLOB_ACCESS,
    });
    return failureResponse(request, "upload", reason);
  }

  if (isNewUser) {
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      name: String(form.get("fullname") ?? ""),
      email,
      password: await bcrypt.hash(senha, 12),
      tipo_usuario: "cliente",
      cadastro_completo: false,
      status_aprovacao: "pendente",
    });
    if (userError) return failureResponse(request, "cadastro", userError.message);
  }

  const endereco = {
    enderecavel_id: Number.isFinite(Number(userId)) ? Number(userId) : null,
    enderecavel_type: "App\\Models\\User",
    rua: String(form.get("endereco_rua") ?? ""),
    numero,
    complemento: String(form.get("endereco_complemento") ?? ""),
    bairro: String(form.get("endereco_bairro") ?? ""),
    cidade: String(form.get("endereco_cidade") ?? ""),
    estado,
    cep,
  };

  const { data: enderecoCriado } = await supabase.from("enderecos").insert(endereco).select("id").single();

  const { data: pendingUser } = await supabase
    .from("users")
    .update({
      name: String(form.get("fullname") ?? ""),
      photo: String(form.get("photo") ?? user?.photo ?? ""),
      email,
      password: await bcrypt.hash(senha, 12),
      telefone,
      cpf,
      sexo: String(form.get("sexo") ?? ""),
      idade: Number(idade),
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

  const response = successResponse(request, user ? "/" : "/login?cadastro=1");
  response.cookies.delete("eqm-google-data");
  return response;
}
