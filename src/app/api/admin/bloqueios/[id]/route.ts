import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("bloqueios_salas").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidatePath("/admin/salas");
  return NextResponse.json({ success: true, message: "Bloqueio removido com sucesso." });
}
