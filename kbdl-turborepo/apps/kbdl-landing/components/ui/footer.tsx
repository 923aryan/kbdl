import type { JSX } from "react";

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-[#00143A] text-white px-6 md:px-10 pt-20 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-14">
          {/* LEFT COLUMN */}
          <div className="max-w-sm">
            {/* LOGO */}
            <img src="/logo.png" alt="Kaam Badlo" className="w-24 mb-6" />

            {/* Description */}
            <p className="text-[#94A3B8] leading-8 text-[15px] mb-6">
              India&apos;s first Cross-Factory Shift Swap & Verified Skill Card
              platform. Transforming the blue-collar workforce with trust and
              technology.
            </p>

            {/* Quote */}
            <p className="italic text-[#7C8AA5] text-sm mb-6">
              “Apni shift badlo, paisa mat kho”
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="text-white hover:text-gray-300 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M22 12.07C22 6.504 17.523 2 12 2S2 6.504 2 12.07c0 5.017 3.657 9.178 8.438 9.93v-7.03H7.898v-2.9h2.54V9.845c0-2.522 1.492-3.918 3.777-3.918 1.094 0 2.238.196 2.238.196v2.475h-1.26c-1.243 0-1.63.774-1.63 1.567v1.88h2.773l-.443 2.9h-2.33V22c4.78-.752 8.437-4.913 8.437-9.93z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="text-white hover:text-gray-300 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 1.8h8.5a3.95 3.95 0 013.95 3.95v8.5a3.95 3.95 0 01-3.95 3.95h-8.5a3.95 3.95 0 01-3.95-3.95v-8.5A3.95 3.95 0 017.75 3.8zm8.95 1.35a1.05 1.05 0 100 2.1 1.05 1.05 0 000-2.1zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.8A3.2 3.2 0 1112 15.2 3.2 3.2 0 0112 8.8z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-white hover:text-gray-300 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M4.98 3.5C4.98 4.604 4.104 5.5 3 5.5S1.02 4.604 1.02 3.5 1.896 1.5 3 1.5s1.98.896 1.98 2zm.02 4H1V22h4V7.5zm7 0H8V22h4v-7.5c0-4.167 5-4.5 5 0V22h4v-9c0-7-8-6.75-9-3.313V7.5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* PLATFORM */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Platform</h3>

            <ul className="space-y-4 text-[#94A3B8] text-[15px]">
              <li>
                <a href="#" className="hover:text-white transition">
                  Home
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition">
                  About Us
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition">
                  Workers
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition">
                  FAQ
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Legal</h3>

            <ul className="space-y-4 text-[#94A3B8] text-[15px]">
              <li>
                <a href="#" className="hover:text-white transition">
                  Terms & Conditions
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Contact</h3>

            <div>
              <p className="font-medium text-white mb-2">Corporate Address</p>

              <p className="text-[#94A3B8] leading-7 text-[15px]">
                Noida, Delhi NCR – 201301 (India)
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-16 pt-8">
          <p className="text-center text-[#7C8AA5] text-sm">
            © 2026 Kaam Badlo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
