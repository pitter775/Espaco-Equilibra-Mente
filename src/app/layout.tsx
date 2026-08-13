import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import {
  absoluteUrl,
  businessAddress,
  businessPhone,
  geoCoordinates,
  instagramUrl,
  siteDescription,
  siteKeywords,
  siteLegalName,
  siteName,
  siteUrl,
  socialImageUrl,
  whatsappUrl,
} from "@/lib/seo";
import { SiteScrollReset } from "@/components/site/SiteScrollReset";
import "./globals.css";

const googleAnalyticsId = "G-GRG4XXWLH3";
const shouldLoadGoogleAnalytics = process.env.NODE_ENV === "production";

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HealthAndBeautyBusiness"],
  name: siteName,
  alternateName: [
    siteLegalName,
    "Equilibra Mente Espaço",
    "Espaço Equilibramente",
    "Espaço EquilibraMente Coworking",
  ],
  description: siteDescription,
  url: siteUrl.toString(),
  image: socialImageUrl,
  logo: absoluteUrl("/assets/img/logoescuro.png"),
  telephone: businessPhone,
  sameAs: [instagramUrl, whatsappUrl],
  address: {
    "@type": "PostalAddress",
    ...businessAddress,
  },
  geo: {
    "@type": "GeoCoordinates",
    ...geoCoordinates,
  },
  areaServed: ["São Paulo", "Consolação", "Bela Vista", "Higienópolis", "Paulista"],
  priceRange: "$$",
  makesOffer: [
    {
      "@type": "Offer",
      name: "Aluguel de salas para atendimento por hora",
      itemOffered: {
        "@type": "Service",
        name: "Salas para psicólogos, terapeutas e profissionais da saúde",
      },
    },
  ],
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
    default: `${siteName} | Salas para profissionais da saúde`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
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
    title: `${siteName} | Salas para profissionais da saúde`,
    description: siteDescription,
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: "Recepção do Espaço Equilibra Mente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Salas para profissionais da saúde`,
    description: siteDescription,
    images: [socialImageUrl],
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
        {shouldLoadGoogleAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
        <SiteScrollReset />
        {children}
      </body>
    </html>
  );
}
