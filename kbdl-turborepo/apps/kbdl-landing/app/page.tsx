import { Metadata } from 'next';
import StructuredData from '../components/seo/structured-data';
import { DownloadSection } from '../components/ui/download';
import GetWorkSection from '../components/ui/geJob';
import HeroBanners from '../components/ui/hero-banners';
import ShiftSwapSection from '../components/ui/shift_swap';
import TimelineSection from '../components/ui/timeline';
import WhomWeServeSection from '../components/ui/whom-we-serve';
import { siteConfig } from '../lib/seo-constants';
import ContactSection from './contact/page';
// import { Button } from '@repo/ui';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,

  metadataBase: new URL(siteConfig.url),

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: '/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Kaam Badlo',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/favicon.ico'],
  },

  keywords: siteConfig.keywords,

  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],

  creator: siteConfig.name,
  publisher: siteConfig.name,

  icons: {
    icon: '/favicon.ico',
  },
};

export default function Home() {
  // Define Schema specific to the homepage
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        description: siteConfig.description,
        contactPoint: {
          '@type': 'ContactPoint',
          email: siteConfig.contactEmail,
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
        sameAs: siteConfig.socialLinks,
      },
      {
        '@type': 'WebSite',
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteConfig.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <div className="h-full w-full">
      <StructuredData data={schema} />
      <HeroBanners />
      <TimelineSection />
      <ShiftSwapSection />
      <GetWorkSection />
      <WhomWeServeSection />
      <DownloadSection />
      <ContactSection showSections={false} />
    </div>
  );
}
