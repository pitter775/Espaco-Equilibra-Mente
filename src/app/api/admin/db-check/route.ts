import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

function decodeJwtPayload(token?: string) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as { ref?: string; role?: string; iss?: string };
    return {
      ref: parsed.ref ?? null,
      role: parsed.role ?? null,
      iss: parsed.iss ?? null,
    };
  } catch {
    return null;
  }
}

async function countRows(client: ReturnType<typeof getSupabaseAdmin>, table: string) {
  try {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    return { count: count ?? 0, error: error?.message ?? null };
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function GET() {
  await requireAdmin();

  const admin = getSupabaseAdmin();
  const publicClient = getSupabasePublic();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const [adminReservas, adminUsers, adminSalas, publicReservas, publicSalas] = await Promise.all([
    countRows(admin, "reservas"),
    countRows(admin, "users"),
    countRows(admin, "salas"),
    countRows(publicClient, "reservas"),
    countRows(publicClient, "salas"),
  ]);

  const payload = {
    env: {
      urlHost: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim()).host : null,
      serviceJwt: decodeJwtPayload(serviceKey),
      anonJwt: decodeJwtPayload(anonKey),
      hasServiceKey: Boolean(serviceKey),
    },
    adminCounts: {
      reservas: adminReservas,
      users: adminUsers,
      salas: adminSalas,
    },
    publicCounts: {
      reservas: publicReservas,
      salas: publicSalas,
    },
  };

  console.info("[admin-db-check]", payload);

  return NextResponse.json(payload);
}
