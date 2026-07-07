import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const users = isSupabaseConfigured() ? (await getSupabaseAdmin().from("users").select("*").order("created_at", { ascending: false })).data ?? [] : [];
  return (
    <AdminShell>
      <h1 className="h3 mb-4">Usuarios</h1>
      <div className="eq-card p-3">
        <table className="table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Aprovacao</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.tipo_usuario}</td><td>{u.status_aprovacao}</td></tr>)}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
