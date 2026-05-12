import Image from "next/image";
import bannerImage from "../../public/contact-banner.png";

export default function ContactBanner() {
  return (
    <section className="relative w-full min-h-[320px] sm:min-h-[380px] lg:min-h-[450px] overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bannerImage}
          alt="Kaam Badlo Contact Banner"
          fill
          priority
          className="object-cover object-center"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-[#000000]/25" />

        {/* BLUE GLOW */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/65 to-[#0057D9]/30" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex items-center justify-center min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* BADGE */}
          <div className="inline-flex items-center rounded-full border border-[#3B82F6]/40 bg-[#2563EB]/10 px-4 py-2 sm:px-5 backdrop-blur-md mb-6 sm:mb-8">
            <span className="text-[9px] sm:text-[11px] md:text-[12px] font-semibold tracking-[1.5px] sm:tracking-[2px] uppercase text-[#93C5FD]">
              24×7 Support For Workers & Businesses
            </span>
          </div>

          {/* HEADING */}
          <h1 className="text-white font-bold leading-[1.1] text-3xl sm:text-5xl md:text-6xl lg:text-[68px] max-w-5xl mx-auto">
            Connecting Businesses &
            <br />
            <span className="text-[#0658C2]">Workers Without Delays</span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-5 sm:mt-8 max-w-3xl mx-auto text-sm sm:text-base md:text-xl leading-6 sm:leading-8 text-[#D1D5DB] px-2">
            Have questions about hiring, worker onboarding, or shift management?
            Our team is ready to help businesses and workers with fast and
            reliable support.
          </p>
        </div>
      </div>
    </section>
  );
}
