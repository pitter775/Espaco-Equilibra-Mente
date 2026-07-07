import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function FechaduraPage() {
  await requireAdmin();
  return <AdminShell><h1 className="h3">Fechadura</h1><p>Cadastro de chaves preservado como rota. Edicao depende da estrutura final da tabela fechaduras no Supabase.</p></AdminShell>;
}
