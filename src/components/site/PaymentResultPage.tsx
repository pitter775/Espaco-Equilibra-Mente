import Link from "next/link";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { AppUser } from "@/lib/types";

type PaymentResultPageProps = {
  user: AppUser | null;
  status: "success" | "pending" | "error";
};

const content = {
  success: {
    icon: "fa-solid fa-circle-check",
    eyebrow: "Pagamento aprovado",
    title: "Reserva confirmada",
    description: "Recebemos a confirmacao do pagamento. Sua reserva ja pode ser acompanhada na area do cliente.",
    tone: "success",
  },
  pending: {
    icon: "fa-solid fa-clock",
    eyebrow: "Pagamento pendente",
    title: "Estamos aguardando a confirmacao",
    description: "Assim que o Mercado Pago confirmar o pagamento, sua reserva sera atualizada automaticamente.",
    tone: "pending",
  },
  error: {
    icon: "fa-solid fa-triangle-exclamation",
    eyebrow: "Pagamento nao concluido",
    title: "Nao foi possivel confirmar o pagamento",
    description: "Voce pode tentar novamente pela area Minhas Reservas ou escolher outro meio de pagamento.",
    tone: "error",
  },
} as const;

export function PaymentResultPage({ user, status }: PaymentResultPageProps) {
  const data = content[status];

  return (
    <main className="legacy-page">
      <SiteHeader user={user} />
      <section className="payment-result-page">
        <div className="container">
          <div className={`eq-card payment-result-card ${data.tone}`}>
            <div className="payment-result-icon">
              <i className={data.icon} aria-hidden="true" />
            </div>
            <p className="admin-kicker mb-1">{data.eyebrow}</p>
            <h1>{data.title}</h1>
            <p>{data.description}</p>
            <div className="payment-result-actions">
              <Link className="eq-btn" href="/cliente/reservas">Minhas reservas</Link>
              <Link className="eq-btn secondary" href="/#about">Ver salas</Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
