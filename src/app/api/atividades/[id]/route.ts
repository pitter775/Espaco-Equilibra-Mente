import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json(null, { status: 404 });
  const { data } = await getSupabaseAdmin().from("atividades").select("*").eq("id", Number(id)).single();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("atividades").update(body).eq("id", Number(id)).select("*").single();
  if (error) return NextResponse.json({ mensagem: error.message }, { status: 422 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getSupabaseAdmin().from("atividades").delete().eq("id", Number(id));
  return NextResponse.json({ mensagem: "Removido com sucesso" });
}
