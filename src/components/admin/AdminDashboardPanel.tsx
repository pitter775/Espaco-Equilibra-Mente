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

function rawPercent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function hasAny(items: { total?: number; horas?: number; reservas?: number; receita?: number }[], key: "total" | "horas" | "reservas" | "receita") {
  return items.some((item) => Number(item[key] ?? 0) > 0);
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="admin-empty-state">
      <i className={icon} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export function AdminDashboardPanel({ data }: { data: DashboardData }) {
  const reservasPorDiaComMovimento = data.reservasPorDia.filter((item) => item.total > 0);
  const ocupacaoComMovimento = data.ocupacaoUltimos20Dias.filter((item) => item.horas > 0);
  const maxReservasDia = maxValue(reservasPorDiaComMovimento, "total");
  const maxOcupacao = maxValue(ocupacaoComMovimento, "horas");
  const maxMensal = maxValue(data.evolucaoMensal, "reservas");
  const temReservasNoMes = hasAny(data.reservasPorDia, "total");
  const temOcupacaoRecente = hasAny(data.ocupacaoUltimos20Dias, "horas");
  const temEvolucao = hasAny(data.evolucaoMensal, "reservas");
  const temStatus = data.statusDistribuicao.confirmada + data.statusDistribuicao.pendente + data.statusDistribuicao.cancelada > 0;
  const totalStatus = data.statusDistribuicao.confirmada + data.statusDistribuicao.pendente + data.statusDistribuicao.cancelada;
  const salasComDemanda = data.salasMaisReservadas.filter((sala) => sala.total > 0).slice(0, 6);

  return (
    <>
      <AdminPageHero eyebrow="Painel administrativo" title="Dashboard">
        <p className="mb-0">
          {data.resumo.reservasHoje} reserva(s) hoje, {data.resumo.pendentes} pendente(s) e {data.resumo.salasDisponiveis} sala(s) disponivel(is).
        </p>
      </AdminPageHero>
      <AdminMetrics items={[
        { label: "Status geral", value: data.resumo.statusGeral },
        { label: "Ticket medio", value: money(data.resumo.ticketMedio) },
        { label: "Clientes", value: data.resumo.clientes },
        { label: "Salas disponiveis", value: data.resumo.salasDisponiveis },
      ]} />

      <div className="admin-dashboard-grid">
        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Evolucao de reservas e receita</h2>
            <span>Ultimos 6 meses</span>
          </div>
          <div className="admin-chart-bars">
            {data.evolucaoMensal.map((item) => (
              <div key={item.label} className={item.reservas > 0 ? undefined : "is-empty"}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.reservas, maxMensal) }} />
                <strong>{item.reservas} - {money(item.receita)}</strong>
              </div>
            ))}
          </div>
          {!temEvolucao && (
            <EmptyState
              icon="fa-solid fa-arrow-trend-up"
              title="Historico em formacao"
              text="A evolucao mensal sera exibida conforme novas reservas forem confirmadas."
            />
          )}
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Status das reservas</h2>
            <span>Geral</span>
          </div>
          {temStatus ? (
            <div className="admin-status-grid">
              <div className="is-confirmada"><strong>{data.statusDistribuicao.confirmada}</strong><span>Confirmadas</span></div>
              <div className="is-pendente"><strong>{data.statusDistribuicao.pendente}</strong><span>Pendentes</span></div>
              <div className="is-cancelada"><strong>{data.statusDistribuicao.cancelada}</strong><span>Canceladas</span></div>
            </div>
          ) : (
            <EmptyState
              icon="fa-solid fa-chart-pie"
              title="Sem historico de reservas"
              text="O resumo de status sera preenchido automaticamente com as primeiras reservas."
            />
          )}
          {temStatus && (
            <div className="admin-status-bar" aria-label="Distribuicao de status das reservas">
              <i className="is-confirmada" style={{ width: rawPercent(data.statusDistribuicao.confirmada, totalStatus) }} />
              <i className="is-pendente" style={{ width: rawPercent(data.statusDistribuicao.pendente, totalStatus) }} />
              <i className="is-cancelada" style={{ width: rawPercent(data.statusDistribuicao.cancelada, totalStatus) }} />
            </div>
          )}
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Salas com maior demanda</h2>
            <span>Ranking</span>
          </div>
          <div className="admin-ranking-list">
            {salasComDemanda.map((sala, index) => (
              <div key={sala.nome}>
                <b>#{index + 1}</b>
                <span><strong>{sala.nome}</strong><small>{sala.total} reserva(s) - {money(sala.receita)}</small></span>
              </div>
            ))}
            {!salasComDemanda.length && (
              <EmptyState
                icon="fa-solid fa-door-open"
                title="Salas preparadas para o ranking"
                text="Quando houver reservas, a maior demanda aparece por ordem automaticamente."
              />
            )}
          </div>
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Ocupacao nos ultimos 20 dias</h2>
            <span>Horas</span>
          </div>
          <div className="admin-chart-bars compact">
            {ocupacaoComMovimento.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.horas, maxOcupacao) }} />
                <strong>{item.horas.toFixed(1)}h</strong>
              </div>
            ))}
          </div>
          {!temOcupacaoRecente && (
            <EmptyState
              icon="fa-regular fa-clock"
              title="Sem ocupacao recente"
              text="As horas reservadas dos ultimos dias vao aparecer neste painel."
            />
          )}
        </section>

        <section className="eq-card admin-dashboard-panel">
          <div className="admin-dashboard-heading">
            <h2>Reservas por dia no mes</h2>
            <span>Mes atual</span>
          </div>
          <div className="admin-chart-bars">
            {reservasPorDiaComMovimento.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <i style={{ width: percent(item.total, maxReservasDia) }} />
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
          {!temReservasNoMes && (
            <EmptyState
              icon="fa-regular fa-calendar-check"
              title="Mes pronto para receber reservas"
              text="Assim que um agendamento entrar, os dias com movimento aparecem aqui."
            />
          )}
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
            {!data.proximasReservas.length && (
              <EmptyState
                icon="fa-regular fa-calendar-plus"
                title="Agenda livre no momento"
                text="Quando uma cliente reservar um horario futuro, ele aparece aqui em destaque."
              />
            )}
          </div>
        </section>
      </div>

      <AdminMetrics items={[
        { label: "Reservas hoje", value: data.resumo.reservasHoje },
        { label: "Reservas no mes", value: data.resumo.reservasMes },
        { label: "Receita confirmada", value: money(data.resumo.receitaConfirmadaMes) },
        { label: "Pendentes / Canceladas", value: `${data.resumo.pendentes} / ${data.resumo.canceladasMes}` },
      ]} />
    </>
  );
}
