"use client";

import { useState } from "react";
import type { Sala } from "@/lib/types";
import { RoomCard } from "./RoomCard";

export function PublicRooms({ salas }: { salas: Sala[] }) {
  const [imageOffset, setImageOffset] = useState(0);

  function move(direction: -1 | 1) {
    setImageOffset((current) => current + direction);
  }

  return (
    <>
      <div className="room-arrows">
        <button type="button" onClick={() => move(-1)} aria-label="Imagem anterior das salas">
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Proxima imagem das salas">
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
      <div className="rooms-grid">
        {salas.map((sala) => <RoomCard sala={sala} imageOffset={imageOffset} key={sala.id} />)}
      </div>
    </>
  );
}
