import { requireUser } from "@/lib/auth";
import { listReservasByUser } from "@/lib/data";
import { dateBr, money } from "@/lib/format";

export default async function MinhasReservasPage() {
  const user = await requireUser();
  const reservas = await listReservasByUser(user.id);

  return (
    <main className="legacy-page" style={{ minHeight: "100vh", padding: 32 }}>
      <div className="container">
        <h1 className="h3 mb-4">Minhas Reservas</h1>
        <div className="eq-card p-3">
          <table className="table">
            <thead><tr><th>Sala</th><th>Data</th><th>Horario</th><th>Status</th><th>Valor</th></tr></thead>
            <tbody>
              {reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td>{reserva.sala?.nome ?? reserva.sala_id}</td>
                  <td>{dateBr(reserva.data_reserva)}</td>
                  <td>{reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fim?.slice(0, 5)}</td>
                  <td>{reserva.status}</td>
                  <td>{money(reserva.sala?.valor ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reservas.length && <p className="text-center">Nenhuma reserva encontrada.</p>}
        </div>
      </div>
    </main>
  );
}
