import Link from "next/link";
import type { AppUser } from "@/lib/types";

export function SiteHeader({ user }: { user: AppUser | null }) {
  return (
    <header id="header" className="fixed-top header-transparent">
      <div className="container d-flex align-items-center hero-content">
        <div className="logo mr-auto">
          <Link href="/">
            <img src="/assets/img/logotextopp.png" style={{ opacity: 0, padding: 13, width: 250 }} alt="Equilibra Mente" />
          </Link>
        </div>
        <nav className="nav-menu d-none d-lg-block">
          <ul>
            <li className="active"><Link href="/#inicio">Inicio</Link></li>
            <li><Link href="/#about">Salas</Link></li>
            <li><Link href="/#quemsomos">Sobre Nos</Link></li>
            <li><Link href="/#team">Especialistas</Link></li>
            <li><Link href="/#contato">Contato</Link></li>
            <li>
              {user ? (
                <Link href={user.tipo_usuario === "admin" ? "/admin" : "/cliente/reservas"}>
                  {user.tipo_usuario === "admin" ? "Gestao" : "Minhas Reservas"}
                </Link>
              ) : (
                <Link href="/login">Entre</Link>
              )}
            </li>
            {user && <li><Link href="/profile">Perfil</Link></li>}
          </ul>
        </nav>
      </div>
    </header>
  );
}
