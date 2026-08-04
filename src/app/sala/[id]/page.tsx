import { notFound } from "next/navigation";
import { ReservationSelector } from "@/components/site/ReservationSelector";
import { AuthModalTrigger } from "@/components/site/AuthModalTrigger";
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
  const endereco = sala.endereco;
  const indisponivel = sala.status === "indisponivel";

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <main id="main" style={{ marginTop: 90 }}>
        <section className="sala-detalhes pb-0">
          <div className="container">
            <div className="row">
              <div className="col-lg-8">
                <img src={imagens[0]} className="img-fluid rounded w-100" style={{ maxHeight: 450, objectFit: "cover" }} alt={sala.nome} />
                <div className="row mt-2">
                  {imagens.slice(1, 5).map((imagem) => (
                    <div className="col-3" key={imagem}>
                      <img src={imagem} className="img-fluid rounded w-100" style={{ height: 90, objectFit: "cover" }} alt={sala.nome} />
                    </div>
                  ))}
                </div>
                <div className="contentg mt-4 text-left">
                  <h3>Sobre a <span>{sala.nome}</span></h3>
                </div>
                {indisponivel && (
                  <div className="alert alert-warning">Esta sala esta temporariamente indisponivel para novas reservas.</div>
                )}
                <div dangerouslySetInnerHTML={{ __html: sala.descricao ?? "" }} />
                <div className="d-flex flex-wrap mt-4">
                  {sala.conveniencias?.length ? sala.conveniencias.map((item) => (
                    <div className="eq-card m-2 p-2" key={item.id}>
                      <i className={`${item.icone ?? "fa fa-check"} mr-2`} style={{ color: "#76aa66" }} />
                      <span style={{ fontSize: 13, color: "#777" }}>{item.nome}</span>
                    </div>
                  )) : <p>Sem conveniencias cadastradas para esta sala.</p>}
                </div>
              </div>
              <div className="col-lg-4">
                <div className="eq-card p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <p style={{ fontSize: 25, color: "#000" }}>{money(sala.valor)}/h</p>
                    <span>{sala.metragem ?? "-"} m2</span>
                  </div>
                </div>
                {user ? (
                  <ReservationSelector
                    salaId={sala.id}
                    valor={Number(sala.valor)}
                    userApproved={user.status_aprovacao === "aprovado" || user.tipo_usuario === "admin"}
                    disabled={indisponivel}
                  />
                ) : (
                  <AuthModalTrigger label="Entrar para reservar" className="eq-btn w-100" salaId={sala.id} />
                )}
                {endereco && (
                  <div className="eq-card p-4 mt-3">
                    <p><i className="fa-solid fa-map-marker-alt mr-2" />{endereco.rua}, {endereco.numero}, {endereco.bairro} - {endereco.cidade}, {endereco.estado}</p>
                    <iframe width="100%" height="260" style={{ border: 0 }} loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(`${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`)}&output=embed`} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
