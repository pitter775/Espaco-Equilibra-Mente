import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, getProfileByEmail } from "./data";
import { getSupabaseAnon } from "./supabase";
import type { AppUser } from "./types";

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;
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
  const user = await requireUser();
  if (user.tipo_usuario !== "admin") redirect("/cliente/reservas");
  return user;
}
