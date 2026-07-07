import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHero } from "@/components/admin/AdminPageChrome";
import { requireAdmin } from "@/lib/auth";

export default async function RelatoriosPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <AdminPageHero eyebrow="Relatorios" title="Relatorios">
        <p className="mb-0">A fonte Laravel aponta esta rota para uma tela administrativa em construcao.</p>
      </AdminPageHero>
      <div className="eq-card p-4 admin-external-card">
        <h2>Dashboard Administrativo em Construcao</h2>
        <p>Rota preservada no Next para manter a navegacao existente. Nenhum relatorio extra foi inventado alem da fonte atual.</p>
        <a className="eq-btn secondary" href="/admin">Voltar ao dashboard</a>
      </div>
    </AdminShell>
  );
}
