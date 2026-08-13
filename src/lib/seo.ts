export const siteOrigin = "https://www.espacoequilibramente.com.br";
export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || siteOrigin);
export const siteName = "Espaço Equilibra Mente";
export const siteLegalName = "Espaço EquilibraMente";
export const siteDescription =
  "Coworking para psicólogos, terapeutas e profissionais da saúde em São Paulo, com salas acolhedoras para atendimento por hora na Consolação.";
export const siteKeywords = [
  "Espaço Equilibra Mente",
  "Espaço EquilibraMente",
  "Equilibra Mente Espaço",
  "aluguel de salas para psicólogos",
  "sala para atendimento terapêutico",
  "sala para psicólogo por hora",
  "consultório por hora em São Paulo",
  "coworking para profissionais da saúde",
  "sala para terapia em São Paulo",
  "salas para terapeutas na Consolação",
];
export const socialImage = "/assets/img/seo/equilibra-mente-og.jpg";
export const socialImageUrl = new URL(socialImage, siteUrl).toString();
export const businessPhone = "+55 11 97969-1269";
export const whatsappUrl = "https://wa.me/5511979691269";
export const instagramUrl = "https://www.instagram.com/espaco_equilibramente";
export const businessAddress = {
  streetAddress: "Rua Dona Antônia de Queirós, 504 - cj 43",
  addressLocality: "São Paulo",
  addressRegion: "SP",
  postalCode: "01307-013",
  addressCountry: "BR",
};
export const geoCoordinates = {
  latitude: -23.5525,
  longitude: -46.6539,
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
