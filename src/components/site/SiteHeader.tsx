"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AuthModalTrigger } from "./AuthModalTrigger";
import type { AppUser } from "@/lib/types";

const navItems = [
  { href: "/#inicio", label: "Inicio", icon: "fa-solid fa-house" },
  { href: "/#about", label: "Salas", icon: "fa-solid fa-door-open" },
  { href: "/#quemsomos", label: "Sobre Nos", icon: "fa-solid fa-seedling" },
  { href: "/#team", label: "Especialistas", icon: "fa-solid fa-user-doctor" },
  { href: "/#contato", label: "Contato", icon: "fa-brands fa-whatsapp" },
];

export function SiteHeader({ user }: { user: AppUser | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const accountRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const header = document.getElementById("header");
    const updateHeader = () => {
      header?.classList.toggle("header-scrolled", window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const sectionIds = navItems.map((item) => item.href.slice(2));
    const updateActiveSection = () => {
      if (window.scrollY < 120) {
        setActiveSection(sectionIds[0]);
        return;
      }
      const activationLine = window.innerWidth < 992 ? 150 : Math.min(window.innerHeight * 0.32, 280);
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= activationLine && rect.bottom > activationLine) {
          current = id;
          break;
        }
        if (rect.top <= activationLine) current = id;
      }

      setActiveSection(current);
    };

    const timer = window.setTimeout(updateActiveSection, 0);
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [pathname]);

  useEffect(() => {
    window.setTimeout(() => {
      setMenuOpen(false);
      setAccountOpen(false);
    }, 0);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("site-menu-open", menuOpen);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAccountOpen(false);
      }
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

  useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [accountOpen]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("/#") || pathname !== "/") {
      setMenuOpen(false);
      return;
    }

    const target = document.getElementById(href.slice(2));
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);
    setActiveSection(href.slice(2));

    const headerOffset = window.innerWidth < 992 ? 76 : 72;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.history.replaceState(null, "", href);
    window.scrollTo({ top, behavior: "smooth" });
  }

  const isInternalPage = pathname !== "/";
  const accountName = user?.name?.split(" ")[0] || "Minha conta";
  const accountInitial = accountName.slice(0, 1).toUpperCase();
  const accountHref = user?.tipo_usuario === "admin" ? "/admin" : "/cliente/reservas";
  const accountLabel = user?.tipo_usuario === "admin" ? "Gestao" : "Minhas reservas";

  return (
    <header id="header" className={`fixed-top header-transparent ${isInternalPage ? "header-internal" : ""} ${menuOpen ? "mobile-menu-open" : ""}`}>
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
              <li key={item.href} className={pathname === "/" && activeSection === item.href.slice(2) ? "is-active" : ""}>
                <Link href={item.href} onClick={(event) => handleNavClick(event, item.href)}>
                  <i className={item.icon} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
            {!user && (
              <li>
                <AuthModalTrigger label="Entre" className="auth-nav-trigger" onOpen={() => setMenuOpen(false)} />
              </li>
            )}
            {user && (
              <li className={`site-account-menu ${accountOpen ? "is-open" : ""}`} ref={accountRef}>
                <button
                  type="button"
                  className="site-account-trigger"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <span className="site-account-avatar">
                    {user.photo ? <img src={user.photo} alt="" /> : accountInitial}
                  </span>
                  <span className="site-account-name">{accountName}</span>
                  <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                </button>
                <div className="site-account-dropdown" role="menu">
                  <Link href={accountHref} role="menuitem" onClick={() => { setMenuOpen(false); setAccountOpen(false); }}>
                    <i className={user.tipo_usuario === "admin" ? "fa-solid fa-chart-line" : "fa-solid fa-calendar-check"} aria-hidden="true" />
                    {accountLabel}
                  </Link>
                  <Link href="/profile" role="menuitem" onClick={() => { setMenuOpen(false); setAccountOpen(false); }}>
                    <i className="fa-solid fa-user" aria-hidden="true" />
                    Perfil
                  </Link>
                  <form method="post" action="/api/auth/logout" className="site-logout-form" role="none">
                    <button type="submit" className="site-logout-button" role="menuitem">
                      <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                      Sair
                    </button>
                  </form>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
