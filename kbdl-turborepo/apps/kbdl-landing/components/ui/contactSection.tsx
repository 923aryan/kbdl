import type { JSX } from "react";

export default function ContactSection(): JSX.Element {
  return (
    <section className="bg-[#F8FAFC] py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-16 items-start">
          {/* LEFT SIDE */}
          <div className="pt-6">
            {/* Small Label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-[#0658C2]" />
              <span className="text-[#0658C2] text-xs font-bold tracking-[3px] uppercase">
                Get In Touch
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-[42px] leading-[1.1] md:text-[56px] font-bold text-[#0B1736] max-w-xl mb-6">
              Let&apos;s Stop Production Loss.
            </h2>

            {/* Description */}
            <p className="text-[#6B7280] text-lg leading-8 max-w-lg mb-12">
              Fill out the form and our team will get back to you within 24
              hours. No long calls, no commitments.
            </p>

            {/* Info Cards */}
            <div className="space-y-5 max-w-xl">
              {/* Card 1 */}
              <div className="bg-white border border-gray-200 rounded-3xl px-6 py-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[11px] font-bold tracking-[2px] uppercase text-gray-400 mb-1">
                    Corporate Address
                  </p>

                  <p className="font-semibold text-[#0B1736]">
                    Noida, Delhi NCR 201301, India
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-gray-200 rounded-3xl px-6 py-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14l-4-4H5a2 2 0 01-2-2V5z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[11px] font-bold tracking-[2px] uppercase text-gray-400 mb-1">
                    Whatsapp Support
                  </p>

                  <p className="font-semibold text-[#0B1736]">
                    Available for workers 9am–9pm IST
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-200 rounded-3xl px-6 py-5 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[11px] font-bold tracking-[2px] uppercase text-gray-400 mb-1">
                    Response Time
                  </p>

                  <p className="font-semibold text-[#0B1736]">
                    Within 24 hours guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE FORM */}
          <div className="bg-white border border-gray-200 rounded-[32px] p-8 md:p-10 shadow-sm">
            <h3 className="text-3xl font-bold text-[#0B1736] mb-8">
              Send Us a Message
            </h3>

            <form className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-bold tracking-[1px] uppercase text-[#0B1736] mb-3">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full h-14 px-5 rounded-3xl border border-gray-200 outline-none focus:border-[#0658C2]"
                />
              </div>

              {/* Email + Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold tracking-[1px] uppercase text-[#0B1736] mb-3">
                    Email
                  </label>

                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full h-14 px-5 rounded-3xl border border-gray-200 outline-none focus:border-[#0658C2]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-[1px] uppercase text-[#0B1736] mb-3">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full h-14 px-5 rounded-3xl border border-gray-200 outline-none focus:border-[#0658C2]"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[12px] font-bold tracking-[1px] uppercase text-[#0B1736] mb-3">
                  Subject
                </label>

                <input
                  type="text"
                  placeholder="Hiring inquiry, shift swap, partnership..."
                  className="w-full h-14 px-5 rounded-3xl border border-gray-200 outline-none focus:border-[#0658C2]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[12px] font-bold tracking-[1px] uppercase text-[#0B1736] mb-3">
                  Your Message
                </label>

                <textarea
                  rows={5}
                  placeholder="Tell us what you need..."
                  className="w-full px-5 py-4 rounded-3xl border border-gray-200 outline-none resize-none focus:border-[#0658C2]"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full h-14 rounded-3xl bg-[#0658C2] text-white font-semibold hover:bg-[#0547a0] transition"
              >
                Submit Message →
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
