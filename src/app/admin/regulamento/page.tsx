import { revalidatePath, revalidateTag } from "next/cache";
import { AdminPageHero } from "@/components/admin/AdminPageChrome";
import { SubmitButton } from "@/components/ui/LoadingButton";
import { requireAdmin } from "@/lib/auth";
import { getLatestRegulation } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

const fallbackRegulation = `REGULAMENTO INTERNO DO ESPACO EQUILIBRA MENTE

Este regulamento define as regras de uso das salas, horarios, reservas, cancelamentos, cuidado com o espaco e responsabilidades do usuario.

Atualize este conteudo com o texto oficial do regulamento interno aprovado pela administracao.`;

async function saveRegulation(formData: FormData) {
  "use server";
  await requireAdmin();

  const versao = String(formData.get("versao") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!versao || !conteudo) return;

  await getSupabaseAdmin().from("regulations").insert({ versao, conteudo });
  revalidateTag("regulations", "max");
  revalidatePath("/regulamento");
  revalidatePath("/admin/regulamento");
}

export default async function AdminRegulamentoPage() {
  const regulamento = await getLatestRegulation();

  return (
    <>
      <AdminPageHero eyebrow="Regulamento" title="Editar Regulamento Interno">
        <p className="mb-0">Atualize o regulamento interno exibido no site e no fluxo de reserva.</p>
      </AdminPageHero>
      <form action={saveRegulation} className="eq-card p-4 admin-contract-form">
        <label>
          <span>Versao do Regulamento</span>
          <input className="form-control" name="versao" defaultValue={regulamento?.versao ?? ""} placeholder="v1.0 - 2026" required />
        </label>
        <label>
          <span>Conteudo do Regulamento</span>
          <textarea className="form-control" name="conteudo" rows={18} defaultValue={regulamento?.conteudo ?? fallbackRegulation} required />
        </label>
        <SubmitButton className="eq-btn" loadingLabel="Salvando...">Salvar Regulamento</SubmitButton>
      </form>
    </>
  );
}
