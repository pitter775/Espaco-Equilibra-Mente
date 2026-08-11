import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { expireStalePendingReservations } from "@/lib/reservation";
import { createMercadoPagoReservationPayment } from "@/lib/reservation-payment";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type ReservaHorario = {
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
};

function randomChave(chaves: unknown) {
  const lista = Array.isArray(chaves) ? chaves : [];
  if (!lista.length) return null;
  return String(lista[Math.floor(Math.random() * lista.length)]);
}

async function existeBloqueioParaPeriodo(salaId: number, horario: ReservaHorario) {
  const { data } = await getSupabaseAdmin()
    .from("bloqueios_salas")
    .select("*")
    .eq("sala_id", salaId)
    .eq("ativo", true)
    .lte("data_inicio", horario.data_reserva)
    .gte("data_fim", horario.data_reserva);

  return (data ?? []).some((bloqueio) => {
    if (bloqueio.tipo === "dia_inteiro") return true;
    if (!bloqueio.hora_inicio || !bloqueio.hora_fim) return true;

    const inicioBloqueio = String(bloqueio.hora_inicio).slice(0, 5);
    const fimBloqueio = String(bloqueio.hora_fim).slice(0, 5);
    return horario.hora_inicio < fimBloqueio && horario.hora_fim > inicioBloqueio;
  });
}

async function existeConflitoReserva(salaId: number, horario: ReservaHorario) {
  const { data } = await getSupabaseAdmin()
    .from("reservas")
    .select("hora_inicio,hora_fim")
    .eq("sala_id", salaId)
    .eq("data_reserva", horario.data_reserva)
    .in("status", ["PENDENTE", "pendente", "CONFIRMADA", "confirmada"]);

  return (data ?? []).some((reserva) => {
    const inicio = String(reserva.hora_inicio).slice(0, 5);
    const fim = String(reserva.hora_fim).slice(0, 5);
    return horario.hora_inicio < fim && horario.hora_fim > inicio;
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const cookieStore = await cookies();
    const raw = cookieStore.get("eqm-reserva")?.value;
    if (!raw) return NextResponse.json({ success: false, message: "Dados da reserva invalidos." }, { status: 400 });

    const form = await request.formData().catch(() => null);
    const metodo = String(form?.get("metodo_pagamento") ?? "mercadopago");
    const aceitouRegulamento = form?.get("aceito_regulamento") === "1";
    const reservaData = JSON.parse(decodeURIComponent(raw)) as { sala_id: number; horarios: { data_reserva: string; hora_inicio: string; hora_fim: string }[] };
    if (!isSupabaseConfigured()) return NextResponse.json({ success: false, message: "Configure o Supabase antes de confirmar reservas." }, { status: 503 });
    if (!aceitouRegulamento) return NextResponse.json({ success: false, message: "Voce precisa aceitar o regulamento para confirmar a reserva." }, { status: 422 });

    const sala = await getSala(reservaData.sala_id);
    if (!sala) return NextResponse.json({ success: false, message: "Sala nao encontrada." }, { status: 404 });

    const supabase = getSupabaseAdmin();
    await expireStalePendingReservations(sala.id);
    const criadas = [];
    for (const horario of reservaData.horarios) {
      if (await existeBloqueioParaPeriodo(sala.id, horario)) {
        return NextResponse.json({ success: false, message: "Horario indisponivel. Existe um bloqueio manual para esse periodo." }, { status: 409 });
      }

      if (await existeConflitoReserva(sala.id, horario)) {
        return NextResponse.json({ success: false, message: "Horario indisponivel. Ja existe uma reserva nesse horario." }, { status: 409 });
      }

      const { data: fechadura } = await supabase.from("fechaduras").select("chaves").eq("sala_id", sala.id).maybeSingle();
      const chaveParaUsar = randomChave(fechadura?.chaves);
      if (!chaveParaUsar) {
        return NextResponse.json({ success: false, message: "A sala nao possui chaves cadastradas." }, { status: 409 });
      }

      const { data: cancelada } = await supabase
        .from("reservas")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("sala_id", sala.id)
        .eq("data_reserva", horario.data_reserva)
        .eq("hora_inicio", horario.hora_inicio)
        .eq("hora_fim", horario.hora_fim)
        .eq("status", "CANCELADA")
        .maybeSingle();

      if (cancelada) {
        const { data, error } = await supabase
          .from("reservas")
          .update({ status: "PENDENTE", chave_usada: chaveParaUsar })
          .eq("id", cancelada.id)
          .select("*")
          .single();
        if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
        criadas.push(data);
        continue;
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
          chave_usada: chaveParaUsar,
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      criadas.push(data);
    }

    const primeira = criadas[0];
    const payment = metodo === "mercadopago"
      ? await createMercadoPagoReservationPayment(request, primeira.id, user)
      : { redirect: `/api/mercadopago/pagar/${primeira.id}?metodo=${metodo}`, reference_id: `reserva_${primeira.id}` };

    if (!payment.redirect) {
      return NextResponse.json({ success: false, message: payment.message || "Erro ao gerar link de pagamento." }, { status: 500 });
    }

    cookieStore.delete("eqm-reserva");
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Erro ao confirmar reserva:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Erro ao confirmar a reserva.",
    }, { status: 500 });
  }
}
