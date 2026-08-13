"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthModalTrigger } from "./AuthModalTrigger";
import { money } from "@/lib/format";

type MobileRoomReservationBarProps = {
  salaId: number;
  roomName: string;
  image: string;
  price: number;
  hasUser: boolean;
  disabled: boolean;
};

export function MobileRoomReservationBar({
  salaId,
  roomName,
  image,
  price,
  hasUser,
  disabled,
}: MobileRoomReservationBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      if (window.innerWidth > 991) {
        setVisible(false);
        return;
      }

      const contentBand = document.querySelector(".room-detail-content-band");
      if (contentBand) {
        setVisible(contentBand.getBoundingClientRect().top <= 96);
        return;
      }

      setVisible(window.scrollY > 420);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  function goToAgenda() {
    document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={`mobile-room-cta ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <Link className="mobile-room-cta-back" href="/#about" aria-label="Voltar para outras salas">
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        <span>Salas</span>
      </Link>
      <span className="mobile-room-cta-media" aria-hidden="true" style={{ backgroundImage: `url('${image}')` }} />
      <div className="mobile-room-cta-copy">
        <strong>{roomName}</strong>
        <span>{money(price)}/h</span>
      </div>
      {disabled ? (
        <button className="mobile-room-cta-action is-disabled" type="button" disabled>
          Indisponível
        </button>
      ) : hasUser ? (
        <button className="mobile-room-cta-action" type="button" onClick={goToAgenda}>
          Reservar
        </button>
      ) : (
        <AuthModalTrigger label="Reservar" className="mobile-room-cta-action" salaId={salaId} />
      )}
    </div>
  );
}
