import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="bg-[#F5F5F5] min-h-screen">
      {/* HERO SECTION */}
      <section className="border-b border-gray-300 bg-[#F5F5F5] px-6 py-16 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-[42px] md:text-[64px] font-bold text-[#1B1F28] tracking-tight">
            Terms And Conditions
          </h1>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="px-6 py-14 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* INTRO */}
          <div className="mb-14">
            <div className="mb-8">
              <p className="text-gray-700 text-[15px] leading-8">
                <span className="font-semibold text-black">Effective Date:</span> [Insert Date]
              </p>

              <p className="text-gray-700 text-[15px] leading-8">
                <span className="font-semibold text-black">Website:</span>{' '}
                <Link href="https://kaambadlo.com/" className="text-[#0658C2] hover:underline">
                  https://kaambadlo.com/
                </Link>
              </p>
            </div>

            <p className="text-[#222] text-[18px] leading-9">
              Welcome to Kaam Badlo. These Terms and Conditions (“Terms”) govern your access to and
              use of the Kaam Badlo website, applications, workforce tools, digital hiring services
              and related platform features.
            </p>

            <p className="text-[#222] text-[18px] leading-9 mt-6">
              By accessing or using the platform, you agree to comply with these Terms. If you do
              not agree with any part of these Terms, please discontinue use of the platform
              immediately.
            </p>
          </div>

          {/* TERMS */}
          <div className="space-y-14">
            {/* ABOUT */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">About Kaam Badlo</h2>

              <p className="text-[17px] text-[#333] leading-9 mb-6">
                Kaam Badlo is a workforce and job-connect platform designed to connect workers,
                employers, contractors, factories, placement agencies, households and service
                providers across India.
              </p>

              <p className="text-[17px] text-[#333] leading-9 mb-6">The platform may include:</p>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Blue-collar job opportunities',
                  'Factory and industrial hiring',
                  'Household service connections',
                  'Worker profile creation',
                  'Shift replacement and staffing support',
                  'Digital hiring and workforce tools',
                  'Communication and notification services',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Kaam Badlo operates as a technology and facilitation platform and does not directly
                employ workers unless specifically stated otherwise.
              </p>
            </div>

            {/* ELIGIBILITY */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">
                Eligibility & Access
              </h2>

              <p className="text-[17px] text-[#333] leading-9 mb-6">
                To use the Kaam Badlo platform, you must:
              </p>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Be at least 18 years old',
                  'Provide accurate and authentic information',
                  'Use the platform lawfully and ethically',
                  'Have authorization to represent your company or business if acting on behalf of an employer or agency',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Kaam Badlo reserves the right to suspend or terminate access if false, misleading or
                fraudulent information is detected.
              </p>
            </div>

            {/* USER ACCOUNTS */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">
                User Accounts & Responsibilities
              </h2>

              <p className="text-[17px] text-[#333] leading-9 mb-6">
                Users may register using phone numbers, email addresses, WhatsApp authentication or
                other supported methods.
              </p>

              <p className="text-[17px] text-[#333] leading-9 mb-6">You are responsible for:</p>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Maintaining confidentiality of account credentials',
                  'All activities performed under your account',
                  'Keeping account information updated and accurate',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Kaam Badlo shall not be responsible for unauthorized access resulting from
                negligence or misuse by users.
              </p>
            </div>

            {/* WORKERS */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">
                Worker Responsibilities
              </h2>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Provide genuine personal and professional information',
                  'Share accurate skills and work experience details',
                  'Maintain professional conduct with employers and customers',
                  'Attend confirmed jobs responsibly',
                  'Avoid fraudulent or misleading activities',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Workers acknowledge that hiring decisions are made independently by employers or
                customers using the platform.
              </p>
            </div>

            {/* EMPLOYERS */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">
                Employer & Business Responsibilities
              </h2>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Provide lawful job opportunities',
                  'Share accurate payment and job information',
                  'Treat workers respectfully and fairly',
                  'Comply with applicable labor and employment laws',
                  'Avoid discrimination, harassment or exploitation',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Kaam Badlo may remove listings or suspend accounts violating platform standards or
                applicable laws.
              </p>
            </div>

            {/* PAYMENTS */}
            <div>
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">
                Payments & Platform Fees
              </h2>

              <p className="text-[17px] text-[#333] leading-9 mb-6">
                Certain services may involve subscriptions, commissions, service charges or
                promotional fees.
              </p>

              <div className="space-y-4 text-[17px] text-[#333] leading-8">
                {[
                  'Applicable pricing may change without prior notice',
                  'Payments must be completed using approved methods',
                  'Refunds are subject to platform policies',
                  'Fraudulent payment activity may result in suspension',
                ].map((item) => (
                  <div key={item} className="flex gap-4">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#0658C2]" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <p className="text-[17px] text-[#333] leading-9 mt-6">
                Kaam Badlo may work with third-party payment providers for transaction processing.
              </p>
            </div>

            {/* COMPACT SECTIONS */}
            {[
              {
                title: 'Verification & Background Checks',
                text: 'Kaam Badlo may provide verification, ratings and screening tools. However, verification does not guarantee conduct, performance or reliability. Users should independently exercise judgment before hiring or accepting work.',
              },
              {
                title: 'Platform Availability',
                text: 'While we aim to provide uninterrupted services, platform access may occasionally be unavailable due to maintenance, upgrades, technical issues or third-party disruptions.',
              },
              {
                title: 'Prohibited Activities',
                text: 'Users may not post false information, impersonate others, misuse platform branding, attempt unauthorized access, upload malicious content or engage in unlawful activities.',
              },
              {
                title: 'Intellectual Property',
                text: 'All platform content including branding, software, graphics, designs, logos and materials are owned by or licensed to Kaam Badlo and are protected by intellectual property laws.',
              },
              {
                title: 'Third-Party Services',
                text: 'The platform may integrate services including payment gateways, WhatsApp communication, maps, verification systems and analytics providers. Kaam Badlo is not responsible for third-party policies or availability.',
              },
              {
                title: 'Limitation of Liability',
                text: 'Kaam Badlo is a technology platform and shall not be liable for employment disputes, worker conduct, payment disagreements, damages, service quality disputes or business losses arising from user interactions.',
              },
              {
                title: 'Suspension & Termination',
                text: 'Kaam Badlo reserves the right to suspend or terminate accounts without notice if fraudulent activity, misuse or violations of these Terms are detected.',
              },
              {
                title: 'Privacy',
                text: 'Your use of the platform is also governed by our Privacy Policy. By using Kaam Badlo, you consent to the collection and use of information described therein.',
              },
              {
                title: 'Governing Law',
                text: 'These Terms shall be governed and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of the competent courts.',
              },
              {
                title: 'Changes To Terms',
                text: 'Kaam Badlo may revise or update these Terms at any time. Continued use of the platform after updates constitutes acceptance of the revised Terms.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h2 className="text-[34px] font-semibold text-[#111827] mb-6">{item.title}</h2>

                <p className="text-[17px] text-[#333] leading-9">{item.text}</p>
              </div>
            ))}

            {/* CONTACT */}
            <div className="pt-4">
              <h2 className="text-[34px] font-semibold text-[#111827] mb-6">Contact Information</h2>

              <p className="text-[17px] text-[#333] leading-9 mb-8">
                For legal inquiries, support or questions regarding these Terms & Conditions, please
                contact:
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[2px] text-gray-500 mb-2">Company</p>

                  <p className="text-[18px] font-semibold text-[#111827]">Kaam Badlo</p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[2px] text-gray-500 mb-2">Website</p>

                  <Link
                    href="https://kaambadlo.com/"
                    className="text-[#0658C2] text-[17px] hover:underline"
                  >
                    https://kaambadlo.com/
                  </Link>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[2px] text-gray-500 mb-2">
                    Official Email
                  </p>

                  <a
                    href="mailto:hr@kaambadlo.com"
                    className="text-[#0658C2] text-[17px] hover:underline"
                  >
                    hr@kaambadlo.com
                  </a>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[2px] text-gray-500 mb-2">
                    Technical Support
                  </p>

                  <a
                    href="mailto:itsupport@kaambadlo.com"
                    className="text-[#0658C2] text-[17px] hover:underline"
                  >
                    itsupport@kaambadlo.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
