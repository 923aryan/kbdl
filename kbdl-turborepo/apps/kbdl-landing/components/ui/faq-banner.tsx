import Image from 'next/image';
import engineer from '../../public/faq-hero-bg.png';

export default function FAQBanner() {
  return (
    <section className="relative w-full h-[420px] sm:h-[520px] lg:h-[600px] overflow-hidden bg-[#020817]">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src={engineer}
          alt="Kaam Badlo FAQ Banner"
          fill
          priority
          sizes="100vw"
          className="
            object-cover
            object-[78%_center]
            sm:object-center
          "
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/40" />

        {/* EXTRA GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/70 to-[#0057D9]/30" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center max-w-5xl px-4 sm:px-6 mx-auto">
        {/* TOP BADGE */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center rounded-full border border-[#0D6EFD]/50 bg-[#0A1A33]/80 px-6 sm:px-8 py-3 backdrop-blur-md shadow-[0_0_25px_rgba(13,110,253,0.15)]">
            <span className="text-[10px] sm:text-xs md:text-[13px] font-bold tracking-[3px] uppercase text-[#8DBBFF]">
              Everything You Need To Know
            </span>
          </div>
        </div>

        {/* HEADING */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[56px] font-bold text-white leading-[1.1] mb-5 sm:mb-6 max-w-5xl">
          Got Questions About
          <br />
          <span className="text-[#0D6EFD]">Kaam Badlo Services?</span>
        </h1>

        {/* DESCRIPTION */}
        <p className="text-sm sm:text-lg md:text-xl text-[#D1D5DB] max-w-3xl leading-7 sm:leading-8 px-2">
          Find quick answers about hiring workers, shift swaps, onboarding, payments, worker
          verification, and platform support.
        </p>
      </div>
    </section>
  );
}
