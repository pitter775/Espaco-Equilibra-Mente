import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  await requireAdmin();
  const { data } = await getSupabaseAdmin().from("users").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("users").insert(body).select("*").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 422 });
  return NextResponse.json({ success: true, data });
}
