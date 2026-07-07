import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/salas", "Salas"],
  ["/admin/usuarios", "Usuarios"],
  ["/admin/reservas", "Reservas"],
  ["/admin/analitico", "Analitico"],
  ["/admin/fechadura", "Fechadura"],
  ["/contrato", "Contrato"],
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="legacy-page" style={{ minHeight: "100vh" }}>
      <div className="d-flex">
        <aside style={{ width: 260, minHeight: "100vh", background: "#1f2d1f", padding: 24 }}>
          <img src="/assets/img/logoclaro.png" alt="Equilibra Mente" className="img-fluid mb-4" />
          <nav className="d-flex flex-column" style={{ gap: 10 }}>
            {links.map(([href, label]) => <Link key={href} href={href} style={{ color: "#fff" }}>{label}</Link>)}
            <Link href="/" style={{ color: "#fff" }}>Site</Link>
          </nav>
        </aside>
        <section style={{ flex: 1, padding: 32 }}>{children}</section>
      </div>
    </main>
  );
}
