import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { requireAdmin } from "@/lib/auth";
import type { AppUser } from "@/lib/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const users = isSupabaseConfigured()
    ? (await getSupabaseAdmin().from("users").select("*, endereco:enderecos(*)").order("created_at", { ascending: false })).data ?? []
    : [];

  return (
    <AdminShell>
      <AdminUsersPanel users={users as AppUser[]} />
    </AdminShell>
  );
}
