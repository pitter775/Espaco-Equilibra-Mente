import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSala } from "@/lib/data";

const schema = z.object({
  sala_id: z.number(),
  horarios: z.array(z.object({
    data_reserva: z.string(),
    hora_inicio: z.string(),
    hora_fim: z.string(),
  })).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Dados da reserva invalidos." }, { status: 422 });

    const sala = await getSala(parsed.data.sala_id);
    if (!sala) return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });

    const reserva = {
      sala_id: parsed.data.sala_id,
      sala_nome: sala.nome,
      horarios: parsed.data.horarios,
      valor_total: parsed.data.horarios.length * Number(sala.valor),
    };
    const cookieStore = await cookies();
    cookieStore.set("eqm-reserva", encodeURIComponent(JSON.stringify(reserva)), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 30 });
    return NextResponse.json({ redirect: "/reserva/revisao" });
  } catch (error) {
    console.error("Erro ao preparar revisao da reserva:", error);
    return NextResponse.json({ error: "Nao foi possivel preparar a revisao da reserva." }, { status: 500 });
  }
}
