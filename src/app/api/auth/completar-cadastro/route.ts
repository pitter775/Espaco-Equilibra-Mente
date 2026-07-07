import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByEmail } from "@/lib/data";
import { getSupabaseAdmin, getSupabaseAnon } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const senha = String(form.get("senha") ?? "");
  const senhaConfirmacao = String(form.get("senha_confirmation") ?? "");
  const documento = form.get("documento");

  if (senha.length < 8 || senha !== senhaConfirmacao) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=senha", request.url));
  }

  if (!(documento instanceof File) || !documento.name) {
    return NextResponse.redirect(new URL("/completar-cadastro?erro=documento", request.url));
  }

  const supabase = getSupabaseAdmin();
  let userId = user?.id ?? "";

  if (!userId) {
    const existing = await getProfileByEmail(email);
    if (existing) {
      return NextResponse.redirect(new URL("/completar-cadastro?erro=email", request.url));
    }

    const { data: authData, error: authError } = await getSupabaseAnon().auth.signUp({
      email,
      password: senha,
      options: { data: { name: String(form.get("fullname") ?? "") } },
    });

    if (authError || !authData.user) {
      return NextResponse.redirect(new URL("/completar-cadastro?erro=cadastro", request.url));
    }

    userId = authData.user.id;
    await supabase.from("users").insert({
      id: userId,
      name: String(form.get("fullname") ?? ""),
      email,
      tipo_usuario: "cliente",
      cadastro_completo: false,
      status_aprovacao: "pendente",
    });
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

  await supabase
    .from("users")
    .update({
      name: String(form.get("fullname") ?? ""),
      photo: String(form.get("photo") ?? user?.photo ?? ""),
      email,
      telefone: String(form.get("telefone") ?? ""),
      cpf: String(form.get("cpf") ?? ""),
      sexo: String(form.get("sexo") ?? ""),
      idade: Number(form.get("idade") ?? 0),
      registro_profissional: String(form.get("registro_profissional") ?? ""),
      tipo_registro_profissional: String(form.get("tipo_registro_profissional") ?? "0000000") || "0000000",
      cadastro_completo: true,
      endereco_id: enderecoCriado?.id ?? null,
      documento_tipo: String(form.get("documento_tipo") ?? ""),
      documento_caminho: `logs/cadastro/${documento.name}`,
      status_aprovacao: "pendente",
    })
    .eq("id", userId);

  const response = NextResponse.redirect(new URL(user ? "/" : "/login?cadastro=1", request.url));
  response.cookies.delete("eqm-google-data");
  return response;
}
