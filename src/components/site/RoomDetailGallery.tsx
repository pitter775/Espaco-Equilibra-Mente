"use client";

import { useState } from "react";

export function RoomDetailGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const safeImages = images.length ? images : ["/assets/img/salas/sala1.jfif"];
  const [activeImage, setActiveImage] = useState(safeImages[0]);

  return (
    <div className="room-detail-gallery">
      <div className="room-detail-main">
        <img src={activeImage} alt={roomName} />
      </div>
      <div className="room-detail-thumbs">
        {safeImages.slice(0, 5).map((image, index) => (
          <button
            type="button"
            className={image === activeImage ? "active" : ""}
            onClick={() => setActiveImage(image)}
            key={`${image}-${index}`}
            aria-label={`Ver imagem ${index + 1} de ${roomName}`}
          >
            <img src={image} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
