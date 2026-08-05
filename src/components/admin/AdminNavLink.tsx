"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

function AdminNavPendingHint() {
  const { pending } = useLinkStatus();
  return <span className={`admin-nav-loader ${pending ? "is-pending" : ""}`} aria-hidden="true" />;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();

  return (
    <Link href={href} className={isActive(pathname, href) ? "is-active" : undefined}>
      <i className={icon} aria-hidden="true" />
      <span>{label}</span>
      <AdminNavPendingHint />
    </Link>
  );
}
