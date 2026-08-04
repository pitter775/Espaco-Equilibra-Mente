"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Sala } from "@/lib/types";

export function RoomCard({ sala }: { sala: Sala }) {
  const imagens = useMemo(
    () =>
      (sala.imagens?.length ? [...sala.imagens] : [{ imagem_base64: "/assets/img/salas/sala1.jfif", principal: true }])
        .sort((a, b) => Number(Boolean(b.principal)) - Number(Boolean(a.principal)))
        .map((imagem) => imagem.imagem_base64)
        .filter(Boolean),
    [sala.imagens]
  );
  const [activeImage, setActiveImage] = useState(0);
  const indisponivel = sala.status === "indisponivel";

  useEffect(() => {
    if (imagens.length < 2) return;
    const delay = 3200 + (Number(sala.id) % 4) * 350;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % imagens.length);
    }, delay);

    return () => window.clearInterval(timer);
  }, [imagens.length, sala.id]);

  return (
    <div className={`room-card-public ${indisponivel ? "indisponivel" : ""}`}>
      <div className="room-image">
        {imagens.map((imagem, index) => (
          <span
            className={`room-image-slide ${index === activeImage ? "active" : ""}`}
            style={{ backgroundImage: `url('${imagem}')` }}
            key={`${imagem}-${index}`}
          />
        ))}
        <span className="badge-open">{indisponivel ? "Indisponivel" : "Disponivel"}</span>
      </div>
      <div className="room-body">
        <h4>{sala.nome}</h4>
        <div className="room-meta">
          <span><i className="fa-solid fa-location-dot mr-1" />Consolacao, Sao Paulo</span>
          <span>{sala.metragem ?? "-"} m2</span>
        </div>
        <div className="room-price-line">
          <div>
            <small>R$</small>
            <br />
            <strong>{Number(sala.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/h</strong>
          </div>
          <Link href={`/sala/${sala.id}`} className="about-btn">Ver Detalhes</Link>
        </div>
      </div>
    </div>
  );
}
