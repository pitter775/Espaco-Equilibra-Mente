import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listReservas } from "@/lib/data";

export async function GET() {
  await requireAdmin();
  const reservas = await listReservas();
  return NextResponse.json({ reservas, quantidade: reservas.length });
}
