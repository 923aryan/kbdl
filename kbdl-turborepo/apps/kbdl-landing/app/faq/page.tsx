"use client"; // Required for interactivity (useState)

import { useState } from "react";
import { DownloadSection } from "../../components/ui/download";
import FAQBanner from "../../components/ui/faq-banner";

// Data extracted directly from the provided PDF document
const faqs = [
  {
    question: "How does the 30 min Replacement actually work?",
    answer:
      "When you mark a worker absent on the app, our algorithm immediately alerts nearby, verified workers with matching skills via push notifications. Interested workers apply using their Karigari Card. You review their ID, skills and past employer ratings, accept with one tap, and track their arrival via live geo-location. The entire process—from marking absent to replacement confirmed—typically takes under 15 minutes. Arrival at your gate happens within 30 minutes for workers within our service radius.",
  },
  {
    question: "How do I know the worker is verified and trustworthy?",
    answer:
      "Every worker on Kaam Badlo holds a Karigari Skill Card — India's most robust digital identity for blue-collar workers. It includes: Government ID digitally authenticated (zero fraud risk), verified trade skills with exact proficiency levels, historical ratings from previous employers, and a QR code you scan at your gate for instant validation. You know exactly who is walking in before they arrive.",
  },
  {
    question: "Is there really a 3 months free trial? What's the catch?",
    answer:
      "Yes—completely free. No credit card required. No hidden charges. No commitment. You get access to the Starter plan for free, which includes 5 job posts per month, basic worker search, and Karigari Card QR scanning. We offer a free trial because we are confident that once you see a verified worker arrive in 30 minutes, you'll never go back to 3-hour phone calls. After the trial, you can upgrade to Growth (₹2,500/month) or Enterprise (₹5,000/month) if you want unlimited posts and swaps.",
  },
  {
    question:
      "We already have a manpower contractor. Why do we need Kaam Badlo?",
    answer:
      "Your contractor is your primary resource—Kaam Badlo is your emergency safety net for when your contractor fails. No contractor has 100% fill rates, especially for Monday mornings, festivals, or sudden surges. Kaam Badlo activates in 30 minutes when your contractor can't deliver. Think of it like having a backup power generator - you hope you never need it, but when you do, it saves the whole plant.",
  },
  {
    question: "What industry and job role do we cover?",
    answer:
      "We cover all blue-collar roles across manufacturing and logistics: welders, fitters, helpers, loaders, packers, quality checkers, machine operators, forklift operators, electricians, plumbers, security guards, housekeeping staff and more. Industries include automotive, electronics, garments, pharma, food processing, FMCG, warehousing and logistics.",
  },
  {
    question: "How do I pay the workers? Does Kaam Badlo handle Payroll?",
    answer:
      "You pay workers directly via UPI or cash at the end of the shift. Kaam Badlo does not hold funds or handle payroll. Our platform provides a transparent digital log of hours worked for your records. You pay only for the hours the worker actually worked—no agency fees on top of the worker's wage.",
  },
];

export default function FAQSection() {
  // State to track which FAQ is currently open.
  // Initialized to 1 (the second item) to match your design image where one is open by default.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    // If clicking the currently open one, close it. Otherwise, open the new one.
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full overflow-hidden">
      <FAQBanner />
      <DownloadSection />

      <section className="py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA]">
      <section className="py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 block">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-4">
              Everything you need to <span className="text-primary">Know</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Common questions from factory owners, HR managers, warehouse heads
              and workers.
            </p>
          </div>

          {/* Accordion List */}
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${
                    isOpen
                      ? "border-[#0658C2] shadow-lg"
                      : "border-gray-200 shadow-sm hover:border-gray-300"
                  }`}
                >
                  {/* Question Button */}
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] md:text-base font-bold text-[#01122E] pr-8 leading-7">
                      {faq.question}
                    </span>

                    {/* Chevron Icon */}
                    <div
                      className={`flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    >
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
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Answer Content (Animated Height) */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-6 pt-0 text-gray-500 text-[15px] leading-relaxed border-t border-gray-100 mx-6 mt-2">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
