import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return NextResponse.json({ sala: await getSala(id) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const salaId = Number(id);
  const supabase = getSupabaseAdmin();
  const valor = cleanNumber(body.valor);
  const salaPayload = {
    nome: cleanText(body.nome),
    descricao: cleanText(body.descricao),
    metragem: cleanText(body.metragem),
    valor,
    status: cleanText(body.status) || "disponivel",
  };

  if (!salaPayload.nome || !salaPayload.descricao || !salaPayload.metragem || valor === null) {
    return NextResponse.json({ success: false, message: "Preencha os dados obrigatorios da sala." }, { status: 422 });
  }

  const { data, error } = await supabase.from("salas").update(salaPayload).eq("id", salaId).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  if (body.endereco) {
    const enderecoPayload = {
      enderecavel_id: salaId,
      enderecavel_type: "App\\Models\\Sala",
      rua: cleanText(body.endereco.rua),
      numero: cleanText(body.endereco.numero),
      complemento: cleanText(body.endereco.complemento) || null,
      bairro: cleanText(body.endereco.bairro),
      cidade: cleanText(body.endereco.cidade),
      estado: cleanText(body.endereco.estado),
      cep: cleanText(body.endereco.cep),
    };

    const enderecoId = Number(body.endereco.id || data.endereco_id);
    if (enderecoId) {
      await supabase.from("enderecos").update(enderecoPayload).eq("id", enderecoId);
    } else {
      const { data: enderecoCriado } = await supabase.from("enderecos").insert(enderecoPayload).select("id").single();
      if (enderecoCriado?.id) await supabase.from("salas").update({ endereco_id: enderecoCriado.id }).eq("id", salaId);
    }
  }

  if (Array.isArray(body.conveniencias)) {
    const conveniencias: number[] = body.conveniencias.map((conveniencia: unknown) => Number(conveniencia)).filter(Boolean);
    await supabase.from("sala_conveniencias").delete().eq("sala_id", salaId);
    if (conveniencias.length) {
      await supabase.from("sala_conveniencias").insert(conveniencias.map((conveniencia_id) => ({ sala_id: salaId, conveniencia_id })));
    }
  }

  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Sala atualizada com sucesso!", data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await getSupabaseAdmin().from("salas").delete().eq("id", Number(id));
  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Sala excluida com sucesso!" });
}
