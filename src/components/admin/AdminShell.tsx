import type { ReactNode } from "react";
import { AdminDebugProbe } from "./AdminDebugProbe";
import { AdminNavLink } from "./AdminNavLink";
import type { AppUser } from "@/lib/types";

const links = [
  ["/admin", "Dashboard", "fa-solid fa-chart-line"],
  ["/admin/salas", "Salas", "fa-solid fa-door-open"],
  ["/admin/usuarios", "Usuarios", "fa-solid fa-users"],
  ["/admin/reservas", "Reservas", "fa-solid fa-calendar-check"],
  ["/admin/analitico", "Analitico", "fa-solid fa-chart-pie"],
  ["/admin/fechadura", "Fechadura", "fa-solid fa-key"],
  ["/admin/contrato", "Contrato", "fa-solid fa-file-signature"],
];

function userInitials(name?: string | null) {
  return String(name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

export function AdminShell({ children, user }: { children: ReactNode; user: AppUser }) {
  return (
    <main className="legacy-page admin-shell">
      <AdminDebugProbe />
      <div className="admin-shell-layout">
        <aside className="admin-sidebar">
          <div>
            <img src="/assets/img/logoclaro.png" alt="Equilibra Mente" className="admin-sidebar-logo" />
            <nav className="admin-sidebar-nav">
              {links.map(([href, label, icon]) => (
                <AdminNavLink key={href} href={href} label={label} icon={icon} />
              ))}
              <AdminNavLink href="/" label="Site" icon="fa-solid fa-globe" />
            </nav>
          </div>
          <div className="admin-sidebar-user" aria-label="Usuario logado">
            <div className="admin-sidebar-avatar">
              {user.photo ? <img src={user.photo} alt="" /> : userInitials(user.name)}
            </div>
            <div>
              <strong>{user.name || "Administrador"}</strong>
              <span>{user.email || "admin"}</span>
            </div>
          </div>
        </aside>
        <section className="admin-shell-content">{children}</section>
      </div>
    </main>
  );
}
