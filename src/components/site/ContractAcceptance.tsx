"use client";

import { useMemo, useState } from "react";

type ContractAcceptanceProps = {
  version?: string;
  content?: string;
};

const fallbackContract = `INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTACAO DE SERVICOS

Pelo presente instrumento particular, as Partes:

CONTRATANTE: Nome: {{nome}}, Profissao: {{profissao}}, CPF: {{cpf}}, com endereco em {{endereco}}, com endereco eletronico: {{email}}, telefone: {{telefone}};

CONTRATADA: ESPACO EQUILIBRAMENTE LTDA, com sede na Cidade de Sao Paulo, Estado de Sao Paulo, na RUA DONA ANTONIA DE QUEIROS no 504, cj 43 Edificio E C Higienopolis, Consolacao, CEP: 01307-013, inscrita no CNPJ sob o no 55.559.476/0001-59, com endereco eletronico: equilibramente12@gmail.com;

As partes celebram o presente CONTRATO DE PRESTACAO DE SERVICOS, o qual se regera pelas clausulas e condicoes a seguir estabelecidas.

I. OBJETO

O presente contrato tem por objeto a prestacao de servicos de gestao e disponibilidade de salas para atendimento da area da saude mental, localizado em Rua Dona Antonia de Queiros, no 504 cj 43 - 4 andar, Edificio Higienopolis, Bairro Consolacao, Sao Paulo/SP.

O Espaco podera ser utilizado pelo contratante apenas para o desempenho de suas atividades como profissional da area da saude mental, respeitados todos os termos do Regulamento Interno para uso do Espaco EquilibraMente.

II. PRECOS E FORMAS DE PAGAMENTO

Pela prestacao dos servicos, a Contratada fara jus aos valores apresentados na plataforma de agendamento, de acordo com horarios e especies de contratacao especificadas.

O pagamento podera ser realizado atraves da plataforma no momento do agendamento e na forma disponibilizada no momento da contratacao.

III. PRAZO E RESCISAO

O presente instrumento vigora ate a utilizacao da sala e hora contratada. O contrato podera ser rescindido por qualquer parte mediante notificacao com antecedencia minima de 24 horas da hora agendada.

IV. PENALIDADES

No caso de descumprimento de obrigacoes deste instrumento ou do regulamento de uso do espaco, o Contratante estara sujeito as penalidades previstas no contrato e regulamento.

V. DISPOSICOES FINAIS

A relacao entre as Partes e de contratantes independentes, nao constituindo sociedade, associacao, parceria ou vinculo empregaticio.

Fica eleito o Foro Central da Comarca da Capital do Estado de Sao Paulo para dirimir qualquer questao relacionada ao presente Contrato.

Sao Paulo, {{data}}

CONTRATANTE: {{nome}}, {{endereco}}

CONTRATADA: ESPACO EQUILIBRAMENTE LTDA`;

function fieldValue(name: string) {
  const field = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
  if (!field) return "";
  if (field instanceof HTMLSelectElement) return field.selectedOptions[0]?.textContent?.trim() ?? field.value;
  return field.value.trim();
}

function currentContractData() {
  const endereco = [
    fieldValue("endereco_rua"),
    fieldValue("endereco_numero"),
    fieldValue("endereco_complemento"),
    fieldValue("endereco_bairro"),
    fieldValue("endereco_cidade"),
    fieldValue("endereco_estado"),
    fieldValue("endereco_cep"),
  ].filter(Boolean).join(", ");

  return {
    nome: fieldValue("fullname") || "Nao informado",
    profissao: fieldValue("tipo_registro_profissional") || fieldValue("registro_profissional") || "Nao informado",
    cpf: fieldValue("cpf") || "Nao informado",
    endereco: endereco || "Nao informado",
    email: fieldValue("email") || "Nao informado",
    telefone: fieldValue("telefone") || "Nao informado",
    data: new Intl.DateTimeFormat("pt-BR").format(new Date()),
  };
}

export function ContractAcceptance({ version, content }: ContractAcceptanceProps) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [snapshot, setSnapshot] = useState(currentContractData);
  const contractText = content?.trim() || fallbackContract;

  const preview = useMemo(() => {
    return Object.entries(snapshot).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
      contractText
    );
  }, [contractText, snapshot]);

  function openContract() {
    setSnapshot(currentContractData());
    setOpen(true);
  }

  function acceptContract() {
    setAccepted(true);
    setOpen(false);
  }

  return (
    <div className="contract-acceptance-box mt-3 mb-4">
      <div>
        <strong>Contrato de uso do Espaco Equilibra Mente</strong>
        <p>
          Para concluir o cadastro, abra os termos do contrato, leia o conteudo e confirme o aceite.
        </p>
      </div>
      <div className="form-check contract-acceptance-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="aceitaContrato"
          name="aceita_contrato"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          required
        />
        <label className="form-check-label" htmlFor="aceitaContrato">
          Eu li e aceito os{" "}
          <button type="button" className="contract-open-button" onClick={openContract}>
            termos do contrato
          </button>
          .
        </label>
      </div>

      {open && (
        <div className="contract-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div className="contract-modal" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2 id="contract-modal-title">Contrato - {version || "v1.0 - 2025-05-16"}</h2>
              <button type="button" aria-label="Fechar contrato" onClick={() => setOpen(false)}>x</button>
            </header>
            <div className="contract-modal-body">{preview}</div>
            <footer>
              <button type="button" className="eq-btn" onClick={acceptContract}>Aceito os termos</button>
              <button type="button" className="contract-cancel-button" onClick={() => setOpen(false)}>Cancelar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
