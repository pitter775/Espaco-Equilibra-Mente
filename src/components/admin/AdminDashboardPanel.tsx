import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import { dateBr, money } from "@/lib/format";
import type { getAdminDashboardData } from "@/lib/admin-dashboard";

type DashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;

function maxValue(items: { total?: number; horas?: number; reservas?: number; receita?: number }[], key: "total" | "horas" | "reservas" | "receita") {
  return Math.max(1, ...items.map((item) => Number(item[key] ?? 0)));
}

function percent(value: number, max: number) {
  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

export function AdminDashboardPanel({ data }: { data: DashboardData }) {
  const maxReservasDia = maxValue(data.reservasPorDia, "total");
  const maxOcupacao = maxValue(data.ocupacaoUltimos20Dias, "horas");
  const maxMensal = maxValue(data.evolucaoMensal, "reservas");

  return (
    <>
      <AdminPageHero eyebrow="Painel administrativo" title="Dashboard">
        <p className="mb-0">
          {data.resumo.reservasHoje} reserva(s) hoje, {data.resumo.pendentes} pendente(s) e {data.resumo.salasDisponiveis} sala(s) disponivel(is).
        </p>
      </AdminPageHero>
      <AdminMetrics items={[
        { label: "Reservas hoje", value: data.resumo.reservasHoje },
        { label: "Reservas no mes", value: data.resumo.reservasMes },
        { label: "Receita confirmada", value: money(data.resumo.receitaConfirmadaMes) },
        { label: "Pendentes / Canceladas", value: `${data.resumo.pendentes} / ${data.resumo.canceladasMes}` },
      ]} />

      <div className="admin-dashboard-grid">
        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Reservas por dia no mes</h2>
            <span>Mes atual</span>
          </div>
          <div className="admin-chart-bars">
            {data.reservasPorDia.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.total, maxReservasDia) }} />
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Status das reservas</h2>
            <span>Geral</span>
          </div>
          <div className="admin-status-grid">
            <div className="is-confirmada"><strong>{data.statusDistribuicao.confirmada}</strong><span>Confirmadas</span></div>
            <div className="is-pendente"><strong>{data.statusDistribuicao.pendente}</strong><span>Pendentes</span></div>
            <div className="is-cancelada"><strong>{data.statusDistribuicao.cancelada}</strong><span>Canceladas</span></div>
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Salas com maior demanda</h2>
            <span>Ranking</span>
          </div>
          <div className="admin-ranking-list">
            {data.salasMaisReservadas.slice(0, 6).map((sala, index) => (
              <div key={sala.nome}>
                <b>#{index + 1}</b>
                <span><strong>{sala.nome}</strong><small>{sala.total} reserva(s) - {money(sala.receita)}</small></span>
              </div>
            ))}
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Ocupacao nos ultimos 20 dias</h2>
            <span>Horas</span>
          </div>
          <div className="admin-chart-bars compact">
            {data.ocupacaoUltimos20Dias.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.horas, maxOcupacao) }} />
                <strong>{item.horas.toFixed(1)}h</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Evolucao de reservas e receita</h2>
            <span>Ultimos 6 meses</span>
          </div>
          <div className="admin-chart-bars">
            {data.evolucaoMensal.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.reservas, maxMensal) }} />
                <strong>{item.reservas} - {money(item.receita)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Proximas reservas</h2>
            <span>Atendimento</span>
          </div>
          <div className="admin-upcoming-list">
            {data.proximasReservas.map((reserva) => (
              <div key={reserva.id}>
                <strong>{reserva.sala?.nome ?? `Sala ${reserva.sala_id}`}</strong>
                <span>{dateBr(reserva.data_reserva)} - {String(reserva.hora_inicio).slice(0, 5)} as {String(reserva.hora_fim).slice(0, 5)}</span>
                <small>{reserva.usuario?.name ?? "Cliente nao identificado"} - {reserva.status_normalizado}</small>
              </div>
            ))}
            {!data.proximasReservas.length && <p className="mb-0">Nenhuma reserva futura encontrada no momento.</p>}
          </div>
        </section>
      </div>

      <AdminMetrics items={[
        { label: "Ticket medio", value: money(data.resumo.ticketMedio) },
        { label: "Clientes", value: data.resumo.clientes },
        { label: "Salas disponiveis", value: data.resumo.salasDisponiveis },
        { label: "Status geral", value: data.resumo.statusGeral },
      ]} />
    </>
  );
}
