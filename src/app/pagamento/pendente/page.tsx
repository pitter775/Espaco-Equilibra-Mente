import { PaymentResultPage } from "@/components/site/PaymentResultPage";
import { getCurrentUser } from "@/lib/auth";

export default async function PendentePage() {
  const user = await getCurrentUser();
  return <PaymentResultPage user={user} status="pending" />;
}
