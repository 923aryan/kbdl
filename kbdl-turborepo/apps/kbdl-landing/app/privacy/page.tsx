import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[#F5F7FA] min-h-screen">
      {/* HERO SECTION */}
      <section className="bg-[#F3F4F6] border-b border-gray-200 px-6 py-24 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-[42px] md:text-[72px] font-extrabold tracking-[-2px] text-[#111827] leading-none">
            Privacy Policy
          </h1>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* TOP INFO */}
          <div className="mb-16">
            {/* <p className="text-[#111827] text-lg mb-5">
              <span className="font-bold">Effective Date:</span>{' '}
              <span className="text-gray-600">[Comming Soon]</span>
            </p> */}

            <p className="text-[#111827] text-lg">
              <span className="font-bold">Website:</span>{' '}
              <Link href="https://kaambadlo.com/" className="text-[#0658C2] hover:underline">
                https://kaambadlo.com/
              </Link>
            </p>
          </div>

          {/* INTRO */}
          <div className="space-y-8 mb-20">
            <p className="text-[20px] leading-[42px] text-[#1F2937]">
              Kaam Badlo we values your privacy and is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, store, process and
              safeguard your information when you use our website, mobile applications, workforce
              platform and related services.
            </p>

            <p className="text-[20px] leading-[42px] text-[#1F2937]">
              By accessing or using Kaam Badlo, you consent to the practices described in this
              Privacy Policy.
            </p>
          </div>

          {/* SECTIONS */}
          <div className="space-y-20">
            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">Information We Collect</h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-10">
                We may collect different types of information to provide, improve and secure our
                services.
              </p>

              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl font-semibold text-[#111827] mb-6">
                    Personal Information
                  </h3>

                  <ul className="space-y-5">
                    {[
                      'Full name',
                      'Phone number',
                      'Email address',
                      'Profile photograph',
                      'Address and location details',
                      'Government identification details',
                      'Skills, work history and job preferences',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-4 text-[19px] leading-[38px] text-[#374151]"
                      >
                        <span className="text-[#0658C2] font-bold">•</span>

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-[#111827] mb-6">
                    Business Information
                  </h3>

                  <ul className="space-y-5">
                    {[
                      'Company or factory name',
                      'Business contact details',
                      'Hiring requirements and workforce needs',
                      'GST or registration details where applicable',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-4 text-[19px] leading-[38px] text-[#374151]"
                      >
                        <span className="text-[#0658C2] font-bold">•</span>

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-[#111827] mb-6">
                    Technical Information
                  </h3>

                  <ul className="space-y-5">
                    {[
                      'Device and browser information',
                      'IP address and operating system',
                      'Website or app activity',
                      'Cookies and analytics data',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex gap-4 text-[19px] leading-[38px] text-[#374151]"
                      >
                        <span className="text-[#0658C2] font-bold">•</span>

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">
                How We Use Your Information
              </h2>

              <ul className="space-y-5">
                {[
                  'Create and manage user accounts',
                  'Match workers with job opportunities',
                  'Enable workforce management and hiring',
                  'Improve platform performance and user experience',
                  'Send notifications, updates and service alerts',
                  'Verify profiles and reduce fraud',
                  'Provide support and customer assistance',
                  'Comply with applicable legal obligations',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-[19px] leading-[38px] text-[#374151]">
                    <span className="text-[#0658C2] font-bold">•</span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">
                Communication & Notifications
              </h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-8">
                By using Kaam Badlo, you agree to receive communication through:
              </p>

              <ul className="space-y-5">
                {[
                  'Phone calls',
                  'SMS notifications',
                  'WhatsApp messages',
                  'Email communication',
                  'Push notifications',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-[19px] leading-[38px] text-[#374151]">
                    <span className="text-[#0658C2] font-bold">•</span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mt-8">
                These communications may include job alerts, hiring updates, support responses,
                promotional campaigns, account notifications and important platform announcements.
              </p>
            </div>

            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">Location Information</h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-8">
                We may collect and process location information to improve worker-employer matching
                and service availability.
              </p>

              <ul className="space-y-5">
                {[
                  'Display nearby job opportunities',
                  'Enable faster workforce replacement',
                  'Support household and industrial services',
                  'Improve platform recommendations',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-[19px] leading-[38px] text-[#374151]">
                    <span className="text-[#0658C2] font-bold">•</span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">Sharing of Information</h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-8">
                We may share information with trusted service providers and platform participants
                where necessary.
              </p>

              <ul className="space-y-5">
                {[
                  'Employers and recruiters',
                  'Workers and service providers',
                  'Household customers',
                  'Verification partners',
                  'Payment service providers',
                  'Technology and analytics providers',
                  'Government authorities where legally required',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-[19px] leading-[38px] text-[#374151]">
                    <span className="text-[#0658C2] font-bold">•</span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mt-8">
                Kaam Badlo does not sell personal information to third parties.
              </p>
            </div>

            {/* SECTION */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">
                Data Protection & Security
              </h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937]">
                We implement commercially reasonable safeguards and security practices to protect
                user information from unauthorized access, misuse, disclosure, loss or theft.
              </p>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mt-8">
                While we strive to maintain strong security standards, no electronic storage or
                transmission system can be guaranteed to be completely secure.
              </p>
            </div>

            {/* COMPACT SECTIONS */}
            {[
              {
                title: 'Cookies & Analytics',
                text: 'Kaam Badlo may use cookies, analytics and tracking technologies to improve website performance, understand user behavior and personalize platform experiences.',
              },
              {
                title: 'User Responsibilities',
                text: 'Users agree to provide accurate information, avoid misuse of another person’s data, maintain lawful conduct and avoid uploading false or misleading documents.',
              },
              {
                title: 'Third-Party Services',
                text: 'Our platform may integrate third-party services including payment gateways, WhatsApp communication, Google services, maps and analytics providers.',
              },
              {
                title: 'Data Retention',
                text: 'We may retain information as long as necessary for operational, legal, fraud prevention and dispute resolution purposes.',
              },
              {
                title: 'Account Suspension or Deletion',
                text: 'Users may request account deletion by contacting us. Kaam Badlo may suspend accounts involved in fraud, illegal activity or platform misuse.',
              },
              {
                title: 'Children’s Privacy',
                text: 'Kaam Badlo services are intended only for individuals aged 18 years and above. We do not knowingly collect data from minors.',
              },
              {
                title: 'Changes to this Privacy Policy',
                text: 'We may update this Privacy Policy periodically. Updated versions will be posted on the platform with revised effective dates.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">{item.title}</h2>

                <p className="text-[20px] leading-[42px] text-[#1F2937]">{item.text}</p>
              </div>
            ))}

            {/* USER RIGHTS */}
            <div>
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">User Rights</h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-8">
                Depending on applicable laws, users may request to:
              </p>

              <ul className="space-y-5">
                {[
                  'Access stored personal information',
                  'Correct inaccurate information',
                  'Request deletion of data',
                  'Withdraw permissions or communication preferences',
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-[19px] leading-[38px] text-[#374151]">
                    <span className="text-[#0658C2] font-bold">•</span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CONTACT */}
            <div className="border-t border-gray-300 pt-14">
              <h2 className="text-[42px] font-bold text-[#0F172A] mb-10">Contact Information</h2>

              <p className="text-[20px] leading-[42px] text-[#1F2937] mb-10">
                For privacy-related concerns, account requests or support, contact us:
              </p>

              <div className="space-y-8">
                <div>
                  <p className="font-bold text-[#111827] text-2xl">Kaam Badlo</p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Website</p>

                  <Link
                    href="https://kaambadlo.com/"
                    className="text-[#0658C2] text-lg hover:underline"
                  >
                    https://kaambadlo.com/
                  </Link>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                    Official Email
                  </p>

                  <a
                    href="mailto:hr@kaambadlo.com"
                    className="text-[#0658C2] text-lg hover:underline"
                  >
                    hr@kaambadlo.com
                  </a>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                    Technical Support
                  </p>

                  <a
                    href="mailto:itsupport@kaambadlo.com"
                    className="text-[#0658C2] text-lg hover:underline"
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
