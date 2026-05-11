import Image from "next/image";
import engineer from "../../public/engineer.png";
// import { Button } from '@repo/ui'; // You can use your UI button, but custom styled below to match exactly

export default function HeroSection() {
  return (
    // Hero section
    <section className="relative w-full min-h-175 md:min-h-150 flex flex-col justify-center items-center overflow-hidden bg-navy">
      {/* 1. SEO Optimized Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={engineer}
          alt="Skilled blue-collar engineer working in a factory"
          fill
          priority /* CRUCIAL: Tells Next.js to preload this immediately for LCP score */
          className="object-cover object-center opacity-90"
        />
        {/* Deep blue radial/linear gradient overlay to match the image tone */}
        <div className="absolute inset-0 bg-linear-to-r from-[#010C1E]/10 via-navy/80 to-navy/40"></div>
      </div>

      {/* 2. Main Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6 mx-auto mt-16">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-600/50 bg-[#ffffff10] backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-gray-200">
            India's 1st Job Portal for Daily Wage Workers
          </span>
        </div>

        {/* H1 Heading (Only ONE H1 per page for SEO) */}
        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white mb-6 leading-[1.15]">
          Find Skilled Workers & <br />
          <span className="text-primary">Swap Shifts Instantly</span>
        </h1>

        {/* Subheading / Description */}
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
          India's first platform enabling seamless{" "}
          <strong className="text-white font-semibold">
            Cross-Factory Shift Swaps
          </strong>{" "}
          and verified{" "}
          <strong className="text-white font-semibold">
            Karigari Digital Identities
          </strong>
          . Hire with speed, transparency, and confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0658C2] text-white rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Hire Workers <span aria-hidden="true">→</span>
          </button>

          <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Find Job <span aria-hidden="true">→</span>
          </button>

          <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-gray-500 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
            Find Shifts <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* TODO: Once app arrives uncomment this : 3. Floating App Store Badges (Sticky to right edge of screen) */}
      {/* <div className="flex fixed right-0 top-1/2 -translate-y-1/2 flex-col gap-3 sm:gap-4 z-50">
        <button className="flex items-center gap-2 sm:gap-3 bg-[#EBF3FF] hover:bg-white transition-colors text-navy px-3 py-2 sm:px-4 sm:py-3 rounded-l-xl shadow-lg border border-r-0 border-white/20 group">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-black"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.78-.04 1.94-.8 3.42-.69 1.14.04 2.37.52 3.1 1.5-2.61 1.54-2.18 5.25.5 6.27-.64 1.77-1.48 3.55-2.1 4.11zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <div className="text-left flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-medium leading-none text-gray-600 mb-1">
              Coming Soon on the
            </span>
            <span className="text-xs sm:text-sm font-bold leading-none text-black">
              App Store
            </span>
          </div>
        </button>

        <button className="flex items-center gap-2 sm:gap-3 bg-[#EBF3FF] hover:bg-white transition-colors text-navy px-3 py-2 sm:px-4 sm:py-3 rounded-l-xl shadow-lg border border-r-0 border-white/20">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.1 2.924C2.69 3.292 2.45 3.864 2.45 4.614V19.38C2.45 20.13 2.69 20.702 3.1 21.07L3.17 21.13L13.43 10.87V10.63L3.17 0.37L3.1 2.924Z"
              fill="#3FCC28"
            />
            <path
              d="M16.84 14.28L13.43 10.87V10.63L16.84 7.22L16.92 7.27L20.89 9.53C22.02 10.17 22.02 11.23 20.89 11.88L16.92 14.13L16.84 14.28Z"
              fill="#F9A826"
            />
            <path
              d="M16.92 14.13L13.43 10.63L3.1 20.96C3.52 21.41 4.22 21.47 5.06 20.99L16.92 14.13Z"
              fill="#EA4335"
            />
            <path
              d="M16.92 7.27L5.06 0.41C4.22-.07 3.52 0 3.1 0.44L13.43 10.77L16.92 7.27Z"
              fill="#4285F4"
            />
          </svg>
          <div className="text-left flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-medium leading-none text-gray-600 mb-1">
              Coming Soon on the
            </span>
            <span className="text-xs sm:text-sm font-bold leading-none text-black">
              Google Play
            </span>
          </div>
        </button>
      </div> */}
    </section>
  );
}
