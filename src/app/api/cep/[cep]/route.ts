import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const cleanCep = cep.replace(/\D/g, "");
  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { next: { revalidate: 86400 } });
  return NextResponse.json(await response.json(), { status: response.status });
}
