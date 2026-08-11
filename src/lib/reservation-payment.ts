import { MercadoPagoConfig, Preference } from "mercadopago";
import type { AppUser } from "./types";
import { getMercadoPagoAccessToken } from "./payments";
import { getSupabaseAdmin } from "./supabase";

type PaymentResult = {
  redirect?: string;
  reference_id?: string;
  message?: string;
};

function onlyDigits(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

function splitName(name?: string | null) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] || "Nome",
    surname: parts.slice(1).join(" ") || "Sobrenome",
  };
}

export async function createMercadoPagoReservationPayment(request: Request, reservaId: string | number, user: AppUser): Promise<PaymentResult> {
  const mercadoPagoAccessToken = getMercadoPagoAccessToken();
  if (!mercadoPagoAccessToken) return { message: "Mercado Pago nao configurado." };

  const supabase = getSupabaseAdmin();
  const { data: reserva, error } = await supabase
    .from("reservas")
    .select("*, sala:salas(*)")
    .eq("id", Number(reservaId))
    .single();

  if (error) return { message: error.message };
  if (!reserva) return { message: "Reserva nao encontrada." };
  if (String(reserva.usuario_id) !== String(user.id)) return { message: "Reserva nao pertence a voce." };
  if (String(reserva.status).toLowerCase() !== "pendente") return { message: "Reserva nao esta pendente." };

  const valor = Number(reserva.sala?.valor ?? 0);
  if (!Number.isFinite(valor) || valor <= 0) return { message: "Valor da reserva invalido." };

  const origin = new URL(request.url).origin;
  const payerName = splitName(user.name);
  const client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
  const preference = new Preference(client);
  const created = await preference.create({
    body: {
      items: [{
        id: `reserva_${reserva.id}`,
        title: `Reserva de sala - ${reserva.sala?.nome ?? reserva.sala_id}`,
        description: `Reserva da sala ${reserva.sala?.nome ?? reserva.sala_id} no dia ${reserva.data_reserva} das ${String(reserva.hora_inicio).slice(0, 5)} as ${String(reserva.hora_fim).slice(0, 5)}`,
        category_id: "services",
        quantity: 1,
        unit_price: valor,
      }],
      payer: {
        name: payerName.name,
        surname: payerName.surname,
        email: user.email || "comprador_teste@example.com",
        phone: {
          area_code: "11",
          number: onlyDigits(user.telefone) || "999999999",
        },
        identification: {
          type: "CPF",
          number: onlyDigits(user.cpf) || "00000000000",
        },
      },
      external_reference: `reserva_${reserva.id}`,
      statement_descriptor: "EQUILIBRA MENTE",
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
    valor,
    status: "pendente",
    detalhes: JSON.stringify(created),
  });

  const link = created.init_point ?? created.sandbox_init_point;
  if (!link) return { message: "Erro ao gerar link de pagamento." };

  return {
    redirect: link,
    reference_id: `reserva_${reserva.id}`,
  };
}
