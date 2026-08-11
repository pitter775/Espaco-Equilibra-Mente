"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import type { Reserva } from "@/lib/types";
import { dateBr, money } from "@/lib/format";
import { LoadingButton } from "@/components/ui/LoadingButton";

function normalizeStatus(status?: string | null) {
  return String(status ?? "").toUpperCase();
}

function statusLabel(status?: string | null) {
  const value = normalizeStatus(status);
  if (value === "CONFIRMADA") return "Confirmada";
  if (value === "PENDENTE") return "Pendente";
  if (value === "CANCELADA") return "Cancelada";
  return value || "Desconhecido";
}

function statusClass(status?: string | null) {
  const value = normalizeStatus(status);
  if (value === "CONFIRMADA") return "success";
  if (value === "PENDENTE") return "warning";
  if (value === "CANCELADA") return "danger";
  return "secondary";
}

function initials(name?: string | null) {
  const parts = String(name || "CL").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function timeRange(reserva: Reserva) {
  return `${String(reserva.hora_inicio || "").slice(0, 5)} as ${String(reserva.hora_fim || "").slice(0, 5)}`;
}

function longDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateBr(value);
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function roomImage(reserva: Reserva) {
  return reserva.sala?.imagens?.find((image) => image.principal)?.imagem_base64 ?? reserva.sala?.imagens?.[0]?.imagem_base64 ?? "";
}

function endereco(reserva: Reserva) {
  const item = reserva.sala?.endereco;
  if (!item) return "Endereco nao informado";
  return [item.rua, item.numero, item.bairro, [item.cidade, item.estado].filter(Boolean).join("/")].filter(Boolean).join(", ");
}

function hours(reserva: Reserva) {
  const start = String(reserva.hora_inicio || "").split(":").map(Number);
  const end = String(reserva.hora_fim || "").split(":").map(Number);
  if (start.length < 2 || end.length < 2) return 0;
  const diff = ((end[0] * 60) + end[1]) - ((start[0] * 60) + start[1]);
  return diff > 0 ? diff / 60 : 0;
}

function totalValue(reserva: Reserva) {
  return Number(reserva.sala?.valor ?? 0) * hours(reserva);
}

export function AdminReservationsPanel({ reservas }: { reservas: Reserva[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Reserva | null>(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [roomFilter, setRoomFilter] = useState("todas");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  const rooms = useMemo(() => Array.from(new Set(reservas.map((reserva) => reserva.sala?.nome).filter(Boolean))).sort() as string[], [reservas]);
  const stats = useMemo(() => ({
    total: reservas.length,
    confirmadas: reservas.filter((reserva) => normalizeStatus(reserva.status) === "CONFIRMADA").length,
    pendentes: reservas.filter((reserva) => normalizeStatus(reserva.status) === "PENDENTE").length,
    canceladas: reservas.filter((reserva) => normalizeStatus(reserva.status) === "CANCELADA").length,
  }), [reservas]);

  const filtered = reservas.filter((reserva) => {
    const statusMatch = statusFilter === "todos" || statusLabel(reserva.status) === statusFilter;
    const roomMatch = roomFilter === "todas" || reserva.sala?.nome === roomFilter;
    const text = `${reserva.id} ${reserva.usuario?.name ?? ""} ${reserva.usuario?.email ?? ""} ${reserva.usuario?.telefone ?? ""} ${reserva.sala?.nome ?? ""}`.toLowerCase();
    return statusMatch && roomMatch && text.includes(query.toLowerCase());
  });

  async function cancelReservation(reserva: Reserva) {
    if (!confirm("Deseja realmente cancelar esta reserva?")) return;
    setLoading(`cancel-${reserva.id}`);
    setMessage("");
    const response = await fetch(`/api/admin/reservas/${reserva.id}/cancelar`, { method: "POST" });
    const data = await response.json();
    setLoading("");

    if (!response.ok || !data.success) {
      setMessage(data.message || "Falha ao cancelar reserva.");
      return;
    }

    setMessage(data.message || "Reserva cancelada com sucesso!");
    setSelected(null);
    router.refresh();
  }

  async function approveClient(reserva: Reserva) {
    if (!reserva.usuario?.id) return;
    setLoading(`approve-user-${reserva.usuario.id}`);
    setMessage("");

    const response = await fetch(`/api/admin/usuarios/${reserva.usuario.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status_aprovacao: "aprovado" }),
    });
    const data = await response.json();
    setLoading("");

    if (!response.ok || !data.success) {
      setMessage(data.message || "Nao foi possivel aprovar o cliente.");
      return;
    }

    setMessage(data.email?.sent ? "Cliente aprovado com sucesso. E-mail enviado." : "Cliente aprovado com sucesso.");
    setSelected((current) => current?.id === reserva.id && current.usuario ? { ...current, usuario: { ...current.usuario, status_aprovacao: "aprovado" } } : current);
    router.refresh();
  }

  return (
    <>
      <AdminPageHero eyebrow="Operacao de reservas" title="Reservas">
        <p className="mb-0">Acompanhe cliente, contato, sala, periodo, status, detalhes e cancelamentos.</p>
      </AdminPageHero>
      <AdminMetrics items={[
        { label: "Total", value: stats.total },
        { label: "Confirmadas", value: stats.confirmadas },
        { label: "Pendentes", value: stats.pendentes },
        { label: "Canceladas", value: stats.canceladas },
      ]} />

      <div className="admin-reservation-controls">
        <div className="admin-control-heading">
          <div>
            <span>Filtros</span>
            <strong>Encontrar reserva</strong>
          </div>
          <small>{filtered.length} de {reservas.length} reserva(s)</small>
        </div>
        <div className="admin-toolbar admin-reservation-toolbar">
          <label className="admin-control-field admin-control-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input className="form-control" placeholder="Cliente, e-mail, telefone, sala ou ID" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="admin-segments admin-reservation-segments" aria-label="Filtrar por status">
            {["todos", "Confirmada", "Pendente", "Cancelada"].map((item) => (
              <button key={item} className={statusFilter === item ? "active" : ""} type="button" onClick={() => setStatusFilter(item)}>
                {item === "todos" ? "Todos" : item}
              </button>
            ))}
          </div>
          <div className="admin-segments admin-reservation-segments admin-room-segments" aria-label="Filtrar por sala">
            {["todas", ...rooms].map((item) => (
              <button key={item} className={roomFilter === item ? "active" : ""} type="button" onClick={() => setRoomFilter(item)}>
                {item === "todas" ? "Todas as salas" : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="eq-card p-3">
        <div className="admin-reservation-list admin-filter-transition" key={`${statusFilter}-${roomFilter}-${query}`}>
          {filtered.map((reserva) => {
            const canCancel = normalizeStatus(reserva.status) !== "CANCELADA";
            const clientePendente = String(reserva.usuario?.status_aprovacao ?? "").toLowerCase() === "pendente";
            return (
              <div className="admin-reservation-row" key={reserva.id}>
                <div className="admin-reservation-person">
                  <span className="admin-avatar">{reserva.usuario?.photo ? <img src={reserva.usuario.photo} alt="" /> : initials(reserva.usuario?.name)}</span>
                  <div>
                    <strong>{reserva.usuario?.name || "Cliente nao identificado"}</strong>
                    <small>Reserva #{reserva.id}</small>
                  </div>
                </div>
                <div>
                  <strong>Contato</strong>
                  <span>{reserva.usuario?.email || "Email nao informado"}</span>
                  <small>{reserva.usuario?.telefone || "Telefone nao informado"} - Cadastro {reserva.usuario?.status_aprovacao || "pendente"}</small>
                </div>
                <div>
                  <strong>{reserva.sala?.nome || "Sala nao encontrada"}</strong>
                  <span>{reserva.sala?.valor ? `${money(reserva.sala.valor)}/hora` : "Valor nao informado"}</span>
                </div>
                <div>
                  <strong>{longDate(reserva.data_reserva)}</strong>
                  <span>{timeRange(reserva)}</span>
                </div>
                <div className="admin-reservation-actions">
                  <em className={`eq-status eq-status-${statusClass(reserva.status)}`}>{statusLabel(reserva.status)}</em>
                  <div className="admin-reservation-action-group">
                    <button className="admin-table-action" type="button" onClick={() => { setSelected(reserva); setMessage(""); }}>
                      <i className="fa-solid fa-eye" aria-hidden="true" />
                      <span>Detalhes</span>
                    </button>
                    {clientePendente && (
                      <LoadingButton className="admin-table-action success" type="button" loading={loading === `approve-user-${reserva.usuario?.id}`} loadingLabel="Aprovando..." onClick={() => approveClient(reserva)}>
                        <i className="fa-solid fa-user-check" aria-hidden="true" />
                        <span>Aprovar cliente</span>
                      </LoadingButton>
                    )}
                    <a className="admin-table-action" href={reserva.sala?.id ? `/admin/salas?editar=${reserva.sala.id}` : "/admin/salas"}>
                      <i className="fa-solid fa-door-open" aria-hidden="true" />
                      <span>Sala</span>
                    </a>
                    {canCancel && (
                      <LoadingButton className="admin-table-action danger" type="button" loading={loading === `cancel-${reserva.id}`} loadingLabel="Cancelando..." onClick={() => cancelReservation(reserva)}>
                        <i className="fa-solid fa-ban" aria-hidden="true" />
                        <span>Cancelar</span>
                      </LoadingButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!filtered.length && <p className="text-center mb-0 p-4">Nenhuma reserva encontrada.</p>}
        {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
      </div>

      {selected && (
        <div className="eq-modal-backdrop" role="dialog" aria-modal="true">
          <div className="eq-modal eq-card admin-reservation-modal">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p className="admin-kicker mb-1">Reserva #{selected.id}</p>
                <h2 className="h4 mb-0">{selected.sala?.nome || "Sala nao encontrada"}</h2>
              </div>
              <button className="eq-icon-btn" type="button" onClick={() => setSelected(null)} aria-label="Fechar">x</button>
            </div>

            <div className="admin-reservation-detail">
              <div className="admin-reservation-image">
                {roomImage(selected) ? <img src={roomImage(selected)} alt="" /> : <span>Sem imagem</span>}
              </div>
              <div className="admin-reservation-detail-grid">
                <section>
                  <h3>Cliente</h3>
                  <p><strong>{selected.usuario?.name || "Cliente nao identificado"}</strong></p>
                  <p>{selected.usuario?.email || "Email nao informado"}</p>
                  <p>{selected.usuario?.telefone || "Telefone nao informado"}</p>
                  <p><strong>Cadastro:</strong> {selected.usuario?.status_aprovacao || "pendente"}</p>
                </section>
                <section>
                  <h3>Pagamento</h3>
                  <p><strong>Valor por hora:</strong> {money(selected.sala?.valor)}</p>
                  <p><strong>Valor total:</strong> {money(totalValue(selected))}</p>
                  <p><strong>Status:</strong> {statusLabel(selected.status)}</p>
                </section>
                <section>
                  <h3>Local da reserva</h3>
                  <p>{endereco(selected)}</p>
                </section>
                <section>
                  <h3>Horario reservado</h3>
                  <p>{longDate(selected.data_reserva)}</p>
                  <p>{timeRange(selected)}</p>
                </section>
              </div>
            </div>

            <div className="admin-approval-box">
              <span>{normalizeStatus(selected.status) === "CANCELADA" ? "Esta reserva ja esta cancelada." : "Confira os dados antes de cancelar esta reserva."}</span>
              <div className="d-flex flex-wrap" style={{ gap: 10 }}>
                {String(selected.usuario?.status_aprovacao ?? "").toLowerCase() === "pendente" && (
                  <LoadingButton className="eq-btn" type="button" loading={loading === `approve-user-${selected.usuario?.id}`} loadingLabel="Aprovando..." onClick={() => approveClient(selected)}>Aprovar cliente</LoadingButton>
                )}
                {normalizeStatus(selected.status) !== "CANCELADA" && <LoadingButton className="eq-btn danger" type="button" loading={loading === `cancel-${selected.id}`} loadingLabel="Cancelando..." onClick={() => cancelReservation(selected)}>Cancelar reserva</LoadingButton>}
                <a className="eq-btn secondary" href={selected.sala?.id ? `/admin/salas?editar=${selected.sala.id}` : "/admin/salas"}>Editar sala</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
