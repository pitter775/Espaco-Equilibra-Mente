import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

export default async function AdminPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();

  return (
    <AdminShell>
      <AdminDashboardPanel data={data} />
    </AdminShell>
  );
}
