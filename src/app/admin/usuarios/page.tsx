import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import type { AppUser } from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{ usuario?: string }>;
};

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const users = isSupabaseConfigured()
    ? (await getSupabaseAdmin().from("users").select("*, endereco:enderecos(*)").order("created_at", { ascending: false })).data ?? []
    : [];

  return <AdminUsersPanel users={users as AppUser[]} initialUserId={params?.usuario} />;
}
