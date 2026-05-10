import Image from "next/image";
import Link from "next/link";

import workerImg from "../../public/blue-collar.png";
import factoryImg from "../../public/factory-hr.png";
import agentImg from "../../public/placement-agent.png";

export default function WhomWeServeSection() {

  // Data array to keep the component clean and DRY
  const cards = [
    {
      id: 1,
      title: "Factory HR / \nEmployer",
      desc: "Hire verified workers for your factory. Approve shift swaps in one click. Never face production loss again.",
      link: "/employer",
      imgSrc: factoryImg, // Replace with your actual imported variable
      bgClass: "bg-[#F2FCF5]", // Soft light green
    },
    {
      id: 2,
      title: "Reliable Home \nServices",
      desc: "Get trusted help for daily household needs. From cleaning to maintenance, find reliable support without the hassle.",
      link: "/worker",
      imgSrc: workerImg, // Replace with your actual imported variable
      bgClass: "bg-[#F0F5FF]", // Soft light blue
    },
    {
      id: 3,
      title: "Service \nPartner",
      desc: "Join as a verified service provider.Get customer leads, manage bookings and grow your business faster. Service Partners",
      link: "/agent",
      imgSrc: agentImg, // Replace with your actual imported variable
      bgClass: "bg-[#FFF8F0]", // Soft light orange
    }
  ];

  return (
    <section className="py-8 px-4 md:px-8 bg-white">
      <div className="max-w-350 mx-auto">

        {/* 1. Header Area */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary text-xs font-bold tracking-widest uppercase mb-4 block">
            Whom We Are Serving
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-6">
            Trusted Hiring Platform for Everyone
          </h2>
          <p className="text-gray-500 text-base md:text-lg leading-relaxed">
            Kaam Badlo is a trusted platform that empowers businesses to hire blue-collar
            professionals with speed, transparency, and confidence.
          </p>
        </div>

        {/* 2. Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`${card.bgClass} rounded-4xl p-6 lg:p-8 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-6 transition-transform hover:-translate-y-1`}
            >
              {/* Card Image */}
              <div className="relative w-full sm:w-32.5 lg:w-full xl:w-32.5 h-45 sm:h-32.5 lg:h-45 xl:h-32.5 shrink-0 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={card.imgSrc}
                  alt={card.title.replace('\n', ' ')}
                  fill
                  className="object-cover object-center"
                />
              </div>

              {/* Card Content */}
              <div className="flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-navy mb-3 whitespace-pre-line">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed">
                  {card.desc}
                </p>

                {/* Link */}
                <Link
                  href={card.link}
                  className="text-primary font-semibold text-sm flex items-center hover:underline mt-auto"
                >
                  Learn more <span className="ml-1" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}