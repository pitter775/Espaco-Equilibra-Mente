import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ status: "NAO_ENCONTRADO" }, { status: 404 });
  const clean = reservaId.replace("reserva_", "");
  const { data } = await getSupabaseAdmin()
    .from("transacoes")
    .select("*")
    .or(`reference_id.eq.${reservaId},reference_id.eq.${clean}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return NextResponse.json({ status: "NAO_ENCONTRADO" }, { status: 404 });
  const map: Record<string, string> = { approved: "PAGA", pending: "PENDENTE", rejected: "REJEITADA", cancelled: "CANCELADA" };
  return NextResponse.json({ status: map[data.status] ?? String(data.status).toUpperCase() });
}
