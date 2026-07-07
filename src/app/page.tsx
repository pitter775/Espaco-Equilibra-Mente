import { RoomCard } from "@/components/site/RoomCard";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { mockSalas } from "@/lib/mock";

const especialistas = [
  {
    nome: "Rosiane Camelo",
    foto: "/assets/img/team/rose.jpeg",
    whatsapp: "5511986428238",
    texto:
      "Psicologa clinica com mais de 10 anos de experiencia na abordagem psicanalitica, fundadora do Espaco EquilibraMente.",
  },
  {
    nome: "Jicileia Oliveira",
    foto: "/assets/img/team/ji.jpg",
    whatsapp: "5511944751511",
    texto:
      "Psicologa clinica com mais de 9 anos de experiencia, pos-graduada em Neuropsicanalise e fundadora do Espaco EquilibraMente.",
  },
  {
    nome: "Cristina Azevedo",
    foto: "/assets/img/team/cristina.jpg",
    whatsapp: "5511915654166",
    texto:
      "Psicologa clinica com experiencia em Terapia Cognitivo-Comportamental, avaliacoes e intervencoes personalizadas.",
  },
  {
    nome: "Djane",
    foto: "/assets/img/team/djane.jpg",
    whatsapp: "5511972396456",
    texto:
      "Psicopedagoga e Neuropsicopedagoga especializada no atendimento a criancas, jovens e adultos.",
  },
];

export default async function Home() {
  const [salas, user] = await Promise.all([listSalas(), getCurrentUser()]);
  const salasVisiveis = salas.length ? salas : mockSalas;

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <section id="inicio" className="public-hero">
        <div className="public-hero-content">
          <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="public-hero-logo" />
          <p style={{ fontSize: 25 }}>Espaco Coworking para Profissionais da Saude</p>
          <p style={{ fontSize: 20 }}>Consolacao - SP <br />Rua Dona Antonia de Queiros</p>
          <a href="https://wa.me/5511979691269?text=Ola%2C%20gostaria%20de%20saber%20mais%20sobre%20as%20salas." target="_blank" className="about-btn">
            <img src="/assets/img/icons/whats.png" alt="" style={{ height: 20 }} /> Chamar no Whats
          </a>
        </div>
        <div className="slides">
          {["sala1.jfif", "sala2.jfif", "sala3.jfif", "sala4.jfif"].map((image, index) => (
            <div key={image} className={`slide ${index === 0 ? "active" : ""}`} style={{ backgroundImage: `url('/assets/img/salas/${image}')` }} />
          ))}
        </div>
      </section>

      <section id="about" className="public-rooms">
        <div className="container">
          <div className="contentg">
            <h3>Escolha <span>a melhor opcao</span></h3>
            <p>Espacos planejados para inspirar e proporcionar bem-estar, com conforto e praticidade.</p>
          </div>
          <div className="rooms-grid">
            {salasVisiveis.map((sala) => <RoomCard sala={sala} key={sala.id} />)}
          </div>
        </div>
      </section>

      <section id="quemsomos" className="public-about">
        <div className="container">
          <div className="contentg">
            <h3>Um pouco <span>Sobre nos</span></h3>
            <div className="about-text text-left mt-4">
              <p>Em um mundo cada vez mais acelerado e exigente, cuidar da saude emocional tornou-se uma prioridade. Foi com esse proposito que as psicologas clinicas Rosiane Camelo e Jicileia Oliveira fundaram o Espaco EquilibraMente: um ambiente pensado com carinho para acolher profissionais da saude mental e seus pacientes.</p>
              <p>O espaco oferece salas aconchegantes, silenciosas e bem equipadas, disponiveis para locacao por hora, proporcionando uma estrutura de qualidade para atendimentos presenciais ou online. Nosso objetivo e garantir um ambiente onde o bem-estar, a privacidade e a qualidade no atendimento caminhem lado a lado.</p>
              <p>Aqui, cada detalhe foi pensado para que voce possa cuidar de quem cuida.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="specialists-section">
        <div className="container">
          <div className="contentg">
            <h3>Nosso time de <span>Especialistas</span></h3>
            <p>Profissionais experientes comprometidas com cuidado emocional e qualidade no atendimento.</p>
          </div>
          {especialistas.map((item, index) => (
            <div className={`specialist-row ${index % 2 ? "reverse" : ""}`} key={item.nome}>
              <img src={item.foto} className="specialist-photo" alt={item.nome} />
              <div className="specialist-copy">
                <h4>{item.nome}</h4>
                <p>{item.texto}</p>
                <a href={`https://wa.me/${item.whatsapp}`} target="_blank" style={{ color: "inherit" }}>
                  <img src="/assets/img/icons/whats.png" alt="" style={{ height: 20, marginRight: 5 }} />
                  <strong>{item.whatsapp.replace("55", "+55 ")}</strong>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contato" style={{ background: "#fafafa", padding: "50px 0" }}>
        <div className="container text-center">
          <div className="contentg mb-4">
            <h3>Fale <span>Conosco</span></h3>
            <p>Entre em contato pelo WhatsApp ou acompanhe nosso Instagram.</p>
          </div>
          <a href="https://www.instagram.com/espaco_equilibramente" target="_blank" className="about-btn">
            @espaco_equilibramente
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
