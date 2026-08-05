"use client";

import { useState } from "react";
import type { ReservaClienteGrupo } from "@/lib/data";
import { dateBr, money } from "@/lib/format";
import { LoadingButton } from "@/components/ui/LoadingButton";

function statusBadge(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "CONFIRMADA" || normalized === "PAGA") return "success";
  if (normalized === "PENDENTE") return "warning";
  if (normalized === "CANCELADA") return "danger";
  return "secondary";
}

function showKeyButton(group: ReservaClienteGrupo) {
  const first = group.reservas[0];
  const last = group.reservas[group.reservas.length - 1];
  const start = new Date(`${first.data_reserva}T${first.hora_inicio.slice(0, 5)}:00`);
  const end = new Date(`${last.data_reserva}T${last.hora_fim.slice(0, 5)}:00`);
  const visibleFrom = new Date(start.getTime() - 30 * 60 * 1000);
  const now = new Date();
  return now >= visibleFrom && now <= end;
}

export function ClientReservations({ groups }: { groups: ReservaClienteGrupo[] }) {
  const [selected, setSelected] = useState<ReservaClienteGrupo | null>(null);
  const [chave, setChave] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  async function fetchChave(reservaId: number) {
    setLoading("chave");
    setMessage("");
    const response = await fetch(`/api/cliente/reserva/${reservaId}/chave`);
    const data = await response.json();
    if (response.ok) setChave(data.chave || "Chave nao cadastrada.");
    else setMessage(data.message || "Erro ao buscar chave.");
    setLoading("");
  }

  async function cancelReserva(reservaId: number) {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    setLoading("cancelar");
    setMessage("");
    const response = await fetch("/api/reserva/cancelar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference_id: `reserva_${reservaId}` }),
    });
    const data = await response.json();
    if (response.ok && data.success) window.location.reload();
    else setMessage(data.message || "Falha ao cancelar a reserva.");
    setLoading("");
  }

  return (
    <>
      <div className="eq-card p-3">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Sala</th>
                <th>Data</th>
                <th>Horarios</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const reserva = group.reservas[0];
                const status = reserva.status.toUpperCase();
                return (
                  <tr key={group.key}>
                    <td>{reserva.sala?.nome ?? reserva.sala_id}</td>
                    <td>{dateBr(reserva.data_reserva)}</td>
                    <td>{group.reservas.map((item) => <div key={item.id}>{item.hora_inicio.slice(0, 5)} - {item.hora_fim.slice(0, 5)}</div>)}</td>
                    <td>
                      <button className={`eq-status eq-status-${statusBadge(status)}`} type="button" onClick={() => { setSelected(group); setChave(""); setMessage(""); }}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!groups.length && <p className="text-center mb-0">Nenhuma reserva encontrada.</p>}
      </div>

      {selected && (
        <div className="eq-modal-backdrop" role="dialog" aria-modal="true">
          <div className="eq-modal eq-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Detalhes da Reserva</h2>
              <button className="eq-icon-btn" type="button" onClick={() => setSelected(null)} aria-label="Fechar">x</button>
            </div>
            <div className="row">
              <div className="col-md-5">
                <img
                  src={selected.reservas[0].sala?.imagens?.[0]?.imagem_base64 ?? "/assets/img/salas/sala1.jfif"}
                  className="img-fluid rounded w-100"
                  style={{ height: 220, objectFit: "cover" }}
                  alt={selected.reservas[0].sala?.nome ?? "Sala"}
                />
              </div>
              <div className="col-md-7">
                <h3 className="h5">{selected.reservas[0].sala?.nome ?? selected.sala_id}</h3>
                {selected.reservas[0].sala?.endereco && (
                  <p>
                    <strong>Endereco:</strong><br />
                    {selected.reservas[0].sala.endereco.rua}, {selected.reservas[0].sala.endereco.numero} - {selected.reservas[0].sala.endereco.bairro}<br />
                    {selected.reservas[0].sala.endereco.cidade}/{selected.reservas[0].sala.endereco.estado}
                  </p>
                )}
                <p className="mb-2"><strong>Horarios reservados:</strong></p>
                <ul className="pl-3">
                  {selected.reservas.map((item) => <li key={item.id}>{item.hora_inicio.slice(0, 5)} as {item.hora_fim.slice(0, 5)}</li>)}
                </ul>
                <p><strong>Total:</strong> {money((selected.reservas[0].sala?.valor ?? 0) * selected.reservas.length)}</p>
                {showKeyButton(selected) ? (
                  <div className="mb-3">
                    {!chave && (
                      <LoadingButton
                        className="eq-btn secondary"
                        type="button"
                        loading={loading === "chave"}
                        loadingLabel="Buscando..."
                        onClick={() => fetchChave(selected.reservas[0].id)}
                      >
                        Ver chave da sala
                      </LoadingButton>
                    )}
                    {chave && <p className="text-success font-weight-bold">Sua chave de acesso: {chave}</p>}
                  </div>
                ) : (
                  <p className="text-danger">A chave da sala estara visivel 30 minutos antes do horario reservado.</p>
                )}
              </div>
            </div>
            {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
            <div className="d-flex justify-content-end mt-4" style={{ gap: 10 }}>
              <button className="eq-btn secondary" type="button" onClick={() => setSelected(null)}>Fechar</button>
              {selected.reservas[0].status.toUpperCase() === "PENDENTE" && (
                <>
                  <a className="eq-btn" href={`/api/mercadopago/pagar/${selected.reservas[0].id}`} target="_blank">Concluir pagamento</a>
                  <LoadingButton
                    className="eq-btn danger"
                    type="button"
                    loading={loading === "cancelar"}
                    loadingLabel="Cancelando..."
                    onClick={() => cancelReserva(selected.reservas[0].id)}
                  >
                    Cancelar (sistema)
                  </LoadingButton>
                </>
              )}
              {["PAGA", "CONFIRMADA"].includes(selected.reservas[0].status.toUpperCase()) && (
                <a className="eq-btn danger" href={`https://wa.me/5511979691269?text=Ol%C3%A1!%20Quero%20cancelar%20a%20reserva%20%23${selected.reservas[0].id}.`} target="_blank">Cancelar via WhatsApp</a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
