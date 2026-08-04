import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { AppUser } from "@/lib/types";

export default async function CadastroAprovadoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!isSupabaseConfigured()) notFound();

  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("id,name,status_aprovacao")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.status_aprovacao !== "aprovado") notFound();
  const approved = data as AppUser;

  return (
    <main className="legacy-page">
      <SiteHeader user={user} />
      <section className="profile-page">
        <div className="container">
          <div className="eq-card profile-approved">
            <p className="admin-kicker mb-2">Cadastro aprovado</p>
            <h1>Cadastro aprovado com sucesso!</h1>
            <p>Bem-vindo, {approved.name}. Seus dados estao aprovados e disponiveis para uso.</p>
            <div className="d-flex flex-wrap justify-content-center" style={{ gap: 12 }}>
              <Link className="eq-btn" href="/cliente/reservas">Minhas reservas</Link>
              <Link className="eq-btn secondary" href="/">Voltar ao site</Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
