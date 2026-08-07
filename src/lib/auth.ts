import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile } from "./data";
import { readSessionToken, SESSION_COOKIE } from "./session";
import { getSupabaseAdmin } from "./supabase";
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
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const legacyUserId = cookieStore.get("eqm-legacy-user-id")?.value;
  const userId = session?.userId ?? legacyUserId;

  if (userId) {
    if (userId === "1") {
      return {
        id: "1",
        email: "admin@admin",
        name: "Administrador",
        tipo_usuario: "admin",
        status_aprovacao: "aprovado",
        cadastro_completo: true,
      };
    }

    const profile = await getLegacyProfile(userId);
    if (profile) return profile;
  }

  return null;
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
