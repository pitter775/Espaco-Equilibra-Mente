import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const imagemId = Number(id);
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body.principal) {
    const { data: imagem, error } = await supabase.from("imagens_salas").select("sala_id").eq("id", imagemId).single();
    if (error || !imagem) return NextResponse.json({ success: false, message: "Imagem nao encontrada." }, { status: 404 });
    await supabase.from("imagens_salas").update({ principal: false }).eq("sala_id", imagem.sala_id);
  }

  const { error } = await supabase.from("imagens_salas").update({ principal: Boolean(body.principal) }).eq("id", imagemId);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Imagem definida como principal!" });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("imagens_salas").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Imagem excluida com sucesso." });
}
