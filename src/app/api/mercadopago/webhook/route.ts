import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoAccessToken } from "@/lib/payments";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

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
  const { data: reserva } = await supabase.from("reservas").select("*").eq("id", Number(reservaId)).single();
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
  return NextResponse.json({ status: "ok" });
}
