import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

type GoogleData = {
  name?: string;
  email?: string;
  photo?: string | null;
};

export default async function CompletarCadastroPage() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const googleData = JSON.parse(cookieStore.get("eqm-google-data")?.value ?? "{}") as GoogleData;
  const name = googleData.name ?? user?.name ?? "";
  const email = googleData.email ?? user?.email ?? "";
  const photo = googleData.photo ?? user?.photo ?? "";

  return (
    <main className="legacy-page" style={{ minHeight: "100vh", padding: "110px 0 70px" }}>
      <div className="container">
        <form className="eq-card p-4" method="post" action="/api/auth/completar-cadastro" encType="multipart/form-data">
          <h1 className="h4 mb-4">Completar Cadastro</h1>
          {photo && (
            <div className="mb-3">
              <img src={photo} alt="Foto do Google" style={{ width: 88, height: 88, borderRadius: 8, objectFit: "cover" }} />
              <input type="hidden" name="photo" value={photo} />
            </div>
          )}

          <h2 className="h5 mt-3">Informacoes Basicas</h2>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Nome Completo</label>
              <input className="form-control" name="fullname" defaultValue={name} required />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" defaultValue={email} required />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Telefone com DDD</label>
              <input className="form-control" name="telefone" required />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">CPF</label>
              <input className="form-control" name="cpf" required />
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Sexo</label>
              <select className="form-control" name="sexo" required>
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div className="col-md-2 mb-3">
              <label className="form-label">Idade</label>
              <input className="form-control" type="number" name="idade" min="0" required />
            </div>
          </div>

          <h2 className="h5 mt-4">Login de Acesso</h2>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Senha</label>
              <input className="form-control" type="password" name="senha" required minLength={8} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Repetir Senha</label>
              <input className="form-control" type="password" name="senha_confirmation" required minLength={8} />
            </div>
          </div>

          <h2 className="h5 mt-4">Informacoes Profissionais</h2>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Tipo de Registro</label>
              <select className="form-control" name="tipo_registro_profissional">
                <option value="">Selecione</option>
                <option value="CRM">CRM</option>
                <option value="CRP">CRP</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Registro Profissional</label>
              <input className="form-control" name="registro_profissional" />
            </div>
          </div>

          <h2 className="h5 mt-4">Endereco</h2>
          <div className="row">
            <div className="col-md-3 mb-3"><label className="form-label">CEP</label><input className="form-control" name="endereco_cep" required /></div>
            <div className="col-md-6 mb-3"><label className="form-label">Rua</label><input className="form-control" name="endereco_rua" required /></div>
            <div className="col-md-3 mb-3"><label className="form-label">Numero</label><input className="form-control" name="endereco_numero" required /></div>
            <div className="col-md-3 mb-3"><label className="form-label">Complemento</label><input className="form-control" name="endereco_complemento" /></div>
            <div className="col-md-3 mb-3"><label className="form-label">Bairro</label><input className="form-control" name="endereco_bairro" required /></div>
            <div className="col-md-4 mb-3"><label className="form-label">Cidade</label><input className="form-control" name="endereco_cidade" required /></div>
            <div className="col-md-2 mb-3"><label className="form-label">Estado</label><input className="form-control" name="endereco_estado" required maxLength={2} /></div>
          </div>

          <h2 className="h5 mt-4">Documento</h2>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Tipo de Documento</label>
              <select className="form-control" name="documento_tipo" required>
                <option value="">Selecione...</option>
                <option value="RG">RG</option>
                <option value="CPF">CPF</option>
                <option value="CNH">CNH</option>
                <option value="Certidao de Nascimento">Certidao de Nascimento</option>
              </select>
            </div>
            <div className="col-md-8 mb-3">
              <label className="form-label">Arquivo do documento</label>
              <input className="form-control" type="file" name="documento" accept=".jpg,.jpeg,.png,.pdf" required />
            </div>
          </div>

          <div className="form-check mt-3 mb-4">
            <input className="form-check-input" type="checkbox" id="aceitaContrato" name="aceita_contrato" required />
            <label className="form-check-label" htmlFor="aceitaContrato">Eu li e aceito os termos do contrato.</label>
          </div>

          <button className="eq-btn" type="submit">Salvar</button>
        </form>
      </div>
    </main>
  );
}
