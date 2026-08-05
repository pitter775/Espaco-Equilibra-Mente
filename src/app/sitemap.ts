import type { MetadataRoute } from "next";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://espaco-equilibra-mente.vercel.app";

function url(path: string) {
  return new URL(path, siteUrl).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let salas: { id: number; status: string | null }[] = [];
  if (isSupabaseConfigured()) {
    const { data } = await getSupabaseServer()
      .from("salas")
      .select("id,status")
      .order("id", { ascending: true });
    salas = data ?? [];
  }

  const now = new Date();
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: url("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: url("/termos-de-servico"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: url("/politica-privacidade"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const salaPages = salas
    .filter((sala) => sala.status !== "indisponivel")
    .map((sala) => ({
      url: url(`/sala/${sala.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...publicPages, ...salaPages];
}
