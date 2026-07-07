import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type { AppUser, Reserva, Sala } from "./types";

const salaSelect = `
  *,
  imagens:imagens_salas(*),
  conveniencias(*),
  endereco:enderecos(*)
`;

export async function listSalas(): Promise<Sala[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseAdmin()
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

  const { data, error } = await getSupabaseAdmin()
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

export async function getProfile(userId: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseAdmin()
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

export async function listReservasByUser(userId: string): Promise<Reserva[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseAdmin()
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

export async function listReservas(): Promise<Reserva[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("reservas")
    .select("*, sala:salas(*), usuario:users(id,name,email,telefone,photo)")
    .order("data_reserva", { ascending: false });

  if (error) {
    console.error("Erro ao listar reservas:", error.message);
    return [];
  }

  return (data ?? []) as Reserva[];
}
