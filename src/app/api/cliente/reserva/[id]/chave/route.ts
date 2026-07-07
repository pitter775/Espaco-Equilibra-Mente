import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ message: "Supabase nao configurado." }, { status: 503 });

  const { data: reserva } = await getSupabaseAdmin().from("reservas").select("usuario_id,chave_usada").eq("id", id).maybeSingle();
  if (!reserva) return NextResponse.json({ message: "Reserva nao encontrada." }, { status: 404 });
  if (String(reserva.usuario_id) !== String(user.id)) return NextResponse.json({ message: "Reserva nao pertence a voce." }, { status: 403 });

  return NextResponse.json({ chave: reserva.chave_usada });
}
