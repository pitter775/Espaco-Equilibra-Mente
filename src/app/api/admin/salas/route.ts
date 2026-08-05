import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export async function GET() {
  await requireAdmin();
  const salas = await listSalas();
  return NextResponse.json({ salas, quantidade: salas.length });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const salaPayload = {
    nome: cleanText(body.nome),
    descricao: cleanText(body.descricao),
    metragem: cleanText(body.metragem),
    valor: cleanNumber(body.valor),
    status: cleanText(body.status) || "disponivel",
  };

  if (!salaPayload.nome || !salaPayload.descricao || !salaPayload.metragem || salaPayload.valor === null) {
    return NextResponse.json({ success: false, message: "Preencha os dados obrigatorios da sala." }, { status: 422 });
  }

  const { data: sala, error } = await supabase.from("salas").insert(salaPayload).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  const endereco = body.endereco;
  if (endereco) {
    const { data: enderecoCriado } = await supabase
      .from("enderecos")
      .insert({
        enderecavel_id: sala.id,
        enderecavel_type: "App\\Models\\Sala",
        rua: cleanText(endereco.rua),
        numero: cleanText(endereco.numero),
        complemento: cleanText(endereco.complemento) || null,
        bairro: cleanText(endereco.bairro),
        cidade: cleanText(endereco.cidade),
        estado: cleanText(endereco.estado),
        cep: cleanText(endereco.cep),
      })
      .select("id")
      .single();

    if (enderecoCriado?.id) {
      await supabase.from("salas").update({ endereco_id: enderecoCriado.id }).eq("id", sala.id);
    }
  }

  const conveniencias: number[] = Array.isArray(body.conveniencias)
    ? body.conveniencias.map((conveniencia: unknown) => Number(conveniencia)).filter(Boolean)
    : [];
  if (conveniencias.length) {
    await supabase.from("sala_conveniencias").insert(conveniencias.map((conveniencia_id) => ({ sala_id: sala.id, conveniencia_id })));
  }

  const imagens: string[] = Array.isArray(body.imagens)
    ? body.imagens.map((imagem: unknown) => String(imagem ?? "")).filter(Boolean)
    : [];
  if (imagens.length) {
    await supabase.from("imagens_salas").insert(imagens.map((imagem_base64, index) => ({
      sala_id: sala.id,
      imagem_base64,
      principal: index === 0,
    })));
  }

  revalidateTag("salas", "max");
  revalidateTag("conveniencias", "max");
  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Sala criada com sucesso!", data: sala });
}
