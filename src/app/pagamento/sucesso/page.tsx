import { PaymentResultPage } from "@/components/site/PaymentResultPage";
import { getCurrentUser } from "@/lib/auth";

export default async function SucessoPage() {
  const user = await getCurrentUser();
  return <PaymentResultPage user={user} status="success" />;
}
