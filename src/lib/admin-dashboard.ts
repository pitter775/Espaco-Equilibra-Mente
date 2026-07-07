import { listReservas, listSalas } from "./data";
import { getSupabaseServer, isSupabaseConfigured } from "./supabase";
import type { Reserva, Sala } from "./types";

export type DashboardReserva = Reserva & {
  status_normalizado: "confirmada" | "pendente" | "cancelada";
  duracao_horas: number;
  valor_total: number;
};

function normalizeStatus(status?: string | null): DashboardReserva["status_normalizado"] {
  const value = String(status ?? "").trim().toUpperCase();
  if (["CONFIRMADA", "ATIVA", "RESERVADO", "CONCLUIDA"].includes(value)) return "confirmada";
  if (["CANCELADA", "CANCELLED", "REJECTED", "REFUNDED", "CHARGED_BACK"].includes(value)) return "cancelada";
  return "pendente";
}

function durationHours(start?: string | null, end?: string | null) {
  const startParts = String(start ?? "").split(":").map(Number);
  const endParts = String(end ?? "").split(":").map(Number);
  if (startParts.length < 2 || endParts.length < 2) return 0;

  const startMinutes = (startParts[0] * 60) + startParts[1];
  const endMinutes = (endParts[0] * 60) + endParts[1];
  const diff = endMinutes - startMinutes;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

function isSameMonth(date: Date, monthDate: Date) {
  return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

function shiftDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function shiftMonths(date: Date, months: number) {
  const copy = new Date(date.getFullYear(), date.getMonth(), 1);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

async function countClientes() {
  if (!isSupabaseConfigured()) return 0;
  const { count, error } = await getSupabaseServer()
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("tipo_usuario", "cliente");

  if (error) {
    console.error("Erro ao contar clientes:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getAdminDashboardData() {
  const [salas, reservas, clientes] = await Promise.all([listSalas(), listReservas(), countClientes()]);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const dashboardReservas: DashboardReserva[] = reservas.map((reserva) => {
    const duracao = durationHours(reserva.hora_inicio, reserva.hora_fim);
    return {
      ...reserva,
      status_normalizado: normalizeStatus(reserva.status),
      duracao_horas: duracao,
      valor_total: Math.round(Number(reserva.sala?.valor ?? 0) * duracao * 100) / 100,
    };
  });

  const reservasValidas = dashboardReservas.filter((reserva) => reserva.status_normalizado !== "cancelada");
  const reservasMes = reservasValidas.filter((reserva) => {
    const date = dateAtNoon(reserva.data_reserva);
    return date >= monthStart && date <= monthEnd;
  });

  const statusDistribuicao = {
    confirmada: dashboardReservas.filter((reserva) => reserva.status_normalizado === "confirmada").length,
    pendente: dashboardReservas.filter((reserva) => reserva.status_normalizado === "pendente").length,
    cancelada: dashboardReservas.filter((reserva) => reserva.status_normalizado === "cancelada").length,
  };

  const receitaConfirmadaMes = reservasMes
    .filter((reserva) => reserva.status_normalizado === "confirmada")
    .reduce((total, reserva) => total + reserva.valor_total, 0);

  const confirmadas = dashboardReservas.filter((reserva) => reserva.status_normalizado === "confirmada");
  const ticketMedio = confirmadas.length
    ? confirmadas.reduce((total, reserva) => total + reserva.valor_total, 0) / confirmadas.length
    : 0;

  const salasMaisReservadas = [...salas]
    .map((sala: Sala) => {
      const reservasSala = reservasValidas.filter((reserva) => Number(reserva.sala_id) === Number(sala.id));
      return {
        nome: sala.nome,
        total: reservasSala.length,
        receita: reservasSala.reduce((total, reserva) => total + reserva.valor_total, 0),
      };
    })
    .sort((a, b) => b.total - a.total);

  const reservasPorDia = Array.from({ length: monthEnd.getDate() }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
    return {
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: reservasMes.filter((reserva) => reserva.data_reserva === dateKey(date)).length,
    };
  });

  const ocupacaoUltimos20Dias = Array.from({ length: 20 }, (_, index) => shiftDays(today, index - 19)).map((date) => ({
    label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    horas: reservasValidas
      .filter((reserva) => reserva.data_reserva === dateKey(date))
      .reduce((total, reserva) => total + reserva.duracao_horas, 0),
  }));

  const evolucaoMensal = Array.from({ length: 6 }, (_, index) => shiftMonths(today, index - 5)).map((date) => {
    const reservasMesAtual = reservasValidas.filter((reserva) => isSameMonth(dateAtNoon(reserva.data_reserva), date));
    return {
      label: monthLabel(date),
      reservas: reservasMesAtual.length,
      receita: reservasMesAtual
        .filter((reserva) => reserva.status_normalizado === "confirmada")
        .reduce((total, reserva) => total + reserva.valor_total, 0),
    };
  });

  const proximasReservas = reservasValidas
    .filter((reserva) => new Date(`${reserva.data_reserva}T${String(reserva.hora_fim).slice(0, 8)}`) >= new Date())
    .sort((a, b) => `${a.data_reserva}${a.hora_inicio}`.localeCompare(`${b.data_reserva}${b.hora_inicio}`))
    .slice(0, 6);

  return {
    resumo: {
      reservasHoje: reservasValidas.filter((reserva) => reserva.data_reserva === dateKey(today)).length,
      reservasMes: reservasMes.length,
      pendentes: statusDistribuicao.pendente,
      receitaConfirmadaMes,
      ticketMedio,
      salasDisponiveis: salas.filter((sala) => sala.status === "disponivel").length,
      clientes,
      canceladasMes: dashboardReservas.filter((reserva) => reserva.status_normalizado === "cancelada" && isSameMonth(dateAtNoon(reserva.data_reserva), today)).length,
      statusGeral: statusDistribuicao.confirmada + statusDistribuicao.pendente + statusDistribuicao.cancelada,
    },
    statusDistribuicao,
    salasMaisReservadas,
    ocupacaoUltimos20Dias,
    reservasPorDia,
    evolucaoMensal,
    proximasReservas,
  };
}
