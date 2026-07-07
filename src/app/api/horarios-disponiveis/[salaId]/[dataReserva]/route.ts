import { NextResponse } from "next/server";
import { getHorariosDisponiveis } from "@/lib/reservation";

export async function GET(_: Request, { params }: { params: Promise<{ salaId: string; dataReserva: string }> }) {
  const { salaId, dataReserva } = await params;
  const horarios = await getHorariosDisponiveis(Number(salaId), dataReserva);
  return NextResponse.json({ horarios });
}
