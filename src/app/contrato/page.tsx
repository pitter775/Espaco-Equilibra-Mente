import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function ContratoPage() {
  await requireAdmin();
  return <AdminShell><h1 className="h3">Contrato</h1><p>Rota migrada. Editor do contrato sera ligado a tabela contracts apos configurar Supabase.</p></AdminShell>;
}
