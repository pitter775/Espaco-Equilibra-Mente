import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseAdmin().from("users").select("*, endereco:enderecos(*)").eq("id", id).single();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("users").update(body).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  await getSupabaseAdmin().from("users").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
