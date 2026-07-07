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
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
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
  sala?: Sala | null;
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
};
