import { AdminLocksPanel } from "@/components/admin/AdminLocksPanel";
import { listLockedKeys, listSalas } from "@/lib/data";

export default async function FechaduraPage() {
  const [salas, lockedKeys] = await Promise.all([listSalas(), listLockedKeys()]);

  return <AdminLocksPanel salas={salas} lockedKeys={lockedKeys} />;
}
