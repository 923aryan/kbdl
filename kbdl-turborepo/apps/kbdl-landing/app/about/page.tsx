import { Metadata } from "next";
import Image from "next/image";
import StructuredData from "../../components/seo/structured-data";
import HeroSection from "../../components/ui/hero";
import TimelineSection from "../../components/ui/timeline";
import { siteConfig } from "../../lib/seo-constants";
import ourPromise from "../../public/who-we-are-img.png";


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
            {/* <TimelineSection /> */}
            <section className="about-story">
                <div className="container-xxl">
                    {/* LEFT */}
                    <div className="about-left">
                        <span className="about-tag">
                            ABOUT KAAM BADLO STORY
                        </span>

                        <h2>
                            Transforming India's Blue-Collar Ecosystem
                        </h2>

                        <p className="about-bold">
                            <strong>Kaam Badlo</strong> is an on-demand blue-collar workforce
                            platform built to connect skilled and unskilled workers with
                            reliable job opportunities across India. From construction and
                            manufacturing to household and daily workforce needs, we make
                            hiring faster, safer, and more transparent for everyone.
                        </p>

                        <p>
                            Our mission is simple — remove dependency on middlemen, reduce
                            hiring chaos, and create better opportunities for workers while
                            helping businesses and households find trusted manpower instantly.
                        </p>

                        <p>
                            With verified workers, smart matching, transparent payments, and
                            location-based hiring, Kaam Badlo is building a modern workforce
                            ecosystem designed for Bharat.
                        </p>

                        {/* BOTTOM CARD */}
                        <div className="about-bottom-card">
                            <h4>Whether you're:</h4>

                            <div className="about-list">
                                <div className="about-item">
                                    <span className="about-icon">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="#0D5BD7"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>

                                    <p>A worker looking for better opportunities,</p>
                                </div>

                                <div className="about-item">
                                    <span className="about-icon">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="#0D5BD7"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>

                                    <p>A business hiring at scale,</p>
                                </div>

                                <div className="about-item">
                                    <span className="about-icon">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="#0D5BD7"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>

                                    <p>Or a household searching for trusted skilled help,</p>
                                </div>
                            </div>

                            <p className="aims">
                                Kaam Badlo aims to make the entire process simple, reliable, and
                                accessible.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="about-right-card">
                        <h3>Our Core Values</h3>

                        {/* ITEM */}
                        <div className="value-item">
                            <div className="value-icon green">
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
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

                            <div className="value-content">
                                <h5>Trust & Transparency</h5>
                                <p>
                                    Every worker is background checked. Every transaction is clear.
                                    No hidden fees or middleman cuts.
                                </p>
                            </div>
                        </div>

                        {/* ITEM */}
                        <div className="value-item">
                            <div className="value-icon orange">
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M12 21C12 21 4 16 4 9.5C4 6.5 6.5 4 9.5 4C11.3 4 12.8 4.9 13.5 6.2C14.2 4.9 15.7 4 17.5 4C20.5 4 23 6.5 23 9.5C23 16 15 21 15 21H12Z"
                                        stroke="#F97316"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <div className="value-content">
                                <h5>Dignity of Labor</h5>
                                <p>
                                    We treat our blue-collar workforce with the exact same respect
                                    as white-collar professionals.
                                </p>
                            </div>
                        </div>

                        {/* ITEM */}
                        <div className="value-item">
                            <div className="value-icon purple">
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                                        stroke="#9333EA"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <div className="value-content">
                                <h5>Speed & Efficiency</h5>
                                <p>
                                    Time is money. Our technology ensures you find the right match
                                    in under 30 minutes.
                                </p>
                            </div>
                        </div>

                        {/* ITEM */}
                        <div className="value-item">
                            <div className="value-icon blue">
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M3 12H21"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M12 3C15 6 16 9 16 12C16 15 15 18 12 21"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M12 3C9 6 8 9 8 12C8 15 9 18 12 21"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>

                            <div className="value-content">
                                <h5>Built for Bharat</h5>
                                <p>
                                    Designed specifically for the unique needs and scale of the
                                    Indian workforce ecosystem.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="who-we-are">
                <div className="container-xxl">

                    {/* LEFT */}
                    <div className="who-left">

                        <span className="who-tag">
                            WHO WE ARE
                        </span>

                        <h2>
                            Bridging the Gap Between Talent and Opportunity
                        </h2>

                        <p>
                            From construction and manufacturing to household and daily workforce
                            needs, we make hiring faster, safer, and more transparent for everyone.
                        </p>

                        {/* QUOTE CARD */}
                        <div className="quote-card">

                            <div className="quote-line"></div>

                            <div className="quote-content">

                                <h4>
                                    “Our mission is simple — remove dependency on
                                    middlemen, reduce hiring chaos, and create better
                                    opportunities for workers while helping businesses and
                                    households find trusted manpower instantly.”
                                </h4>

                                <span className="quote-icon">
                                    ❞
                                </span>

                            </div>

                        </div>

                        <p className="bottom-text">
                            With verified workers, smart matching, transparent payments, and
                            location-based hiring, Kaam Badlo is building a modern workforce
                            ecosystem designed for Bharat.
                        </p>

                    </div>

                    {/* RIGHT */}
                    <div className="who-right-card">

                        <h3>
                            A Platform Built for Everyone
                        </h3>

                        {/* ITEM */}
                        <div className="who-item">

                            <div className="who-icon">

                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M6 19H18"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M8 19V10"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M16 19V10"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M4 10H20"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M12 5L20 10H4L12 5Z"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                            </div>

                            <div className="who-content">
                                <h5>For Workers</h5>

                                <p>
                                    Looking for better opportunities, fair wages, and the dignity
                                    of labor they deserve.
                                </p>
                            </div>

                        </div>

                        {/* ITEM */}
                        <div className="who-item">

                            <div className="who-icon">

                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
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

                                    <path
                                        d="M7 10H8"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    <path
                                        d="M16 8H17"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>

                            </div>

                            <div className="who-content">
                                <h5>For Businesses</h5>

                                <p>
                                    Hiring at scale with a need for verified, reliable, and skilled
                                    workers instantly.
                                </p>
                            </div>

                        </div>

                        {/* ITEM */}
                        <div className="who-item">

                            <div className="who-icon">

                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M4 10L12 4L20 10V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V10Z"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                    />

                                    <path
                                        d="M9 20V13H15V20"
                                        stroke="#0D5BD7"
                                        strokeWidth="2"
                                    />
                                </svg>

                            </div>

                            <div className="who-content">
                                <h5>For Households</h5>

                                <p>
                                    Searching for trusted, skilled help for daily needs without
                                    the usual hiring chaos.
                                </p>
                            </div>

                        </div>

                        <div className="who-bottom-btn">
                            Making the entire process simple, reliable, and accessible.
                        </div>

                    </div>

                </div>
            </section>
            <section className="our-promise">
                <div className="container-xxl">

                    {/* LEFT CONTENT */}
                    <div className="promise-left">

                        <span className="promise-tag">
                            OUR PROMISE
                        </span>

                        <h2>
                            Empowering India's
                            <br />
                            Blue-Collar <span>Workforce</span>
                        </h2>

                        <p>
                            To eliminate production downtime caused by worker absenteeism across
                            Indian manufacturing — giving every factory a verified, skill-matched
                            replacement worker in under 30 minutes, and giving every blue-collar
                            worker a digital identity they can carry for life.
                        </p>

                        <p>
                            We believe India's blue-collar workforce — 450 million strong —
                            deserves the same dignity, visibility and opportunity that technology
                            gives to white-collar professionals. The{" "}
                            <span className="highlight">
                                Karigari Skill Card
                            </span>{" "}
                            is our promise to every worker on our platform.
                        </p>

                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="promise-right">

                        <div className="promise-image">
                            {/* 
                            <img
                                src="../../public/who-we-are-img.png"
                                alt="Workers"
                            /> */}
                            <Image
                                src={ourPromise}
                                alt="Skilled blue-collar engineer working in a factory"
                                className="our-promise-img"/* CRUCIAL: Tells Next.js to preload this immediately for LCP score */
                            />

                            {/* STATS */}
                            <div className="promise-stats">

                                {/* CARD */}
                                <div className="stat-card">

                                    <div className="stat-top">

                                        <div className="stat-icon blue">

                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M20 6L9 17L4 12"
                                                    stroke="white"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>

                                        </div>

                                        <h4>100%</h4>

                                    </div>

                                    <h5>
                                        Verified Workers
                                    </h5>

                                    <p>
                                        Background checked and verified
                                    </p>

                                </div>

                                {/* CARD */}
                                <div className="stat-card">

                                    <div className="stat-top">

                                        <div className="stat-icon yellow">

                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>

                                        </div>

                                        <h4>30 Min</h4>

                                    </div>

                                    <h5>
                                        Replacement Time
                                    </h5>

                                    <p>
                                        Get the right worker within 30 minutes
                                    </p>

                                </div>

                                {/* CARD */}
                                <div className="stat-card">

                                    <div className="stat-top">

                                        <div className="stat-icon green">

                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M20 6L9 17L4 12"
                                                    stroke="white"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>

                                        </div>

                                        <h4>Zero</h4>

                                    </div>

                                    <h5>
                                        Production Downtime
                                    </h5>

                                    <p>
                                        Keep your factory running, always
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            </section>
        </div>
    );
}