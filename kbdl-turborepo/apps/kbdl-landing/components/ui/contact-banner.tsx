import Image from 'next/image';
import bannerImage from '../../public/contact-banner.png';

export default function ContactBanner() {
  return (
    <section className="relative w-full min-h-[420px] sm:min-h-[520px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-[#020817]">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bannerImage}
          alt="Kaam Badlo Contact Banner"
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
        <div className="absolute inset-0 bg-black/30" />

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/70 to-[#0057D9]/30" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl px-4 sm:px-6 mx-auto">
        {/* BADGE */}
        <div className="inline-flex items-center justify-center px-5 sm:px-7 py-3 rounded-full border border-[#0D6EFD]/40 bg-[#0A1D3A]/80 backdrop-blur-md shadow-[0_0_25px_rgba(13,110,253,0.15)] mb-6 sm:mb-8">
          <span className="text-[9px] sm:text-[11px] md:text-[12px] font-bold tracking-[3px] uppercase text-[#8DBDFF]">
            24×7 Support For Workers & Businesses
          </span>
        </div>

        {/* HEADING */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[56px] font-bold text-white leading-[1.1] mb-5 sm:mb-6 max-w-5xl">
          Connecting Businesses &
          <br />
          <span className="text-[#0D6EFD]">Workers Without Delays</span>
        </h1>

        {/* DESCRIPTION */}
        <p className="text-sm sm:text-lg md:text-xl text-[#D1D5DB] max-w-3xl leading-7 sm:leading-8 px-2">
          Have questions about hiring workers, onboarding, shift management, or partnerships? Our
          support team is ready to assist businesses and workers with fast and reliable solutions.
        </p>
      </div>
    </section>
  );
}
