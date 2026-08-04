import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConfirmReservationButton } from "@/components/site/ConfirmReservationButton";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { money } from "@/lib/format";

const regulationItems = [
  {
    title: "Reservas e Pagamentos",
    text: "Reservas via plataforma ou WhatsApp. O pagamento e realizado no momento da reserva.",
  },
  {
    title: "Cancelamento",
    text: "Cancelamentos com ate 24h de antecedencia tem reembolso integral. Apos esse prazo, nao ha reembolso.",
  },
  {
    title: "Duracao e Tolerancia",
    text: "Cada hora contratada equivale a 50 minutos de uso, com 5 minutos de tolerancia.",
  },
  {
    title: "Uso do Espaco",
    text: "Apenas profissionais da saude mental podem utilizar as salas. O ambiente deve ser entregue organizado.",
  },
  {
    title: "Seguranca",
    text: "A senha da sala e pessoal e intransferivel. O profissional deve recepcionar seus clientes no andar.",
  },
  {
    title: "Protecao de Dados",
    text: "Os dados sao tratados conforme a LGPD e usados apenas para cadastro, reserva e comunicacao operacional.",
  },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default async function RevisaoPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("eqm-reserva")?.value;
  if (!raw) redirect("/");
  const user = await getCurrentUser();
  const reserva = JSON.parse(raw) as {
    sala_nome: string;
    sala_metragem?: string | number | null;
    sala_imagem?: string | null;
    valor_total: number;
    horarios: { data_reserva: string; hora_inicio: string; hora_fim: string }[];
  };

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <main className="reservation-review-page">
        <div className="container reservation-review-container">
          <div className="reservation-review-hero">
            <div className="reservation-review-photo">
              {reserva.sala_imagem ? <img src={reserva.sala_imagem} alt={reserva.sala_nome} /> : <span>Imagem da sala</span>}
            </div>
            <div className="reservation-review-heading">
              <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" />
              <span>Reserva</span>
              <h1>Revise sua reserva</h1>
              <p>Confira os horarios escolhidos e aceite o regulamento para abrir o checkout de pagamento.</p>
            </div>
          </div>

          <div className="reservation-review-room-strip">
            <div>
              <span>Sala escolhida</span>
              <strong>{reserva.sala_nome}</strong>
            </div>
            <div>
              <span>Periodo</span>
              <strong>{reserva.horarios.length} horario(s)</strong>
            </div>
            {reserva.sala_metragem && (
              <div>
                <span>Espaco</span>
                <strong>{reserva.sala_metragem} m2</strong>
              </div>
            )}
            <div>
              <span>Total</span>
              <strong>{money(reserva.valor_total)}</strong>
            </div>
          </div>

          <div className="reservation-review-layout">
            <section className="eq-card reservation-review-card">
              <h2>Detalhes da reserva</h2>
              <div className="reservation-summary-line">
                <span>Sala</span>
                <strong>{reserva.sala_nome}</strong>
              </div>
              <div className="reservation-schedule-list">
                {reserva.horarios.map((h) => (
                  <div className="reservation-schedule-item" key={`${h.data_reserva}-${h.hora_inicio}`}>
                    <span>{formatDate(h.data_reserva)}</span>
                    <strong>{h.hora_inicio.slice(0, 5)} as {h.hora_fim.slice(0, 5)}</strong>
                  </div>
                ))}
              </div>
              <div className="reservation-total-line">
                <span>Total</span>
                <strong>{money(reserva.valor_total)}</strong>
              </div>
              <ConfirmReservationButton />
            </section>

            <section className="eq-card reservation-regulation-card">
              <h2>Regulamento de Uso das Salas</h2>
              <div className="reservation-regulation-scroll">
                {regulationItems.map((item) => (
                  <p key={item.title}>
                    <strong>{item.title}</strong>
                    <br />
                    {item.text}
                  </p>
                ))}
                <p className="reservation-regulation-note">
                  Este e um resumo dos principais pontos. O regulamento completo pode ser aberto antes da confirmacao.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
