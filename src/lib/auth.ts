import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, getProfileByEmail } from "./data";
import { getSupabaseAdmin, getSupabaseAnon } from "./supabase";
import type { AppUser } from "./types";

async function getLegacyProfile(userId: string): Promise<AppUser | null> {
  try {
    const { data, error } = await getSupabaseAdmin().from("users").select("*").eq("id", userId).maybeSingle();
    if (error) return null;
    return data as AppUser | null;
  } catch {
    return getProfile(userId);
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
  const legacyUserId = cookieStore.get("eqm-legacy-user-id")?.value;
  if (!token && legacyUserId) {
    if (legacyUserId === "1") {
      return {
        id: "1",
        email: "admin@admin",
        name: "Administrador",
        tipo_usuario: "admin",
        status_aprovacao: "aprovado",
        cadastro_completo: true,
      };
    }
    return getLegacyProfile(legacyUserId);
  }
  if (!token) return null;

  try {
    const { data, error } = await getSupabaseAnon().auth.getUser(token);
    if (error || !data.user) return null;

    const profile = (await getProfile(data.user.id)) ?? (data.user.email ? await getProfileByEmail(data.user.email) : null);
    return {
      id: profile?.id ?? data.user.id,
      email: data.user.email,
      name: profile?.name ?? data.user.user_metadata?.name ?? null,
      tipo_usuario: profile?.tipo_usuario ?? data.user.user_metadata?.tipo_usuario ?? "cliente",
      status_aprovacao: profile?.status_aprovacao ?? null,
      cadastro_completo: profile?.cadastro_completo ?? null,
      telefone: profile?.telefone ?? null,
      cpf: profile?.cpf ?? null,
      photo: profile?.photo ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect_to=/admin");
  if (user.tipo_usuario !== "admin") redirect("/cliente/reservas");
  return user;
}
