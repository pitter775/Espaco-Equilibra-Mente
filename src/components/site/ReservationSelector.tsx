"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";

type Slot = { inicio: string; fim: string; status: string; mensagem: string };
type Selected = { data_reserva: string; hora_inicio: string; hora_fim: string };

export function ReservationSelector({
  salaId,
  valor,
  userApproved,
  disabled,
}: {
  salaId: number;
  valor: number;
  userApproved: boolean;
  disabled: boolean;
}) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Selected[]>([]);
  const [loading, setLoading] = useState(false);
  const total = useMemo(() => selected.length * valor, [selected.length, valor]);

  async function loadSlots(value: string) {
    setDate(value);
    setSelected([]);
    if (!value) return;
    setLoading(true);
    const response = await fetch(`/api/horarios-disponiveis/${salaId}/${value}`);
    const data = await response.json();
    setSlots(data.horarios ?? []);
    setLoading(false);
  }

  function toggle(slot: Slot) {
    const key = `${date}-${slot.inicio}-${slot.fim}`;
    setSelected((current) => {
      const exists = current.some((item) => `${item.data_reserva}-${item.hora_inicio}-${item.hora_fim}` === key);
      if (exists) {
        return current.filter((item) => `${item.data_reserva}-${item.hora_inicio}-${item.hora_fim}` !== key);
      }
      return [...current, { data_reserva: date, hora_inicio: slot.inicio, hora_fim: slot.fim }];
    });
  }

  async function review() {
    if (!userApproved) {
      alert("Seu cadastro ainda esta em analise. Aguarde a aprovacao para concluir uma reserva.");
      return;
    }
    if (!selected.length) {
      alert("Selecione pelo menos um horario.");
      return;
    }
    const response = await fetch("/api/reserva/revisao", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sala_id: salaId, horarios: selected }),
    });
    const data = await response.json();
    if (data.redirect) window.location.href = data.redirect;
    else alert(data.error || "Erro ao processar reserva.");
  }

  if (disabled) {
    return <button className="eq-btn secondary w-100" disabled>Sala indisponivel no momento</button>;
  }

  return (
    <div className="eq-card p-4 reservation-card">
      <h3>Horarios disponiveis</h3>
      <label className="d-block mb-2">Escolha uma data</label>
      <input className="form-control" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => loadSlots(event.target.value)} />
      <div className="mt-3" style={{ minHeight: 120 }}>
        {loading && <p>Carregando agenda do dia...</p>}
        {!loading && !date && <p>Aguardando selecionar a data para exibir os horarios...</p>}
        {!loading && date && (
          <div className="horarios-grid">
            {slots.map((slot) => {
              const active = selected.some((item) => item.hora_inicio === slot.inicio && item.hora_fim === slot.fim);
              return (
                <button
                  key={`${slot.inicio}-${slot.fim}`}
                  type="button"
                  className={`horario-slot horario-${slot.status} ${active ? "horario-selecionado" : ""}`}
                  disabled={slot.status !== "disponivel"}
                  title={slot.mensagem}
                  onClick={() => toggle(slot)}
                >
                  {slot.inicio.slice(0, 2)}hs - {slot.fim.slice(0, 2)}hs
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <strong>Total: {money(total)}</strong>
        <button className="eq-btn" type="button" onClick={review}>Reservar</button>
      </div>
    </div>
  );
}
