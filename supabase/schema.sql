-- Equilibra Mente - Supabase Postgres schema
-- Converted from the Laravel migrations in C:\xampp81\htdocs\EquilibraMente.
-- This schema keeps Laravel table names, but uses UUID user ids to work with Supabase Auth.

create extension if not exists "pgcrypto";

create table if not exists public.enderecos (
  id bigserial primary key,
  enderecavel_id bigint,
  enderecavel_type varchar(255),
  rua varchar(255) not null,
  numero varchar(255) not null,
  complemento varchar(255),
  bairro varchar(255) not null,
  cidade varchar(255) not null,
  estado varchar(255) not null,
  cep varchar(255) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists enderecos_enderecavel_idx
  on public.enderecos (enderecavel_id, enderecavel_type);

create table if not exists public.users (
  id text primary key,
  name varchar(255) not null,
  email varchar(255) not null unique,
  email_verified_at timestamptz,
  password varchar(255),
  tipo_usuario varchar(255) not null default 'cliente',
  cpf varchar(255),
  sexo varchar(255),
  idade integer,
  registro_profissional varchar(255),
  tipo_registro_profissional varchar(255),
  photo varchar(255),
  telefone varchar(255),
  endereco_id bigint references public.enderecos(id) on delete set null,
  status varchar(255) not null default 'ativo',
  cadastro_completo boolean not null default false,
  remember_token varchar(100),
  documento_tipo varchar(255),
  documento_identidade varchar(255),
  status_aprovacao varchar(255) not null default 'pendente',
  documento_caminho varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.password_reset_tokens (
  email varchar(255) primary key,
  token varchar(255) not null,
  created_at timestamptz
);

create table if not exists public.failed_jobs (
  id bigserial primary key,
  uuid varchar(255) not null unique,
  connection text not null,
  queue text not null,
  payload text not null,
  exception text not null,
  failed_at timestamptz not null default now()
);

create table if not exists public.personal_access_tokens (
  id bigserial primary key,
  tokenable_type varchar(255) not null,
  tokenable_id bigint not null,
  name varchar(255) not null,
  token varchar(64) not null unique,
  abilities text,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists personal_access_tokens_tokenable_idx
  on public.personal_access_tokens (tokenable_type, tokenable_id);

create table if not exists public.salas (
  id bigserial primary key,
  nome varchar(255) not null,
  metragem varchar(255) not null,
  descricao text not null,
  endereco_id bigint references public.enderecos(id) on delete set null,
  valor numeric(8, 2),
  status varchar(255) not null default 'disponivel',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reservas (
  id bigserial primary key,
  usuario_id text not null references public.users(id) on delete cascade,
  sala_id bigint not null references public.salas(id) on delete cascade,
  data_reserva date not null,
  hora_inicio time not null,
  hora_fim time not null,
  status varchar(255) not null default 'ativa',
  chave_usada varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint reserva_unica unique (sala_id, data_reserva, hora_inicio, hora_fim)
);

create table if not exists public.transacoes (
  id bigserial primary key,
  external_id varchar(255),
  usuario_id text not null references public.users(id) on delete cascade,
  sala_id bigint not null references public.salas(id) on delete cascade,
  pagbank_order_id varchar(255),
  reference_id varchar(255),
  valor numeric(10, 2) not null,
  status varchar(255) not null default 'PENDING',
  detalhes jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.faturas (
  id bigserial primary key,
  transacao_id bigint not null references public.transacoes(id) on delete cascade,
  numero_fatura varchar(255) not null unique,
  data_emissao date not null,
  valor numeric(10, 2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notas_fiscais (
  id bigserial primary key,
  transacao_id bigint not null references public.transacoes(id) on delete cascade,
  numero_nota varchar(255) not null unique,
  chave_acesso varchar(255) not null unique,
  valor numeric(10, 2) not null,
  status varchar(255) not null default 'pendente',
  data_emissao date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.imagens_salas (
  id bigserial primary key,
  sala_id bigint not null references public.salas(id) on delete cascade,
  imagem_base64 text,
  principal boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.conveniencias (
  id bigserial primary key,
  nome varchar(255) not null,
  icone varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sala_conveniencias (
  sala_id bigint not null references public.salas(id) on delete cascade,
  conveniencia_id bigint not null references public.conveniencias(id) on delete cascade,
  primary key (sala_id, conveniencia_id)
);

create table if not exists public.newsletters (
  id bigserial primary key,
  email varchar(255) not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.debug_logs (
  id bigserial primary key,
  mensagem text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fechaduras (
  id bigserial primary key,
  sala_id bigint not null references public.salas(id) on delete cascade,
  tipo varchar(255),
  chaves jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contratos_usuarios (
  id bigserial primary key,
  user_id text not null references public.users(id) on delete cascade,
  versao_contrato varchar(255) not null default 'v1.0 - 2025-05-16',
  aceito_em timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contracts (
  id bigserial primary key,
  versao varchar(255) not null default 'v1.0 - 2025-05-16',
  conteudo text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.regulations (
  id bigserial primary key,
  versao varchar(255) not null default 'v1.0',
  conteudo text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.atividades (
  id bigserial primary key,
  id_usuario text references public.users(id) on delete set null,
  descricao varchar(255) not null,
  hora_inicio time not null,
  hora_fim time not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bloqueios_salas (
  id bigserial primary key,
  sala_id bigint not null references public.salas(id) on delete cascade,
  data_inicio date not null,
  data_fim date not null,
  hora_inicio time,
  hora_fim time,
  tipo varchar(255) not null default 'dia_inteiro',
  motivo text,
  ativo boolean not null default true,
  gera_renda boolean not null default true,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bloqueios_salas
  add column if not exists gera_renda boolean not null default true;

create index if not exists bloqueios_salas_periodo_idx
  on public.bloqueios_salas (sala_id, data_inicio, data_fim);

create index if not exists bloqueios_salas_ativo_idx
  on public.bloqueios_salas (sala_id, ativo);

create table if not exists public.migrations (
  id serial primary key,
  migration varchar(255) not null,
  batch integer not null
);

alter table public.enderecos enable row level security;
alter table public.users enable row level security;
alter table public.salas enable row level security;
alter table public.reservas enable row level security;
alter table public.transacoes enable row level security;
alter table public.faturas enable row level security;
alter table public.notas_fiscais enable row level security;
alter table public.imagens_salas enable row level security;
alter table public.conveniencias enable row level security;
alter table public.sala_conveniencias enable row level security;
alter table public.newsletters enable row level security;
alter table public.debug_logs enable row level security;
alter table public.fechaduras enable row level security;
alter table public.contratos_usuarios enable row level security;
alter table public.contracts enable row level security;
alter table public.regulations enable row level security;
alter table public.atividades enable row level security;
alter table public.bloqueios_salas enable row level security;

create policy "Public read salas" on public.salas for select using (true);
create policy "Public read imagens_salas" on public.imagens_salas for select using (true);
create policy "Public read conveniencias" on public.conveniencias for select using (true);
create policy "Public read sala_conveniencias" on public.sala_conveniencias for select using (true);
create policy "Public read enderecos" on public.enderecos for select using (true);
create policy "Public read bloqueios_salas" on public.bloqueios_salas for select using (true);
create policy "Public read fechaduras" on public.fechaduras for select using (true);
create policy "Public read regulations" on public.regulations for select using (true);

create policy "Users read own profile" on public.users
  for select using (auth.uid()::text = id);

create policy "Users update own profile" on public.users
  for update using (auth.uid()::text = id);

create policy "Users read own reservas" on public.reservas
  for select using (auth.uid()::text = usuario_id);

create policy "Users insert own reservas" on public.reservas
  for insert with check (auth.uid()::text = usuario_id);

create policy "Users update own reservas" on public.reservas
  for update using (auth.uid()::text = usuario_id);

create policy "Newsletter public insert" on public.newsletters
  for insert with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

grant select on public.salas to anon, authenticated;
grant select on public.imagens_salas to anon, authenticated;
grant select on public.conveniencias to anon, authenticated;
grant select on public.sala_conveniencias to anon, authenticated;
grant select on public.enderecos to anon, authenticated;
grant select on public.bloqueios_salas to anon, authenticated;
grant select on public.fechaduras to anon, authenticated;
grant insert on public.newsletters to anon, authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert, update on public.reservas to authenticated;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
