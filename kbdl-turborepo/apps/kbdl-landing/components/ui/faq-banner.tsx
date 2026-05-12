import Image from "next/image";
import engineer from "../../public/faq-hero-bg.png";

export default function FAQBanner() {
  return (
    <section className="relative w-full min-h-[520px] flex items-center justify-center overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src={engineer}
          alt="Kaam Badlo FAQ Banner"
          fill
          priority
          className="object-cover object-center"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-[#000000]/25" />

        {/* EXTRA GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/80 via-[#020817]/60 to-[#020817]/70" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        {/* TOP BADGE */}
        <div className="mb-8 inline-flex items-center rounded-full border border-[#3B82F6]/40 bg-[#2563EB]/10 px-5 py-2 backdrop-blur-md">
          <span className="text-[12px] md:text-[13px] font-semibold tracking-[2px] uppercase text-[#93C5FD]">
            Everything You Need To Know
          </span>
        </div>

        {/* HEADING */}
        <h1 className="text-white font-bold leading-[1.1] text-5xl md:text-6xl lg:text-[68px] max-w-4xl">
          Got Questions About
          <br />
          <span className="text-[#0658C2]">Kaam Badlo Services?</span>
        </h1>

        {/* DESCRIPTION */}
        <p className="mt-8 max-w-3xl text-base md:text-xl leading-8 text-[#D1D5DB]">
          Find quick answers about hiring workers, shift swaps, onboarding,
          payments, worker verification, and platform support.
        </p>
      </div>
    </section>
  );
}
