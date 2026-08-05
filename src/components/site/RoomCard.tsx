import Link from "next/link";
import type { Sala } from "@/lib/types";

export function RoomCard({ sala }: { sala: Sala }) {
  const image =
    (sala.imagens?.length ? [...sala.imagens] : [{ imagem_base64: "/assets/img/salas/sala1.jfif", principal: true }])
      .sort((a, b) => Number(Boolean(b.principal)) - Number(Boolean(a.principal)))
      .map((imagem) => imagem.imagem_base64)
      .find(Boolean) ?? "/assets/img/salas/sala1.jfif";
  const indisponivel = sala.status === "indisponivel";

  return (
    <div className={`room-card-public ${indisponivel ? "indisponivel" : ""}`}>
      <div className="room-image">
        <span className="room-image-slide active" style={{ backgroundImage: `url('${image}')` }} />
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
