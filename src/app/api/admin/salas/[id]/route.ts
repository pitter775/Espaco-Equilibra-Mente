import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return NextResponse.json({ sala: await getSala(id) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("salas").update(body).eq("id", Number(id)).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });
  return NextResponse.json({ success: true, message: "Sala atualizada com sucesso!", data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await getSupabaseAdmin().from("salas").delete().eq("id", Number(id));
  return NextResponse.json({ success: true, message: "Sala excluida com sucesso!" });
}
