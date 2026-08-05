"use client";

import { useState } from "react";

export function RoomDetailGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const safeImages = images.length ? images : ["/assets/img/salas/sala1.jfif"];
  const visibleThumbs = safeImages.slice(0, 4);
  const extraCount = Math.max(safeImages.length - visibleThumbs.length, 0);
  const [activeImage, setActiveImage] = useState(safeImages[0]);
  const [transitioning, setTransitioning] = useState(false);

  function selectImage(image: string) {
    if (image === activeImage) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setActiveImage(image);
      window.setTimeout(() => setTransitioning(false), 40);
    }, 120);
  }

  return (
    <div className="room-detail-gallery">
      <div className="room-detail-main">
        <img className={transitioning ? "is-transitioning" : ""} src={activeImage} alt={roomName} />
      </div>
      <div className="room-detail-thumbs">
        {visibleThumbs.map((image, index) => (
          <button
            type="button"
            className={image === activeImage ? "active" : ""}
            onClick={() => selectImage(image)}
            key={`${image}-${index}`}
            aria-label={`Ver imagem ${index + 1} de ${roomName}`}
          >
            <img src={image} alt="" />
            {index === visibleThumbs.length - 1 && extraCount > 0 ? (
              <span className="room-detail-thumb-more">+{extraCount} fotos</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
