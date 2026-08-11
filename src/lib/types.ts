export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type Sala = {
  id: number;
  nome: string;
  descricao: string | null;
  valor: number;
  metragem: string | number | null;
  status: string | null;
  imagens?: ImagemSala[];
  conveniencias?: Conveniencia[];
  endereco?: Endereco | null;
  bloqueios?: BloqueioSala[];
  fechadura?: Fechadura | null;
};

export type ImagemSala = {
  id: number;
  sala_id: number;
  imagem_base64: string;
  principal: boolean | null;
};

export type Conveniencia = {
  id: number;
  nome: string;
  icone: string | null;
};

export type Endereco = {
  id: number;
  enderecavel_id?: number | null;
  enderecavel_type?: string | null;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
};

export type BloqueioSala = {
  id: number;
  sala_id: number;
  data_inicio: string;
  data_fim: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  tipo: "dia_inteiro" | "intervalo" | string;
  motivo?: string | null;
  ativo?: boolean | null;
  gera_renda?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
};

export type Fechadura = {
  id: number;
  sala_id: number;
  tipo?: string | null;
  chaves?: string[] | null;
};

export type Reserva = {
  id: number;
  usuario_id: string | number;
  sala_id: number;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  chave_usada?: string | null;
  created_at?: string;
  updated_at?: string;
  sala?: Sala | null;
  usuario?: AppUser | null;
};

export type Transacao = {
  id: number;
  external_id?: string | null;
  usuario_id: string | number;
  sala_id: number;
  reference_id: string | null;
  valor: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type AppUser = {
  id: string;
  email?: string;
  name?: string | null;
  tipo_usuario?: string | null;
  status_aprovacao?: string | null;
  cadastro_completo?: boolean | null;
  telefone?: string | null;
  cpf?: string | null;
  photo?: string | null;
  sexo?: string | null;
  idade?: number | null;
  registro_profissional?: string | null;
  tipo_registro_profissional?: string | null;
  status?: string | null;
  documento_tipo?: string | null;
  documento_caminho?: string | null;
  created_at?: string | null;
  endereco?: Endereco | null;
};
