import { Metadata } from 'next';
import Image from 'next/image';
import { DownloadSection } from '../../components/ui/download';
import { siteConfig } from '../../lib/seo-constants';
// import aboutUsHero from '../../public/aboutus-hero-bg.png';
import ourPromise from '../../public/who-we-are-img.jpg';
import HeroBanners from '../../components/ui/hero-banners';
export const metadata: Metadata = {
  title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,

  description:
    'Kaam Badlo helps factories and workers manage shift swaps, verified skill cards, and hyperlocal blue-collar hiring.',

  metadataBase: new URL(siteConfig.url),

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,
    description:
      'Shift swaps, Karigari Skill Cards, and hyperlocal hiring for blue-collar workers and factories.',
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
    title: `${siteConfig.name} | Workforce Management & Shift Swap Platform`,
    description:
      'Shift swaps, verified worker profiles, and hiring tools for factories and workers.',
    images: ['/favicon.ico'],
  },

  keywords: [
    'shift swap platform',
    'blue collar jobs',
    'factory workers',
    'workforce management',
    'Karigari card',
    'industrial hiring',
    'worker verification',
    'Noida jobs',
    'factory staffing',
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
    icon: '/favicon.ico',
  },
};

export default function AboutUs() {
  // Define Schema specific to the homepage
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contactEmail,
      contactType: 'customer support',
    },
    sameAs: siteConfig.socialLinks,
  };

  return (
    <div className="h-full w-full bg-white ">
      {/* <StructuredData data={schema} /> */}
      {/* <HeroSection /> */}
      <HeroBanners />
      {/* <TimelineSection /> */}
      <section className="bg-white py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8">
        <div className="max-w-350 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* LEFT */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold mb-6 w-max">
              ABOUT KAAM BADLO STORY
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6">
              Transforming India's Blue-Collar Ecosystem
            </h2>

            <p className="text-gray-700 text-lg font-semibold mb-4 leading-relaxed">
              <strong>Kaam Badlo</strong> is an on-demand blue-collar workforce platform built to
              connect skilled and unskilled workers with reliable job opportunities across India.
              From construction and manufacturing to household and daily workforce needs, we make
              hiring faster, safer, and more transparent for everyone.
            </p>

            <ul className="text-gray-600 text-lg mb-8 leading-relaxed list-disc pl-5 space-y-3 marker:text-blue-600">
              <li>
                <strong>Faster & Safer Hiring:</strong> For construction, manufacturing, household,
                and <strong>Daily Workforce</strong> needs.
              </li>
              <li>
                <strong>Zero Middlemen:</strong> Removing dependency to reduce hiring chaos.
              </li>
              <li>
                <strong>Instant Trust:</strong> Helping businesses and households find verified
                manpower instantly.
              </li>
              <li>
                <strong>Smart Ecosystem:</strong> Verified workers, smart matching, transparent
                payments, and location-based hiring.
              </li>
            </ul>

            {/* BOTTOM CARD */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h4 className="text-navy font-bold text-xl mb-4">Whether you're:</h4>

              <div className="flex flex-col gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#0D5BD7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <p className="text-gray-600 font-medium">
                    A worker looking for better opportunities,
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-blue-600 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#0D5BD7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <p className="text-gray-600 font-medium">A business hiring at scale,</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-blue-600 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#0D5BD7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <p className="text-gray-600 font-medium">
                    Or a household searching for trusted skilled help,
                  </p>
                </div>
              </div>

              <p className="text-blue-600 font-semibold">
                Kaam Badlo aims to make the entire process simple, reliable, and accessible.
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-center gap-4">
            <h3 className="text-3xl font-bold text-navy mb-4">Our Core Values</h3>

            {/* ITEM */}
            <div className="flex gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-green-50">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22C12 22 20 18 20 10V5L12 2L4 5V10C4 18 12 22 12 22Z"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="#16A34A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h5 className="text-xl font-bold text-navy mb-1.5">Trust & Transparency</h5>
                <p className="text-gray-500 leading-relaxed">
                  Every worker is background checked. Every transaction is clear. No hidden fees or
                  middleman cuts.
                </p>
              </div>
            </div>

            {/* ITEM */}
            <div className="flex gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-50">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21C12 21 4 16 4 9.5C4 6.5 6.5 4 9.5 4C11.3 4 12.8 4.9 13.5 6.2C14.2 4.9 15.7 4 17.5 4C20.5 4 23 6.5 23 9.5C23 16 15 21 15 21H12Z"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h5 className="text-xl font-bold text-navy mb-1.5">Dignity of Labor</h5>
                <p className="text-gray-500 leading-relaxed">
                  We treat our Blue-Collar Workforce with the exact same respect as white-collar
                  professionals.
                </p>
              </div>
            </div>

            {/* ITEM */}
            <div className="flex gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-50">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                    stroke="#9333EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h5 className="text-xl font-bold text-navy mb-1.5">Speed & Efficiency</h5>
                <p className="text-gray-500 leading-relaxed">
                  Time is money. Our technology ensures you find the right match in under 30
                  minutes.
                </p>
              </div>
            </div>

            {/* ITEM */}
            <div className="flex gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#2563EB" strokeWidth="2" />
                  <path d="M3 12H21" stroke="#2563EB" strokeWidth="2" />
                  <path
                    d="M12 3C15 6 16 9 16 12C16 15 15 18 12 21"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                  <path d="M12 3C9 6 8 9 8 12C8 15 9 18 12 21" stroke="#2563EB" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <h5 className="text-xl font-bold text-navy mb-1.5">Built for Bharat</h5>
                <p className="text-gray-500 leading-relaxed">
                  Designed specifically for the unique needs and scale of the Indian workforce
                  ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative w-full py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA] overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* LEFT */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold mb-6 w-max">
              WHO WE ARE
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6">
              Bridging the Gap Between Talent and Opportunity
            </h2>

            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              From construction and manufacturing to household and Daily Workforce needs, we make
              hiring faster, safer, and more transparent for everyone.
            </p>

            {/* QUOTE CARD */}
            <div className="relative pl-6 border-l-4 border-blue-600 mb-8 py-2">
              <span className="absolute -top-6 -left-3 text-7xl text-blue-100 opacity-50 -z-10 select-none">
                ❞
              </span>

              <h4 className="text-2xl font-medium text-navy italic leading-snug">
                “Our mission is simple — remove dependency on middlemen, reduce hiring chaos, and
                create better opportunities for workers while helping businesses and households find
                trusted manpower instantly.”
              </h4>
            </div>

            <p className="text-gray-500 text-lg leading-relaxed">
              With verified workers, smart matching, transparent payments, and location-based
              hiring, Kaam Badlo is building a modern workforce ecosystem designed for Bharat.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              A Platform Built for Everyone
            </h3>
            <div className="flex flex-col gap-8">
              {/* ITEM */}
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M6 19H18" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 19V10" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 19V10" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 10H20" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M12 5L20 10H4L12 5Z"
                      stroke="#0D5BD7"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h5 className="text-xl font-bold text-navy mb-2">For Workers</h5>

                  <p className="text-gray-500 leading-relaxed">
                    <strong>Every worker deserves dignity, stability, and opportunity.</strong>{' '}
                    Helping workers find better opportunities, fair wages, and the dignity they
                    deserve.
                  </p>
                </div>
              </div>

              {/* ITEM */}
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="4"
                      y="7"
                      width="7"
                      height="13"
                      rx="1"
                      stroke="#0D5BD7"
                      strokeWidth="2"
                    />

                    <rect
                      x="13"
                      y="4"
                      width="7"
                      height="16"
                      rx="1"
                      stroke="#0D5BD7"
                      strokeWidth="2"
                    />

                    <path d="M7 10H8" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />

                    <path d="M16 8H17" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div>
                  <h5 className="text-xl font-bold text-navy mb-2">For Businesses</h5>

                  <p className="text-gray-500 leading-relaxed">
                    Hiring at scale with a need for verified, reliable, and skilled workers
                    instantly.
                  </p>
                </div>
              </div>

              {/* ITEM */}
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 10L12 4L20 10V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V10Z"
                      stroke="#0D5BD7"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    <path d="M9 20V13H15V20" stroke="#0D5BD7" strokeWidth="2" />
                  </svg>
                </div>

                <div>
                  <h5 className="text-xl font-bold text-navy mb-2">For Households</h5>

                  <p className="text-gray-500 leading-relaxed">
                    Searching for trusted, skilled help for daily needs without the usual hiring
                    chaos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-4 bg-blue-50 text-blue-700 font-semibold rounded-xl text-center">
              Hire verified workers in under 30 minutes — without middlemen.
            </div>
          </div>
        </div>
      </section>
      <section className=" py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-navy overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-center text-white">
            {/* "OUR PROMISE" Text (No pill background, just text) */}
            <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">
              Our Promise
            </span>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.15]">
              Empowering India's
              <br />
              Blue-Collar <span className="text-primary">Workforce</span>
            </h2>

            {/* Paragraphs */}
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              To eliminate production downtime caused by worker absenteeism across Indian
              manufacturing — giving every factory a verified, skill-matched replacement worker in
              under 30 minutes, and giving every Blue-Collar worker a digital identity they can
              carry for life.
            </p>

            <p className="text-gray-400 text-lg leading-relaxed">
              We believe India's Blue-Collar Workforce — 450 million strong — deserves the same
              dignity, visibility and opportunity that technology gives to white-collar
              professionals. The{' '}
              <span className="font-semibold text-primary">Karigari Skill Card</span> is our promise
              to every worker on our platform.
            </p>
          </div>

          {/* RIGHT IMAGE & GLASS CARDS */}
          <div className="relative mt-8 lg:mt-0">
            {/* Image Container */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl z-0 w-full aspect-[4/3] sm:aspect-auto sm:min-h-[450px]">
              <Image
                src={ourPromise}
                alt="Skilled blue-collar workers smiling in a factory"
                fill
                className="object-cover object-center"
              />
            </div>

            {/* STATS CARDS (Overlapping with negative margin & Glass effect) */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-[95%] mx-auto -mt-16 sm:-mt-24">
              {/* CARD 1: 100% */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-start transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white">100%</h4>
                </div>
                <h5 className="font-semibold text-white text-[15px] mb-1">Verified Workers</h5>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Background checked and verified
                </p>
              </div>

              {/* CARD 2: 30 Min */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-start transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-500 text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white">30 Min</h4>
                </div>
                <h5 className="font-semibold text-white text-[15px] mb-1">Replacement Time</h5>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Get the right worker within 30 minutes
                </p>
              </div>

              {/* CARD 3: Zero */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-start transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6l-9.5 9.5-5-5L1 18"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 6h6v6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white">Zero</h4>
                </div>
                <h5 className="font-semibold text-white text-[15px] mb-1">Production Downtime</h5>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Keep your factory running, always
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <DownloadSection />
    </div>
  );
}
