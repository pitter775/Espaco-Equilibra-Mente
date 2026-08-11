import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type HorarioSlot = {
  inicio: string;
  fim: string;
  status: "disponivel" | "reservado" | "bloqueado";
  mensagem: string;
};

function possibleHours() {
  return Array.from({ length: 12 }, (_, index) => {
    const hour = index + 8;
    return {
      inicio: `${String(hour).padStart(2, "0")}:00`,
      fim: `${String(hour + 1).padStart(2, "0")}:00`,
    };
  });
}

function overlaps(start: string, end: string, itemStart: string, itemEnd: string) {
  return start < itemEnd.slice(0, 5) && end > itemStart.slice(0, 5);
}

export async function expireStalePendingReservations(salaId?: number) {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const limite = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  let query = supabase
    .from("reservas")
    .select("id")
    .in("status", ["pendente", "PENDENTE"])
    .lt("created_at", limite);

  if (salaId) query = query.eq("sala_id", salaId);

  const { data: antigas } = await query;
  const idsAntigas = (antigas ?? []).map((item) => item.id);
  if (!idsAntigas.length) return [];

  await supabase.from("reservas").update({ status: "CANCELADA" }).in("id", idsAntigas);
  await supabase
    .from("transacoes")
    .update({ status: "cancelada" })
    .in("reference_id", [...idsAntigas.map(String), ...idsAntigas.map((id) => `reserva_${id}`)])
    .in("status", ["pendente", "PENDENTE", "iniciada", "aguardando", "pending"]);

  return idsAntigas;
}

export async function getHorariosDisponiveis(salaId: number, dataReserva: string): Promise<HorarioSlot[]> {
  if (!isSupabaseConfigured()) {
    return possibleHours().map((item) => ({
      ...item,
      status: "disponivel",
      mensagem: "Horario disponivel para reserva.",
    }));
  }

  const supabase = getSupabaseAdmin();
  await expireStalePendingReservations(salaId);

  const [{ data: reservas }, { data: bloqueios }] = await Promise.all([
    supabase
      .from("reservas")
      .select("hora_inicio,hora_fim")
      .eq("sala_id", salaId)
      .eq("data_reserva", dataReserva)
      .in("status", ["CONFIRMADA", "confirmada", "PENDENTE", "pendente"]),
    supabase
      .from("bloqueios_salas")
      .select("*")
      .eq("sala_id", salaId)
      .eq("ativo", true)
      .lte("data_inicio", dataReserva)
      .gte("data_fim", dataReserva),
  ]);

  return possibleHours().map((slot) => {
    const bloqueio = (bloqueios ?? []).find((item) => {
      if (item.tipo === "dia_inteiro") return true;
      if (!item.hora_inicio || !item.hora_fim) return true;
      return overlaps(slot.inicio, slot.fim, item.hora_inicio, item.hora_fim);
    });

    if (bloqueio) {
      return { ...slot, status: "bloqueado", mensagem: bloqueio.motivo || "Horario bloqueado pela administracao." };
    }

    const reserva = (reservas ?? []).find((item) => overlaps(slot.inicio, slot.fim, item.hora_inicio, item.hora_fim));
    if (reserva) {
      return { ...slot, status: "reservado", mensagem: "Este horario ja foi reservado." };
    }

    return { ...slot, status: "disponivel", mensagem: "Horario disponivel para reserva." };
  });
}
