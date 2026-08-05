"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { AuthModalTrigger } from "./AuthModalTrigger";
import type { AppUser } from "@/lib/types";

const navItems = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#about", label: "Salas" },
  { href: "/#quemsomos", label: "Sobre Nos" },
  { href: "/#team", label: "Especialistas" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({ user }: { user: AppUser | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const header = document.getElementById("header");
    const updateHeader = () => {
      const forceSolid = window.location.pathname !== "/";
      header?.classList.toggle("header-scrolled", forceSolid || window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    window.setTimeout(() => setMenuOpen(false), 0);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("site-menu-open", menuOpen);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 992) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.classList.remove("site-menu-open");
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("/#") || pathname !== "/") {
      setMenuOpen(false);
      return;
    }

    const target = document.getElementById(href.slice(2));
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);

    const headerOffset = window.innerWidth < 992 ? 76 : 72;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.history.replaceState(null, "", href);
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <header id="header" className={`fixed-top header-transparent ${menuOpen ? "mobile-menu-open" : ""}`}>
      <div className="container d-flex align-items-center hero-content">
        <div className="logo mr-auto">
          <Link href="/">
            <img className="header-logo-img" src="/assets/img/logoescuro.png" alt="Equilibra Mente" />
          </Link>
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav id="site-navigation" className="nav-menu">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={(event) => handleNavClick(event, item.href)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              {user ? (
                <Link href={user.tipo_usuario === "admin" ? "/admin" : "/cliente/reservas"} onClick={() => setMenuOpen(false)}>
                  {user.tipo_usuario === "admin" ? "Gestao" : "Minhas Reservas"}
                </Link>
              ) : (
                <AuthModalTrigger label="Entre" className="auth-nav-trigger" />
              )}
            </li>
            {user && <li><Link href="/profile">Perfil</Link></li>}
          </ul>
        </nav>
      </div>
    </header>
  );
}
