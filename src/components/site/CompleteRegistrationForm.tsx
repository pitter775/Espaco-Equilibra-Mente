"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ContractAcceptance } from "@/components/site/ContractAcceptance";
import { SubmitButton } from "@/components/ui/LoadingButton";
import { compressImageFile } from "@/lib/client-images";

type CompleteRegistrationFormProps = {
  error?: string;
  name: string;
  email: string;
  photo?: string | null;
  contract?: {
    versao?: string | null;
    conteudo?: string | null;
  } | null;
};

type AddressState = {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const documentMaxSize = 4 * 1024 * 1024;
const allowedDocumentTypes = ["application/pdf", "image/jpeg", "image/png"];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calc = (size: number) => {
    const sum = cpf.slice(0, size).split("").reduce((total, digit, index) => total + Number(digit) * (size + 1 - index), 0);
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };

  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function passwordLabel(score: number) {
  if (score >= 4) return "Senha forte";
  if (score >= 3) return "Senha boa";
  if (score >= 2) return "Senha media";
  return "Senha fraca";
}

function fileSizeLabel(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function replaceInputFile(input: HTMLInputElement, file: File) {
  if (typeof DataTransfer === "undefined") return false;
  const files = new DataTransfer();
  files.items.add(file);
  input.files = files.files;
  return true;
}

function PasswordInput({
  name,
  value,
  label,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="complete-field">
      <span>{label}</span>
      <div className="complete-password-field">
        <input
          className="form-control"
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          minLength={8}
          autoComplete="new-password"
          required
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisible((current) => !current)}>
          <i className={visible ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}

export function CompleteRegistrationForm({ error, name, email, photo, contract }: CompleteRegistrationFormProps) {
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [idade, setIdade] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentPreview, setDocumentPreview] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);
  const [formError, setFormError] = useState("");
  const [address, setAddress] = useState<AddressState>({ rua: "", bairro: "", cidade: "", estado: "" });
  const [cepLoading, setCepLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(senha), [senha]);
  const passwordsMatch = senhaConfirmacao.length > 0 && senha === senhaConfirmacao;
  const canShowPasswordMatch = senha.length > 0 && senhaConfirmacao.length > 0;

  async function fetchAddressByCep(digits: string) {
    setCepLoading(true);
    try {
      const response = await fetch(`/api/cep/${digits}`);
      const data = await response.json();
      if (!data?.erro) {
        setAddress({
          rua: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
        });
      }
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepChange(value: string) {
    const masked = maskCep(value);
    const digits = onlyDigits(masked);
    setCep(masked);
    if (digits.length === 8) void fetchAddressByCep(digits);
  }

  function validateDocument(file?: File | null, originalSize?: number) {
    setDocumentPreview((current) => {
      if (current?.type === "image") URL.revokeObjectURL(current.url);
      return null;
    });

    if (!file) {
      setDocumentMessage("");
      return;
    }

    if (!allowedDocumentTypes.includes(file.type)) {
      setDocumentMessage("Use PDF, JPG ou PNG.");
      return;
    }

    if (file.size > documentMaxSize) {
      setDocumentMessage("Arquivo acima de 4 MB. Na Vercel, envie um arquivo menor.");
      return;
    }

    const optimizedLabel = originalSize && originalSize > file.size ? ` Imagem otimizada de ${fileSizeLabel(originalSize)} para ${fileSizeLabel(file.size)}.` : "";
    setDocumentMessage(`${file.name} selecionado.${optimizedLabel}`);
    if (file.type.startsWith("image/")) {
      setDocumentPreview({ url: URL.createObjectURL(file), type: "image", name: file.name });
      return;
    }
    setDocumentPreview({ url: "", type: "pdf", name: file.name });
  }

  async function handleDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      validateDocument(null);
      return;
    }

    if (!allowedDocumentTypes.includes(file.type)) {
      validateDocument(file);
      return;
    }

    if (!file.type.startsWith("image/")) {
      validateDocument(file);
      return;
    }

    setDocumentMessage("Otimizando imagem antes do envio...");
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.78 });
      if (compressed !== file) {
        if (replaceInputFile(input, compressed)) {
          validateDocument(compressed, file.size);
        } else {
          validateDocument(file);
        }
        return;
      }
    } catch (error) {
      console.error("Erro ao otimizar documento:", error);
    }

    validateDocument(file);
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const telefoneDigits = onlyDigits(telefone);
    const cepDigits = onlyDigits(cep);
    const numeroDigits = onlyDigits(numero);

    if (telefoneDigits.length < 10 || telefoneDigits.length > 11) {
      event.preventDefault();
      setFormError("Informe um telefone valido com DDD.");
      return;
    }

    if (!isValidCpf(cpf)) {
      event.preventDefault();
      setFormError("Informe um CPF valido.");
      return;
    }

    if (cepDigits.length !== 8) {
      event.preventDefault();
      setFormError("Informe um CEP valido.");
      return;
    }

    if (!numeroDigits) {
      event.preventDefault();
      setFormError("Informe apenas numeros no numero do endereco.");
      return;
    }

    if (senha.length < 8 || senha !== senhaConfirmacao) {
      event.preventDefault();
      setFormError("Confira a senha e a confirmacao.");
      return;
    }

    setFormError("");
  }

  return (
    <form className="eq-card p-4 complete-register-card" method="post" action="/api/auth/completar-cadastro" encType="multipart/form-data" onSubmit={validateBeforeSubmit}>
      <div className="complete-register-head">
        <span>Cadastro profissional</span>
        <h1>Completar cadastro</h1>
        <p>Preencha os dados, envie o documento e aceite o contrato para enviar seu cadastro para analise.</p>
      </div>

      {(error || formError) && <p className="alert alert-warning">{formError || error}</p>}
      {photo && (
        <div className="complete-google-photo">
          <img src={photo} alt="Foto do Google" />
          <input type="hidden" name="photo" value={photo} />
        </div>
      )}

      <section className="complete-section">
        <h2>Informacoes basicas</h2>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Nome completo</label>
            <input className="form-control" name="fullname" defaultValue={name} autoComplete="name" required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" name="email" defaultValue={email} autoComplete="email" required />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Telefone com DDD</label>
            <input className="form-control" name="telefone" value={telefone} inputMode="numeric" autoComplete="tel" placeholder="(11) 99999-9999" required onChange={(event) => setTelefone(maskPhone(event.target.value))} />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">CPF</label>
            <input className="form-control" name="cpf" value={cpf} inputMode="numeric" placeholder="000.000.000-00" required onChange={(event) => setCpf(maskCpf(event.target.value))} />
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
            <input className="form-control" name="idade" value={idade} inputMode="numeric" maxLength={3} required onChange={(event) => setIdade(onlyDigits(event.target.value).slice(0, 3))} />
          </div>
        </div>
      </section>

      <section className="complete-section">
        <h2>Login de acesso</h2>
        <div className="row">
          <div className="col-md-6 mb-3">
            <PasswordInput name="senha" label="Senha" value={senha} onChange={setSenha} />
            <div className={`complete-password-meter score-${strength}`} aria-hidden="true"><span /></div>
            {senha && <small className="complete-help">{passwordLabel(strength)}. Use pelo menos 8 caracteres.</small>}
          </div>
          <div className="col-md-6 mb-3">
            <PasswordInput name="senha_confirmation" label="Repetir senha" value={senhaConfirmacao} onChange={setSenhaConfirmacao} />
            {canShowPasswordMatch && <small className={passwordsMatch ? "complete-valid" : "complete-invalid"}>{passwordsMatch ? "As senhas conferem." : "As senhas ainda nao conferem."}</small>}
          </div>
        </div>
      </section>

      <section className="complete-section">
        <h2>Informacoes profissionais</h2>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Tipo de registro</label>
            <select className="form-control" name="tipo_registro_profissional">
              <option value="">Selecione</option>
              <option value="CRM">CRM</option>
              <option value="CRP">CRP</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Registro profissional</label>
            <input className="form-control" name="registro_profissional" inputMode="numeric" onChange={(event) => { event.currentTarget.value = onlyDigits(event.currentTarget.value).slice(0, 12); }} />
          </div>
        </div>
      </section>

      <section className="complete-section">
        <h2>Endereco</h2>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">CEP</label>
            <input className="form-control" name="endereco_cep" value={cep} inputMode="numeric" placeholder="00000-000" required onChange={(event) => handleCepChange(event.target.value)} />
            {cepLoading && <small className="complete-help">Buscando endereco...</small>}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Rua</label>
            <input className="form-control" name="endereco_rua" value={address.rua} required onChange={(event) => setAddress((current) => ({ ...current, rua: event.target.value }))} />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Numero</label>
            <input className="form-control" name="endereco_numero" value={numero} inputMode="numeric" required onChange={(event) => setNumero(onlyDigits(event.target.value).slice(0, 8))} />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Complemento</label>
            <input className="form-control" name="endereco_complemento" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Bairro</label>
            <input className="form-control" name="endereco_bairro" value={address.bairro} required onChange={(event) => setAddress((current) => ({ ...current, bairro: event.target.value }))} />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Cidade</label>
            <input className="form-control" name="endereco_cidade" value={address.cidade} required onChange={(event) => setAddress((current) => ({ ...current, cidade: event.target.value }))} />
          </div>
          <div className="col-md-2 mb-3">
            <label className="form-label">Estado</label>
            <input className="form-control text-uppercase" name="endereco_estado" value={address.estado} required maxLength={2} onChange={(event) => setAddress((current) => ({ ...current, estado: event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() }))} />
          </div>
        </div>
      </section>

      <section className="complete-section">
        <h2>Documento</h2>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Tipo de documento</label>
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
            <input className="form-control" type="file" name="documento" accept=".jpg,.jpeg,.png,.pdf" required onChange={handleDocumentChange} />
            {documentMessage && <small className={documentMessage.includes("selecionado") ? "complete-valid" : "complete-invalid"}>{documentMessage}</small>}
            {documentPreview && (
              <div className="complete-document-preview">
                {documentPreview.type === "image" ? (
                  <img src={documentPreview.url} alt={`Previa do documento ${documentPreview.name}`} />
                ) : (
                  <div className="complete-document-pdf">
                    <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                    <span>PDF selecionado</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <ContractAcceptance version={contract?.versao ?? undefined} content={contract?.conteudo ?? undefined} />

      <SubmitButton className="eq-btn complete-submit" loadingLabel="Enviando cadastro...">Enviar cadastro para analise</SubmitButton>
    </form>
  );
}
