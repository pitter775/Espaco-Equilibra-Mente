import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const reservaId = Number(id);
  if (!reservaId) return NextResponse.json({ success: false, message: "Reserva invalida." }, { status: 422 });

  const supabase = getSupabaseAdmin();
  const { data: reserva } = await supabase.from("reservas").select("id,status").eq("id", reservaId).maybeSingle();
  if (!reserva) return NextResponse.json({ success: false, message: "Reserva nao encontrada." }, { status: 404 });
  if (String(reserva.status).toUpperCase() === "CANCELADA") {
    return NextResponse.json({ success: false, message: "Esta reserva ja esta cancelada." }, { status: 422 });
  }

  const { error } = await supabase.from("reservas").update({ status: "CANCELADA" }).eq("id", reservaId);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  await supabase
    .from("transacoes")
    .update({ status: "cancelada" })
    .in("reference_id", [`reserva_${reservaId}`, String(reservaId)])
    .in("status", ["pendente", "iniciada", "aguardando", "pending"]);

  revalidatePath("/admin/reservas");
  revalidatePath("/cliente/reservas");
  return NextResponse.json({ success: true, message: "Reserva cancelada com sucesso!" });
}
