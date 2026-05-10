import type { JSX } from "react";

const features = [
  {
    title: "Find Jobs Near You",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5V4H2v16h5m10 0v-5a3 3 0 00-6 0v5m6 0H7"
        />
      </svg>
    ),
  },
  {
    title: "Swap Shifts",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7h11m0 0l-4-4m4 4l-4 4m9 6H9m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    title: "Trusted & Verified",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z"
        />
      </svg>
    ),
  },
  {
    title: "Chat & Hire Easily",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h8m-8 4h5m-9 6l2.5-2.5A2 2 0 015 17h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h.5L3 20z"
        />
      </svg>
    ),
  },
];

const bottomFeatures = [
  {
    title: "100% Safe",
    desc: "Verified profiles and secure platform",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z"
        />
      </svg>
    ),
  },
  {
    title: "Save Time",
    desc: "Quick hiring and shift management",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "All India Access",
    desc: "Find workers from your city",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "24×7 Support",
    desc: "We're here to help you anytime",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 10-12.728 12.728M15 10l-3 3m0 0l-3-3m3 3V7"
        />
      </svg>
    ),
  },
];

export default function PromotionSection(): JSX.Element {
  return (
    <section className="py-20 px-4 md:px-8 bg-[#F8FAFC] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex px-4 py-1.5 rounded-full bg-[#EAF2FF] text-[#0658C2] text-xs font-bold uppercase tracking-wide mb-6">
              Now On Mobile
            </div>

            {/* Heading */}
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#0F172A] mb-6">
              Download <br />
              <span className="text-[#0658C2]">Kaam Badlo</span> <br />
              App Today!
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              Find jobs, hire workers, swap shifts, and manage your workforce —
              all in your pocket.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-5 max-w-lg">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#0658C2] group-hover:bg-[#0658C2] group-hover:text-white transition-all">
                    {feature.icon}
                  </div>

                  <span className="text-sm font-medium text-[#0F172A] leading-snug">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Mobile Image - Hidden on desktop, will appear in bottom section */}
          <div className="relative flex justify-center">
            <div className="hidden lg:block absolute top-0 h-full border-l-2 border-dashed border-[#93C5FD]" />
          </div>

          {/* Right QR Section */}
          <div className="flex flex-col items-center">
            {/* QR Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-[380px]">
              {/* Easy To Download - Centered */}
              <div className="text-center">
                <div className="inline-flex px-4 py-1 rounded-full bg-[#EAF2FF] text-[#0658C2] text-xs font-bold uppercase tracking-wide mb-6">
                  Easy To Download
                </div>
              </div>

              <p className="text-gray-500 text-sm text-center mb-8">
                Scan the QR code or choose your store
              </p>

              <div className="flex items-center justify-center gap-6">
                {/* QR Code Image */}
                <div className="border-2 border-dashed border-gray-200 p-4 rounded-2xl">
                  <img
                    src="/qr.png"
                    alt="QR Code"
                    className="w-30 h-30 object-contain"
                  />
                </div>

                {/* Phone Icon */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[#EAF2FF] flex items-center justify-center text-[#0658C2] mb-3">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <p className="text-xs font-semibold text-[#0F172A] leading-relaxed">
                    Scan QR Code <br /> to download
                  </p>
                </div>
              </div>
            </div>

            {/* Store Buttons */}
            <div className="mt-8">
              <p className="text-xs font-bold text-black uppercase tracking-wide mb-4 text-center">
                Choose Your Store
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* App Store */}
                <button className="bg-black text-white rounded-xl px-5 py-3 flex items-center gap-3 hover:scale-105 transition-transform">
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.78-.04 1.94-.8 3.42-.69 1.14.04 2.37.52 3.1 1.5-2.61 1.54-2.18 5.25.5 6.27-.64 1.77-1.48 3.55-2.1 4.11zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>

                  <div className="text-left">
                    <p className="text-[10px]">Download on the</p>
                    <p className="font-semibold text-sm">App Store</p>
                  </div>
                </button>

                {/* Play Store */}
                <button className="bg-black text-white rounded-xl px-5 py-3 flex items-center gap-3 hover:scale-105 transition-transform">
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M3.1 2.924C2.69 3.292 2.45 3.864 2.45 4.614V19.38c0 .75.24 1.322.65 1.69l.07.06L13.43 10.87v-.24L3.17 0.37l-.07 2.554z"
                      fill="#3FCC28"
                    />
                    <path
                      d="M16.84 14.28L13.43 10.87v-.24l3.41-3.41.08.05 3.97 2.26c1.13.64 1.13 1.7 0 2.35l-3.97 2.26-.08.04z"
                      fill="#F9A826"
                    />
                    <path
                      d="M16.92 14.13L13.43 10.63 3.1 20.96c.42.45 1.12.51 1.96.03l11.86-6.86z"
                      fill="#EA4335"
                    />
                    <path
                      d="M16.92 7.27L5.06 0.41C4.22-.07 3.52 0 3.1 0.44L13.43 10.77l3.49-3.5z"
                      fill="#4285F4"
                    />
                  </svg>

                  <div className="text-left">
                    <p className="text-[10px]">Get it on</p>
                    <p className="font-semibold text-sm">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section with Mobile Image Behind It */}
        <div className="relative mt-20">
          {/* Mobile Image - Hidden on mobile, visible on desktop */}
          <div className="absolute inset-0 hidden md:flex justify-center items-center -top-130 z-0 pointer-events-none">
            <img
              src="/mobilescreen.png"
              alt="Kaam Badlo App Screen"
              className="w-[200px] md:w-[250px] lg:w-[280px] h-auto object-contain opacity-85"
            />
          </div>

          {/* Bottom Feature Bar */}
          <div className="relative z-10 bg-white/80 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {bottomFeatures.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 lg:border-r last:border-none border-gray-200 pr-4"
                >
                  <div className="text-[#0658C2] flex-shrink-0">
                    {item.icon}
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0F172A] mb-1">
                      {item.title}
                    </h4>

                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
