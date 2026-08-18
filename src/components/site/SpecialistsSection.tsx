"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SpecialistItem = {
  nome: string;
  foto: string;
  texto: string;
  registro?: string;
  whatsapp?: string;
  linkedin?: string;
};

function specialistId(name: string) {
  return `especialista-${name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^55/, "");
  if (digits.length !== 11) return value;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function SpecialistsSection({ especialistas }: { especialistas: SpecialistItem[] }) {
  const [activeId, setActiveId] = useState(() => specialistId(especialistas[0]?.nome ?? ""));
  const navRef = useRef<HTMLElement | null>(null);
  const ids = useMemo(() => especialistas.map((item) => specialistId(item.nome)), [especialistas]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const updateActive = () => {
      const viewportAnchor = window.innerHeight * 0.38;
      const closest = elements
        .map((element) => ({ id: element.id, distance: Math.abs(element.getBoundingClientRect().top - viewportAnchor) }))
        .sort((a, b) => a.distance - b.distance)[0];

      if (closest) setActiveId(closest.id);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [ids]);

  useEffect(() => {
    const activeThumb = navRef.current?.querySelector<HTMLButtonElement>(`[data-specialist-id="${activeId}"]`);
    activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  function scrollToSpecialist(id: string) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="team" className="specialists-section">
      <div className="container">
        <div className="contentg">
          <h3>Nosso time de <span>Especialistas</span></h3>
          <p>Reunimos profissionais qualificados de diferentes áreas da saúde, comprometidos com um atendimento ético, humanizado e de excelência, respeitando as necessidades e particularidades de cada pessoa.</p>
        </div>
        <div className="specialists-layout">
          <nav ref={navRef} className="specialist-thumb-nav" aria-label="Navegar entre especialistas">
            {especialistas.map((item) => {
              const id = specialistId(item.nome);
              return (
                <button type="button" className={`specialist-thumb-link ${activeId === id ? "is-active" : ""}`} key={item.nome} data-specialist-id={id} aria-label={`Ir para ${item.nome}`} onClick={() => scrollToSpecialist(id)}>
                  <img src={item.foto} alt="" />
                  <span>{item.nome.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>
          <div className="specialists-list">
            {especialistas.map((item, index) => {
              const id = specialistId(item.nome);
              return (
                <div id={id} className={`specialist-row ${index % 2 ? "reverse" : ""}`} key={item.nome}>
                  <img src={item.foto} className="specialist-photo" alt={item.nome} />
                  <div className="specialist-copy">
                    <h4>{item.nome}</h4>
                    {item.registro ? <strong className="specialist-register">{item.registro}</strong> : null}
                    <p>{item.texto}</p>
                    <div className="specialist-actions">
                      {item.whatsapp ? (
                        <a href={`https://wa.me/${item.whatsapp}`} target="_blank" rel="noreferrer" className="specialist-contact specialist-phone" aria-label={`WhatsApp de ${item.nome}`}>
                          <img src="/assets/img/icons/whats.png" alt="" />
                          {formatPhone(item.whatsapp)}
                        </a>
                      ) : null}
                      {item.linkedin ? (
                        <a href={item.linkedin} target="_blank" rel="noreferrer" className="specialist-contact specialist-linkedin" aria-label={`LinkedIn de ${item.nome}`}>
                          <i className="fa-brands fa-linkedin-in" aria-hidden="true" />
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
