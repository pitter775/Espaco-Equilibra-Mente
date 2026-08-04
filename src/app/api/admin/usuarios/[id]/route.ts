import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendApprovalStatusEmail } from "@/lib/email";
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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdmin().from("users").select("*, endereco:enderecos(*)").eq("id", id).single();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body.toggleStatus) {
    const { data: current } = await supabase.from("users").select("status").eq("id", id).maybeSingle();
    const status = current?.status === "ativo" ? "inativo" : "ativo";
    const { data, error } = await supabase.from("users").update({ status }).eq("id", id).select("*, endereco:enderecos(*)").single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });
    revalidatePath("/admin/usuarios");
    return NextResponse.json({ success: true, data });
  }

  const approvalOnly = Object.keys(body).every((key) => ["status_aprovacao"].includes(key));
  const payload = approvalOnly ? { status_aprovacao: cleanText(body.status_aprovacao) } : userPayload(body);
  const { data, error } = await supabase.from("users").update(payload).eq("id", id).select("*, endereco:enderecos(*)").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  const approvalStatus = cleanText(body.status_aprovacao);
  const email = approvalOnly && ["aprovado", "reprovado"].includes(approvalStatus)
    ? await sendApprovalStatusEmail(data, approvalStatus as "aprovado" | "reprovado")
    : null;

  const senha = cleanText(body.senha ?? body.password);
  if (senha.length >= 8 && id.includes("-")) {
    await supabase.auth.admin.updateUserById(id, { password: senha });
  }

  const endereco = addressPayload(body, id);
  if (!approvalOnly && endereco) {
    const enderecoId = Number(body.endereco_id || data.endereco_id);
    if (enderecoId) {
      await supabase.from("enderecos").update(endereco).eq("id", enderecoId);
    } else {
      const { data: enderecoCriado } = await supabase.from("enderecos").insert(endereco).select("id").single();
      if (enderecoCriado?.id) await supabase.from("users").update({ endereco_id: enderecoCriado.id }).eq("id", id);
    }
  }

  revalidatePath("/admin/usuarios");
  return NextResponse.json({ success: true, data, email });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  await supabase.from("users").delete().eq("id", id);
  if (id.includes("-")) await supabase.auth.admin.deleteUser(id);
  revalidatePath("/admin/usuarios");
  return NextResponse.json({ success: true });
}
