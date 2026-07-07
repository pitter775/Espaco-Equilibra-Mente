import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listReservas } from "@/lib/data";

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await listReservas());
}
