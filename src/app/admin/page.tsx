import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listReservas, listSalas } from "@/lib/data";

export default async function AdminPage() {
  await requireAdmin();
  const [salas, reservas] = await Promise.all([listSalas(), listReservas()]);

  return (
    <AdminShell>
      <h1 className="h3 mb-4">Dashboard</h1>
      <div className="row">
        <div className="col-md-4"><div className="eq-card p-4"><strong>Salas</strong><h2>{salas.length}</h2></div></div>
        <div className="col-md-4"><div className="eq-card p-4"><strong>Reservas</strong><h2>{reservas.length}</h2></div></div>
        <div className="col-md-4"><div className="eq-card p-4"><strong>Pendentes</strong><h2>{reservas.filter((r) => r.status === "PENDENTE").length}</h2></div></div>
      </div>
    </AdminShell>
  );
}
