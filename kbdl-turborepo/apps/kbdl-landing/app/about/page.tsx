import { Metadata } from "next";
import Image from "next/image";
import StructuredData from "../../components/seo/structured-data";
import HeroSection from "../../components/ui/hero";
import TimelineSection from "../../components/ui/timeline";
import { siteConfig } from "../../lib/seo-constants";
import ourPromise from "../../public/who-we-are-img.jpg";


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
                url: '/og-image.png',
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
        images: ['/og-image.png'],
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
        <div className="h-full w-full about-page">
            <StructuredData data={schema} />
            <HeroSection />
            {/* tailwind */}
            <section className="about-story bg-white px-[20px] md:px-[30px] font-['Poppins'] overflow-hidden">
                <div className="container-xxl max-w-[1370px] mx-auto py-[70px] flex flex-col lg:flex-row gap-[40px] lg:gap-[65px]">

                    {/* LEFT CONTENT */}
                    <div className="about-left w-full lg:max-w-[776px]">
                        <span className="about-tag text-[14px] font-bold text-[#0658C2] tracking-[1px] inline-block mb-[15px] uppercase">
                            ABOUT KAAM BADLO STORY
                        </span>

                        <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-[800] text-[#01122E] mb-[32px] max-w-[760px]">
                            Transforming India's Blue-Collar Ecosystem
                        </h2>

                        <p className="text-[18px] leading-[1.8] text-[#676767] mb-[25px] max-w-[820px] font-semibold">
                            <strong className="text-[#01122E]">Kaam Badlo</strong> is an on-demand blue-collar workforce
                            platform built to connect skilled and unskilled workers with
                            reliable job opportunities across India. From construction and
                            manufacturing to household and daily workforce needs, we make
                            hiring faster, safer, and more transparent for everyone.
                        </p>

                        <p className="text-[18px] leading-[1.8] text-[#676767] mb-[25px] max-w-[820px]">
                            Our mission is simple — remove dependency on middlemen, reduce
                            hiring chaos, and create better opportunities for workers while
                            helping businesses and households find trusted manpower instantly.
                        </p>

                        <p className="text-[18px] leading-[1.8] text-[#676767] mb-[25px] max-w-[820px]">
                            With verified workers, smart matching, transparent payments, and
                            location-based hiring, Kaam Badlo is building a modern workforce
                            ecosystem designed for Bharat.
                        </p>

                        {/* BOTTOM CARD */}
                        <div className="about-bottom-card mt-[40px] bg-white border border-[#d3d3d3] rounded-[32px] p-[25px] md:p-[30px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                            <h4 className="text-[20px] font-bold text-[#01122E] mb-[30px]">Whether you're:</h4>

                            <div className="about-list flex flex-col gap-[16px]">
                                {/* Worker Item */}
                                <div className="about-item flex items-center gap-[18px]">
                                    <span className="about-icon w-[38px] h-[38px] rounded-full bg-[#eef4ff] flex items-center justify-center text-[#0d5bd7] flex-shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <p className="m-0 text-[18px] text-[#01122E] font-medium leading-normal">A worker looking for better opportunities,</p>
                                </div>

                                {/* Business Item */}
                                <div className="about-item flex items-center gap-[18px]">
                                    <span className="about-icon w-[38px] h-[38px] rounded-full bg-[#eef4ff] flex items-center justify-center text-[#0d5bd7] flex-shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <p className="m-0 text-[18px] text-[#01122E] font-medium leading-normal">A business hiring at scale,</p>
                                </div>

                                {/* Household Item */}
                                <div className="about-item flex items-center gap-[18px]">
                                    <span className="about-icon w-[38px] h-[38px] rounded-full bg-[#eef4ff] flex items-center justify-center text-[#0d5bd7] flex-shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <p className="m-0 text-[18px] text-[#01122E] font-medium leading-normal">Or a household searching for trusted skilled help,</p>
                                </div>
                            </div>

                            <p className="aims mt-[25px] text-[#0658C2] text-[18px] leading-[1.5] font-bold mb-0">
                                Kaam Badlo aims to make the entire process simple, reliable, and accessible.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT CARD: Core Values */}
                    <div className="about-right-card w-full lg:max-w-[536px] h-fit bg-white rounded-[40px] p-[30px] md:p-[40px] border border-[#d3d3d3] shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
                        <h3 className="text-[24px] text-[#01122E] mb-[40px] font-[800]">Our Core Values</h3>

                        <div className="flex flex-col gap-[32px]">
                            {/* Value: Trust */}
                            <div className="value-item flex gap-[20px]">
                                <div className="value-icon w-[58px] h-[58px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#ebf9ef] text-[#15b44a]">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22C12 22 20 18 20 10V5L12 2L4 5V10C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="value-content">
                                    <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">Trust & Transparency</h5>
                                    <p className="text-[14px] text-[#676767] leading-[1.5]">
                                        Every worker is background checked. Every transaction is clear. No hidden fees or middleman cuts.
                                    </p>
                                </div>
                            </div>

                            {/* Value: Dignity */}
                            <div className="value-item flex gap-[20px]">
                                <div className="value-icon w-[58px] h-[58px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#fff2e8] text-[#ff6b00]">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 21C12 21 4 16 4 9.5C4 6.5 6.5 4 9.5 4C11.3 4 12.8 4.9 13.5 6.2C14.2 4.9 15.7 4 17.5 4C20.5 4 23 6.5 23 9.5C23 16 15 21 15 21H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="value-content">
                                    <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">Dignity of Labor</h5>
                                    <p className="text-[14px] text-[#676767] leading-[1.5]">
                                        We treat our blue-collar workforce with the exact same respect as white-collar professionals.
                                    </p>
                                </div>
                            </div>

                            {/* Value: Speed */}
                            <div className="value-item flex gap-[20px]">
                                <div className="value-icon w-[58px] h-[58px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#f4ebff] text-[#9333ea]">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="value-content">
                                    <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">Speed & Efficiency</h5>
                                    <p className="text-[14px] text-[#676767] leading-[1.5]">
                                        Time is money. Our technology ensures you find the right match in under 30 minutes.
                                    </p>
                                </div>
                            </div>

                            {/* Value: Bharat */}
                            <div className="value-item flex gap-[20px]">
                                <div className="value-icon w-[58px] h-[58px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#eaf2ff] text-[#2563eb]">
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M3 12H21" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 3C15 6 16 9 16 12C16 15 15 18 12 21" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 3C9 6 8 9 8 12C8 15 9 18 12 21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="value-content">
                                    <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">Built for Bharat</h5>
                                    <p className="text-[14px] text-[#676767] leading-[1.5]">
                                        Designed specifically for the unique needs and scale of the Indian workforce ecosystem.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="who-we-are bg-white px-[30px] py-[70px] max-[992px]:px-[20px] font-['Poppins']">
                <div className="container-xxl max-w-[1370px] mx-auto flex items-center gap-[65px] max-[992px]:flex-col">

                    {/* LEFT */}
                    <div className="who-left max-w-[650px] w-full max-[992px]:max-w-none">
                        <span className="who-tag text-[14px] font-bold text-[#0658C2] tracking-[1px] inline-block mb-[15px]">
                            WHO WE ARE
                        </span>

                        <h2 className="text-[40px] leading-[1.1] font-extrabold text-[#01122E] mb-[32px] max-w-[620px]">
                            Bridging the Gap Between Talent and Opportunity
                        </h2>

                        <p className="text-[18px] leading-[1.7] text-[#676767] mb-[25px] max-w-[620px]">
                            From construction and manufacturing to household and daily workforce
                            needs, we make hiring faster, safer, and more transparent for everyone.
                        </p>

                        {/* QUOTE CARD */}
                        <div className="quote-card relative bg-[#f4f8ff] border border-[#dbe7ff] rounded-[28px] overflow-hidden my-[40px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                            <div className="quote-line absolute left-0 top-0 w-[6px] h-full bg-[#0658C2]"></div>
                            <div className="quote-content relative p-[40px_35px]">
                                <h4 className="text-[20px] leading-[1.7] italic text-[#01122E] font-bold max-w-[540px]">
                                    “Our mission is simple — remove dependency on
                                    middlemen, reduce hiring chaos, and create better
                                    opportunities for workers while helping businesses and
                                    households find trusted manpower instantly.”
                                </h4>
                                <span className="quote-icon absolute right-[30px] top-[25px] text-[70px] text-[#c8dafc] opacity-50 leading-[1] pointer-events-none">
                                    ❞
                                </span>
                            </div>
                        </div>

                        <p className="bottom-text text-[18px] leading-[1.7] text-[#676767] mb-0 max-w-[620px]">
                            With verified workers, smart matching, transparent payments, and
                            location-based hiring, Kaam Badlo is building a modern workforce
                            ecosystem designed for Bharat.
                        </p>
                    </div>

                    {/* RIGHT */}
                    <div className="who-right-card max-w-[660px] w-full bg-white rounded-[40px] p-[40px] border border-[#d3d3d3] shadow-[0_8px_25px_rgba(0,0,0,0.05)] max-[992px]:max-w-none max-[768px]:p-[30px]">
                        <h3 className="text-[24px] text-center text-[#01122E] font-extrabold mb-[35px]">
                            A Platform Built for Everyone
                        </h3>

                        {/* ITEM: Workers */}
                        <div className="who-item flex gap-[20px] items-start p-[24px] rounded-[28px] border border-[#d3d3d3] mb-[22px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                            <div className="who-icon w-[58px] h-[58px] rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 19H18" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M8 19V10" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M16 19V10" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M4 10H20" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M12 5L20 10H4L12 5Z" stroke="#0D5BD7" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="who-content">
                                <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">For Workers</h5>
                                <p className="text-[14px] leading-[1.7] text-[#676767]">
                                    Looking for better opportunities, fair wages, and the dignity
                                    of labor they deserve.
                                </p>
                            </div>
                        </div>

                        {/* ITEM: Businesses */}
                        <div className="who-item flex gap-[20px] items-start p-[24px] rounded-[28px] border border-[#d3d3d3] mb-[22px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                            <div className="who-icon w-[58px] h-[58px] rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <rect x="4" y="7" width="7" height="13" rx="1" stroke="#0D5BD7" strokeWidth="2" />
                                    <rect x="13" y="4" width="7" height="16" rx="1" stroke="#0D5BD7" strokeWidth="2" />
                                    <path d="M7 10H8" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M16 8H17" stroke="#0D5BD7" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="who-content">
                                <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">For Businesses</h5>
                                <p className="text-[14px] leading-[1.7] text-[#676767]">
                                    Hiring at scale with a need for verified, reliable, and skilled workers instantly.
                                </p>
                            </div>
                        </div>

                        {/* ITEM: Households */}
                        <div className="who-item flex gap-[20px] items-start p-[24px] rounded-[28px] border border-[#d3d3d3] mb-[22px] shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                            <div className="who-icon w-[58px] h-[58px] rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 10L12 4L20 10V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V10Z" stroke="#0D5BD7" strokeWidth="2" strokeLinejoin="round" />
                                    <path d="M9 20V13H15V20" stroke="#0D5BD7" strokeWidth="2" />
                                </svg>
                            </div>
                            <div className="who-content">
                                <h5 className="text-[18px] font-bold text-[#01122E] mb-[8px]">For Households</h5>
                                <p className="text-[14px] leading-[1.7] text-[#676767]">
                                    Searching for trusted, skilled help for daily needs without the usual hiring chaos.
                                </p>
                            </div>
                        </div>

                        <div className="who-bottom-btn w-fit mx-auto mt-[10px] bg-[#eef4ff] text-[#0658C2] py-[14px] px-[24px] rounded-full text-[16px] font-bold text-center">
                            Making the entire process simple, reliable, and accessible.
                        </div>
                    </div>
                </div>
            </section>
            {/* OUR PROMISE SECTION */}
            <section className="our-promise bg-[#01122E] overflow-hidden px-[30px] py-[100px] max-[1200px]:px-[20px] font-['Poppins']">
                <div className="container-xxl max-w-[1370px] mx-auto flex items-center justify-between gap-[60px] max-[1200px]:flex-col">

                    {/* LEFT CONTENT */}
                    <div className="promise-left max-w-[620px] w-full max-[1200px]:max-w-none">
                        <span className="promise-tag text-[14px] font-bold text-[#0658C2] tracking-[1px] inline-block mb-[20px]">
                            OUR PROMISE
                        </span>

                        <h2 className="text-white text-[48px] leading-[1.08] mb-[35px] font-extrabold max-[768px]:text-[36px]">
                            Empowering India's
                            <br />
                            Blue-Collar <span className="text-[#0658C2]">Workforce</span>
                        </h2>

                        <p className="text-[18px] leading-[1.8] text-[rgba(255,255,255,0.7)] mb-[28px]">
                            To eliminate production downtime caused by worker absenteeism across
                            Indian manufacturing — giving every factory a verified, skill-matched
                            replacement worker in under 30 minutes, and giving every blue-collar
                            worker a digital identity they can carry for life.
                        </p>

                        <p className="text-[18px] leading-[1.8] text-[rgba(255,255,255,0.7)] mb-[28px]">
                            We believe India's blue-collar workforce — 450 million strong —
                            deserves the same dignity, visibility and opportunity that technology
                            gives to white-collar professionals. The{" "}
                            <span className="text-[#0658C2] font-semibold">
                                Karigari Skill Card
                            </span>{" "}
                            is our promise to every worker on our platform.
                        </p>
                    </div>

                    {/* RIGHT IMAGE */}
                    {/* RIGHT IMAGE & STATS CONTAINER */}
                    <div className="promise-right max-w-[660px] w-full max-[1200px]:max-w-none flex justify-center">

                        {/* Parent container: Use flex-col on mobile to stack stats below the image naturally */}
                        <div className="relative w-full flex flex-col items-center">

                            {/* Image wrapper: Using aspect-ratio for better mobile scaling */}
                            <div className="relative w-full aspect-[4/5] sm:aspect-square md:h-[600px] overflow-hidden rounded-[24px] sm:rounded-[30px] shadow-2xl">
                                <Image
                                    src={ourPromise}
                                    alt="Skilled blue-collar engineer"
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            </div>

                            {/* STATS CONTAINER: 
            - Stacks vertically or in a grid on mobile (mt-6)
            - Becomes absolute/floating only on large screens (lg:absolute)
        */}
                            <div className="promise-stats 
            mt-6 lg:mt-0 
            relative lg:absolute 
            lg:bottom-[-45px] lg:left-1/2 lg:-translate-x-1/2 
            grid grid-cols-1 sm:grid-cols-3 lg:flex 
            gap-4 sm:gap-6 lg:gap-[18px] 
            w-full sm:w-auto px-4 sm:px-0">

                                {/* STAT: Verified */}
                                <div className="stat-card w-full sm:w-[185px] backdrop-blur-[18px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] rounded-[24px] p-5 lg:p-[22px] shadow-xl flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-[#eaf2ff] shrink-0">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <h4 className="text-white text-xl font-bold">100%</h4>
                                    </div>
                                    <h5 className="text-white text-base font-semibold mb-1">Verified</h5>
                                    <p className="text-xs text-[rgba(255,255,255,0.6)] leading-tight">Background checked</p>
                                </div>

                                {/* STAT: Replacement */}
                                <div className="stat-card w-full sm:w-[185px] backdrop-blur-[18px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] rounded-[24px] p-5 lg:p-[22px] shadow-xl flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-[#fbbc05] shrink-0">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                                        </div>
                                        <h4 className="text-white text-xl font-bold">30 Min</h4>
                                    </div>
                                    <h5 className="text-white text-base font-semibold mb-1">Speed</h5>
                                    <p className="text-xs text-[rgba(255,255,255,0.6)] leading-tight">Rapid replacement</p>
                                </div>

                                {/* STAT: Downtime */}
                                <div className="stat-card w-full sm:w-[185px] backdrop-blur-[18px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] rounded-[24px] p-5 lg:p-[22px] shadow-xl flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-[#ebf9ef] shrink-0">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#15b44a" strokeWidth="2.5" strokeLinecap="round" /></svg>
                                        </div>
                                        <h4 className="text-white text-xl font-bold">Zero</h4>
                                    </div>
                                    <h5 className="text-white text-base font-semibold mb-1">Downtime</h5>
                                    <p className="text-xs text-[rgba(255,255,255,0.6)] leading-tight">Factory stays running</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}