"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const [pendingHref, setPendingHref] = useState("");
  const active = isActive(pathname, href);
  const clicked = pendingHref === href && !active;

  return (
    <Link href={href} className={active ? "is-active" : undefined} onClick={() => !active && setPendingHref(href)}>
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
      <AdminNavPendingHint clicked={clicked} />
    </Link>
  );
}
