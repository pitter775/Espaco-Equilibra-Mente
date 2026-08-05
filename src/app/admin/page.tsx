import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboardPanel data={data} />;
}
