import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listReservas } from "@/lib/data";
import { dateBr } from "@/lib/format";

export default async function AdminReservasPage() {
  await requireAdmin();
  const reservas = await listReservas();
  return (
    <AdminShell>
      <h1 className="h3 mb-4">Reservas</h1>
      <div className="eq-card p-3">
        <table className="table">
          <thead><tr><th>ID</th><th>Sala</th><th>Data</th><th>Horario</th><th>Status</th></tr></thead>
          <tbody>{reservas.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.sala?.nome ?? r.sala_id}</td><td>{dateBr(r.data_reserva)}</td><td>{r.hora_inicio?.slice(0, 5)} - {r.hora_fim?.slice(0, 5)}</td><td>{r.status}</td></tr>)}</tbody>
        </table>
      </div>
    </AdminShell>
  );
}
