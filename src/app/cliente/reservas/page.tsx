import { requireUser } from "@/lib/auth";
import { ClientReservations } from "@/components/site/ClientReservations";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { listReservaGroupsByUser } from "@/lib/data";

export default async function MinhasReservasPage() {
  const user = await requireUser();
  const groups = await listReservaGroupsByUser(user.id);

  return (
    <main className="legacy-page">
      <SiteHeader user={user} />
      <section className="profile-page client-reservations-page">
        <div className="container">
          <div className="profile-heading">
            <p className="admin-kicker mb-1">Area do cliente</p>
            <h1>Minhas Reservas</h1>
            <span>Acompanhe suas reservas, pagamentos pendentes, detalhes da sala e chaves liberadas.</span>
          </div>
          <ClientReservations groups={groups} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
