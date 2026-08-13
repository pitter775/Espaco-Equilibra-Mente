import type { MetadataRoute } from "next";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/seo";

function url(path: string) {
  return absoluteUrl(path);
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
    {
      url: url("/regulamento"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
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
