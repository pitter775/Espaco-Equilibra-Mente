"use client";

import { useState } from "react";

const galleryRooms = [
  {
    id: "sala-1",
    label: "Sala 1",
    images: [
      "/assets/img/salas/sala12.jfif",
      "/assets/img/salas/sala13.jfif",
      "/assets/img/salas/sala14.jfif",
    ],
  },
  {
    id: "sala-2",
    label: "Sala 2",
    images: ["/assets/img/salas/sala2.jfif", "/assets/img/salas/sala21.jfif"],
  },
  {
    id: "sala-3",
    label: "Sala 3",
    images: ["/assets/img/salas/sala3.jfif", "/assets/img/salas/sala31.jfif"],
  },
];

export function AboutGallery() {
  const [activeRoom, setActiveRoom] = useState(galleryRooms[0]);

  return (
    <>
      <div className="gallery-tabs" role="tablist" aria-label="Galeria de salas">
        {galleryRooms.map((room) => (
          <button
            key={room.id}
            type="button"
            className={room.id === activeRoom.id ? "active" : ""}
            onClick={() => setActiveRoom(room)}
            role="tab"
            aria-selected={room.id === activeRoom.id}
          >
            {room.label}
          </button>
        ))}
      </div>
      <div className={`about-gallery image-count-${activeRoom.images.length}`} key={activeRoom.id}>
        {activeRoom.images.map((src) => (
          <figure className="about-gallery-item" key={src}>
            <img src={src} alt={`${activeRoom.label} EquilibraMente`} />
          </figure>
        ))}
      </div>
    </>
  );
}
