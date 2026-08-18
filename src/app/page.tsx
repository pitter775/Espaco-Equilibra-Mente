import type { Metadata } from "next";
import { AboutGallery } from "@/components/site/AboutGallery";
import { PublicRooms } from "@/components/site/PublicRooms";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteMotion } from "@/components/site/SiteMotion";
import { SpecialistsSection, type SpecialistItem } from "@/components/site/SpecialistsSection";
import { getCurrentUser } from "@/lib/auth";
import { listSalas } from "@/lib/data";
import { absoluteUrl, businessAddress, siteDescription, siteKeywords, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Aluguel de salas para psicólogos e terapeutas em São Paulo",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  keywords: siteKeywords,
};

const especialistas: SpecialistItem[] = [
  {
    nome: "Rosiane Camelo",
    foto: "/assets/img/team/rose.jpeg",
    whatsapp: "5511986428238",
    linkedin: "https://www.linkedin.com/in/rosiane-camelo/",
    registro: "CRP: 06/134343",
    texto:
      "Psicóloga clínica com formação em Psicologia e Pós-Graduação em Terapia de Relacionamentos. Com mais de 10 anos de experiência na abordagem psicanalítica, é fundadora do Espaço EquilibraMente, um ambiente dedicado à saúde mental. Oferece atendimento personalizado e especializado em psicologia clínica, promovendo o bem-estar e o equilíbrio emocional de seus pacientes.",
  },
  {
    nome: "Jicileia Oliveira",
    foto: "/assets/img/team/ji.jpg",
    whatsapp: "5511944751511",
    texto:
      "Psicóloga clínica com mais de 9 anos de experiência, atuando com abordagem psicanalítica. Pós-graduada em Neuropsicanálise, integra conhecimentos da psicanálise e da neurociência para um cuidado mais profundo e individualizado. Especializada em prevenção ao suicídio, ansiedade e depressão. Fundadora do Espaço EquilibraMente, um ambiente voltado ao acolhimento e à saúde emocional com ética, escuta e sensibilidade.",
  },
  {
    nome: "Cristina Azevedo",
    foto: "/assets/img/team/cristina.jpg",
    texto:
      "Psicóloga Clínica com mais de 5 anos de experiência em Terapia Cognitivo-Comportamental. Pós-graduanda em Neuropsicologia. Trabalha com avaliações e intervenções personalizadas.",
  },
  {
    nome: "Djane",
    foto: "/assets/img/team/djane.jpg",
    texto:
      "Psicopedagoga e Neuropsicopedagoga especializada no atendimento a crianças, jovens e adultos com TDAH, TEA e dificuldades de aprendizagem. Oferece avaliação, intervenção e orientação educacional personalizada.",
  },
  {
    nome: "Giselle Abissamra",
    foto: "/assets/img/team/giselle-abissamra.png",
    registro: "CRP: 14008",
    texto:
      "Fonoaudióloga, graduada em Fonoaudiologia pela PUC-SP, com especializações em Motricidade Oral e Disfagia, Voz Profissional e Canto, Fala, Linguagem e Distúrbios de Aprendizagem. Atua no atendimento de crianças, jovens, adultos e idosos, oferecendo acompanhamento especializado de acordo com as necessidades de cada paciente.",
  },
  {
    nome: "Júlia Begnami Isioka",
    foto: "/assets/img/team/julia-begnami-isioka.jpg",
    registro: "CRP 06/223101",
    texto:
      "Psicóloga clínica com foco em Terapia Cognitivo-Comportamental, com atualizações em ansiedade, depressão, TDAH e TEA. Atua com acolhimento e intervenções personalizadas no atendimento de crianças, jovens, adultos e idosos.",
  },
];

const passos = [
  { icon: "/assets/img/icons/mesa.png", text: "Escolha uma das nossas salas disponíveis" },
  { icon: "/assets/img/icons/calendar.png", text: "Reserve os horários disponíveis" },
  { icon: "/assets/img/icons/cadastro.png", text: "Cadastre-se e pague com segurança" },
  { icon: "/assets/img/icons/mapa.png", text: "Vá até o consultório na data reservada" },
];

const profissionais = [
  { icon: "/assets/img/icons/pisicologo.png", label: "Psicólogos" },
  { icon: "/assets/img/icons/pisic.png", label: "Psiquiatras" },
  { icon: "/assets/img/icons/tera.png", label: "Terapeutas" },
  { icon: "/assets/img/icons/fisioterapia.png", label: "Fisioterapeutas" },
  { icon: "/assets/img/icons/nutricionista.png", label: "Nutricionistas" },
  { icon: "/assets/img/icons/medico.png", label: "Médicos de diversas especialidades" },
];

const perguntas = [
  {
    pergunta: "Como faço para reservar uma sala?",
    resposta: 'Para reservar uma sala, basta acessar nossa página, escolher a sala desejada e selecionar a opção "Reservar".',
  },
  {
    pergunta: "Quais são os métodos de pagamento aceitos?",
    resposta: "Aceitamos pagamentos via cartão de crédito, boleto bancário e transferência PIX.",
  },
  {
    pergunta: "Posso cancelar minha reserva?",
    resposta: "Sim, é possível cancelar sua reserva com até 24 horas de antecedência para reembolso total.",
  },
];

const shareText = encodeURIComponent(
  "Conheça o Espaço Equilibra Mente: salas acolhedoras para profissionais da saúde em São Paulo. https://www.espacoequilibramente.com.br/",
);

const depoimentos = [
  {
    nome: "Luiza Martins",
    cargo: "Nutricionista",
    texto:
      "A localização estratégica e o ambiente organizado me ajudam a fidelizar meus clientes. Recomendo para qualquer profissional da área da saúde.",
  },
  {
    nome: "Juliana Torres",
    cargo: "Psicopedagoga",
    texto:
      "As salas atendem perfeitamente às minhas necessidades. Conforto e privacidade para os atendimentos são pontos fortes do espaço.",
  },
  {
    nome: "Dr. Ricardo Almeida",
    cargo: "Psicólogo",
    texto:
      "As salas são perfeitas para atender meus pacientes. O ambiente é acolhedor e profissional, exatamente o que eu precisava para oferecer um serviço de qualidade.",
  },
];

function homeStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl("/"),
      inLanguage: "pt-BR",
      description: siteDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: perguntas.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.resposta,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Aluguel de salas para atendimento por hora",
      provider: {
        "@type": "LocalBusiness",
        name: siteName,
        address: {
          "@type": "PostalAddress",
          ...businessAddress,
        },
      },
      areaServed: "São Paulo",
      serviceType: "Coworking para profissionais da saúde",
      description: "Salas por hora para psicólogos, terapeutas, psiquiatras, nutricionistas, fisioterapeutas e profissionais da saúde.",
    },
  ];
}

export default async function Home() {
  const [salas, user] = await Promise.all([listSalas(), getCurrentUser()]);

  return (
    <div className="legacy-page">
      <SiteHeader user={user} />
      <SiteMotion />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData()) }}
      />
      <section id="inicio" className="public-hero">
        <div className="public-hero-content">
          <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" className="public-hero-logo" />
          <p style={{ fontSize: 25 }}>Espaço Coworking para Profissionais da Saúde</p>
          <p style={{ fontSize: 20 }}>
            Rua Dona Antônia de Queirós n. 504 - cj 43
            <br />
            Consolação - SP
          </p>
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
            <h3>Escolha <span>a melhor opção</span></h3>
            <p>Espaços planejados para inspirar e proporcionar bem-estar, com conforto e praticidade.</p>
          </div>
          <PublicRooms salas={salas} />
          {!salas.length && (
            <p className="rooms-empty">Nenhuma sala disponível no momento. Verifique a conexão com o Supabase.</p>
          )}
        </div>
      </section>

      <section id="comofunciona" className="how-section">
        <div className="container how-grid">
          <div className="how-title">
            <h2>Como funciona nossa plataforma <span>para alugar as salas.</span></h2>
          </div>
          <div className="steps-grid">
            {passos.map((passo) => (
              <div className="step-card" key={passo.text}>
                <img src={passo.icon} alt="" />
                <p>{passo.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="atendimento" className="audience-heading">
        <div className="container">
          <div className="contentg">
            <h3>Ofereça o melhor atendimento <span>para seus pacientes</span></h3>
          </div>
        </div>
      </section>

      <section id="profissionais" className="professionals-section">
        <div className="container professionals-wrap">
          <div className="professionals-image" />
          <div className="professionals-card">
            <p>Atenda seus clientes em um ambiente confortável, sofisticado e privado. Nosso espaço é ideal para profissionais liberais da área da saúde, incluindo:</p>
            <ul>
              {profissionais.map((item) => (
                <li key={item.label}>
                  <img src={item.icon} alt="" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="container">
          <div className="contentg">
            <h3>Algumas das perguntas<span> frequentes</span></h3>
          </div>
          <div className="faq-list">
            {perguntas.map((item) => (
              <details className="faq-item" key={item.pergunta}>
                <summary>{item.pergunta}<span>+</span></summary>
                <p>{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="quemsomos" className="public-about">
        <div className="container">
          <div className="contentg">
            <h3>Um pouco <span>Sobre nós</span></h3>
            <div className="about-text text-left mt-4">
              <p>Em um mundo cada vez mais acelerado e exigente, cuidar da saúde emocional tornou-se uma prioridade. Foi com esse propósito que as psicólogas clínicas <strong>Rosiane Camelo</strong> e <strong>Jicileia Oliveira</strong> fundaram o <strong>Espaço EquilibraMente</strong>, um ambiente pensado com carinho para acolher profissionais da saúde mental e seus pacientes.</p>
              <p>O Espaço oferece salas aconchegantes, silenciosas e bem equipadas, disponíveis para locação por hora, proporcionando uma estrutura de qualidade para atendimentos presenciais ou online. Nosso objetivo é garantir um ambiente onde o bem-estar, a privacidade e a qualidade no atendimento caminham lado a lado.</p>
              <p>Aqui, cada detalhe foi pensado para que você possa cuidar de quem cuida.</p>
            </div>
            <AboutGallery />
          </div>
        </div>
      </section>

      <section id="sobre" className="testimonials-section">
        <div className="container">
          <div className="contentg">
            <h3>O que dizem das <span> nossas salas</span></h3>
            <p>Nossos espaços foram cuidadosamente planejados para atender às necessidades de profissionais das mais diversas áreas, como psicólogos, terapeutas, coaches, e muitos outros. Veja o que alguns de nossos parceiros têm a dizer sobre suas experiências:</p>
          </div>
          <div className="testimonials-grid">
            {depoimentos.map((item) => (
              <article className="testimonial-card" key={item.nome}>
                <p><span>“</span>{item.texto}<span>”</span></p>
                <strong>{item.nome}</strong>
                <small>{item.cargo}</small>
              </article>
            ))}
          </div>
          <div className="testimonial-dots"><span /><span /></div>
        </div>
      </section>

      <SpecialistsSection especialistas={especialistas} />

      <section id="contato" className="contact-section">
        <div className="container text-center">
          <div className="contentg mb-4">
            <h3>Fale <span>Conosco</span></h3>
            <p>Entre em contato com nosso time através do WhatsApp ou siga nosso Instagram para acompanhar as novidades.</p>
          </div>
          <div className="contact-actions">
            <a href="https://wa.me/5511979691269" target="_blank" className="about-btn">
              <img src="/assets/img/icons/whats.png" alt="" style={{ height: 20 }} />
              Espaço - (11) 97969-1269
            </a>
            <a href="https://wa.me/5511986428238" target="_blank" className="about-btn">
              <img src="/assets/img/icons/whats.png" alt="" style={{ height: 20 }} />
              Rosiane - (11) 98642-8238
            </a>
            <a href="https://wa.me/5511944751511" target="_blank" className="about-btn">
              <img src="/assets/img/icons/whats.png" alt="" style={{ height: 20 }} />
              Jicileia - (11) 94475-1511
            </a>
            <a href="https://www.instagram.com/espaco_equilibramente" target="_blank" className="about-btn">
              <img src="/assets/img/icons/instagram.png" alt="" style={{ height: 18 }} />
              @espaco_equilibramente
            </a>
          </div>
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" className="contact-share-button">
            <img src="/assets/img/icons/whats.png" alt="" />
            Compartilhar site no WhatsApp
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
