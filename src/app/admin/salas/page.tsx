import { AdminRoomsPanel } from "@/components/admin/AdminRoomsPanel";
import { listConveniencias, listSalas } from "@/lib/data";

export default async function AdminSalasPage() {
  const [salas, conveniencias] = await Promise.all([listSalas(), listConveniencias()]);

  return <AdminRoomsPanel salas={salas} conveniencias={conveniencias} />;
}
