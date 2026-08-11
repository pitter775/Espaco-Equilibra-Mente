import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

function fileNameFromUrl(value: string) {
  try {
    const url = new URL(value);
    return decodeURIComponent(url.pathname.split("/").pop() || "documento");
  } catch {
    return "documento";
  }
}

async function fallbackPublicFetch(url: string) {
  if (!/^https?:\/\//.test(url)) return null;
  const response = await fetch(url);
  if (!response.ok || !response.body) return null;
  return new Response(response.body, {
    headers: {
      "content-type": response.headers.get("content-type") || "application/octet-stream",
      "content-disposition": `inline; filename="${fileNameFromUrl(url)}"`,
      "cache-control": "private, max-age=60",
    },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data: usuario } = await getSupabaseAdmin()
    .from("users")
    .select("documento_caminho")
    .eq("id", id)
    .maybeSingle();

  const documentoUrl = String(usuario?.documento_caminho ?? "");
  if (!documentoUrl) return NextResponse.json({ message: "Documento nao encontrado." }, { status: 404 });

  try {
    const result = await get(documentoUrl, { access: "private" });
    if (result?.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ message: "Documento nao encontrado no Blob." }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "content-disposition": `inline; filename="${fileNameFromUrl(documentoUrl)}"`,
        "cache-control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("[admin-documentos:get:error]", {
      userId: id,
      documentoUrl,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
    });

    const publicResponse = await fallbackPublicFetch(documentoUrl);
    if (publicResponse) return publicResponse;

    return NextResponse.json({ message: "Nao foi possivel abrir o documento." }, { status: 500 });
  }
}
