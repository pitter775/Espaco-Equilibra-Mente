import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://espaco-equilibra-mente.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cliente", "/profile", "/reserva"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
