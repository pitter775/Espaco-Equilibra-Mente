"use client";

import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/format";
import { LoadingButton } from "@/components/ui/LoadingButton";

type Slot = { inicio: string; fim: string; status: string; mensagem: string };
type Selected = { data_reserva: string; hora_inicio: string; hora_fim: string };

function slotStatusLabel(slot: Slot) {
  if (slot.status === "bloqueado") return "Bloqueado";
  if (slot.status === "reservado") return "Reservado";
  return "Livre";
}

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
  const [reviewLoading, setReviewLoading] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const total = useMemo(() => selected.length * valor, [selected.length, valor]);
  const selectedOrdered = useMemo(
    () => [...selected].sort((a, b) => `${a.data_reserva}${a.hora_inicio}`.localeCompare(`${b.data_reserva}${b.hora_inicio}`)),
    [selected],
  );
  const selectedDateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
    : "Selecione a data";

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("eqm:reservation-selection", {
      detail: {
        salaId,
        count: selected.length,
        total,
      },
    }));
  }, [salaId, selected.length, total]);

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
      setApprovalModalOpen(true);
      return;
    }
    if (!selected.length) {
      alert("Selecione pelo menos um horario.");
      return;
    }
    setReviewLoading(true);
    try {
      const response = await fetch("/api/reserva/revisao", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sala_id: salaId, horarios: selected }),
      });
      const data = await response.json();
      if (data.redirect) window.location.href = data.redirect;
      else alert(data.error || "Erro ao processar reserva.");
    } finally {
      setReviewLoading(false);
    }
  }

  if (disabled) {
    return <button className="eq-btn secondary w-100" disabled>Sala indisponivel no momento</button>;
  }

  return (
    <>
      <div id="agenda" className="eq-card p-4 reservation-card">
        <div className="reservation-card-heading">
          <div>
            <span>Agenda</span>
            <h3>Horarios disponiveis</h3>
          </div>
          <small>{selected.length ? `${selected.length} selecionado(s)` : "Por hora"}</small>
        </div>

        <label className="reservation-date-label" htmlFor={`reservation-date-${salaId}`}>Escolha uma data</label>
        <div className="reservation-date-field">
          <i className="fa-regular fa-calendar-days" aria-hidden="true" />
          <input
            id={`reservation-date-${salaId}`}
            className="form-control"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(event) => loadSlots(event.target.value)}
          />
          <span>{date ? "Toque para trocar" : "Toque para abrir o calendario"}</span>
        </div>

        <div className="reservation-legend">
          <span><i className="is-free"></i> Livre</span>
          <span><i className="is-selected"></i> Selecionado</span>
          <span><i className="is-busy"></i> Reservado</span>
        </div>

        <div className="reservation-slots-area">
          {loading && <p className="reservation-muted">Carregando agenda do dia...</p>}
          {!loading && !date && <p className="reservation-muted">Selecione uma data para ver a disponibilidade.</p>}
          {!loading && date && (
            <div className="horarios-grid">
              {slots.map((slot) => {
                const active = selected.some((item) => item.hora_inicio === slot.inicio && item.hora_fim === slot.fim);
                const unavailable = slot.status !== "disponivel";
                return (
                  <button
                    key={`${slot.inicio}-${slot.fim}`}
                    type="button"
                    className={`horario-slot horario-${slot.status} ${active ? "horario-selecionado" : ""}`}
                    disabled={unavailable}
                    aria-disabled={unavailable}
                    title={slot.mensagem}
                    onClick={() => toggle(slot)}
                  >
                    <span>{slot.inicio.slice(0, 2)}h - {slot.fim.slice(0, 2)}h</span>
                    <small>{slotStatusLabel(slot)}</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`reservation-summary-box ${selected.length ? "is-active" : ""}`}>
          <div>
            <span>{selectedDateLabel}</span>
            <strong>{selected.length ? `${selected.length} horario(s)` : "Nenhum horario escolhido"}</strong>
          </div>
          <div className="reservation-selected-list">
            {selectedOrdered.slice(0, 3).map((item) => (
              <small key={`${item.data_reserva}-${item.hora_inicio}`}>
                {item.hora_inicio.slice(0, 5)} as {item.hora_fim.slice(0, 5)}
              </small>
            ))}
            {selectedOrdered.length > 3 && <small>+ {selectedOrdered.length - 3} horario(s)</small>}
          </div>
        </div>

        <div className="reservation-actions">
          <strong>Total: {money(total)}</strong>
          <LoadingButton className="eq-btn" type="button" loading={reviewLoading} loadingLabel="Preparando..." onClick={review}>Reservar</LoadingButton>
        </div>
      </div>

      {approvalModalOpen && (
        <div className="reservation-approval-backdrop" role="presentation" onMouseDown={() => setApprovalModalOpen(false)}>
          <div className="reservation-approval-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-approval-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="reservation-approval-close" aria-label="Fechar aviso" onClick={() => setApprovalModalOpen(false)}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
            <div className="reservation-approval-icon">
              <i className="fa-regular fa-clock" aria-hidden="true" />
            </div>
            <span>Cadastro em análise</span>
            <h3 id="reservation-approval-title">Sua reserva ainda não pode ser concluída</h3>
            <p>
              Recebemos seus dados e a equipe do Espaço Equilibra Mente está conferindo o cadastro.
              Assim que for aprovado, você receberá um e-mail e poderá finalizar suas reservas.
            </p>
            <div className="reservation-approval-actions">
              <button type="button" className="eq-btn" onClick={() => setApprovalModalOpen(false)}>Entendi</button>
              <a className="eq-btn secondary" href="/profile">Ver perfil</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
