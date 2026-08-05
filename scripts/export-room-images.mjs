import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const outputRoot = path.join(root, "public", "uploads", "salas");
const backupPath = path.join(root, "scripts", "room-images-base64-backup.sql");
const writeDb = process.argv.includes("--write-db");

function loadEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function decodeImage(value) {
  const text = String(value ?? "").trim();
  if (!text || text.startsWith("/") || text.startsWith("http://") || text.startsWith("https://")) return null;

  const dataUrl = text.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const mime = dataUrl?.[1] ?? "";
  const base64 = dataUrl?.[2] ?? text;
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) return null;

  let ext = "jpg";
  if (mime.includes("png") || buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = "png";
  if (mime.includes("webp") || buffer.subarray(0, 4).toString("ascii") === "RIFF") ext = "webp";
  if (mime.includes("gif") || buffer.subarray(0, 3).toString("ascii") === "GIF") ext = "gif";

  return { buffer, ext };
}

function sqlString(value) {
  return String(value ?? "").replaceAll("'", "''");
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase
    .from("imagens_salas")
    .select("id,sala_id,imagem_base64,principal")
    .order("sala_id", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;

  const updates = [];
  const backups = [
    "-- Backup gerado antes de trocar imagens base64 por arquivos publicos.",
    "-- Rode manualmente apenas se precisar reverter.",
  ];

  for (const image of data ?? []) {
    const decoded = decodeImage(image.imagem_base64);
    if (!decoded) continue;

    const roomDir = path.join(outputRoot, `sala-${image.sala_id}`);
    fs.mkdirSync(roomDir, { recursive: true });
    const publicPath = `/uploads/salas/sala-${image.sala_id}/imagem-${image.id}.${decoded.ext}`;
    fs.writeFileSync(path.join(root, "public", publicPath), decoded.buffer);

    updates.push({ id: image.id, publicPath, oldValue: image.imagem_base64 });
    backups.push(`update public.imagens_salas set imagem_base64 = '${sqlString(image.imagem_base64)}' where id = ${Number(image.id)};`);
  }

  if (updates.length) {
    fs.writeFileSync(backupPath, `${backups.join("\n")}\n`, "utf8");
  }

  if (writeDb) {
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("imagens_salas")
        .update({ imagem_base64: update.publicPath })
        .eq("id", update.id);
      if (updateError) throw updateError;
    }
  }

  console.log(`${updates.length} imagem(ns) exportada(s).`);
  console.log(writeDb ? "Banco atualizado com caminhos publicos." : "Banco nao atualizado. Use --write-db depois do deploy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
