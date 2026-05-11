'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';

// Data structure for the steps to keep the JSX clean
const steps = [
  {
    id: '01',
    title: 'Register Factory',
    desc: 'Download the app or visit our web dashboard. Create your business profile in minutes.',
    time: '2 mins',
    colorHex: '#0658C2', // Blue
    bgClass: 'bg-[#EBF3FF]',
    textClass: 'text-primary',
    icon: (
      <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: '02',
    title: 'Create Project',
    desc: 'Set up a project — define the location, job role, and type of workers needed for your factory.',
    time: '5 mins',
    colorHex: '#00A650', // Green
    bgClass: 'bg-[#E6F9EC]',
    textClass: 'text-[#00A650]',
    icon: (
      <svg className="w-12 h-12 text-[#00A650]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: '03',
    title: 'Post Job Order',
    desc: 'Specify required skills, radio shift, experience level, salary, and number of candidates.',
    time: '5 mins',
    colorHex: '#FF6B00', // Orange (Active)
    bgClass: 'bg-[#FFF0E6]',
    textClass: 'text-[#FF6B00]',
    icon: (
      <svg className="w-12 h-12 text-[#FF6B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    id: '04',
    title: 'Review Applications',
    desc: 'Every application is screened. You can shortlist, check ratings, and verify candidates.',
    time: '15 mins',
    colorHex: '#9333EA', // Purple
    bgClass: 'bg-[#F3E8FF]',
    textClass: 'text-[#9333EA]',
    icon: (
      <svg className="w-12 h-12 text-[#9333EA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: '05',
    title: 'Interview & Hire',
    desc: 'Connect directly via WhatsApp. Interview and hire the best — all Instant Swap.',
    time: 'Instant Swap',
    colorHex: '#0D9488', // Teal
    bgClass: 'bg-[#E0F2FE]', // Using a light cyan/teal for the bg
    textClass: 'text-[#0D9488]',
    icon: (
      <svg className="w-12 h-12 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

export default function TimelineSection(): JSX.Element {
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          FACTORY-READY TALENT
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-6">
          Hire Blue-Collar Talent {' '}
          <span className="relative inline-block text-primary">
            Instantly
            {/* Curved Swoosh SVG */}
            <svg className="absolute w-[110%] h-4 -bottom-3 -left-[5%] text-primary" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,10 Q50,25 100,0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg max-w-2xl mb-16">
          From registration to hiring — a streamlined process <br className="hidden md:block" />
          designed for busy HR managers and factory supervisors.
        </p>

        {/* Timeline & Cards Wrapper */}
        <div className="relative w-full mb-16">

          {/* Dashed Line (Visible on Desktop only) */}
          <div className="hidden lg:block absolute top-[20px] left-[10%] right-[10%] border-t-2 border-dashed border-gray-200 z-0"></div>

          {/* Grid of Steps */}
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
                  <div className={`relative w-full max-w-[280px] lg:max-w-none bg-white rounded-2xl flex flex-col flex-grow text-center transition-all duration-300 cursor-pointer ${isActive
                      ? 'border-2 border-[#FF6B00] shadow-xl -translate-y-1'
                      : 'border border-gray-100 shadow-sm hover:-translate-y-1 hover:border-2 hover:border-[#FF6B00] hover:shadow-lg'
                    }`}>

                    {/* "You are here" Badge for active step */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-bl-xl rounded-tr-xl shadow-md z-10">
                        You are<br />here
                      </div>
                    )}

                    {/* Card Content Area */}
                    <div className="p-6 flex flex-col flex-grow items-center">
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

                    {/* Colored Bottom Bar */}
                    <div className={`w-full py-3 rounded-b-xl flex justify-center items-center gap-1.5 font-semibold text-sm ${step.bgClass} ${step.textClass}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <button className="bg-[#0658C2] text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mb-20">
          Coming Soon
        </button>

        {/* Bottom Trust/Features Footer */}
        <div className="w-full max-w-6xl border-t border-gray-100 md:pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            <TrustBadge
              icon="✓"
              title="Verified Candidates"
              desc="100% verified & reliable"
              colorClass="text-blue-600 bg-blue-50"
            />
            <TrustBadge
              icon="⚡"
              title="Fast & Reliable Process"
              desc="Save time, hire faster"
              colorClass="text-green-600 bg-green-50"
            />
            <TrustBadge
              icon="$"
              title="Zero Cost to Start"
              desc="Get started for free"
              colorClass="text-orange-600 bg-orange-50"
            />
            <TrustBadge
              icon="🎧"
              title="Dedicated Support"
              desc="We're here to help"
              colorClass="text-purple-600 bg-purple-50"
            />

          </div>
        </div>
      </div>
    </section>
  );
}

// Small helper component for the trust badges at the bottom
function TrustBadge({
  icon,
  title,
  desc,
  colorClass,
}: {
  icon: string;
  title: string;
  desc: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${colorClass}`}
      >
        {icon}
      </div>

      <div>
        <h4 className="text-navy font-bold text-sm mb-0.5">
          {title}
        </h4>

        <p className="text-gray-500 text-xs">
          {desc}
        </p>
      </div>
    </div>
  );
}