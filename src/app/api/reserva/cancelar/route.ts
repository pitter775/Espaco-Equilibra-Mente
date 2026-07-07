import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const reservaId = String(body.reference_id ?? "").replace("reserva_", "");
  if (!reservaId || !isSupabaseConfigured()) return NextResponse.json({ success: false }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: reserva } = await supabase.from("reservas").select("*").eq("id", reservaId).maybeSingle();
  if (!reserva) return NextResponse.json({ success: false, message: "Reserva nao encontrada." }, { status: 404 });
  if (String(reserva.usuario_id) !== String(user.id)) return NextResponse.json({ success: false, message: "Reserva nao pertence a voce." }, { status: 403 });
  if (String(reserva.status).toLowerCase() !== "pendente") return NextResponse.json({ success: false, message: "Somente reservas pendentes podem ser canceladas." }, { status: 422 });

  await supabase.from("reservas").update({ status: "cancelada" }).eq("id", reservaId);
  await supabase
    .from("transacoes")
    .update({ status: "cancelada" })
    .in("reference_id", [`reserva_${reservaId}`, String(reservaId)])
    .in("status", ["pendente", "iniciada", "aguardando", "pending"]);

  return NextResponse.json({ success: true });
}
