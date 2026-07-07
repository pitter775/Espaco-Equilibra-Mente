import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const salaId = Number(id);
  const body = await request.json();
  const tipo = cleanText(body.tipo) || "dia_inteiro";
  const horaInicio = cleanText(body.hora_inicio);
  const horaFim = cleanText(body.hora_fim);

  if (!["dia_inteiro", "intervalo"].includes(tipo)) {
    return NextResponse.json({ success: false, message: "Tipo de bloqueio invalido." }, { status: 422 });
  }

  if (tipo === "intervalo" && (!horaInicio || !horaFim || horaFim <= horaInicio)) {
    return NextResponse.json({ success: false, message: "Informe hora inicial e final para bloqueios por intervalo." }, { status: 422 });
  }

  const payload = {
    sala_id: salaId,
    tipo,
    data_inicio: cleanText(body.data_inicio),
    data_fim: cleanText(body.data_fim),
    hora_inicio: tipo === "dia_inteiro" ? null : horaInicio,
    hora_fim: tipo === "dia_inteiro" ? null : horaFim,
    motivo: cleanText(body.motivo) || null,
    ativo: true,
    created_by: admin.id,
  };

  if (!payload.sala_id || !payload.data_inicio || !payload.data_fim || payload.data_fim < payload.data_inicio) {
    return NextResponse.json({ success: false, message: "Informe um periodo valido." }, { status: 422 });
  }

  const { data, error } = await getSupabaseAdmin().from("bloqueios_salas").insert(payload).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidatePath("/admin/salas");
  return NextResponse.json({ success: true, message: "Bloqueio cadastrado com sucesso.", data });
}
