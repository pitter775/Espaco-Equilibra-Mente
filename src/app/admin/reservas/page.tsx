import { AdminReservationsPanel } from "@/components/admin/AdminReservationsPanel";
import { listReservas } from "@/lib/data";

export default async function AdminReservasPage() {
  const reservas = await listReservas();

  return <AdminReservationsPanel reservas={reservas} />;
}
