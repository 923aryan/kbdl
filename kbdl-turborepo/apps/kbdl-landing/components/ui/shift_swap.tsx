'use client';

import { useEffect, useState } from 'react';

// Data structure for the steps
const steps = [
  {
    id: "01",
    title: "Worker Posts Shift",
    desc: "Worker opens app or WhatsApp, selects shift to give away — date, factory, skill, timing.",
    time: "2 mins",
    colorHex: "#0658C2",
    bgClass: "bg-[#EBF3FF]",
    textClass: "text-primary",
    icon: (
      <svg
        className="w-12 h-12 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 9l-3 3-3-3M12 12V4"
        />
      </svg>
    ),
  },
  {
    id: "02",
    title: "Auto-Match Within 10 km",
    desc: "System finds nearby workers with matching skills who've enabled 'Extra Shift Needed.'",
    time: "5 mins",
    colorHex: "#00A650",
    bgClass: "bg-[#E6F9EC]",
    textClass: "text-[#00A650]",
    icon: (
      <svg
        className="w-12 h-12 text-[#00A650]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v2m0 4h.01"
        />
      </svg>
    ),
  },
  {
    id: "03",
    title: "Replacement Gets Alert",
    desc: "Matched worker receives WhatsApp notification with shift details, pay, and factory info.",
    time: "5 mins",
    colorHex: "#FF6B00",
    bgClass: "bg-[#FFF0E6]",
    textClass: "text-[#FF6B00]",
    icon: (
      <svg
        className="w-12 h-12 text-[#FF6B00]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 00-9-9m-6 2.5A9 9 0 003 12"
        />
      </svg>
    ),
  },
  {
    id: "04",
    title: "HR Approves in 1 Click",
    desc: "Factory HR reviews replacement's Karigari Card – rating, verification, history and approves.",
    time: "15 mins",
    colorHex: "#9333EA",
    bgClass: "bg-[#F3E8FF]",
    textClass: "text-[#9333EA]",
    icon: (
      <svg
        className="w-12 h-12 text-[#9333EA]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12h-6m0 0a2 2 0 100-4 2 2 0 000 4z"
        />
      </svg>
    ),
  },
  {
    id: "05",
    title: "Swap Confirmed!",
    desc: "Both workers receive confirmation. Production line stays active.",
    time: "Instant Swap",
    colorHex: "#0D9488",
    bgClass: "bg-[#E0F2FE]",
    textClass: "text-[#0D9488]",
    icon: (
      <svg
        className="w-12 h-12 text-[#0D9488]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 10l3-3 3 3M7 14l3 3 3-3"
        />
      </svg>
    ),
  },
];

// Main timeline section component
export default function ShiftSwapSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % steps.length);
    }, 2500); // Change the active card every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-10 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-350 mx-auto flex flex-col items-center text-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold mb-6">
          <svg
            className="w-4 h-4"
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
          CORE FEATURE
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6">
          How Cross-Factory{" "}
          <span className="relative inline-block text-primary">
            Shift Swap
            <svg
              className="absolute w-[110%] h-4 -bottom-3 -left-[5%] text-primary"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M0,10 Q50,25 100,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>{" "}
          Works
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg max-w-2xl mb-16">
          From registration to hiring — a streamlined process{" "}
          <br className="hidden md:block" />
          designed for busy HR managers and factory supervisors.
        </p>

        {/* Timeline & Cards Wrapper */}
        <div className="relative w-full mb-16">
          {/* Dashed Line - Desktop only */}
          <div className="hidden lg:block absolute top-[20px] left-[10%] right-[10%] border-t-2 border-dashed border-gray-200 z-0" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4 relative z-10">
            {steps.map((step, index) => {
              const isActive = index === activeIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Number Circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-8 shadow-md"
                    style={{ backgroundColor: step.colorHex }}
                  >
                    {step.id}
                  </div>

                  {/* Card */}
                  <div className={`relative w-full max-w-70 lg:max-w-none bg-white rounded-2xl flex flex-col flex-grow text-center transition-all duration-300 cursor-pointer ${isActive
                      ? "border-2 border-[#FF6B00] shadow-xl -translate-y-1"
                      : "border border-gray-100 shadow-sm hover:border-2 hover:border-[#FF6B00] hover:shadow-lg hover:-translate-y-1"
                    }`}>
                    {/* "You are here" Badge for active step */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-bl-xl rounded-tr-xl shadow-md z-10">
                        You are<br />here
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6 flex flex-col grow items-center">
                      <div className="mb-4 h-16 flex items-center justify-center">
                        {step.icon}
                      </div>
                      <h3 className="text-navy font-bold text-lg mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        {step.desc}
                      </p>
                    </div>

                    {/* Bottom Time Bar */}
                    <div
                      className={`w-full py-3 rounded-b-xl flex justify-center items-center gap-1.5 font-semibold text-sm ${step.bgClass} ${step.textClass}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {step.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary CTA Button */}
        <button className="bg-primary text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
          Coming Soon
        </button>
      </div>
    </section>
  );
}
