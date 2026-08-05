import { notFound } from "next/navigation";
import { ReservationSelector } from "@/components/site/ReservationSelector";
import { AuthModalTrigger } from "@/components/site/AuthModalTrigger";
import { RoomDetailGallery } from "@/components/site/RoomDetailGallery";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { money } from "@/lib/format";

export default async function SalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sala, user] = await Promise.all([getSala(id), getCurrentUser()]);
  if (!sala) notFound();

  const imagens = sala.imagens?.length ? sala.imagens.map((item) => item.imagem_base64) : ["/assets/img/salas/sala1.jfif"];
  const endereco = sala.endereco ?? {
    rua: "Rua Dona Antonia de Queiros",
    numero: "504",
    bairro: "Consolacao",
    cidade: "Sao Paulo",
    estado: "SP",
  };
  const enderecoTexto = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro} - ${endereco.cidade}, ${endereco.estado}`;
  const enderecoMapa = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`;
  const indisponivel = sala.status === "indisponivel";

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <main id="main" className="room-detail-page">
        <section className="sala-detalhes pb-0">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <RoomDetailGallery images={imagens} roomName={sala.nome} />
                {indisponivel && (
                  <div className="status-sala-banner indisponivel">
                    <span>Esta sala esta temporariamente indisponivel para novas reservas.</span>
                    <span>Voce ainda pode consultar os detalhes.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="room-detail-content-band">
            <div className="container">
              <div className="row">
                <div className="col-lg-8 mb-5 mt-3">
                  <div className="contentg room-detail-heading">
                    <h3>Sobre a <span>{sala.nome}</span></h3>
                  </div>
                  <div className="room-detail-copy" dangerouslySetInnerHTML={{ __html: sala.descricao ?? "" }} />
                  <hr className="room-detail-divider" />
                  <div className="room-conveniences">
                  {sala.conveniencias?.length ? sala.conveniencias.map((item) => (
                    <div className="eq-card room-convenience-card" key={item.id}>
                      <i className={`${item.icone ?? "fa fa-check"} mr-2`} style={{ color: "#76aa66" }} />
                      <span style={{ fontSize: 13, color: "#777" }}>{item.nome}</span>
                    </div>
                  )) : <p>Sem conveniencias cadastradas para esta sala.</p>}
                </div>
              </div>
              <div className="col-lg-4">
                <div className="eq-card p-4 mb-3 room-price-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <p style={{ fontSize: 25, color: "#000" }}>{money(sala.valor)}/h</p>
                    <span><i className="fa-solid fa-ruler-combined mr-2" />{sala.metragem ?? "-"} m2</span>
                  </div>
                  {!user && !indisponivel && (
                    <AuthModalTrigger label="Horarios disponiveis" className="eq-btn w-100" salaId={sala.id} />
                  )}
                </div>
                {user ? (
                  <ReservationSelector
                    salaId={sala.id}
                    valor={Number(sala.valor)}
                    userApproved={user.status_aprovacao === "aprovado" || user.tipo_usuario === "admin"}
                    disabled={indisponivel}
                  />
                ) : indisponivel ? (
                  <button className="eq-btn secondary w-100" type="button" disabled>Sala indisponivel no momento</button>
                ) : null}
                <div className="eq-card p-4 mt-3 room-map-card">
                  <p><i className="fa-solid fa-map-marker-alt mr-2" />{enderecoTexto}</p>
                  <iframe width="100%" height="300" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps?q=${encodeURIComponent(enderecoMapa)}&output=embed`} />
                </div>
                <div className="eq-card p-4 mt-3 room-secure-card">
                  <p className="text-success mb-2"><i className="fas fa-lock mr-2" />Este e um ambiente seguro!</p>
                  <p className="mb-0">
                    Trabalhamos constantemente para proteger sua seguranca e privacidade. <a href="/politica-privacidade">Saiba mais</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
