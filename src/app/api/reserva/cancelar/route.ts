import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const reservaId = String(body.reference_id ?? "").replace("reserva_", "");
  if (!reservaId || !isSupabaseConfigured()) return NextResponse.json({ success: false }, { status: 400 });
  await getSupabaseAdmin().from("reservas").update({ status: "CANCELADA" }).eq("id", reservaId);
  return NextResponse.json({ success: true });
}
