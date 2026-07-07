import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { money } from "@/lib/format";

export default async function AdminSalasPage() {
  await requireAdmin();
  const salas = await listSalas();
  return (
    <AdminShell>
      <h1 className="h3 mb-4">Salas</h1>
      <div className="eq-card p-3">
        <table className="table">
          <thead><tr><th>Nome</th><th>Status</th><th>Valor</th><th>Metragem</th></tr></thead>
          <tbody>{salas.map((sala) => <tr key={sala.id}><td>{sala.nome}</td><td>{sala.status}</td><td>{money(sala.valor)}</td><td>{sala.metragem}</td></tr>)}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
