import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://espaco-equilibra-mente.vercel.app");
const siteName = "Espaco Equilibra Mente";
const siteDescription =
  "Coworking para psicologos, terapeutas e profissionais da saude em Sao Paulo, com salas acolhedoras para atendimento por hora.";
const socialImage = "/assets/img/equilibramente.jpeg";
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: siteName,
  description: siteDescription,
  url: siteUrl.toString(),
  image: new URL(socialImage, siteUrl).toString(),
  logo: new URL("/assets/img/logoescuro.png", siteUrl).toString(),
  telephone: "+55 11 97969-1269",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Dona Antonia de Queiros, 504",
    addressLocality: "Sao Paulo",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  areaServed: "Sao Paulo",
  priceRange: "$$",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: `${siteName} | Salas para profissionais da saude`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "aluguel de salas para psicologos",
    "sala para atendimento terapeutico",
    "coworking para profissionais da saude",
    "consultorio por hora",
    "sala para terapia em Sao Paulo",
    "Espaco Equilibra Mente",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "healthcare",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/assets/img/favicon.png",
    apple: "/assets/img/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName,
    title: `${siteName} | Salas para profissionais da saude`,
    description: siteDescription,
    images: [
      {
        url: socialImage,
        width: 1600,
        height: 900,
        alt: "Recepcao do Espaco Equilibra Mente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Salas para profissionais da saude`,
    description: siteDescription,
    images: [socialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "apple-mobile-web-app-title": siteName,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-full antialiased">
        <link rel="icon" href="/assets/img/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@100..900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/assets/vendor/icofont/icofont.min.css" rel="stylesheet" />
        <link href="/assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet" />
        <link href="/assets/css/style.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
