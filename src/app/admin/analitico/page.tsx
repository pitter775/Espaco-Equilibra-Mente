import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHero } from "@/components/admin/AdminPageChrome";
import { requireAdmin } from "@/lib/auth";

const analyticsUrl = "https://analytics.google.com/analytics/web/#/p473689702/reports/dashboard?params=_u..nav%3Dmaui%26_r.1..selmet%3D%5B%22conversions%22%5D&r=business-objectives-generate-leads-overview&ruid=business-objectives-generate-leads-overview,business-objectives,generate-leads&collectionId=business-objectives";

export default async function AnaliticoPage() {
  await requireAdmin();
  const password = process.env.GOOGLE_ANALYTICS_SHARED_PASSWORD;

  return (
    <AdminShell>
      <AdminPageHero eyebrow="Google Analytics" title="Analitico">
        <p className="mb-0">Acesso externo ao painel de analytics conforme a tela Laravel.</p>
      </AdminPageHero>
      <div className="eq-card p-4 admin-external-card">
        <h2>Acessar os dados do Google Analitico</h2>
        <p>Para acessar o Google Analytics, clique no botao abaixo e faca login com as credenciais fornecidas.</p>
        <p><strong>Usuario:</strong> espacoequilibramente7@gmail.com</p>
        <p><strong>Senha:</strong> {password || "configurar GOOGLE_ANALYTICS_SHARED_PASSWORD no ambiente"}</p>
        <a className="eq-btn" href={analyticsUrl} target="_blank" rel="noreferrer">Acessar Google Analytics</a>
      </div>
    </AdminShell>
  );
}
