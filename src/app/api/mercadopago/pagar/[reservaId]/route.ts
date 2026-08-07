import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { requireUser } from "@/lib/auth";
import { getMercadoPagoAccessToken } from "@/lib/payments";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

async function gerarLinkPagamento(request: NextRequest, reservaId: string) {
  const user = await requireUser();
  const mercadoPagoAccessToken = getMercadoPagoAccessToken();
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Supabase nao configurado." }, { status: 503 });
  if (!mercadoPagoAccessToken) return NextResponse.json({ message: "Mercado Pago nao configurado." }, { status: 503 });

  const supabase = getSupabaseAdmin();
  const { data: reserva } = await supabase
    .from("reservas")
    .select("*, sala:salas(*)")
    .eq("id", Number(reservaId))
    .single();

  if (!reserva) return NextResponse.json({ message: "Reserva nao encontrada." }, { status: 404 });
  if (String(reserva.usuario_id) !== String(user.id)) return NextResponse.json({ message: "Reserva nao pertence a voce." }, { status: 403 });
  if (String(reserva.status).toLowerCase() !== "pendente") return NextResponse.json({ message: "Reserva nao esta pendente." }, { status: 422 });

  const client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
  const preference = new Preference(client);
  const origin = new URL(request.url).origin;
  const created = await preference.create({
    body: {
      items: [{
        id: `reserva_${reserva.id}`,
        title: `Reserva da sala ${reserva.sala?.nome ?? reserva.sala_id}`,
        quantity: 1,
        unit_price: Number(reserva.sala?.valor ?? 0),
      }],
      external_reference: `reserva_${reserva.id}`,
      notification_url: `${origin}/api/mercadopago/webhook`,
      back_urls: {
        success: `${origin}/pagamento/sucesso`,
        failure: `${origin}/pagamento/erro`,
        pending: `${origin}/pagamento/pendente`,
      },
      auto_return: "approved",
    },
  });

  await supabase.from("transacoes").upsert({
    reference_id: String(reserva.id),
    external_id: created.id,
    usuario_id: user.id,
    sala_id: reserva.sala_id,
    valor: Number(reserva.sala?.valor ?? 0),
    status: "pendente",
    detalhes: JSON.stringify(created),
  });

  const link = created.init_point ?? created.sandbox_init_point;
  if (!link) return NextResponse.json({ message: "Erro ao gerar link de pagamento." }, { status: 500 });

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({
      redirect: link,
      reference_id: `reserva_${reserva.id}`,
    });
  }

  return NextResponse.redirect(link);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = await params;
  return gerarLinkPagamento(request, reservaId);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = await params;
  return gerarLinkPagamento(request, reservaId);
}
