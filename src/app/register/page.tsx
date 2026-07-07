import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="legacy-page d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <form className="eq-card p-4" method="post" action="/api/auth/register" style={{ width: 520, maxWidth: "92vw" }}>
        <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="img-fluid mb-3" />
        <h1 className="h4 mb-3">Cadastro</h1>
        <input className="form-control mb-3" name="name" placeholder="Nome completo" required />
        <input className="form-control mb-3" type="email" name="email" placeholder="E-mail" required />
        <input className="form-control mb-3" name="telefone" placeholder="Telefone" required />
        <input className="form-control mb-3" name="cpf" placeholder="CPF" required />
        <input className="form-control mb-3" type="password" name="password" placeholder="Senha" required minLength={8} />
        <button className="eq-btn w-100" type="submit">Cadastrar</button>
        <div className="mt-3 d-flex justify-content-between">
          <Link href="/login">Ja tenho conta</Link>
          <Link href="/">Voltar</Link>
        </div>
      </form>
    </main>
  );
}
