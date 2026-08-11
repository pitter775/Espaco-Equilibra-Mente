"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const active = isActive(pathname, href);

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
    >
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
