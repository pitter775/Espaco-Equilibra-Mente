import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getLatestRegulation } from "@/lib/data";

const regulationPdf = "/assets/REGULAMENTO%20DO%20ESPA%C3%87O%20-%20EQM.pdf";

export const metadata: Metadata = {
  title: "Regulamento Interno | Espaco Equilibra Mente",
  description: "Regulamento interno de uso das salas do Espaco Equilibra Mente.",
};

export default async function RegulamentoPage() {
  const user = await getCurrentUser();
  const regulation = await getLatestRegulation();

  return (
    <main className="legacy-page">
      <SiteHeader user={user} />
      <section className="regulation-page">
        <div className="container">
          <div className="regulation-heading">
            <p className="admin-kicker mb-1">Uso das salas</p>
            <h1>Regulamento Interno</h1>
            <span>
              Consulte as regras de uso do Espaco Equilibra Mente antes de realizar ou confirmar uma reserva.
            </span>
          </div>

          <div className="regulation-actions">
            <Link className="eq-btn" href="/#about">Ver salas</Link>
            <a className="eq-btn secondary" href={regulationPdf} target="_blank" rel="noreferrer">
              Abrir PDF
            </a>
          </div>

          {regulation?.conteudo ? (
            <article className="eq-card regulation-content">
              <div>
                <span>Versao {regulation.versao}</span>
                <small>Regulamento interno vigente</small>
              </div>
              <pre>{regulation.conteudo}</pre>
            </article>
          ) : (
            <div className="eq-card regulation-document">
              <iframe title="Regulamento Interno do Espaco Equilibra Mente" src={regulationPdf} />
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
