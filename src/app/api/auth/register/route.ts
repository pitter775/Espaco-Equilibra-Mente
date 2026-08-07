import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sendPendingRegistrationEmail } from "@/lib/email";
import { getProfileByEmail } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");
  const telefone = String(form.get("telefone") ?? "");
  const cpf = String(form.get("cpf") ?? "");

  if (!email || !name || password.length < 8) return NextResponse.redirect(new URL("/register?erro=1", request.url));
  if (await getProfileByEmail(email)) return NextResponse.redirect(new URL("/register?erro=email", request.url));

  const hashedPassword = await bcrypt.hash(password, 12);

  const { data: pendingUser } = await getSupabaseAdmin().from("users").upsert({
    id: crypto.randomUUID(),
    name,
    email,
    password: hashedPassword,
    telefone,
    cpf,
    tipo_usuario: "cliente",
    status_aprovacao: "pendente",
    cadastro_completo: true,
  }).select("*").single();

  if (pendingUser) {
    const emailResult = await sendPendingRegistrationEmail(pendingUser);
    if (!emailResult.sent) console.error("Erro ao enviar e-mail de cadastro pendente:", emailResult.error);
  }

  return NextResponse.redirect(new URL("/login?cadastro=1", request.url));
}
