import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ConfirmReservationButton } from "@/components/site/ConfirmReservationButton";
import { money } from "@/lib/format";

export default async function RevisaoPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("eqm-reserva")?.value;
  if (!raw) redirect("/");
  const reserva = JSON.parse(raw) as { sala_nome: string; valor_total: number; horarios: { data_reserva: string; hora_inicio: string; hora_fim: string }[] };

  return (
    <main className="legacy-page" style={{ minHeight: "100vh", padding: 32 }}>
      <div className="container">
        <div className="eq-card p-4">
          <h1 className="h3">Revisao da reserva</h1>
          <p>Sala: <strong>{reserva.sala_nome}</strong></p>
          <ul>{reserva.horarios.map((h) => <li key={`${h.data_reserva}-${h.hora_inicio}`}>{h.data_reserva} - {h.hora_inicio} as {h.hora_fim}</li>)}</ul>
          <h2 className="h4">Total: {money(reserva.valor_total)}</h2>
          <ConfirmReservationButton />
        </div>
      </div>
    </main>
  );
}
