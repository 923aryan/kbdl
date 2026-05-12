import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../../lib/seo-constants";
import logo from "../../public/logo-dark-bg.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#01122E] text-white pt-14 pb-6 px-6 md:px-10 lg:px-14 border-t border-white/10">
      <div className="max-w-[1400px] mx-auto">
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* COLUMN 1 */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image
                src={logo}
                alt="Kaam Badlo Logo"
                className="object-contain  w-full h-15"
              />
            </Link>

            <p className="text-[#8A94A7] text-sm leading-7 max-w-sm mb-8">
              India's first cross-factory shift swap & verified skill card
              ecosystem. Transforming blue-collar workforce with trust,
              transparency and technology.
            </p>

            {/* ADDRESS */}
            <div className="border-l border-[#0D6EFD] pl-4">
              <div className="flex gap-3">
                <svg
                  className="w-4 h-4 text-[#0D6EFD] mt-1 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

                <p className="text-[#8A94A7] text-sm leading-6">
                  Noida, Delhi NCR – 201301 (India)
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[3px] h-5 bg-[#0D6EFD]" />
              <h3 className="text-lg font-semibold">Quick Links</h3>
            </div>

            <ul className="space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Workers", href: "/services/workers" },
                { name: "FAQ & Support", href: "/faq" },
                { name: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-[#8A94A7] hover:text-white transition-colors text-sm"
                  >
                    <span className="text-[#0D6EFD] text-[11px] leading-none mt-[1px]">
                      ›
                    </span>

                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[3px] h-5 bg-[#0D6EFD]" />
              <h3 className="text-lg font-semibold">Legal & Policies</h3>
            </div>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-[#8A94A7] hover:text-white transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4 text-[#0D6EFD]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                    />
                  </svg>
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 text-[#8A94A7] hover:text-white transition-colors text-sm"
                >
                  <svg
                    className="w-4 h-4 text-[#0D6EFD]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1zm0 0v2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[3px] h-5 bg-[#0D6EFD]" />
              <h3 className="text-lg font-semibold">Connect With Us</h3>
            </div>

            {/* EMAIL BOX */}
            <div className="border border-white/10 rounded-xl p-5 bg-[#031938] mb-6">
              <p className="text-[10px] tracking-[1.5px] uppercase text-[#7F8DA3] mb-3">
                Official Company Email
              </p>

              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-4 h-4 text-[#0D6EFD]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>

                <a
                  href="mailto:connect@kaambadlo.com"
                  className="text-white text-sm"
                >
                  connect@kaambadlo.com
                </a>
              </div>
               <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-4 h-4 text-[#0D6EFD]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>

                <a
                  href="mailto:business@kaambadlo.com"
                  className="text-white text-sm"
                >
                  business@kaambadlo.com
                </a>
              </div>

              <p className="text-[#7F8DA3] text-xs">
                24/7 support & partnership inquiries
              </p>
            </div>

            {/* SOCIAL */}
            <div>
              <p className="text-sm text-[#8A94A7] mb-4">Follow Our Movement</p>

              <div className="flex items-center gap-4">
                {/* FACEBOOK */}
                <a
                  href={siteConfig.socialLinks[2]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#0D6EFD] transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>

                {/* INSTAGRAM */}
                <a
                  href={siteConfig.socialLinks[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#0D6EFD] transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 1.8h8.5a3.95 3.95 0 013.95 3.95v8.5a3.95 3.95 0 01-3.95 3.95h-8.5a3.95 3.95 0 01-3.95-3.95v-8.5A3.95 3.95 0 017.75 3.8zm9.15 1.35a1.05 1.05 0 100 2.1 1.05 1.05 0 000-2.1zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.8A3.2 3.2 0 1112 15.2 3.2 3.2 0 0112 8.8z" />
                  </svg>
                </a>

                {/* LINKEDIN */}
                <a
                  href={siteConfig.socialLinks[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#0D6EFD] transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-white/10 mt-12 pt-6 text-center">
          <p className="text-[#667085] text-sm">
            © {currentYear} KAAM BADLO — On-Demand Labour Platform. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
