import { revalidatePath, revalidateTag } from "next/cache";
import { AdminPageHero } from "@/components/admin/AdminPageChrome";
import { AdminShell } from "@/components/admin/AdminShell";
import { SubmitButton } from "@/components/ui/LoadingButton";
import { requireAdmin } from "@/lib/auth";
import { getLatestContract } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

async function saveContract(formData: FormData) {
  "use server";
  await requireAdmin();

  const versao = String(formData.get("versao") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!versao || !conteudo) return;

  await getSupabaseAdmin().from("contracts").insert({ versao, conteudo });
  revalidateTag("contracts", "max");
  revalidatePath("/contrato");
}

export default async function ContratoPage() {
  await requireAdmin();
  const contrato = await getLatestContract();

  return (
    <AdminShell>
      <AdminPageHero eyebrow="Contrato" title="Editar Contrato">
        <p className="mb-0">Cria uma nova versao do contrato, seguindo o `ContratoController` do Laravel.</p>
      </AdminPageHero>
      <form action={saveContract} className="eq-card p-4 admin-contract-form">
        <label>
          <span>Versao do Contrato</span>
          <input className="form-control" name="versao" defaultValue={contrato?.versao ?? ""} required />
        </label>
        <label>
          <span>Conteudo do Contrato</span>
          <textarea className="form-control" name="conteudo" rows={16} defaultValue={contrato?.conteudo ?? ""} required />
        </label>
        <SubmitButton className="eq-btn" loadingLabel="Salvando...">Salvar Contrato</SubmitButton>
      </form>
    </AdminShell>
  );
}
