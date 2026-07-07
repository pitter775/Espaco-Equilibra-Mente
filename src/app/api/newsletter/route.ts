import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const body = request.headers.get("content-type")?.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, message: "E-mail invalido." }, { status: 422 });
  if (!isSupabaseConfigured()) return NextResponse.json({ success: true, message: "E-mail recebido. Configure o Supabase para gravar." });

  const { error } = await getSupabaseAdmin().from("newsletters").insert({ email: parsed.data.email });
  if (error) return NextResponse.json({ success: false, message: "E-mail ja cadastrado ou erro ao salvar." }, { status: 422 });
  return NextResponse.json({ success: true, message: "E-mail cadastrado com sucesso!" });
}
