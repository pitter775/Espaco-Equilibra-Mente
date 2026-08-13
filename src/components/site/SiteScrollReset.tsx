"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SiteScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (window.location.hash) return;

    const scrollTop = () => {
      if (window.location.hash) return;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    scrollTop();
    const frame = window.requestAnimationFrame(scrollTop);
    const timers = [80, 240, 600].map((delay) => window.setTimeout(scrollTop, delay));
    window.addEventListener("pageshow", scrollTop);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("pageshow", scrollTop);
    };
  }, [pathname]);

  return null;
}
