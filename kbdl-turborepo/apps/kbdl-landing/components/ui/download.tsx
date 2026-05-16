import Image from 'next/image';
import logo from '../../public/logo.png';
import { AppStoreButton } from './app-store';
import { MiniFeature } from './mini-feature';
import { TrustItem } from './trust-item';
export const DownloadSection = () => {
  return (
    <section className="relative w-full py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* Top Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-6 items-center mb-16">
          {/* LEFT COLUMN: Text & Mini Features */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black text-navy mb-4 leading-tight">
              Coming Soon <br className="hidden lg:block" />
              <span className="text-primary">Kaam Badlo</span> <br className="hidden lg:block" />
            </h2>

            <p className="text-gray-500 text-lg mb-10 max-w-md">
              Find jobs, hire workers, swap shifts, and manage your workforce – all in your pocket.
            </p>

            {/* 4 Mini Icons Grid */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 space-x-4">
              <MiniFeature
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                }
                text="Find Jobs Near You"
              />
              <MiniFeature
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                }
                text="Swap Shifts"
              />
              <MiniFeature
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                }
                text="Trusted & Verified"
              />
              <MiniFeature
                icon={
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                }
                text="Chat & Hire Easily"
              />
            </div>
          </div>

          {/* CENTER COLUMN: CSS Phone Mockup */}
          <div className="flex justify-center relative z-0">
            {/* The Phone Hardware Frame */}
            <div className="relative w-70 h-115 bg-navy border-[12px] border-black rounded-[45px] shadow-2xl overflow-hidden flex items-center justify-center translate-y-8">
              {/* The Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[25px] bg-black rounded-b-2xl z-20"></div>

              {/* Inner Screen Content */}
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-navy z-10">
                <Image
                  src={logo}
                  alt="Kaam Badlo Logo"
                  width={180}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Download Options */}
          <div className="flex flex-col items-center lg:items-end">
            {/* TODO: */}
            {/* 
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-[340px] w-full text-center mt-6 mb-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#EBF3FF] text-primary text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-blue-100 whitespace-nowrap">
                Easy To Download
              </div>

              <p className="text-gray-500 text-sm mb-6 mt-2">
                Scan the QR code or choose your store
              </p>

              <div className="flex items-center justify-center gap-6">
                <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl p-2 bg-gray-50 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-3 3h3v3h-3v-3zm3 3h3v3h-3v-3zm-3-6h3v3h-3v-3z" />
                  </svg>
                </div>

                <div className="w-[1px] h-16 bg-gray-200"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold text-navy leading-tight">Scan QR Code<br />to download</p>
                </div>
              </div>
            </div> */}

            {/* Store Buttons */}
            <div className="w-full max-w-85">
              <p className="text-navy font-bold text-sm text-center mb-4 tracking-wide">
                Coming Soon on App Store & Google Play
              </p>
              <div className="flex gap-3 justify-center">
                <AppStoreButton type="apple" />
                <AppStoreButton type="google" />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM TRUST BAR (Overlapping) */}
        {/* We use negative margin (lg:-mt-16) and relative z-20 to pull this bar UP over the phone mockup */}
        <div className="relative opacity-90 z-20 bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white p-6 lg:p-8 w-full max-w-6xl mx-auto lg:-mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <TrustItem
            icon={
              <path
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            }
            title="100% Safe"
            desc="Verified profiles and secure platform"
          />
          <TrustItem
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            }
            title="Save Time"
            desc="Quick hiring and shift management"
          />
          <TrustItem
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            }
            title="All India Access"
            desc="Jobs and workers from your city"
          />
          <TrustItem
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            } // Alternative 24x7 icon
            title="24×7 Support"
            desc="We're here to help you anytime"
          />
        </div>
      </div>
    </section>
  );
};
