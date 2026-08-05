import { del, put } from "@vercel/blob";

const MAX_ROOM_IMAGE_SIZE = 6 * 1024 * 1024;
const ALLOWED_ROOM_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function extensionFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function decodeDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  if (!ALLOWED_ROOM_IMAGE_TYPES.has(mime)) return null;

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_ROOM_IMAGE_SIZE) return null;

  return { buffer, mime };
}

export async function storeRoomImages(salaId: number, imagens: string[]) {
  const stored: string[] = [];

  for (const imagem of imagens) {
    const value = String(imagem ?? "").trim();
    if (!value) continue;

    if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
      stored.push(value);
      continue;
    }

    const decoded = decodeDataUrl(value);
    if (!decoded) {
      throw new Error("Envie imagens JPG, PNG ou WEBP com ate 6MB.");
    }

    const fileName = safeFileName(`sala-${salaId}-${Date.now()}.${extensionFromMime(decoded.mime)}`);
    const blob = await put(`salas/${salaId}/${fileName}`, decoded.buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: decoded.mime,
    });
    stored.push(blob.url);
  }

  return stored;
}

export async function deleteRoomImageAsset(value?: string | null) {
  const url = String(value ?? "").trim();
  if (!url || !url.includes(".public.blob.vercel-storage.com/")) return;

  await del(url);
}
