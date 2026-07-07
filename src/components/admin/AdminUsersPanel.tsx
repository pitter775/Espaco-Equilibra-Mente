"use client";

import { useMemo, useState } from "react";
import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import type { AppUser } from "@/lib/types";

function statusLabel(status?: string | null) {
  const value = status || "pendente";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function statusClass(status?: string | null) {
  const value = String(status ?? "").toLowerCase();
  if (value === "aprovado") return "success";
  if (value === "reprovado") return "danger";
  return "warning";
}

function userInitials(name?: string | null) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

export function AdminUsersPanel({ users }: { users: AppUser[] }) {
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [localUsers, setLocalUsers] = useState(users);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const stats = useMemo(() => ({
    total: localUsers.length,
    pendentes: localUsers.filter((user) => user.status_aprovacao === "pendente").length,
    aprovados: localUsers.filter((user) => user.status_aprovacao === "aprovado").length,
    reprovados: localUsers.filter((user) => user.status_aprovacao === "reprovado").length,
  }), [localUsers]);

  const filtered = localUsers.filter((user) => {
    const matchesStatus = filter === "todos" || user.status_aprovacao === filter;
    const text = `${user.name ?? ""} ${user.email ?? ""} ${user.telefone ?? ""} ${user.cpf ?? ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  });

  async function updateApproval(user: AppUser, status: "aprovado" | "reprovado") {
    setLoading(status);
    setMessage("");
    const response = await fetch(`/api/admin/usuarios/${user.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status_aprovacao: status }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setMessage(data.message || "Nao foi possivel atualizar o cadastro.");
      setLoading("");
      return;
    }

    setLocalUsers((current) => current.map((item) => item.id === user.id ? { ...item, status_aprovacao: status } : item));
    setSelected((current) => current ? { ...current, status_aprovacao: status } : current);
    setMessage(status === "aprovado" ? "Cadastro aprovado com sucesso." : "Cadastro reprovado com sucesso.");
    setLoading("");
  }

  return (
    <>
      <AdminPageHero eyebrow="Cadastros e aprovacoes" title="Usuarios" />
      <AdminMetrics items={[
        { label: "Total", value: stats.total },
        { label: "Pendentes", value: stats.pendentes },
        { label: "Aprovados", value: stats.aprovados },
        { label: "Reprovados", value: stats.reprovados },
      ]} />

      <div className="eq-card p-3">
        <div className="admin-toolbar">
          <input className="form-control" placeholder="Buscar por nome, e-mail, telefone ou CPF" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="admin-segments">
            {["todos", "pendente", "aprovado", "reprovado"].map((item) => (
              <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>
                {statusLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-user-grid">
          {filtered.map((user) => (
            <button className="admin-user-card" key={user.id} type="button" onClick={() => { setSelected(user); setMessage(""); }}>
              <div className="admin-avatar">{user.photo ? <img src={user.photo} alt="" /> : userInitials(user.name)}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{user.telefone || "Sem telefone"} · {user.tipo_usuario || "cliente"}</small>
              </div>
              <em className={`eq-status eq-status-${statusClass(user.status_aprovacao)}`}>{statusLabel(user.status_aprovacao)}</em>
            </button>
          ))}
        </div>

        {!filtered.length && <p className="text-center mb-0 p-4">Nenhum usuario encontrado.</p>}
      </div>

      {selected && (
        <div className="eq-modal-backdrop" role="dialog" aria-modal="true">
          <div className="eq-modal eq-card admin-user-modal">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p className="admin-kicker mb-1">Revisar cadastro</p>
                <h2 className="h4 mb-0">{selected.name}</h2>
              </div>
              <button className="eq-icon-btn" type="button" onClick={() => setSelected(null)} aria-label="Fechar">x</button>
            </div>

            <div className="admin-user-detail">
              <section>
                <h3>Dados cadastrais</h3>
                <p><strong>Email:</strong> {selected.email}</p>
                <p><strong>Telefone:</strong> {selected.telefone || "-"}</p>
                <p><strong>CPF:</strong> {selected.cpf || "-"}</p>
                <p><strong>Sexo:</strong> {selected.sexo || "-"} <strong className="ml-2">Idade:</strong> {selected.idade || "-"}</p>
                <p><strong>Registro:</strong> {selected.registro_profissional || "-"} ({selected.tipo_registro_profissional || "-"})</p>
                <p><strong>Endereco:</strong> {selected.endereco ? `${selected.endereco.rua}, ${selected.endereco.numero} - ${selected.endereco.bairro}, ${selected.endereco.cidade}/${selected.endereco.estado}` : "-"}</p>
              </section>

              <section>
                <h3>Documento</h3>
                <p><strong>Tipo:</strong> {selected.documento_tipo || "-"}</p>
                {selected.documento_caminho ? (
                  <div className="admin-document-box">
                    <span>{selected.documento_caminho}</span>
                    <small>Arquivo registrado no cadastro. O download depende do storage final.</small>
                  </div>
                ) : (
                  <p>Nenhum documento registrado.</p>
                )}
              </section>
            </div>

            <section className="admin-approval-box">
              <div>
                <span>Status atual</span>
                <strong className={`eq-status eq-status-${statusClass(selected.status_aprovacao)}`}>{statusLabel(selected.status_aprovacao)}</strong>
              </div>
              <div className="d-flex" style={{ gap: 10 }}>
                <button className="eq-btn" type="button" disabled={loading === "aprovado"} onClick={() => updateApproval(selected, "aprovado")}>Aprovar</button>
                <button className="eq-btn danger" type="button" disabled={loading === "reprovado"} onClick={() => updateApproval(selected, "reprovado")}>Reprovar</button>
              </div>
            </section>
            {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
