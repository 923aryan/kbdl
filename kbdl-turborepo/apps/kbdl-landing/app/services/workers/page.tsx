import Image from "next/image";
import { DownloadSection } from "../../../components/ui/download";
import workerBg from "../../../public/worker-hero-bg.png";
// SVG Icon Components
const UsersIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const PaintbrushIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const DropletsIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 33C23.7951 33 28.5 28.2951 28.5 22.5C28.5 19.5 27 16.65 24 14.25C21 11.85 18.75 8.25 18 4.5C17.25 8.25 15 11.85 12 14.25C9 16.65 7.5 19.5 7.5 22.5C7.5 28.2951 12.2049 33 18 33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HammerIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 33 32" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.9928 15L6.93326 29.0595C5.69062 30.3026 3.67557 30.3029 2.43251 29.0602C1.18946 27.8176 1.18912 25.8026 2.43176 24.5595L16.4928 10.5M25.4928 19.5L31.4928 13.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30.7432 14.25L27.8722 11.379C27.3095 10.8165 26.9933 10.0536 26.9932 9.258V8.742C26.993 7.94642 26.6768 7.18348 26.1142 6.621L23.6287 4.1355C21.9414 2.44847 19.6532 1.50051 17.2672 1.5H11.9932L13.8577 3.3645C15.5451 5.05218 16.4931 7.34096 16.4932 9.7275V12L19.4932 15H21.2512C22.0467 15.0002 22.8097 15.3164 23.3722 15.879L26.2432 18.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const HardHatIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15V7.5C15 6.67213 15.6721 6 16.5 6H19.5C20.3279 6 21 6.67213 21 7.5V15M21 9C25.9672 9 30 13.0328 30 18V22.5M6 22.5V18C6 13.0328 10.0328 9 15 9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 22.5H31.5C32.3279 22.5 33 23.1721 33 24V27C33 27.8279 32.3279 28.5 31.5 28.5H4.5C3.67213 28.5 3 27.8279 3 27V24C3 23.1721 3.67213 22.5 4.5 22.5V22.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const RulerIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
    <path d="M31.9497 22.95C32.6275 23.6255 33.0085 24.5431 33.0085 25.5C33.0085 26.457 32.6275 27.3745 31.9497 28.05L28.0497 31.95C27.3742 32.6278 26.4566 33.0088 25.4997 33.0088C24.5428 33.0088 23.6252 32.6278 22.9497 31.95L4.0497 13.05C2.64619 11.6397 2.64619 9.36033 4.0497 7.95001L7.9497 4.05001C9.36002 2.6465 11.6394 2.6465 13.0497 4.05001L31.9497 22.95M21.7497 18.75L24.7497 15.75M17.2497 14.25L20.2497 11.25M12.7497 9.75001L15.7497 6.75001M26.2497 23.25L29.2497 20.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FlameIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5068 6.20398C14.678 4.40225 16.1912 3.02612 18.001 3.02612C19.8109 3.02612 21.324 4.40225 21.4953 6.20398C21.5961 7.34389 22.2463 8.36309 23.2375 8.935C24.2287 9.5069 25.4364 9.55971 26.4738 9.07648C28.1181 8.32992 30.0606 8.95294 30.9641 10.5166C31.8675 12.0803 31.4369 14.0744 29.9688 15.126C29.0323 15.7831 28.4748 16.8553 28.4748 17.9992C28.4748 19.1432 29.0323 20.2154 29.9688 20.8725C31.4369 21.9241 31.8675 23.9181 30.9641 25.4818C30.0606 27.0455 28.1181 27.6685 26.4738 26.922C25.4364 26.4388 24.2287 26.4916 23.2375 27.0635C22.2463 27.6354 21.5961 28.6546 21.4953 29.7945C21.324 31.5962 19.8109 32.9723 18.001 32.9723C16.1912 32.9723 14.678 31.5962 14.5068 29.7945C14.4061 28.6542 13.7558 27.6345 12.7641 27.0626C11.7725 26.4906 10.5643 26.4381 9.52678 26.922C7.88241 27.6685 5.93991 27.0455 5.0365 25.4818C4.1331 23.9181 4.56366 21.9241 6.03178 20.8725C6.96822 20.2154 7.52571 19.1432 7.52571 17.9992C7.52571 16.8553 6.96822 15.7831 6.03178 15.126C4.5658 14.0739 4.13637 12.0817 5.03875 10.5191C5.94114 8.95645 7.88129 8.33262 9.52528 9.07648C10.5626 9.55971 11.7704 9.5069 12.7616 8.935C13.7528 8.36309 14.403 7.34389 14.5038 6.20398" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.5 18C13.5 20.4836 15.5164 22.5 18 22.5C20.4836 22.5 22.5 20.4836 22.5 18C22.5 15.5164 20.4836 13.5 18 13.5C15.5164 13.5 13.5 15.5164 13.5 18V18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// Service data with exact content
const servicesData = [
  { title: 'Labour', description: 'Reliable and hardworking general labourers for all construction and site-related tasks.', icon: UsersIcon },
  { title: 'Mason', description: 'Skilled masons specialize in bricklaying, plastering, & structural work for durable construction.', icon: GridIcon },
  { title: 'Painter', description: 'Professional painters ensuring high-quality wall finishes, interior, and exterior painting services.', icon: PaintbrushIcon },
  { title: 'Plumber', description: 'Expert plumbers for seamless water supply, drainage, and plumbing system installations and repairs.', icon: DropletsIcon },
  { title: 'Carpenter', description: 'Experienced carpenters deliver customized woodwork solutions for furniture, doors, and interiors.', icon: HammerIcon },
  { title: 'Electrician', description: 'Qualified electricians for safe electrical installations, maintenance, and fault repair services.', icon: ZapIcon },
  { title: 'Foreman', description: 'Efficient foremen to oversee construction sites and ensure timely project completion.', icon: HardHatIcon },
  { title: 'Supervisor', description: 'Responsible supervisors to monitor workers, manage tasks, and maintain workplace safety.', icon: ClipboardListIcon },
  { title: 'Engineer', description: 'Expert engineers providing technical solutions for design, planning, and execution of projects.', icon: RulerIcon },
  { title: 'Welder', description: 'Welders play a crucial role in fabricating and maintaining steel structures.', icon: FlameIcon },
  { title: 'ITI/Technician', description: 'Certified ITI technicians offer specialized skills for machinery maintenance and technical support.', icon: SettingsIcon },
];

// SVG Check Icon (reusable)
const CheckIcon = ({ color, bgColor }: { color: string; bgColor: string }) => (
  <div
    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
    style={{ backgroundColor: bgColor }}
  >
    <svg
      className="w-3 h-3"
      fill="none"
      stroke={color}
      viewBox="0 0 24 24"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

// Bullet point data for left side
const workerBullets = [
  'Create your profile in minutes',
  'Find jobs based on your skills and location',
  'Get hired',
  'Grow your career every day',
];

// Bullet point data for right side
const employerBullets = [
  'Post jobs and reach thousands of workers',
  'Shortlist and connect with the best match',
  'Manage jobs and teams effortlessly',
  'Build your projects on time',
];

export default function Workers() {
  return (
    <div className="h-full w-full">
      <section className="relative w-full min-h-125 md:min-h-150 flex flex-col justify-center items-center overflow-hidden">

        {/* 1. Background Image & Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={workerBg}
            alt="Construction site workers building a modern high-rise"
            fill
            priority /* CRUCIAL for hero sections to pass Core Web Vitals */
            className="object-cover object-center"
          />
          {/* Heavy dark gradient overlay to ensure perfect text readability */}
          <div className="absolute inset-0 bg-[#070E1A]/40 md:bg-gradient-to-b md:from-[#050B14]/50 md:via-[#070E1A]/70 md:to-[#050B14]/50"></div>
        </div>

        {/* 2. Text Content Container */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">

          {/* Glassmorphism Badge */}
          <div className="px-6 py-2 mb-6 rounded-full border border-[#0658C2]/40 bg-[#0658C2]/10 backdrop-blur-md">
            <span className="text-[#8FBFFF] text-xs font-bold tracking-[0.2em] uppercase">
              Build Your Career
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold text-white leading-[1.1] mb-6">
            Better Jobs. <span className="text-primary">Stronger<br />
              Tomorrow.</span>
          </h1>

          {/* Subheading / Description */}
          <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl leading-relaxed">
            We connect skilled workers with the right opportunities.<br className="hidden sm:block" />
            Find work that matches your skills and build a better future.
          </p>

        </div>
      </section>
      <section className="bg-[#ffffff] py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-15">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-bold mb-6">WHAT WE DO</div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#01122E] mb-5 tracking-tight">
              Services On <span className="relative inline-block text-primary">Demand<svg className="absolute w-[110%] h-4 -bottom-3 -left-[5%] text-primary" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,25 100,0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></span>
            </h2>

            <p className="text-[#676767] text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Blue collar jobs are now easier to manage with{" "}
              <span className="font-semibold text-navy">Kaam Badlo</span>,
              a reliable workers hiring platform that helps
              businesses find skilled labor quickly and efficiently.
            </p>

            <div className="flex justify-center mt-8">
              <div className="w-18 h-0.5 bg-primary rounded-full"></div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7 lg:gap-8">
            {servicesData.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div
                  key={index}
                  className="group relative cursor-pointer flex flex-col justify-center rounded-2xl p-6 md:p-7 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl border border-gray-100 hover:border-[#0658C2]/20 shadow-sm hover:shadow-[#2563eb]/10"
                >
                  <div className="mb-5 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-[20px] bg-white shadow flex items-center justify-center text-[#2563eb] transition-all duration-300 group-hover:bg-[#2563eb] group-hover:text-white group-hover:scale-105">
                      <IconComponent />
                    </div>
                  </div>

                  <h3 className="text-xl text-center font-semibold text-navy mb-3 tracking-tight">
                    {service.title}
                  </h3>

                  <p className="text-[#676767] text-center text-sm leading-relaxed mb-5 line-clamp-3">
                    {service.description}
                  </p>

                  <button className="inline-flex justify-center items-center text-primary font-medium text-sm group/btn transition-all duration-200 gap-1 cursor-pointer hover:text-[#054a9e]">
                    <ArrowRightIcon />
                  </button>

                  <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-[#2563eb]/0 via-[#2563eb]/0 to-[#2563eb]/0 group-hover:from-[#2563eb]/[0.02] transition-all duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#01122E] py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8 relative overflow-hidden">
        {/* Subtle grid/pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-12xl relative z-10">
          {/* Large rounded white container */}
          <div className="bg-white rounded-3xl md:rounded-4xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8 lg:p-10">
              {/* LEFT SECTION - FOR WORKERS */}
              <div className="flex flex-col items-start space-y-6">
                <div>
                  <div className="mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#DBEAFF]  shadow flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth={3} xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 15V7.5C15 6.67213 15.6721 6 16.5 6H19.5C20.3279 6 21 6.67213 21 7.5V15M21 9C25.9672 9 30 13.0328 30 18V22.5M6 22.5V18C6 13.0328 10.0328 9 15 9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.5 22.5H31.5C32.3279 22.5 33 23.1721 33 24V27C33 27.8279 32.3279 28.5 31.5 28.5H4.5C3.67213 28.5 3 27.8279 3 27V24C3 23.1721 3.67213 22.5 4.5 22.5V22.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                    FOR WORKERS
                  </span>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#01122E] mt-2 leading-tight">
                    Find Jobs That Fit You
                  </h2>
                </div>

                {/* Bullet points */}
                <ul className="space-y-4">
                  {workerBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckIcon color="#00BC7D" bgColor="#D0FAE5" />
                      <span className="text-[#676767] text-base">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button className="mt-4 w-full md:w-auto bg-[#0658C2] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg hover:bg-[#054a9e] transition-all duration-300 hover:-translate-y-1">
                  Join as Worker
                </button>
              </div>

              {/* CENTER SECTION - IMAGE CARD WITH FLOATING JOB CARD */}
              <div className="relative flex justify-center items-center">
                <div className="relative w-full max-w-sm mx-auto">
                  {/* Main Image Card */}
                  <div className="rounded-3xl shadow-xl overflow-hidden transform transition-transform duration-300 hover:scale-[1.02]">
                    <Image src="/constructor.png" alt="Worker" className="rounded-[30px] object-cover" width={584} height={438} />
                  </div>

                  {/* Floating Job Card Overlay */}
                  <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-[90%] bg-white rounded-[30px] shadow-2xl p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Badge */}
                    <div className="top-bar flex justify-between items-center">
                      <div className="inline-block bg-blue-50 text-primary text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                        New Job Available!
                      </div>
                      <div className="mb-5">
                        <div className="w-7 h-7 rounded-full bg-[#DBEAFF]  shadow flex items-center justify-center text-primary">
                          <svg className="w-3 h-3" viewBox="0 0 14 15" fill="none" stroke="currentColor" strokeWidth={1.33333} xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.51185 13.3334C5.75004 13.7459 6.19019 14 6.66652 14C7.14285 14 7.583 13.7459 7.82119 13.3334M0.841185 9.55069C0.663244 9.74572 0.617156 10.0274 0.723656 10.269C0.830156 10.5105 1.06918 10.6665 1.33318 10.6667H11.9999C12.2638 10.6668 12.503 10.5111 12.6098 10.2697C12.7166 10.0283 12.6708 9.7466 12.4932 9.55136C11.6065 8.63736 10.6665 7.66602 10.6665 4.66669C10.6665 2.45903 8.87418 0.666687 6.66652 0.666687C4.45886 0.666687 2.66652 2.45903 2.66652 4.66669C2.66652 7.66602 1.72585 8.63735 0.841185 9.55069Z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Job Title */}
                    <h4 className="text-lg font-semibold text-[#01122E]">Site Construction Assistant</h4>
                    {/* Location */}
                    <p className="text-sm text-[#676767] mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 11 13" fill="none" stroke="currentColor" strokeWidth={1.16667} xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.91634 5.24998C9.91634 8.16256 6.68526 11.1959 5.60026 12.1327C5.39261 12.2889 5.10674 12.2889 4.89909 12.1327C3.81409 11.1959 0.583008 8.16256 0.583008 5.24998C0.583008 2.67438 2.67407 0.583313 5.24967 0.583313C7.82528 0.583313 9.91634 2.67438 9.91634 5.24998" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.5 5.25C3.5 6.21585 4.28415 7 5.25 7C6.21585 7 7 6.21585 7 5.25C7 4.28415 6.21585 3.5 5.25 3.5C4.28415 3.5 3.5 4.28415 3.5 5.25V5.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Gurugram, Haryana</p>
                    {/* Salary */}
                    <div className="flex flex-col mt-3">
                      <span className="mb-3 text-sm text-[#676767]"><span className="text-xl text-[#00BC7D] font-bold">₹750 </span>/ Day</span>
                      <button className="bg-[#0658C2] w-full text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#054a9e] transition-all">
                        View & Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SECTION - FOR EMPLOYERS */}
              <div className="flex flex-col items-start space-y-6">
                <div>
                  <div className="mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#DBEAFF]  shadow flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.66667} xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.333 16H18.6663M13.333 10.6667H18.6663M18.6663 28V24C18.6663 22.5282 17.4714 21.3334 15.9997 21.3334C14.5279 21.3334 13.333 22.5282 13.333 24V28" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8.00033 13.3333H5.33366C3.86189 13.3333 2.66699 14.5282 2.66699 16V25.3333C2.66699 26.8051 3.86189 28 5.33366 28H26.667C28.1388 28 29.3337 26.8051 29.3337 25.3333V12C29.3337 10.5282 28.1388 9.33331 26.667 9.33331H24.0003" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 28V6.66667C8 5.19489 9.19489 4 10.6667 4H21.3333C22.8051 4 24 5.19489 24 6.66667V28" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                    FOR EMPLOYERS
                  </span>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#01122E] mt-2 leading-tight">
                    Hire Skilled Workers Easily
                  </h2>
                </div>

                {/* Bullet points */}
                <ul className="space-y-4">
                  {employerBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckIcon color="#0658C2" bgColor="#DBEAFF" />
                      <span className="text-[#676767] text-base">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button className="mt-4  w-full md:w-auto bg-[#0658C2] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg hover:bg-[#054a9e] transition-all duration-300 hover:-translate-y-1">
                  Post a Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <DownloadSection />

    </div>
  );
}