"use client";

import { useEffect } from "react";

export function AdminDebugProbe() {
  useEffect(() => {
    fetch("/api/admin/db-check", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        console.info("[admin-db-check]", {
          ok: response.ok,
          status: response.status,
          payload,
        });
      })
      .catch((error) => {
        console.error("[admin-db-check]", error);
      });
  }, []);

  return null;
}
