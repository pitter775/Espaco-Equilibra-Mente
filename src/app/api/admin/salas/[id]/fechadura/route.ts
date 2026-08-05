import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const salaId = Number(id);
  const body = await request.json();
  const chaves: string[] = Array.isArray(body.chaves)
    ? body.chaves.map((chave: unknown) => String(chave ?? "").trim()).filter(Boolean).slice(0, 4)
    : [];

  if (chaves.some((chave) => chave.length > 12)) {
    return NextResponse.json({ success: false, message: "Cada chave deve ter no maximo 12 caracteres." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existente } = await supabase.from("fechaduras").select("id").eq("sala_id", salaId).maybeSingle();
  const query = existente?.id
    ? supabase.from("fechaduras").update({ chaves }).eq("id", existente.id)
    : supabase.from("fechaduras").insert({ sala_id: salaId, chaves });
  const { error } = await query;

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidateTag("salas", "max");
  revalidatePath("/admin/salas");
  return NextResponse.json({ success: true, message: "Fechadura atualizada com sucesso!" });
}
