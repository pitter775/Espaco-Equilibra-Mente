import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { getHorariosDisponiveis } from "@/lib/reservation";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const raw = cookieStore.get("eqm-reserva")?.value;
  if (!raw) return NextResponse.json({ success: false, message: "Dados da reserva invalidos." }, { status: 400 });

  const form = await request.formData().catch(() => null);
  const metodo = String(form?.get("metodo_pagamento") ?? "mercadopago");
  const reservaData = JSON.parse(raw) as { sala_id: number; horarios: { data_reserva: string; hora_inicio: string; hora_fim: string }[] };
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, message: "Configure o Supabase antes de confirmar reservas." }, { status: 503 });

  const sala = await getSala(reservaData.sala_id);
  if (!sala) return NextResponse.json({ success: false, message: "Sala nao encontrada." }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const criadas = [];
  for (const horario of reservaData.horarios) {
    const slots = await getHorariosDisponiveis(sala.id, horario.data_reserva);
    const slot = slots.find((item) => item.inicio === horario.hora_inicio && item.fim === horario.hora_fim);
    if (!slot || slot.status !== "disponivel") {
      return NextResponse.json({ success: false, message: "Horario indisponivel." }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("reservas")
      .insert({
        usuario_id: user.id,
        sala_id: sala.id,
        data_reserva: horario.data_reserva,
        hora_inicio: horario.hora_inicio,
        hora_fim: horario.hora_fim,
        status: "PENDENTE",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    criadas.push(data);
  }

  cookieStore.delete("eqm-reserva");
  const primeira = criadas[0];
  const url = new URL(`/api/mercadopago/pagar/${primeira.id}?metodo=${metodo}`, request.url);
  return NextResponse.redirect(url);
}
