'use client';

import { useState } from 'react';
import { DownloadSection } from '../../components/ui/download';
import FAQBanner from '../../components/ui/faq-banner';

/* ----------------------------- FAQ DATA ----------------------------- */

const faqPages = [
  // FIRST QUESTIONS
  [
    {
      question: 'How does the 30 min Replacement actually work?',
      answer:
        'When you mark a worker absent on the app, our algorithm immediately alerts nearby, verified workers with matching skills via push notifications. Interested workers apply using their Karigari Card. You review their ID, skills and past employer ratings, accept with one tap, and track their arrival via live geo-location.',
    },
    {
      question: 'How do I know the worker is verified and trustworthy?',
      answer:
        'Every worker on Kaam Badlo holds a Karigari Skill Card with verified identity, work skills, employer ratings and QR-based validation.',
    },
    {
      question: 'Is there really a 3 months free trial?',
      answer:
        'Yes — completely free. No hidden charges, no commitment. Businesses can experience verified hiring before upgrading.',
    },
    {
      question: 'We already have a manpower contractor. Why do we need Kaam Badlo?',
      answer:
        'Kaam Badlo acts as your emergency backup workforce system whenever regular manpower fails.',
    },
    {
      question: 'What industry and job role do we cover?',
      answer:
        'We support manufacturing, logistics, warehousing, security, housekeeping, FMCG and industrial workforce roles.',
    },
    {
      question: 'How do I pay the workers?',
      answer:
        'Workers are paid directly by employers through UPI or cash. Kaam Badlo does not deduct worker wages.',
    },
  ],

  // SECOND QUESTIONS
  [
    {
      question: 'Where is Kaam Badlo currently Available?',
      answer:
        'We are currently active in Noida, Greater Noida, Ghaziabad and Dadri and expanding to other major industrial cities.',
    },
    {
      question: 'Is it free for workers to register?',
      answer: 'Yes — workers never pay registration fees or commissions on Kaam Badlo.',
    },
    {
      question: 'What is the Karigari Skill Card?',
      answer:
        'It is a verified digital identity card containing worker skills, ratings and certifications.',
    },
    {
      question: 'How do workers get paid?',
      answer: 'Factories or employers pay workers directly after shift completion.',
    },
    {
      question: 'What if I miss a confirmed shift?',
      answer: 'Repeated no-shows reduce worker ratings and future job opportunities.',
    },
    {
      question: 'What devices does Kaam Badlo support?',
      answer: 'Kaam Badlo works on Android, iPhone, desktop and laptop devices.',
    },
  ],

  // THIRD QUESTIONS
  [
    {
      question: 'How does QR scanning work at the factory gate?',
      answer:
        'HR managers can instantly verify worker identity and certifications through QR scanning.',
    },
    {
      question: 'Is company data secure?',
      answer: 'Yes. All data is encrypted and securely stored on our platform.',
    },
    {
      question: 'Can I post bulk hiring requirements?',
      answer: 'Yes. Kaam Badlo supports urgent and bulk workforce hiring requests.',
    },
  ],
];

export default function FAQSection() {
  const [page, setPage] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // FIXED ERROR
  const currentFaqs = faqPages[page] ?? [];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleNext = () => {
    if (page < faqPages.length - 1) {
      setPage((prev) => prev + 1);
      setOpenIndex(0);
    }
  };

  const handlePrev = () => {
    if (page > 0) {
      setPage((prev) => prev - 1);
      setOpenIndex(0);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <FAQBanner />
      <DownloadSection />

      <section className="py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="text-center mb-12">
            <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 block">
              FAQ
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-[#01122E] mb-4 leading-tight">
              Everything you need to <span className="text-primary">Know</span>
            </h2>

            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Common questions from factory owners, HR managers, warehouse heads and workers.
            </p>
          </div>

          {/* FAQ LIST */}
          <div className="flex flex-col gap-4">
            {currentFaqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 border ${
                    isOpen
                      ? 'border-[#0658C2] shadow-lg'
                      : 'border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  {/* QUESTION */}
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-[15px] md:text-base font-bold text-[#01122E] pr-8 leading-7">
                      {faq.question}
                    </span>

                    <div
                      className={`shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
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

                  {/* ANSWER */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-6 pt-0 text-gray-600 text-[15px] leading-relaxed border-t border-gray-100 mx-6 mt-2">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NAVIGATION */}
          <div className="flex items-center justify-center gap-4 mt-10">
            {/* LEFT BUTTON */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={page === 0}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border text-xl font-bold ${
                page === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#0658C2] border-[#0658C2] hover:bg-[#0658C2] hover:text-white shadow-md'
              }`}
            >
              ←
            </button>

            {/* PAGE COUNT */}
            <div className="px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-[#01122E] shadow-sm">
              {page + 1} / {faqPages.length}
            </div>

            {/* RIGHT BUTTON */}
            <button
              type="button"
              onClick={handleNext}
              disabled={page === faqPages.length - 1}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border text-xl font-bold ${
                page === faqPages.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#0658C2] text-white border-[#0658C2] hover:bg-blue-700 shadow-lg shadow-blue-500/20'
              }`}
            >
              →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
