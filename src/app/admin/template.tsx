import type { ReactNode } from "react";

export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <div className="admin-page-transition">{children}</div>;
}
