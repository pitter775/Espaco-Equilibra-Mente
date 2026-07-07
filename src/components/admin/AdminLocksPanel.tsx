"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMetrics, AdminPageHero } from "./AdminPageChrome";
import type { Fechadura, Sala } from "@/lib/types";

type RoomWithLock = Sala & {
  fechadura?: Fechadura | Fechadura[] | null;
};

function roomImage(sala: Sala) {
  return sala.imagens?.find((imagem) => imagem.principal)?.imagem_base64 ?? sala.imagens?.[0]?.imagem_base64 ?? "";
}

function getLock(sala: RoomWithLock): Fechadura | null {
  if (Array.isArray(sala.fechadura)) return sala.fechadura[0] ?? null;
  return sala.fechadura ?? null;
}

export function AdminLocksPanel({ salas, lockedKeys }: { salas: RoomWithLock[]; lockedKeys: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const locked = new Set(lockedKeys);

  async function saveLock(event: React.FormEvent<HTMLFormElement>, salaId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const chaves = [0, 1, 2, 3].map((index) => data.get(`chave_${index}`));
    setLoading(salaId);
    setMessage("");

    const response = await fetch(`/api/admin/salas/${salaId}/fechadura`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chaves }),
    });
    const payload = await response.json();
    setLoading(null);

    if (!response.ok || !payload.success) {
      setMessage(payload.message || "Nao foi possivel atualizar a fechadura.");
      return;
    }

    setMessage(payload.message || "Fechadura atualizada com sucesso!");
    router.refresh();
  }

  return (
    <>
      <AdminPageHero eyebrow="Chaves das salas" title="Fechadura">
        <p className="mb-0">Tela dedicada de fechaduras conforme Laravel, com quatro chaves por sala e bloqueio visual para chave em uso.</p>
      </AdminPageHero>
      <AdminMetrics items={[
        { label: "Salas", value: salas.length },
        { label: "Chaves em uso", value: lockedKeys.length },
        { label: "Com fechadura", value: salas.filter((sala) => (getLock(sala)?.chaves ?? []).length).length },
        { label: "Limite por sala", value: 4 },
      ]} />

      <div className="admin-lock-grid">
        {salas.map((sala) => {
          const chaves = getLock(sala)?.chaves ?? [];
          return (
            <form className="eq-card admin-lock-card" key={sala.id} onSubmit={(event) => saveLock(event, sala.id)}>
              <div className="admin-lock-image">
                {roomImage(sala) ? <img src={roomImage(sala)} alt="" /> : <span>Sem imagem</span>}
              </div>
              <div className="admin-lock-content">
                <h2>{sala.nome}</h2>
                {[0, 1, 2, 3].map((index) => {
                  const value = chaves[index] ?? "";
                  const isLocked = Boolean(value && locked.has(value));
                  return (
                    <label key={index}>
                      <span>Chave {index + 1}</span>
                      <input className="form-control" name={`chave_${index}`} maxLength={12} defaultValue={value} readOnly={isLocked} />
                      {isLocked && <small>Chave em uso</small>}
                    </label>
                  );
                })}
                <button className="eq-btn" type="submit" disabled={loading === sala.id}>Atualizar</button>
              </div>
            </form>
          );
        })}
      </div>
      {message && <p className="alert alert-warning mt-3 mb-0">{message}</p>}
    </>
  );
}
