import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordField } from "@/components/site/PasswordField";
import { SubmitButton } from "@/components/ui/LoadingButton";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sala_id?: string; redirect_to?: string }> }) {
  const { sala_id, redirect_to } = await searchParams;
  const googleHref = sala_id ? `/login/google?sala_id=${sala_id}&anchor=agenda` : "/login/google";
  const redirectTo = redirect_to?.startsWith("/") && !redirect_to.startsWith("//") ? redirect_to : sala_id ? `/sala/${sala_id}#agenda` : "/";
  const user = await getCurrentUser();

  if (user && redirectTo !== "/") {
    redirect(redirectTo);
  }

  return (
    <main className="legacy-page d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <form className="eq-card p-4" method="post" action="/api/auth/login" style={{ width: 420, maxWidth: "92vw" }}>
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="img-fluid mb-3" />
        <h1 className="h4 mb-3">Entrar</h1>
        <label className="form-label">E-mail</label>
        <input className="form-control mb-3" type="email" name="email" required />
        <label className="form-label">Senha</label>
        <PasswordField className="login-password-field mb-3" />
        <SubmitButton className="eq-btn w-100" loadingLabel="Entrando...">Entrar</SubmitButton>
        <a href={googleHref} className="eq-btn secondary w-100 mt-3">
          <img src="/assets/img/icons/google.png" alt="" style={{ width: 22, height: 22 }} />
          Login com Google
        </a>
        <div className="mt-3 d-flex justify-content-between">
          <Link href="/completar-cadastro">Cadastro Manual</Link>
          <Link href="/">Voltar</Link>
        </div>
      </form>
    </main>
  );
}
