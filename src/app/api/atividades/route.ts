import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);
  const { data } = await getSupabaseAdmin().from("atividades").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, mensagem: "Supabase nao configurado." }, { status: 503 });
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("atividades").insert(body).select("*").single();
  if (error) return NextResponse.json({ success: false, mensagem: error.message }, { status: 422 });
  return NextResponse.json({ success: true, mensagem: "Atividade cadastrada com sucesso!", data: [data] });
}
