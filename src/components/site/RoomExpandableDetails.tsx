"use client";

import { useState } from "react";

type RoomConvenience = {
  id: number | string;
  nome: string;
  icone?: string | null;
};

export function RoomExpandableDetails({
  description,
  conveniences,
}: {
  description?: string | null;
  conveniences?: RoomConvenience[] | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`room-detail-mobile-section ${expanded ? "is-expanded" : ""}`}>
      <div className="room-detail-copy" dangerouslySetInnerHTML={{ __html: description ?? "" }} />
      <button className="room-mobile-more-toggle" type="button" onClick={() => setExpanded((current) => !current)}>
        <span>{expanded ? "Ver menos" : "Ver mais"}</span>
        <i className={`fa-solid fa-chevron-${expanded ? "up" : "down"}`} aria-hidden="true" />
      </button>
      <hr className="room-detail-divider" />
      <div className="room-conveniences">
        {conveniences?.length ? conveniences.map((item) => (
          <div className="eq-card room-convenience-card" key={item.id}>
            <i className={`${item.icone ?? "fa fa-check"} mr-2`} style={{ color: "#76aa66" }} />
            <span style={{ fontSize: 13, color: "#777" }}>{item.nome}</span>
          </div>
        )) : <p>Sem conveniencias cadastradas para esta sala.</p>}
      </div>
    </div>
  );
}
