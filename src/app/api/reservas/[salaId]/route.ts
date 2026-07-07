import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ salaId: string }> }) {
  const { salaId } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const { data } = await getSupabaseAdmin().from("reservas").select("data_reserva,hora_inicio,hora_fim").eq("sala_id", Number(salaId));
  return NextResponse.json((data ?? []).map((r) => ({
    title: "Reservado",
    start: `${r.data_reserva}T${r.hora_inicio}`,
    end: `${r.data_reserva}T${r.hora_fim}`,
    color: "#ff5e5e",
  })));
}
