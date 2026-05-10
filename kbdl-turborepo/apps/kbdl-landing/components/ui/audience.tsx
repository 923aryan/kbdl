import type { JSX } from "react";

const audienceCards = [
  {
    title: "Factory HR/",
    subtitle: "Employer",
    description:
      "Hire verified workers for your factory. Approve shift swaps in one click. Never face production loss again.",
    image:
      "https://plus.unsplash.com/premium_photo-1661932816149-291a447e3022?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    bgClass: "bg-[#EEF7F1]",
    buttonColor: "text-[#0658C2]",
  },
  {
    title: "Blue-Collar Worker",
    subtitle: "Job Seeker",
    description:
      "Get your free Karigari Skill Card. Swap shifts without losing wages. Find better jobs near you.",
    image:
      "https://media.istockphoto.com/id/945923864/photo/wearing-a-welder-mask-while-looking-at-the-camera.jpg?s=2048x2048&w=is&k=20&c=dbxEzi2OOnk44VkmCA1i8Jrz-2LOEo1FQl0KdifQtLo=",
    bgClass: "bg-[#EEF4FF]",
    buttonColor: "text-[#0658C2]",
  },
  {
    title: "Placement Agent",
    subtitle: "Recruiter",
    description:
      'Digitize your entire worker network. Get "Placed by" branding on every Karigari Card. Free listings.',
    image:
      "https://media.istockphoto.com/id/1263752807/photo/portrait-of-a-female-entrepreneur-in-the-chemical-factory.jpg?s=2048x2048&w=is&k=20&c=Qx0cBUxAxCEps8uql09BgL-No4mdc5zfJ9gp32CCVnI=",
    bgClass: "bg-[#F8F1E8]",
    buttonColor: "text-[#0658C2]",
  },
];

export default function AudienceSection(): JSX.Element {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-[1300px] mx-auto flex flex-col items-center text-center">
        {/* Small Heading */}
        <span className="text-[#0658C2] text-xs font-bold tracking-[2.5px] uppercase mb-4">
          Whom We Are Serving
        </span>

        {/* Main Heading */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E293B] mb-5 leading-tight">
          Trusted Hiring Platform for Everyone
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg max-w-2xl mb-16">
          Kaam Badlo is a trusted platform that empowers businesses to hire
          blue-collar professionals with speed, transparency, and confidence.
        </p>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {audienceCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgClass} rounded-2xl md:rounded-[24px] p-5 md:p-6 text-left flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer group`}
            >
              {/* Image + Title row */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                {/* Image Container */}
                <div className="relative w-full sm:w-24 h-28 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title and Subtitle */}
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#1E293B] leading-tight">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <h3 className="text-lg md:text-xl font-bold text-[#1E293B] leading-tight">
                      {card.subtitle}
                    </h3>
                  )}
                  <p className="text-gray-600 leading-relaxed text-sm mb-6">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Learn More Button */}
              <button
                className={`flex items-center gap-1.5 ${card.buttonColor} font-semibold text-sm hover:gap-3 transition-all duration-300 mt-auto group`}
              >
                Learn more
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
