import type { ReactNode } from "react";

export function AdminPageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="admin-hero">
      <div>
        <p className="admin-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </div>
      <div className="admin-hero-pulse" />
    </div>
  );
}

export function AdminMetrics({ items }: { items: { label: string; value: number | string }[] }) {
  return (
    <div className="admin-metrics">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
