import { cookies } from "next/headers";
import { CompleteRegistrationForm } from "@/components/site/CompleteRegistrationForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getLatestContract } from "@/lib/data";

type GoogleData = {
  name?: string;
  email?: string;
  photo?: string | null;
};

const errorMessages: Record<string, string> = {
  senha: "Confira a senha e a confirmacao. A senha precisa ter pelo menos 8 caracteres.",
  documento: "Envie um documento valido em PDF, JPG ou PNG.",
  email: "Este e-mail ja esta cadastrado. Faca login ou use outro e-mail.",
  cadastro: "Nao foi possivel criar seu acesso agora. Tente novamente.",
  contrato: "Voce precisa aceitar os termos do contrato para concluir o cadastro.",
  dados: "Confira os dados informados antes de enviar o cadastro.",
};

type PageProps = {
  searchParams?: Promise<{ erro?: string }>;
};

export default async function CompletarCadastroPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const googleData = JSON.parse(cookieStore.get("eqm-google-data")?.value ?? "{}") as GoogleData;
  const contract = await getLatestContract();
  const params = await searchParams;
  const error = params?.erro ? errorMessages[params.erro] : "";
  const name = googleData.name ?? user?.name ?? "";
  const email = googleData.email ?? user?.email ?? "";
  const photo = googleData.photo ?? user?.photo ?? "";

  return (
    <>
      <SiteHeader user={user} />
      <main className="legacy-page manual-register-page">
        <div className="container">
          <CompleteRegistrationForm error={error} name={name} email={email} photo={photo} contract={contract} />
        </div>
      </main>
    </>
  );
}
