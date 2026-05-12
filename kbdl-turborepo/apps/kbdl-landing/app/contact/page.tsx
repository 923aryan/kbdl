import { ContactForm } from "../../components/ui/contact-form";
import { DownloadSection } from "../../components/ui/download";
import ContactBanner from "../../components/ui/contact-banner";
// ==========================================
// 1. The Main Layout Section Component
// ==========================================
const ContactSection = ({ showSections = true }) => {
  return (
    <div className="w-full h-full">
      {showSections && (
        <>
          <ContactBanner />
          <DownloadSection />
        </>
      )}
      <section className="py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA]">
        <div className="max-w-300 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* LEFT COLUMN: Text & Info Cards */}
          <div className="flex flex-col">
            {/* Header Label */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-0.5 bg-primary"></span>
              <span className="text-primary text-xs font-bold tracking-widest uppercase">
                Get In Touch
              </span>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-[48px] font-extrabold text-navy leading-[1.15] mb-6">
              Let's Stop Daily Production <br className="hidden sm:block" />{" "}
              Loss
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-lg mb-12 max-w-md leading-relaxed">
              Fill out the form and our team will get back to you within 24
              hours. No long calls, no commitments.
            </p>

            {/* Info Cards Container */}
            <div className="flex flex-col gap-4">
              {/* Info Card 1: Address */}
              <div className="flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-pink-500"
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
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Corporate Address
                  </p>
                  <p className="text-navy font-bold text-[15px]">
                    Noida, Delhi NCR 201301, India
                  </p>
                </div>
              </div>

              {/* Info Card 2: WhatsApp */}
              <div className="flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    WhatsApp Support
                  </p>
                  <p className="text-navy font-bold text-[15px]">
                    Available for workers 24 Hours IST
                  </p>
                </div>
              </div>

              {/* Info Card 3: Response Time */}
              <div className="flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Response Time
                  </p>
                  <p className="text-navy font-bold text-[15px]">
                    Within 24 hours guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Form Component */}
          <div className="w-full">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactSection;
