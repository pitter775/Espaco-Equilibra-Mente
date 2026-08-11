"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function AdminNavPendingHint({ clicked }: { clicked: boolean }) {
  const { pending } = useLinkStatus();
  return <span className={`admin-nav-loader ${pending || clicked ? "is-pending" : ""}`} aria-hidden="true" />;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [pendingNav, setPendingNav] = useState({ href: "", from: "" });
  const active = isActive(pathname, href);
  const clicked = pendingNav.href === href && pendingNav.from === pathname && !active;

  useEffect(() => {
    if (!active || !linkRef.current || window.innerWidth > 991) return;
    linkRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active, pathname]);

  return (
    <Link
      ref={linkRef}
      href={href}
      aria-current={active ? "page" : undefined}
      className={active ? "is-active" : undefined}
      onClick={() => !active && setPendingNav({ href, from: pathname })}
    >
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
      <AdminNavPendingHint clicked={clicked} />
    </Link>
  );
}
