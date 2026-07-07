import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  await requireAdmin();
  const salas = await listSalas();
  return NextResponse.json({ salas, quantidade: salas.length });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("salas").insert(body).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });
  return NextResponse.json({ success: true, message: "Sala criada com sucesso!", data });
}
