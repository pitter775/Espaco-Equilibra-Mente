import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function AnaliticoPage() {
  await requireAdmin();
  return <AdminShell><h1 className="h3">Analitico</h1><p>Relatorios analiticos migrados para estrutura Next.js. Graficos dependem da carga do Supabase.</p></AdminShell>;
}
