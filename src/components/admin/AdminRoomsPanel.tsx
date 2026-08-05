"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import type { BloqueioSala, Conveniencia, Fechadura, ImagemSala, Sala } from "@/lib/types";
import { money } from "@/lib/format";
import { LoadingButton } from "@/components/ui/LoadingButton";

type RoomWithRelationArrays = Sala & {
  fechadura?: Fechadura | Fechadura[] | null;
};

type RoomEditTab = "dados" | "imagens" | "fechadura" | "bloqueios";

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    disponivel: "Disponivel",
    indisponivel: "Indisponivel",
    manutencao: "Manutencao",
  };
  return labels[String(status ?? "disponivel").toLowerCase()] ?? String(status ?? "Disponivel");
}

function statusClass(status?: string | null) {
  const value = String(status ?? "").toLowerCase();
  if (value === "disponivel") return "success";
  if (value === "manutencao") return "warning";
  return "secondary";
}

function roomImage(sala: Sala) {
  return sala.imagens?.find((imagem) => imagem.principal)?.imagem_base64 ?? sala.imagens?.[0]?.imagem_base64 ?? "";
}

function getFechadura(sala: RoomWithRelationArrays): Fechadura | null {
  if (Array.isArray(sala.fechadura)) return sala.fechadura[0] ?? null;
  return sala.fechadura ?? null;
}

function normalizeTime(value?: string | null) {
  return value ? value.slice(0, 5) : "";
}

function readFiles(files: FileList | null): Promise<string[]> {
  if (!files?.length) return Promise.resolve([]);
  return Promise.all(Array.from(files).map((file) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })));
}

function normalizeEditorHtml(value: string) {
  return value.trim() || "<p></p>";
}

function formPayload(form: HTMLFormElement, conveniencias: Conveniencia[], imagens: string[] = []) {
  const data = new FormData(form);
  return {
    nome: data.get("nome"),
    status: data.get("status"),
    valor: data.get("valor"),
    metragem: data.get("metragem"),
    descricao: data.get("descricao"),
    endereco: {
      id: data.get("endereco_id"),
      rua: data.get("rua"),
      numero: data.get("numero"),
      complemento: data.get("complemento"),
      bairro: data.get("bairro"),
      cidade: data.get("cidade"),
      estado: data.get("estado"),
      cep: data.get("cep"),
    },
    conveniencias: conveniencias
      .filter((item) => data.get(`conveniencia_${item.id}`))
      .map((item) => item.id),
    imagens,
  };
}

export function AdminRoomsPanel({ salas, conveniencias }: { salas: RoomWithRelationArrays[]; conveniencias: Conveniencia[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<RoomWithRelationArrays | null>(null);
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");
  const [activeTab, setActiveTab] = useState<RoomEditTab>("dados");
  const [isClosing, setIsClosing] = useState(false);

  const stats = useMemo(() => ({
    total: salas.length,
    disponiveis: salas.filter((sala) => sala.status === "disponivel").length,
    manutencao: salas.filter((sala) => sala.status === "manutencao").length,
    imagens: salas.reduce((total, sala) => total + (sala.imagens?.length ?? 0), 0),
  }), [salas]);

  const filtered = salas.filter((sala) => {
    const matchesStatus = filter === "todos" || sala.status === filter;
    const text = `${sala.nome} ${sala.descricao ?? ""} ${sala.endereco?.cidade ?? ""}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  });

  async function submitJson(url: string, options: RequestInit, successMessage: string) {
    setLoading(url);
    setMessage("");
    const response = await fetch(url, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    });
    const data = await response.json();
    setLoading("");

    if (!response.ok || !data.success) {
      setMessage(data.message || "Nao foi possivel salvar.");
      return false;
    }

    setMessage(data.message || successMessage);
    router.refresh();
    return true;
  }

  function openRoom(sala: RoomWithRelationArrays) {
    setSelected(sala);
    setActiveTab("dados");
    setIsClosing(false);
    setMessage("");
  }

  function closeRoom() {
    setIsClosing(true);
    window.setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
      setMessage("");
    }, 220);
  }

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const imagens = await readFiles((form.elements.namedItem("imagens") as HTMLInputElement | null)?.files ?? null);
    const ok = await submitJson("/api/admin/salas", {
      method: "POST",
      body: JSON.stringify(formPayload(form, conveniencias, imagens)),
    }, "Sala criada com sucesso!");
    if (ok) form.reset();
  }

  async function updateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    await submitJson(`/api/admin/salas/${selected.id}`, {
      method: "PUT",
      body: JSON.stringify(formPayload(form, conveniencias)),
    }, "Sala atualizada com sucesso!");
  }

  async function addImages(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const imagens = await readFiles((form.elements.namedItem("imagens") as HTMLInputElement | null)?.files ?? null);
    setLoading(`/api/admin/salas/${selected.id}/imagens`);
    setMessage("");
    const response = await fetch(`/api/admin/salas/${selected.id}/imagens`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imagens }),
    });
    const data = await response.json();
    setLoading("");

    if (!response.ok || !data.success) {
      setMessage(data.message || "Nao foi possivel enviar as imagens.");
      return;
    }

    const novasImagens = Array.isArray(data.imagens) ? data.imagens as ImagemSala[] : [];
    setSelected((current) => current ? { ...current, imagens: [...(current.imagens ?? []), ...novasImagens] } : current);
    setMessage(data.message || "Imagens da sala salvas com sucesso!");
    form.reset();
    router.refresh();
  }

  async function saveLock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    await submitJson(`/api/admin/salas/${selected.id}/fechadura`, {
      method: "PUT",
      body: JSON.stringify({ chaves: [data.get("chave_0"), data.get("chave_1"), data.get("chave_2"), data.get("chave_3")] }),
    }, "Fechadura atualizada com sucesso!");
  }

  async function addBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const ok = await submitJson(`/api/admin/salas/${selected.id}/bloqueios`, {
      method: "POST",
      body: JSON.stringify({
        tipo: data.get("tipo"),
        data_inicio: data.get("data_inicio"),
        data_fim: data.get("data_fim"),
        hora_inicio: data.get("hora_inicio"),
        hora_fim: data.get("hora_fim"),
        motivo: data.get("motivo"),
      }),
    }, "Bloqueio cadastrado com sucesso.");
    if (ok) form.reset();
  }

  async function removeImage(id: number) {
    const ok = await submitJson(`/api/admin/imagens/${id}`, { method: "DELETE" }, "Imagem excluida com sucesso.");
    if (!ok) return;
    setSelected((current) => current ? { ...current, imagens: current.imagens?.filter((imagem) => imagem.id !== id) } : current);
  }

  async function setMainImage(id: number) {
    const ok = await submitJson(`/api/admin/imagens/${id}`, { method: "PATCH", body: JSON.stringify({ principal: true }) }, "Imagem definida como principal!");
    if (!ok) return;
    setSelected((current) => current ? {
      ...current,
      imagens: current.imagens?.map((imagem) => ({ ...imagem, principal: imagem.id === id })),
    } : current);
  }

  async function removeBlock(id: number) {
    await submitJson(`/api/admin/bloqueios/${id}`, { method: "DELETE" }, "Bloqueio removido com sucesso.");
  }

  const selectedConveniencias = new Set(selected?.conveniencias?.map((item) => item.id) ?? []);
  const fechadura = selected ? getFechadura(selected) : null;
  const chaves = fechadura?.chaves ?? [];
  const bloqueios = [...(selected?.bloqueios ?? [])].sort((a, b) => `${b.data_inicio}${b.created_at ?? ""}`.localeCompare(`${a.data_inicio}${a.created_at ?? ""}`));

  return (
    <>
      <AdminPageHero eyebrow="Cadastro operacional" title="Salas">
        <p className="mb-0">Cadastro, endereco, imagens, conveniencias, bloqueios e chaves seguindo a fonte Laravel.</p>
      </AdminPageHero>
      <AdminMetrics items={[
        { label: "Total", value: stats.total },
        { label: "Disponiveis", value: stats.disponiveis },
        { label: "Manutencao", value: stats.manutencao },
        { label: "Imagens", value: stats.imagens },
      ]} />

      <div className="eq-card p-3 mb-3">
        <div className="admin-toolbar">
          <input className="form-control" placeholder="Buscar por sala, descricao ou cidade" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="admin-segments">
            {["todos", "disponivel", "indisponivel", "manutencao"].map((item) => (
              <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>
                {item === "todos" ? "Todos" : statusLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-room-grid admin-filter-transition" key={`${filter}-${query}`}>
          {filtered.map((sala) => (
            <button className="admin-room-card" key={sala.id} type="button" onClick={() => openRoom(sala)}>
              <div className="admin-room-image">
                {roomImage(sala) ? <img src={roomImage(sala)} alt="" /> : <span>Sem imagem</span>}
              </div>
              <div className="admin-room-content">
                <div>
                  <strong>{sala.nome}</strong>
                  <em className={`eq-status eq-status-${statusClass(sala.status)}`}>{statusLabel(sala.status)}</em>
                </div>
                <span>{money(sala.valor)} / hora - {sala.metragem} m2</span>
                <small>{sala.endereco ? `${sala.endereco.bairro}, ${sala.endereco.cidade}/${sala.endereco.estado}` : "Endereco nao cadastrado"}</small>
                <small>{sala.imagens?.length ?? 0} imagens - {sala.conveniencias?.length ?? 0} conveniencias - {sala.bloqueios?.length ?? 0} bloqueios</small>
              </div>
            </button>
          ))}
        </div>

        {!filtered.length && <p className="text-center mb-0 p-4">Nenhuma sala encontrada.</p>}
      </div>

      <form className="eq-card p-4 admin-room-form" onSubmit={createRoom}>
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
          <div>
            <p className="admin-kicker mb-1">Nova sala</p>
            <h2 className="h5 mb-0">Cadastrar sala completa</h2>
          </div>
          <LoadingButton className="eq-btn" type="submit" loading={Boolean(loading)} loadingLabel="Criando...">Criar sala</LoadingButton>
        </div>
        <RoomFields conveniencias={conveniencias} />
      </form>

      {selected && (
        <div className={`eq-modal-backdrop admin-room-backdrop ${isClosing ? "is-closing" : ""}`} role="dialog" aria-modal="true" onClick={closeRoom}>
          <div className={`eq-modal eq-card admin-room-modal ${isClosing ? "is-closing" : ""}`} onClick={(event) => event.stopPropagation()}>
            <div className="admin-room-modal-header">
              <div>
                <p className="admin-kicker mb-1">Editar sala</p>
                <h2>{selected.nome}</h2>
              </div>
              <button className="eq-icon-btn" type="button" onClick={closeRoom} aria-label="Fechar">x</button>
            </div>

            <div className="admin-room-tabs" role="tablist" aria-label="Editar sala">
              {[
                ["dados", "Dados"],
                ["imagens", `Imagens (${selected.imagens?.length ?? 0})`],
                ["fechadura", "Fechadura"],
                ["bloqueios", `Bloqueios (${bloqueios.length})`],
              ].map(([tab, label]) => (
                <button key={tab} className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab as RoomEditTab)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="admin-room-modal-body">
              {activeTab === "dados" && (
                <form key={`room-${selected.id}`} className="admin-room-form" onSubmit={updateRoom}>
                  <RoomFields sala={selected} conveniencias={conveniencias} selectedConveniencias={selectedConveniencias} />
                  <div className="admin-room-modal-footer">
                    <button className="eq-btn secondary" type="button" onClick={closeRoom}>Cancelar</button>
                    <LoadingButton className="eq-btn" type="submit" loading={Boolean(loading)} loadingLabel="Salvando...">Salvar sala</LoadingButton>
                  </div>
                </form>
              )}

              {activeTab === "imagens" && (
                <section className="admin-room-section-panel">
                  <div className="admin-section-heading">
                    <div>
                      <h3>Imagens da sala</h3>
                      <p>Adicione novas fotos, remova imagens antigas e defina a principal.</p>
                    </div>
                  </div>
                  <form className="admin-image-upload" onSubmit={addImages}>
                    <input className="form-control" name="imagens" type="file" accept="image/*" multiple />
                    <LoadingButton className="eq-btn" type="submit" loading={Boolean(loading)} loadingLabel="Enviando...">Adicionar imagens</LoadingButton>
                  </form>
                  <div className="admin-image-strip">
                    {selected.imagens?.map((imagem) => (
                      <div key={imagem.id}>
                        <img src={imagem.imagem_base64} alt="" />
                        <div>
                          <LoadingButton type="button" className="eq-btn secondary" loading={loading === `/api/admin/imagens/${imagem.id}`} onClick={() => setMainImage(imagem.id)} disabled={Boolean(imagem.principal)}>Principal</LoadingButton>
                          <LoadingButton type="button" className="eq-btn danger" loading={loading === `/api/admin/imagens/${imagem.id}`} loadingLabel="Removendo..." onClick={() => removeImage(imagem.id)}>Remover</LoadingButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!selected.imagens?.length && <p className="admin-empty-inline">Nenhuma imagem cadastrada para esta sala.</p>}
                </section>
              )}

              {activeTab === "fechadura" && (
                <section className="admin-room-section-panel">
                  <div className="admin-section-heading">
                    <div>
                      <h3>Chaves da fechadura</h3>
                      <p>Cadastre ate quatro chaves para liberar reservas da sala.</p>
                    </div>
                  </div>
                  <form className="admin-key-grid" onSubmit={saveLock}>
                    {[0, 1, 2, 3].map((index) => (
                      <input key={index} className="form-control" name={`chave_${index}`} maxLength={12} defaultValue={chaves[index] ?? ""} placeholder={`Chave ${index + 1}`} />
                    ))}
                    <LoadingButton className="eq-btn secondary" type="submit" loading={Boolean(loading)} loadingLabel="Salvando...">Salvar chaves</LoadingButton>
                  </form>
                </section>
              )}

              {activeTab === "bloqueios" && (
                <section className="admin-room-section-panel">
                  <div className="admin-section-heading">
                    <div>
                      <h3>Bloqueios da agenda</h3>
                      <p>Bloqueie dias ou intervalos em que a sala nao pode receber reserva.</p>
                    </div>
                  </div>
                  <form className="admin-block-form" onSubmit={addBlock}>
                    <select className="form-select" name="tipo" defaultValue="dia_inteiro">
                      <option value="dia_inteiro">Dia inteiro</option>
                      <option value="intervalo">Intervalo</option>
                    </select>
                    <input className="form-control" name="data_inicio" type="date" required />
                    <input className="form-control" name="data_fim" type="date" required />
                    <input className="form-control" name="hora_inicio" type="time" />
                    <input className="form-control" name="hora_fim" type="time" />
                    <input className="form-control" name="motivo" placeholder="Motivo" />
                    <LoadingButton className="eq-btn secondary" type="submit" loading={Boolean(loading)} loadingLabel="Bloqueando...">Bloquear</LoadingButton>
                  </form>
                  <div className="admin-block-list">
                    {bloqueios.map((bloqueio: BloqueioSala) => (
                      <div key={bloqueio.id}>
                        <span>{bloqueio.data_inicio} ate {bloqueio.data_fim}</span>
                        <small>{bloqueio.tipo === "intervalo" ? `${normalizeTime(bloqueio.hora_inicio)} - ${normalizeTime(bloqueio.hora_fim)}` : "Dia inteiro"} - {bloqueio.motivo || "Sem motivo"}</small>
                        <LoadingButton type="button" className="eq-btn danger" loading={loading === `/api/admin/bloqueios/${bloqueio.id}`} loadingLabel="Removendo..." onClick={() => removeBlock(bloqueio.id)}>Remover</LoadingButton>
                      </div>
                    ))}
                    {!bloqueios.length && <p className="mb-0">Nenhum bloqueio cadastrado.</p>}
                  </div>
                </section>
              )}

              {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RoomFields({
  sala,
  conveniencias,
  selectedConveniencias = new Set<number>(),
}: {
  sala?: Sala;
  conveniencias: Conveniencia[];
  selectedConveniencias?: Set<number>;
}) {
  const endereco = sala?.endereco;
  return (
    <>
      <input type="hidden" name="endereco_id" value={endereco?.id ?? ""} />
      <section className="admin-room-form-section">
        <div className="admin-section-heading">
          <div>
            <h3>Informacoes principais</h3>
            <p>Nome, status, valor, metragem e descricao exibidos no site.</p>
          </div>
        </div>
        <div className="admin-form-grid">
        <label>
          <span>Nome</span>
          <input className="form-control" name="nome" defaultValue={sala?.nome ?? ""} required />
        </label>
        <label>
          <span>Status</span>
          <select className="form-select" name="status" defaultValue={sala?.status ?? "disponivel"}>
            <option value="disponivel">Disponivel</option>
            <option value="indisponivel">Indisponivel</option>
            <option value="manutencao">Manutencao</option>
          </select>
        </label>
        <label>
          <span>Valor por hora</span>
          <input className="form-control" name="valor" type="number" step="0.01" defaultValue={sala?.valor ?? ""} required />
        </label>
        <label>
          <span>Metragem</span>
          <input className="form-control" name="metragem" defaultValue={sala?.metragem ?? ""} required />
        </label>
        <label className="admin-form-wide">
          <span>Descricao</span>
          <DescriptionEditor defaultValue={sala?.descricao ?? ""} />
        </label>
        </div>
      </section>

      <section className="admin-room-form-section">
        <div className="admin-section-heading">
          <div>
            <h3>Endereco</h3>
            <p>Dados usados na sala e na localizacao exibida para o cliente.</p>
          </div>
        </div>
        <div className="admin-form-grid">
        <label>
          <span>Rua</span>
          <input className="form-control" name="rua" defaultValue={endereco?.rua ?? ""} required />
        </label>
        <label>
          <span>Numero</span>
          <input className="form-control" name="numero" defaultValue={endereco?.numero ?? ""} required />
        </label>
        <label>
          <span>Bairro</span>
          <input className="form-control" name="bairro" defaultValue={endereco?.bairro ?? ""} required />
        </label>
        <label>
          <span>Cidade</span>
          <input className="form-control" name="cidade" defaultValue={endereco?.cidade ?? ""} required />
        </label>
        <label>
          <span>Estado</span>
          <input className="form-control" name="estado" defaultValue={endereco?.estado ?? ""} required />
        </label>
        <label>
          <span>CEP</span>
          <input className="form-control" name="cep" defaultValue={endereco?.cep ?? ""} required />
        </label>
        <label className="admin-form-wide">
          <span>Complemento</span>
          <input className="form-control" name="complemento" defaultValue={endereco?.complemento ?? ""} />
        </label>
        </div>
      </section>

      <section className="admin-room-form-section">
        <div className="admin-section-heading">
          <div>
            <h3>Conveniencias</h3>
            <p>Selecione os recursos que aparecem no card da sala.</p>
          </div>
        </div>
        <div className="admin-convenience-list">
          {conveniencias.map((item) => (
            <label key={item.id}>
              <input name={`conveniencia_${item.id}`} type="checkbox" defaultChecked={selectedConveniencias.has(item.id)} />
              <span>{item.nome}</span>
            </label>
          ))}
        </div>
      </section>

      {!sala && (
        <label className="d-block mt-3">
          <span className="form-label">Imagens</span>
          <input className="form-control" name="imagens" type="file" accept="image/*" multiple />
        </label>
      )}
    </>
  );
}

function DescriptionEditor({ defaultValue }: { defaultValue: string }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(normalizeEditorHtml(defaultValue));

  function syncValue() {
    setValue(normalizeEditorHtml(editorRef.current?.innerHTML ?? ""));
  }

  function runCommand(command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
    syncValue();
  }

  function applyParagraph() {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, "p");
    syncValue();
  }

  return (
    <div className="admin-rich-editor">
      <input type="hidden" name="descricao" value={value} required />
      <div className="admin-rich-toolbar" aria-label="Formatar descricao">
        <button type="button" onClick={() => runCommand("bold")}><strong>B</strong></button>
        <button type="button" onClick={() => runCommand("italic")}><em>I</em></button>
        <button type="button" onClick={applyParagraph}>P</button>
        <button type="button" onClick={() => runCommand("insertUnorderedList")}>Lista</button>
        <button type="button" onClick={() => runCommand("insertOrderedList")}>1. Lista</button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor-field"
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        onInput={syncValue}
        onBlur={syncValue}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
