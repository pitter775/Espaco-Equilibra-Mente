import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationSelector } from "@/components/site/ReservationSelector";
import { AuthModalTrigger } from "@/components/site/AuthModalTrigger";
import { MobileRoomReservationBar } from "@/components/site/MobileRoomReservationBar";
import { RoomExpandableDetails } from "@/components/site/RoomExpandableDetails";
import { RoomDetailGallery } from "@/components/site/RoomDetailGallery";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { getSala } from "@/lib/data";
import { money } from "@/lib/format";
import { absoluteUrl, businessAddress, siteDescription, siteName, siteUrl } from "@/lib/seo";

const fallbackImage = "/assets/img/equilibramente.jpeg";

function stripHtml(value?: string | null) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicImageUrl(value?: string | null) {
  if (!value) return fallbackImage;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return fallbackImage;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const sala = await getSala(id);
  if (!sala) {
    return {
      title: "Sala não encontrada",
      robots: { index: false, follow: false },
    };
  }

  const description =
    stripHtml(sala.descricao).slice(0, 155) ||
    `Reserve ${sala.nome} no ${siteName}, coworking para profissionais da saúde em São Paulo.`;
  const image = publicImageUrl(sala.imagens?.find((item) => item.principal)?.imagem_base64 ?? sala.imagens?.[0]?.imagem_base64);
  const canonical = `/sala/${sala.id}`;
  const title = `${sala.nome} para atendimento por hora em São Paulo`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: new URL(canonical, siteUrl).toString(),
      title,
      description,
      images: [
        {
          url: image,
          width: image === fallbackImage ? 1600 : undefined,
          height: image === fallbackImage ? 900 : undefined,
          alt: `${sala.nome} - ${siteName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function roomStructuredData({
  sala,
  enderecoTexto,
  image,
}: {
  sala: NonNullable<Awaited<ReturnType<typeof getSala>>>;
  enderecoTexto: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: `${sala.nome} para atendimento por hora`,
    url: absoluteUrl(`/sala/${sala.id}`),
    price: Number(sala.valor ?? 0),
    priceCurrency: "BRL",
    availability: sala.status === "indisponivel" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    itemOffered: {
      "@type": "Room",
      name: sala.nome,
      description: stripHtml(sala.descricao) || siteDescription,
      image,
      floorSize: sala.metragem
        ? {
            "@type": "QuantitativeValue",
            value: Number(sala.metragem),
            unitText: "m²",
          }
        : undefined,
      containedInPlace: {
        "@type": "LocalBusiness",
        name: siteName,
        address: {
          "@type": "PostalAddress",
          ...businessAddress,
        },
      },
      address: enderecoTexto,
    },
  };
}

export default async function SalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sala, user] = await Promise.all([getSala(id), getCurrentUser()]);
  if (!sala) notFound();

  const imagens = sala.imagens?.length ? sala.imagens.map((item) => item.imagem_base64) : ["/assets/img/salas/sala1.jfif"];
  const endereco = sala.endereco ?? {
    rua: "Rua Dona Antônia de Queirós",
    numero: "504",
    complemento: "cj 43",
    bairro: "Consolação",
    cidade: "São Paulo",
    estado: "SP",
  };
  const complementoTexto = endereco.complemento ? ` - ${endereco.complemento}` : "";
  const enderecoTexto = `${endereco.rua}, ${endereco.numero}${complementoTexto}, ${endereco.bairro} - ${endereco.cidade}, ${endereco.estado}`;
  const enderecoMapa = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`;
  const indisponivel = sala.status === "indisponivel";
  const seoImage = publicImageUrl(sala.imagens?.find((item) => item.principal)?.imagem_base64 ?? sala.imagens?.[0]?.imagem_base64);

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <MobileRoomReservationBar
        salaId={sala.id}
        roomName={sala.nome}
        image={seoImage}
        price={Number(sala.valor)}
        hasUser={Boolean(user)}
        disabled={indisponivel}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roomStructuredData({ sala, enderecoTexto, image: seoImage })) }}
      />
      <main id="main" className="room-detail-page">
        <section className="sala-detalhes pb-0">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <RoomDetailGallery images={imagens} roomName={sala.nome} />
                {indisponivel && (
                  <div className="status-sala-banner indisponivel">
                    <span>Esta sala está temporariamente indisponível para novas reservas.</span>
                    <span>Você ainda pode consultar os detalhes.</span>
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
                  <RoomExpandableDetails description={sala.descricao} conveniences={sala.conveniencias} />
                </div>
                <div className="col-lg-4">
                  <div className="eq-card p-4 mb-3 room-price-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <p style={{ fontSize: 25, color: "#000" }}>{money(sala.valor)}/h</p>
                      <span><i className="fa-solid fa-ruler-combined mr-2" />{sala.metragem ?? "-"} m2</span>
                    </div>
                    {!user && !indisponivel && (
                      <AuthModalTrigger label="Horários disponíveis" className="eq-btn w-100" salaId={sala.id} />
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
                    <button className="eq-btn secondary w-100" type="button" disabled>Sala indisponível no momento</button>
                  ) : null}
                  <div className="eq-card p-4 mt-3 room-map-card">
                    <p><i className="fa-solid fa-map-marker-alt mr-2" />{enderecoTexto}</p>
                    <iframe width="100%" height="300" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps?q=${encodeURIComponent(enderecoMapa)}&output=embed`} />
                  </div>
                  <div className="eq-card p-4 mt-3 room-secure-card">
                    <p className="text-success mb-2"><i className="fas fa-lock mr-2" />Este é um ambiente seguro!</p>
                    <p className="mb-0">
                      Trabalhamos constantemente para proteger sua segurança e privacidade. <a href="/politica-privacidade">Saiba mais</a>
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
