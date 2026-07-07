import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const salaId = Number(id);
  const body = await request.json();
  const imagens: string[] = Array.isArray(body.imagens)
    ? body.imagens.map((imagem: unknown) => String(imagem ?? "")).filter(Boolean)
    : [];

  if (!salaId || !imagens.length) {
    return NextResponse.json({ success: false, message: "Envie ao menos uma imagem." }, { status: 422 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existentes } = await supabase.from("imagens_salas").select("id").eq("sala_id", salaId).limit(1);
  const { error } = await supabase.from("imagens_salas").insert(imagens.map((imagem_base64, index) => ({
    sala_id: salaId,
    imagem_base64,
    principal: !(existentes?.length) && index === 0,
  })));

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });

  revalidatePath("/admin/salas");
  revalidatePath("/");
  return NextResponse.json({ success: true, message: "Imagens da sala salvas com sucesso!" });
}
