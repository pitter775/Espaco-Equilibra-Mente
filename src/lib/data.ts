import { unstable_noStore as noStore } from "next/cache";
import { getSupabasePublic, getSupabaseServer, isSupabaseConfigured } from "./supabase";
import type { AppUser, Conveniencia, Reserva, Sala, Transacao } from "./types";

const salaSelect = `
  *,
  imagens:imagens_salas(*),
  conveniencias(*),
  endereco:enderecos(*),
  bloqueios:bloqueios_salas(*),
  fechadura:fechaduras(*)
`;

export async function listSalas(): Promise<Sala[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabasePublic()
    .from("salas")
    .select(salaSelect)
    .order("id", { ascending: true });

  if (error) {
    console.error("Erro ao listar salas:", error.message);
    return [];
  }

  return (data ?? []) as Sala[];
}

export async function getSala(id: string | number): Promise<Sala | null> {
  noStore();
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabasePublic()
    .from("salas")
    .select(salaSelect)
    .eq("id", Number(id))
    .single();

  if (error) {
    console.error("Erro ao buscar sala:", error.message);
    return null;
  }

  return data as Sala;
}

export async function listConveniencias(): Promise<Conveniencia[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabasePublic()
    .from("conveniencias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar conveniencias:", error.message);
    return [];
  }

  return (data ?? []) as Conveniencia[];
}

export async function getProfile(userId: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseServer()
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar usuario:", error.message);
    return null;
  }

  return data as AppUser | null;
}

export async function getProfileByEmail(email: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseServer()
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar usuario por email:", error.message);
    return null;
  }

  return data as AppUser | null;
}

export async function listReservasByUser(userId: string): Promise<Reserva[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseServer()
    .from("reservas")
    .select("*, sala:salas(*)")
    .eq("usuario_id", userId)
    .order("data_reserva", { ascending: false });

  if (error) {
    console.error("Erro ao listar reservas do cliente:", error.message);
    return [];
  }

  return (data ?? []) as Reserva[];
}

export type ReservaClienteGrupo = {
  key: string;
  sala_id: number;
  data_reserva: string;
  reservas: Reserva[];
  transacao: Transacao | null;
  sortAt: string;
};

function toDateTime(dataReserva: string, hora: string) {
  return new Date(`${dataReserva}T${hora.slice(0, 5)}:00`);
}

export async function listReservaGroupsByUser(userId: string): Promise<ReservaClienteGrupo[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServer();
  const limiteCancelamento = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const limiteExclusao = new Date();
  limiteExclusao.setMonth(limiteExclusao.getMonth() - 4);

  const { data: pendentesAntigas } = await supabase
    .from("reservas")
    .select("id")
    .eq("usuario_id", userId)
    .in("status", ["pendente", "PENDENTE"])
    .lt("created_at", limiteCancelamento);

  const idsAntigas = (pendentesAntigas ?? []).map((item) => item.id);
  if (idsAntigas.length) {
    await supabase.from("reservas").update({ status: "cancelada" }).in("id", idsAntigas);
    await supabase
      .from("transacoes")
      .update({ status: "cancelada" })
      .in("reference_id", [...idsAntigas.map(String), ...idsAntigas.map((id) => `reserva_${id}`)])
      .in("status", ["pendente", "iniciada", "aguardando", "pending"]);
  }

  await supabase
    .from("reservas")
    .delete()
    .eq("usuario_id", userId)
    .in("status", ["cancelada", "CANCELADA"])
    .lt("updated_at", limiteExclusao.toISOString());

  const { data: reservas, error } = await supabase
    .from("reservas")
    .select("*, sala:salas(*, imagens:imagens_salas(*), endereco:enderecos(*))")
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao listar reservas do cliente:", error.message);
    return [];
  }

  const lista = (reservas ?? []) as Reserva[];
  if (!lista.length) return [];

  const refs = Array.from(new Set(lista.flatMap((reserva) => [`reserva_${reserva.id}`, String(reserva.id)])));
  const { data: transacoes } = await supabase
    .from("transacoes")
    .select("*")
    .eq("usuario_id", userId)
    .in("reference_id", refs)
    .order("created_at", { ascending: false });

  const transacoesPorRef = new Map<string, Transacao>();
  for (const transacao of ((transacoes ?? []) as Transacao[])) {
    if (transacao.reference_id && !transacoesPorRef.has(transacao.reference_id)) {
      transacoesPorRef.set(transacao.reference_id, transacao);
    }
  }

  const grupos = new Map<string, ReservaClienteGrupo>();
  for (const reserva of lista) {
    const key = `${reserva.sala_id}_${reserva.data_reserva}`;
    const transacao = transacoesPorRef.get(`reserva_${reserva.id}`) ?? transacoesPorRef.get(String(reserva.id)) ?? null;
    const sortAt = transacao?.created_at ?? (reserva.data_reserva && reserva.hora_fim ? toDateTime(reserva.data_reserva, reserva.hora_fim).toISOString() : reserva.created_at ?? "");
    const grupo = grupos.get(key);

    if (!grupo) {
      grupos.set(key, {
        key,
        sala_id: reserva.sala_id,
        data_reserva: reserva.data_reserva,
        reservas: [reserva],
        transacao,
        sortAt,
      });
      continue;
    }

    grupo.reservas.push(reserva);
    if (sortAt > grupo.sortAt) {
      grupo.sortAt = sortAt;
      grupo.transacao = transacao;
    }
  }

  return Array.from(grupos.values())
    .map((grupo) => ({
      ...grupo,
      reservas: grupo.reservas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    }))
    .sort((a, b) => b.sortAt.localeCompare(a.sortAt));
}

export async function listReservas(): Promise<Reserva[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseServer()
    .from("reservas")
    .select("*, sala:salas(*, imagens:imagens_salas(*), endereco:enderecos(*)), usuario:users(id,name,email,telefone,photo,cpf,sexo,idade,registro_profissional,tipo_registro_profissional,status,tipo_usuario,endereco:enderecos(*))")
    .order("data_reserva", { ascending: false });

  if (error) {
    console.error("Erro ao listar reservas:", error.message);
    return [];
  }

  return (data ?? []) as Reserva[];
}

export async function listLockedKeys(): Promise<string[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseServer()
    .from("reservas")
    .select("chave_usada,status")
    .not("chave_usada", "is", null)
    .in("status", ["ativa", "ATIVA", "CONFIRMADA"]);

  if (error) {
    console.error("Erro ao listar chaves em uso:", error.message);
    return [];
  }

  return Array.from(new Set((data ?? []).map((item) => String(item.chave_usada ?? "").trim()).filter(Boolean)));
}

export async function getLatestContract(): Promise<{ id: number; versao: string; conteudo: string; created_at?: string | null } | null> {
  noStore();
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseServer()
    .from("contracts")
    .select("id,versao,conteudo,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar contrato:", error.message);
    return null;
  }

  return data;
}
