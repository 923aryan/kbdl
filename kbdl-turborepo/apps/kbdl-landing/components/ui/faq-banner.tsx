import Image from "next/image";
import engineer from "../../public/faq-hero-bg.png";

export default function FAQBanner() {
  return (
    <section className="relative w-full min-h-[420px] sm:min-h-[520px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-[#020817]">
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
        <div className="absolute inset-0 bg-black/30" />

        {/* EXTRA GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/70 to-[#0057D9]/30" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl px-4 sm:px-6 mx-auto">
        {/* TOP BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3B82F6]/40 bg-[#2563EB]/10 backdrop-blur-md mb-6 sm:mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>

          <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[#D6E8FF] tracking-[1px] uppercase">
            Everything You Need To Know
          </span>
        </div>

        {/* HEADING */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold text-white leading-[1.1] mb-5 sm:mb-6 max-w-5xl">
          Got Questions About
          <br />
          <span className="text-[#0D6EFD]">Kaam Badlo Services?</span>
        </h1>

        {/* DESCRIPTION */}
        <p className="text-sm sm:text-lg md:text-xl text-[#D1D5DB] max-w-3xl leading-7 sm:leading-8 px-2">
          Find quick answers about hiring workers, shift swaps, onboarding,
          payments, worker verification, and platform support.
        </p>
      </div>
    </section>
  );
}
