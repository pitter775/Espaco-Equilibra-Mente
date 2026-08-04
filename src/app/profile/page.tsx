import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { requireUser } from "@/lib/auth";

const messages: Record<string, string> = {
  perfil: "Perfil atualizado com sucesso.",
  senha: "Senha atualizada com sucesso.",
  excluido: "Conta excluida com sucesso.",
};

const errors: Record<string, string> = {
  perfil: "Nao foi possivel atualizar o perfil.",
  senha: "Confira a senha atual e a confirmacao.",
  excluir: "Nao foi possivel excluir a conta com os dados informados.",
  auth: "Operacao disponivel apenas para usuarios autenticados pelo Supabase.",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ status?: string; erro?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;

  return (
    <main className="legacy-page">
      <SiteHeader user={user} />
      <section className="profile-page">
        <div className="container">
          <div className="profile-heading">
            <p className="admin-kicker mb-1">Minha conta</p>
            <h1>Perfil</h1>
            <span>Atualize seus dados de acesso como na area de perfil do Laravel.</span>
          </div>

          {params.status && messages[params.status] && <p className="alert alert-success">{messages[params.status]}</p>}
          {params.erro && errors[params.erro] && <p className="alert alert-warning">{errors[params.erro]}</p>}

          <div className="profile-grid">
            <form className="eq-card profile-card" method="post" action="/api/profile">
              <input type="hidden" name="action" value="profile" />
              <h2>Informacoes do perfil</h2>
              <p>Atualize o nome e o e-mail da sua conta.</p>
              <label>
                <span>Nome</span>
                <input className="form-control" type="text" name="name" defaultValue={user.name ?? ""} required />
              </label>
              <label>
                <span>E-mail</span>
                <input className="form-control" type="email" name="email" defaultValue={user.email ?? ""} required />
              </label>
              <button className="eq-btn" type="submit">Salvar</button>
            </form>

            <form className="eq-card profile-card" method="post" action="/api/profile">
              <input type="hidden" name="action" value="password" />
              <h2>Atualizar senha</h2>
              <p>Use uma senha longa e segura para proteger sua conta.</p>
              <label>
                <span>Senha atual</span>
                <input className="form-control" type="password" name="current_password" autoComplete="current-password" required />
              </label>
              <label>
                <span>Nova senha</span>
                <input className="form-control" type="password" name="password" minLength={8} autoComplete="new-password" required />
              </label>
              <label>
                <span>Confirmar nova senha</span>
                <input className="form-control" type="password" name="password_confirmation" minLength={8} autoComplete="new-password" required />
              </label>
              <button className="eq-btn" type="submit">Atualizar senha</button>
            </form>

            <form className="eq-card profile-card profile-danger" method="post" action="/api/profile">
              <input type="hidden" name="action" value="delete" />
              <h2>Excluir conta</h2>
              <p>Ao excluir a conta, seus dados de usuario serao removidos. Confirme com sua senha.</p>
              <label>
                <span>Senha</span>
                <input className="form-control" type="password" name="current_password" autoComplete="current-password" required />
              </label>
              <button className="eq-btn danger" type="submit">Excluir conta</button>
            </form>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
