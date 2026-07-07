import { AdminReservationsPanel } from "@/components/admin/AdminReservationsPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listReservas } from "@/lib/data";

export default async function AdminReservasPage() {
  await requireAdmin();
  const reservas = await listReservas();

  return (
    <AdminShell>
      <AdminReservationsPanel reservas={reservas} />
    </AdminShell>
  );
}
