import { Metadata } from "next";
import StructuredData from "../components/seo/structured-data";
import GetWorkSection from "../components/ui/geJob";
import HeroSection from "../components/ui/hero";
import ShiftSwapSection from "../components/ui/shift_swap";
import TimelineSection from "../components/ui/timeline";
import WhomWeServeSection from "../components/ui/whom-we-serve";
import { siteConfig } from "../lib/seo-constants";
// import { Button } from '@repo/ui';

export const metadata: Metadata = {
  title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,

  description:
    "Kaam Badlo helps factories and workers manage shift swaps, verified skill cards, and hyperlocal blue-collar hiring.",

  metadataBase: new URL(siteConfig.url),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,
    description:
      "Shift swaps, Karigari Skill Cards, and hyperlocal hiring for blue-collar workers and factories.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kaam Badlo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,
    description:
      "Shift swaps, verified worker profiles, and hiring tools for factories and workers.",
    images: ["/og-image.png"],
  },

  keywords: [
    "shift swap platform",
    "blue collar jobs",
    "factory workers",
    "workforce management",
    "Karigari card",
    "industrial hiring",
    "worker verification",
    "Noida jobs",
    "factory staffing",
  ],

  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],

  creator: siteConfig.name,
  publisher: siteConfig.name,

  icons: {
    icon: "/favicon.ico",
  },
};

export default function Home() {
  // Define Schema specific to the homepage
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.contactEmail,
      contactType: "customer support",
    },
    sameAs: [
      "https://www.linkedin.com/company/kaam-badlo/",
      "https://www.instagram.com/kaambadlo/",
    ],
  };

  return (
    <div className="h-full w-full">
      <StructuredData data={schema} />
      <HeroSection />
      <TimelineSection />
      <ShiftSwapSection />
      <GetWorkSection />
      <WhomWeServeSection />
    </div>
  );
}
