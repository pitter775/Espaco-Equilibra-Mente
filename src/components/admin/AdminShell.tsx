import type { ReactNode } from "react";
import { AdminDebugProbe } from "./AdminDebugProbe";
import { AdminNavLink } from "./AdminNavLink";

const links = [
  ["/admin", "Dashboard", "fa-solid fa-chart-line"],
  ["/admin/salas", "Salas", "fa-solid fa-door-open"],
  ["/admin/usuarios", "Usuarios", "fa-solid fa-users"],
  ["/admin/reservas", "Reservas", "fa-solid fa-calendar-check"],
  ["/admin/analitico", "Analitico", "fa-solid fa-chart-pie"],
  ["/admin/fechadura", "Fechadura", "fa-solid fa-key"],
  ["/contrato", "Contrato", "fa-solid fa-file-signature"],
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="legacy-page admin-shell">
      <AdminDebugProbe />
      <div className="admin-shell-layout">
        <aside className="admin-sidebar">
          <img src="/assets/img/logoclaro.png" alt="Equilibra Mente" className="admin-sidebar-logo" />
          <nav className="admin-sidebar-nav">
            {links.map(([href, label, icon]) => (
              <AdminNavLink key={href} href={href} label={label} icon={icon} />
            ))}
            <AdminNavLink href="/" label="Site" icon="fa-solid fa-globe" />
          </nav>
        </aside>
        <section className="admin-shell-content">{children}</section>
      </div>
    </main>
  );
}
