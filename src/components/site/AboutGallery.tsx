"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const galleryRooms = [
  {
    id: "sala-1",
    label: "Sala 1",
    images: [
      "/assets/img/salas/sala12.jfif",
      "/assets/img/salas/sala1-nova-varanda.jpg",
      "/assets/img/salas/sala1-nova-interna.jpg",
    ],
  },
  {
    id: "sala-2",
    label: "Sala 2",
    images: [
      "/assets/img/salas/sala2.jfif",
      "/assets/img/salas/sala21.jfif",
      "/assets/img/salas/sala2-nova-ampla.png",
      "/assets/img/salas/sala2-nova-mesa.png",
    ],
  },
  {
    id: "sala-3",
    label: "Sala 3",
    images: [
      "/assets/img/salas/sala31.jfif",
      "/assets/img/salas/sala3-nova-sofa.jpg",
      "/assets/img/salas/sala3-nova-janela.png",
    ],
  },
];

const receptionImages = [
  {
    src: "/assets/img/recepcao/recepcao-principal.jpg",
    alt: "Recepção EquilibraMente com acesso às salas",
  },
  {
    src: "/assets/img/recepcao/recepcao-cafe.jpg",
    alt: "Apoio de café e espera na recepção EquilibraMente",
  },
  {
    src: "/assets/img/recepcao/recepcao-acesso.jpg",
    alt: "Ambiente de espera da recepção EquilibraMente",
  },
];

export function AboutGallery() {
  const [activeRoom, setActiveRoom] = useState(galleryRooms[0]);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isVideoOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isVideoOpen]);

  const videoModal = (
    <div className="reception-video-modal" role="dialog" aria-modal="true" aria-label="Video da recepção" onClick={() => setIsVideoOpen(false)}>
      <div className="reception-video-frame" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Fechar video" onClick={() => setIsVideoOpen(false)}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        <div className="reception-video-shell">
          <video controls playsInline poster="/assets/img/recepcao/recepcao-principal.jpg">
            <source src="/assets/img/recepcao/recepcao-tour.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="reception-showcase" aria-labelledby="reception-title">
        <div className="reception-copy">
          <span>Recepção</span>
          <h4 id="reception-title">Recepção integrada às salas</h4>
          <p>
            Um ambiente acolhedor para receber profissionais e pacientes com conforto, privacidade e acesso direto às salas.
          </p>
          <button className="reception-video-button" type="button" onClick={() => setIsVideoOpen(true)}>
            <i className="fa-solid fa-play" aria-hidden="true" />
            Ver recepção em vídeo
          </button>
        </div>
        <div className="reception-gallery" aria-label="Fotos da recepção EquilibraMente">
          <figure className="reception-gallery-main">
            <img src={receptionImages[0].src} alt={receptionImages[0].alt} />
          </figure>
          <div className="reception-gallery-side">
            {receptionImages.slice(1).map((image) => (
              <figure key={image.src}>
                <img src={image.src} alt={image.alt} />
              </figure>
            ))}
          </div>
        </div>
      </section>
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
      {isMounted && isVideoOpen ? createPortal(videoModal, document.body) : null}
    </>
  );
}
