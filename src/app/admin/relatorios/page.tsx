import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function RelatoriosPage() {
  await requireAdmin();
  return <AdminShell><h1 className="h3">Relatorios</h1><p>Base pronta para conectar os filtros e exportacoes apos validar o schema no Supabase.</p></AdminShell>;
}
