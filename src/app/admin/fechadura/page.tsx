import { AdminLocksPanel } from "@/components/admin/AdminLocksPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listLockedKeys, listSalas } from "@/lib/data";

export default async function FechaduraPage() {
  await requireAdmin();
  const [salas, lockedKeys] = await Promise.all([listSalas(), listLockedKeys()]);

  return (
    <AdminShell>
      <AdminLocksPanel salas={salas} lockedKeys={lockedKeys} />
    </AdminShell>
  );
}
