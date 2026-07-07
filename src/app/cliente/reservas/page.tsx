import { requireUser } from "@/lib/auth";
import { ClientReservations } from "@/components/site/ClientReservations";
import { listReservaGroupsByUser } from "@/lib/data";

export default async function MinhasReservasPage() {
  const user = await requireUser();
  const groups = await listReservaGroupsByUser(user.id);

  return (
    <main className="legacy-page" style={{ minHeight: "100vh", padding: 32 }}>
      <div className="container">
        <h1 className="h3 mb-4">Minhas Reservas</h1>
        <ClientReservations groups={groups} />
      </div>
    </main>
  );
}
