"use client"; // Required since we are using state for the mobile menu

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import logo from "../../public/logo-new.svg";
// import logo from "../../public/logo.png"; // Make sure to adjust this import

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Workers", href: "/services/workers" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname(); // Optional: used to highlight the active link

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 py-[10px] py-md-[14px]">
      <div className="md:w-full px-4 md:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo */}
          <Link href="/" className="flex items-start justify-start p-1">
            <Image
              src={logo}
              alt="Kaam Badlo Logo"
              className="object-contain w-full h-15 p-1"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[15px] font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-navy focus:outline-none p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                // Close Icon (X)
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger Icon
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                  className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
