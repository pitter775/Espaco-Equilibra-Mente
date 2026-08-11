import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanWeekdays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6)));
}

function toDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function repeatedDates(startValue: string, endValue: string, weekdays: number[]) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const selected = new Set(weekdays);
  const dates: string[] = [];
  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    if (selected.has(current.getDay())) dates.push(toDateInput(current));
    if (dates.length > 370) break;
  }
  return dates;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const salaId = Number(id);
  const body = await request.json();
  const tipo = cleanText(body.tipo) || "dia_inteiro";
  const horaInicio = cleanText(body.hora_inicio);
  const horaFim = cleanText(body.hora_fim);
  const dataInicio = cleanText(body.data_inicio);
  const dataFim = cleanText(body.data_fim);
  const diasSemana = cleanWeekdays(body.dias_semana);

  if (!["dia_inteiro", "intervalo"].includes(tipo)) {
    return NextResponse.json({ success: false, message: "Tipo de bloqueio invalido." }, { status: 422 });
  }

  if (tipo === "intervalo" && (!horaInicio || !horaFim || horaFim <= horaInicio)) {
    return NextResponse.json({ success: false, message: "Informe hora inicial e final para bloqueios por intervalo." }, { status: 422 });
  }

  const basePayload = {
    sala_id: salaId,
    tipo,
    hora_inicio: tipo === "dia_inteiro" ? null : horaInicio,
    hora_fim: tipo === "dia_inteiro" ? null : horaFim,
    motivo: cleanText(body.motivo) || null,
    ativo: true,
    created_by: admin.id,
  };

  if (!basePayload.sala_id || !dataInicio || !dataFim || dataFim < dataInicio) {
    return NextResponse.json({ success: false, message: "Informe um periodo valido." }, { status: 422 });
  }

  const datasRepetidas = diasSemana.length ? repeatedDates(dataInicio, dataFim, diasSemana) : [];
  if (diasSemana.length && !datasRepetidas.length) {
    return NextResponse.json({ success: false, message: "Nenhuma data encontrada para os dias da semana selecionados." }, { status: 422 });
  }

  const payloads = datasRepetidas.length
    ? datasRepetidas.map((data) => ({ ...basePayload, data_inicio: data, data_fim: data }))
    : [{ ...basePayload, data_inicio: dataInicio, data_fim: dataFim }];

  const { data, error } = await getSupabaseAdmin().from("bloqueios_salas").insert(payloads).select("*");
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidateTag("salas", "max");
  revalidatePath("/admin/salas");
  return NextResponse.json({
    success: true,
    message: payloads.length > 1 ? `${payloads.length} bloqueios cadastrados com sucesso.` : "Bloqueio cadastrado com sucesso.",
    data,
  });
}
