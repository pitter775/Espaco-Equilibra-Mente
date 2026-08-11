import { NextRequest, NextResponse } from "next/server";
import { sendReservationConfirmedEmail } from "@/lib/email";
import { getMercadoPagoAccessToken } from "@/lib/payments";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { AppUser, Reserva, Sala } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mercadoPagoAccessToken = getMercadoPagoAccessToken();
  if (!isSupabaseConfigured()) return NextResponse.json({ status: "ok" });

  const paymentId = body?.type === "payment" ? body?.data?.id : null;
  if (!paymentId || !mercadoPagoAccessToken) return NextResponse.json({ status: "ok" });

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
  });
  const payment = await response.json();
  const reservaId = String(payment.external_reference ?? "").replace("reserva_", "");
  if (!reservaId) return NextResponse.json({ status: "ok" });

  const supabase = getSupabaseAdmin();
  const { data: reserva } = await supabase.from("reservas").select("*, sala:salas(*)").eq("id", Number(reservaId)).single();
  if (!reserva) return NextResponse.json({ status: "ok" });

  const status = String(payment.status ?? "").toLowerCase();
  await supabase.from("transacoes").upsert({
    external_id: String(payment.id),
    reference_id: String(reserva.id),
    usuario_id: reserva.usuario_id,
    sala_id: reserva.sala_id,
    status,
    valor: payment.transaction_amount,
    pagbank_order_id: payment.order?.id ?? null,
    detalhes: JSON.stringify(payment),
  });

  const reservaStatus = status === "approved" ? "CONFIRMADA" : ["rejected", "cancelled", "refunded", "charged_back"].includes(status) ? "CANCELADA" : "PENDENTE";
  await supabase.from("reservas").update({ status: reservaStatus }).eq("id", reserva.id);

  if (reservaStatus === "CONFIRMADA" && String(reserva.status).toUpperCase() !== "CONFIRMADA") {
    const { data: usuario } = await supabase.from("users").select("*").eq("id", String(reserva.usuario_id)).maybeSingle();
    if (usuario) {
      const emailResult = await sendReservationConfirmedEmail(usuario as AppUser, reserva as Reserva & { sala?: Sala | null });
      if (!emailResult.sent) console.error("Erro ao enviar e-mail de reserva confirmada:", emailResult.error);
    }
  }

  return NextResponse.json({ status: "ok" });
}
