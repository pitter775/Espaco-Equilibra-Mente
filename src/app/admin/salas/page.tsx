import { AdminRoomsPanel } from "@/components/admin/AdminRoomsPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { listConveniencias, listSalas } from "@/lib/data";

export default async function AdminSalasPage() {
  await requireAdmin();
  const [salas, conveniencias] = await Promise.all([listSalas(), listConveniencias()]);

  return (
    <AdminShell>
      <AdminRoomsPanel salas={salas} conveniencias={conveniencias} />
    </AdminShell>
  );
}
