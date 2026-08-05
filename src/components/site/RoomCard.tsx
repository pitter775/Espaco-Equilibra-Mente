"use client";

import Link from "next/link";
import { useState } from "react";
import type { Sala } from "@/lib/types";

function imageIndex(offset: number, total: number) {
  return ((offset % total) + total) % total;
}

export function RoomCard({ sala, imageOffset = 0 }: { sala: Sala; imageOffset?: number }) {
  const [localOffset, setLocalOffset] = useState(0);
  const images =
    (sala.imagens?.length ? [...sala.imagens] : [{ imagem_base64: "/assets/img/salas/sala1.jfif", principal: true }])
      .sort((a, b) => Number(Boolean(b.principal)) - Number(Boolean(a.principal)))
      .map((imagem) => imagem.imagem_base64)
      .filter(Boolean);
  const image = images.length ? images[imageIndex(imageOffset + localOffset, images.length)] : "/assets/img/salas/sala1.jfif";
  const indisponivel = sala.status === "indisponivel";
  const hasGallery = images.length > 1;

  return (
    <div className={`room-card-public ${indisponivel ? "indisponivel" : ""}`}>
      <div className="room-image">
        <span className="room-image-slide active" style={{ backgroundImage: `url('${image}')` }} />
        {hasGallery && (
          <div className="room-card-image-controls">
            <button type="button" onClick={() => setLocalOffset((current) => current - 1)} aria-label={`Imagem anterior da ${sala.nome}`}>
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setLocalOffset((current) => current + 1)} aria-label={`Proxima imagem da ${sala.nome}`}>
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        )}
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
