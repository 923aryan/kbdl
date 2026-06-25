"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { bannerData } from "../../app/data/bannerData";
import Link from "next/link";

export default function HeroBanners() {
  const pathname = usePathname();

  const data =
    bannerData[pathname as keyof typeof bannerData] || bannerData["/"];

  return (
    <section className="relative w-full min-h-175 md:min-h-150 flex flex-col justify-center items-center overflow-hidden bg-navy">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={data.bgImage}
          alt={data.title}
          fill
          priority
          className="object-cover object-center opacity-90"
        />
        {/* DARK OVERLAY */}
        {/* <div className="absolute inset-0 bg-black/30" /> */}

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-linear-to-r from-[#010C1E]/10 via-navy/80 to-navy/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6 mx-auto mt-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0D6EFD]/40 bg-[#0A1D3A]/80 backdrop-blur-md shadow-[0_0_25px_rgba(13,110,253,0.15)] mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

          <span className="text-[9px] sm:text-[11px] md:text-[12px] font-bold tracking-[3px] uppercase text-[#8DBDFF]">
            {data.badge}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white mb-6 leading-[1.15]">
          {data.title}
          <br />
          <span className="text-primary">{data.highlight}</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
          {data.description}
        </p>

        {/* Home Page Buttons Only */}
        {data.showButtons && (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/workers"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0658C2] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Hire Workers
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/jobs"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Find Job
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/shift"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-gray-500 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Find Shifts
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
