"use client";

import { useMemo, useState } from "react";
import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import type { AppUser } from "@/lib/types";
import { LoadingButton } from "@/components/ui/LoadingButton";

type Mode = "details" | "create" | "edit";
type ApiResult = {
  data?: AppUser;
  email?: {
    sent?: boolean;
    skipped?: boolean;
    error?: string;
  } | null;
};

function statusLabel(status?: string | null) {
  const value = status || "pendente";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function statusClass(status?: string | null) {
  const value = String(status ?? "").toLowerCase();
  if (value === "aprovado" || value === "ativo") return "success";
  if (value === "reprovado" || value === "inativo") return "danger";
  return "warning";
}

function userInitials(name?: string | null) {
  return String(name || "U").split(" ").filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function payloadFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    fullname: data.get("fullname"),
    email: data.get("email"),
    perfil: data.get("perfil"),
    cpf: data.get("cpf"),
    sexo: data.get("sexo"),
    idade: data.get("idade"),
    photo: data.get("photo"),
    telefone: data.get("telefone"),
    status: data.get("status"),
    registro_profissional: data.get("registro_profissional"),
    tipo_registro_profissional: data.get("tipo_registro_profissional"),
    senha: data.get("senha"),
    endereco_id: data.get("endereco_id"),
    endereco_rua: data.get("endereco_rua"),
    endereco_numero: data.get("endereco_numero"),
    endereco_complemento: data.get("endereco_complemento"),
    endereco_bairro: data.get("endereco_bairro"),
    endereco_cidade: data.get("endereco_cidade"),
    endereco_estado: data.get("endereco_estado"),
    endereco_cep: data.get("endereco_cep"),
  };
}

export function AdminUsersPanel({ users }: { users: AppUser[] }) {
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<Mode>("details");
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [localUsers, setLocalUsers] = useState(users);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [isClosing, setIsClosing] = useState(false);

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

  function openUser(user: AppUser) {
    setIsClosing(false);
    setSelected(user);
    setMode("details");
    setMessage("");
  }

  function openCreate() {
    setIsClosing(false);
    setSelected(null);
    setMode("create");
    setMessage("");
  }

  function closeUser() {
    setIsClosing(true);
    window.setTimeout(() => {
      setSelected(null);
      setMode("details");
      setMessage("");
      setIsClosing(false);
    }, 220);
  }

  async function submitJson(url: string, method: string, body?: unknown) {
    setLoading(method);
    setMessage("");
    const response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    setLoading("");
    if (!response.ok || !data.success) {
      setMessage(data.message || "Nao foi possivel salvar.");
      return null;
    }
    return data as ApiResult;
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await submitJson("/api/admin/usuarios", "POST", payloadFromForm(event.currentTarget));
    const created = result?.data;
    if (!created) return;
    setLocalUsers((current) => [created, ...current]);
    setSelected(created);
    setMode("details");
    setMessage("Usuario criado com sucesso.");
  }

  async function updateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const result = await submitJson(`/api/admin/usuarios/${selected.id}`, "PUT", payloadFromForm(event.currentTarget));
    const updated = result?.data;
    if (!updated) return;
    setLocalUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    setMode("details");
    setMessage("Usuario atualizado com sucesso.");
  }

  async function updateApproval(user: AppUser, status: "aprovado" | "reprovado") {
    const result = await submitJson(`/api/admin/usuarios/${user.id}`, "PUT", { status_aprovacao: status });
    const updated = result?.data;
    if (!updated) return;
    setLocalUsers((current) => current.map((item) => item.id === user.id ? { ...item, status_aprovacao: status } : item));
    setSelected((current) => current ? { ...current, status_aprovacao: status } : current);
    const emailMessage = result?.email?.sent ? " E-mail enviado." : result?.email?.error ? ` E-mail pendente: ${result.email.error}` : "";
    setMessage(`${status === "aprovado" ? "Cadastro aprovado com sucesso." : "Cadastro reprovado com sucesso."}${emailMessage}`);
  }

  async function toggleStatus(user: AppUser) {
    const result = await submitJson(`/api/admin/usuarios/${user.id}`, "PUT", { toggleStatus: true });
    const updated = result?.data;
    if (!updated) return;
    setLocalUsers((current) => current.map((item) => item.id === user.id ? updated : item));
    setSelected(updated);
    setMessage("Status do usuario atualizado.");
  }

  async function deleteUser(user: AppUser) {
    if (!confirm("Deseja realmente excluir este usuario?")) return;
    const result = await submitJson(`/api/admin/usuarios/${user.id}`, "DELETE");
    if (result === null) return;
    setLocalUsers((current) => current.filter((item) => item.id !== user.id));
    setSelected(null);
    setMessage("Usuario excluido com sucesso.");
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
          <button className="eq-btn" type="button" onClick={openCreate}>Criar usuario</button>
        </div>

        <div className="admin-user-grid admin-filter-transition" key={`${filter}-${query}`}>
          {filtered.map((user) => (
            <button className="admin-user-card" key={user.id} type="button" onClick={() => openUser(user)}>
              <div className="admin-avatar">{user.photo ? <img src={user.photo} alt="" /> : userInitials(user.name)}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{user.telefone || "Sem telefone"} - {user.tipo_usuario || "cliente"} - {user.status || "ativo"}</small>
              </div>
              <em className={`eq-status eq-status-${statusClass(user.status_aprovacao)}`}>{statusLabel(user.status_aprovacao)}</em>
            </button>
          ))}
        </div>

        {!filtered.length && <p className="text-center mb-0 p-4">Nenhum usuario encontrado.</p>}
        {message && !selected && mode !== "create" && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
      </div>

      {(selected || mode === "create") && (
        <div className={`eq-modal-backdrop admin-user-backdrop ${isClosing ? "is-closing" : ""}`} role="dialog" aria-modal="true" onClick={closeUser}>
          <div className={`eq-modal eq-card admin-user-modal ${isClosing ? "is-closing" : ""}`} onClick={(event) => event.stopPropagation()}>
            <div className="admin-user-modal-header">
              <div>
                <p className="admin-kicker mb-1">{mode === "create" ? "Criar usuario" : mode === "edit" ? "Editar usuario" : "Revisar cadastro"}</p>
                <h2 className="h4 mb-0">{selected?.name || "Novo usuario"}</h2>
              </div>
              <button className="eq-icon-btn" type="button" onClick={closeUser} aria-label="Fechar">x</button>
            </div>

            <div className="admin-user-modal-body">
              {mode === "details" && selected && (
                <>
                <div className="admin-user-detail">
                  <section>
                    <h3>Dados cadastrais</h3>
                    <p><strong>Cadastro:</strong> {formatDate(selected.created_at)}</p>
                    <p><strong>Email:</strong> {selected.email}</p>
                    <p><strong>Telefone:</strong> {selected.telefone || "-"}</p>
                    <p><strong>CPF:</strong> {selected.cpf || "-"}</p>
                    <p><strong>Perfil:</strong> {selected.tipo_usuario || "cliente"} <strong>Status:</strong> {selected.status || "ativo"}</p>
                    <p><strong>Sexo:</strong> {selected.sexo || "-"} <strong>Idade:</strong> {selected.idade || "-"}</p>
                    <p><strong>Registro:</strong> {selected.registro_profissional || "-"} ({selected.tipo_registro_profissional || "-"})</p>
                    <p><strong>Endereco:</strong> {selected.endereco ? `${selected.endereco.rua}, ${selected.endereco.numero} - ${selected.endereco.bairro}, ${selected.endereco.cidade}/${selected.endereco.estado}` : "-"}</p>
                  </section>

                  <section>
                    <h3>Documento</h3>
                    <p><strong>Tipo:</strong> {selected.documento_tipo || "-"}</p>
                    {selected.documento_caminho ? (
                      <div className="admin-document-box">
                        <span>{selected.documento_caminho}</span>
                        <a className="eq-btn secondary" href={selected.documento_caminho} target="_blank" rel="noreferrer">Abrir documento</a>
                      </div>
                    ) : <p>Nenhum documento registrado.</p>}
                  </section>
                </div>

                <section className="admin-approval-box">
                  <div>
                    <span>Status atual</span>
                    <strong className={`eq-status eq-status-${statusClass(selected.status_aprovacao)}`}>{statusLabel(selected.status_aprovacao)}</strong>
                  </div>
                  <div className="d-flex flex-wrap" style={{ gap: 10 }}>
                    <LoadingButton className="eq-btn" type="button" loading={loading === "PUT"} loadingLabel="Salvando..." onClick={() => updateApproval(selected, "aprovado")}>Aprovar</LoadingButton>
                    <LoadingButton className="eq-btn danger" type="button" loading={loading === "PUT"} loadingLabel="Salvando..." onClick={() => updateApproval(selected, "reprovado")}>Reprovar</LoadingButton>
                    <button className="eq-btn secondary" type="button" onClick={() => setMode("edit")}>Editar</button>
                    <LoadingButton className="eq-btn secondary" type="button" loading={loading === "PUT"} loadingLabel="Salvando..." onClick={() => toggleStatus(selected)}>{selected.status === "ativo" ? "Inativar" : "Ativar"}</LoadingButton>
                    <LoadingButton className="eq-btn danger" type="button" loading={loading === "DELETE"} loadingLabel="Excluindo..." onClick={() => deleteUser(selected)}>Excluir</LoadingButton>
                  </div>
                </section>
                </>
              )}

              {(mode === "create" || (mode === "edit" && selected)) && (
                <form className="admin-user-form" onSubmit={mode === "create" ? createUser : updateUser}>
                  <UserFields user={selected ?? undefined} requirePassword={mode === "create"} />
                  <div className="admin-user-modal-footer">
                    {mode === "edit" && <button className="eq-btn secondary" type="button" onClick={() => setMode("details")}>Cancelar</button>}
                    <LoadingButton className="eq-btn" type="submit" loading={Boolean(loading)} loadingLabel="Salvando...">{mode === "create" ? "Criar usuario" : "Salvar alteracoes"}</LoadingButton>
                  </div>
                </form>
              )}

              {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserFields({ user, requirePassword }: { user?: AppUser; requirePassword?: boolean }) {
  const endereco = user?.endereco;
  return (
    <>
      <input type="hidden" name="endereco_id" value={endereco?.id ?? ""} />
      <div className="admin-form-grid">
        <label><span>Nome</span><input className="form-control" name="fullname" defaultValue={user?.name ?? ""} required /></label>
        <label><span>Email</span><input className="form-control" name="email" type="email" defaultValue={user?.email ?? ""} required /></label>
        <label><span>Perfil</span><select className="form-select" name="perfil" defaultValue={user?.tipo_usuario ?? "cliente"}><option value="cliente">Cliente</option><option value="admin">Admin</option></select></label>
        <label><span>Status</span><select className="form-select" name="status" defaultValue={user?.status ?? "ativo"}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
        <label><span>Telefone</span><input className="form-control" name="telefone" defaultValue={user?.telefone ?? ""} /></label>
        <label><span>CPF</span><input className="form-control" name="cpf" defaultValue={user?.cpf ?? ""} /></label>
        <label><span>Sexo</span><input className="form-control" name="sexo" defaultValue={user?.sexo ?? ""} /></label>
        <label><span>Idade</span><input className="form-control" name="idade" type="number" defaultValue={user?.idade ?? ""} /></label>
        <label><span>Foto URL</span><input className="form-control" name="photo" defaultValue={user?.photo ?? ""} /></label>
        <label><span>Registro</span><input className="form-control" name="registro_profissional" defaultValue={user?.registro_profissional ?? ""} /></label>
        <label><span>Tipo registro</span><input className="form-control" name="tipo_registro_profissional" defaultValue={user?.tipo_registro_profissional ?? ""} /></label>
        <label><span>Senha {requirePassword ? "" : "(opcional)"}</span><input className="form-control" name="senha" type="password" minLength={8} required={requirePassword} /></label>
      </div>

      <div className="admin-form-grid mt-3">
        <label><span>Rua</span><input className="form-control" name="endereco_rua" defaultValue={endereco?.rua ?? ""} /></label>
        <label><span>Numero</span><input className="form-control" name="endereco_numero" defaultValue={endereco?.numero ?? ""} /></label>
        <label><span>Bairro</span><input className="form-control" name="endereco_bairro" defaultValue={endereco?.bairro ?? ""} /></label>
        <label><span>Cidade</span><input className="form-control" name="endereco_cidade" defaultValue={endereco?.cidade ?? ""} /></label>
        <label><span>Estado</span><input className="form-control" name="endereco_estado" defaultValue={endereco?.estado ?? ""} /></label>
        <label><span>CEP</span><input className="form-control" name="endereco_cep" defaultValue={endereco?.cep ?? ""} /></label>
        <label className="admin-form-wide"><span>Complemento</span><input className="form-control" name="endereco_complemento" defaultValue={endereco?.complemento ?? ""} /></label>
      </div>
    </>
  );
}
