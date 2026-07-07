import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="legacy-page d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <form className="eq-card p-4" method="post" action="/api/auth/login" style={{ width: 420, maxWidth: "92vw" }}>
        <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="img-fluid mb-3" />
        <h1 className="h4 mb-3">Entrar</h1>
        <label className="form-label">E-mail</label>
        <input className="form-control mb-3" type="email" name="email" required />
        <label className="form-label">Senha</label>
        <input className="form-control mb-3" type="password" name="password" required />
        <button className="eq-btn w-100" type="submit">Entrar</button>
        <div className="mt-3 d-flex justify-content-between">
          <Link href="/register">Criar conta</Link>
          <Link href="/">Voltar</Link>
        </div>
      </form>
    </main>
  );
}
