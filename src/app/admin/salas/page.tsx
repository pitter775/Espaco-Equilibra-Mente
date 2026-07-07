import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { money } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function criarSala(formData: FormData) {
  "use server";
  await requireAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const metragem = String(formData.get("metragem") ?? "").trim();
  const valor = Number(String(formData.get("valor") ?? "0").replace(",", "."));
  const status = String(formData.get("status") ?? "disponivel");

  if (!nome || !descricao || !metragem || Number.isNaN(valor)) return;

  await getSupabaseAdmin().from("salas").insert({
    nome,
    descricao,
    metragem,
    valor,
    status,
  });

  revalidatePath("/admin/salas");
  revalidatePath("/");
}

async function atualizarSala(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const metragem = String(formData.get("metragem") ?? "").trim();
  const valor = Number(String(formData.get("valor") ?? "0").replace(",", "."));
  const status = String(formData.get("status") ?? "disponivel");

  if (!id || !nome || !descricao || !metragem || Number.isNaN(valor)) return;

  await getSupabaseAdmin()
    .from("salas")
    .update({ nome, descricao, metragem, valor, status })
    .eq("id", id);

  revalidatePath("/admin/salas");
  revalidatePath("/");
}

export default async function AdminSalasPage() {
  await requireAdmin();
  const salas = await listSalas();
  return (
    <AdminShell>
      <h1 className="h3 mb-4">Salas</h1>
      <div className="row g-4">
        <div className="col-lg-4">
          <form action={criarSala} className="eq-card p-4">
            <h2 className="h5 mb-3">Nova sala</h2>
            <label className="form-label">Nome</label>
            <input name="nome" className="form-control mb-3" required />
            <label className="form-label">Status</label>
            <select name="status" className="form-select mb-3" defaultValue="disponivel">
              <option value="disponivel">Disponível</option>
              <option value="indisponivel">Indisponível</option>
              <option value="manutencao">Manutenção</option>
            </select>
            <label className="form-label">Valor por hora</label>
            <input name="valor" type="number" step="0.01" className="form-control mb-3" required />
            <label className="form-label">Metragem</label>
            <input name="metragem" className="form-control mb-3" required />
            <label className="form-label">Descrição</label>
            <textarea name="descricao" className="form-control mb-3" rows={4} required />
            <button className="eq-btn w-100" type="submit">Criar sala</button>
          </form>
        </div>

        <div className="col-lg-8">
          <div className="d-grid gap-3">
            {salas.map((sala) => (
              <form action={atualizarSala} className="eq-card p-4" key={sala.id}>
                <input type="hidden" name="id" value={sala.id} />
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                  <div>
                    <h2 className="h5 mb-1">{sala.nome}</h2>
                    <small className="text-muted">{money(sala.valor)} · {sala.metragem} m² · {sala.status}</small>
                  </div>
                  <button className="eq-btn secondary" type="submit">Salvar alterações</button>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nome</label>
                    <input name="nome" className="form-control" defaultValue={sala.nome} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select name="status" className="form-select" defaultValue={sala.status ?? "disponivel"}>
                      <option value="disponivel">Disponível</option>
                      <option value="indisponivel">Indisponível</option>
                      <option value="manutencao">Manutenção</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Valor por hora</label>
                    <input name="valor" type="number" step="0.01" className="form-control" defaultValue={sala.valor} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Metragem</label>
                    <input name="metragem" className="form-control" defaultValue={sala.metragem ?? ""} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descrição</label>
                    <textarea name="descricao" className="form-control" rows={3} defaultValue={sala.descricao ?? ""} required />
                  </div>
                </div>
              </form>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
