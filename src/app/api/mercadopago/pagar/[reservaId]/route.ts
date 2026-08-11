import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createMercadoPagoReservationPayment } from "@/lib/reservation-payment";
import { isSupabaseConfigured } from "@/lib/supabase";

async function gerarLinkPagamento(request: NextRequest, reservaId: string) {
  const user = await requireUser();
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Supabase nao configurado." }, { status: 503 });
  const result = await createMercadoPagoReservationPayment(request, reservaId, user);
  if (!result.redirect) return NextResponse.json({ message: result.message || "Erro ao gerar link de pagamento." }, { status: 500 });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json(result);
  }

  return NextResponse.redirect(result.redirect);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = await params;
  return gerarLinkPagamento(request, reservaId);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = await params;
  return gerarLinkPagamento(request, reservaId);
}
