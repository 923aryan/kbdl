import { Calendar, Clock3, MapPin } from 'lucide-react';

interface JobCardProps {
  job: {
    id: number;
    title: string;
    company: string;
    salary: string;
    location: string;
    time: string;
    date: string;
    postedAt: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="rounded-3xl border border-[#E8E8E8] bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 gap-3 pr-[5px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-semibold text-white">
            {job.company.charAt(0)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="group relative min-w-0">
              <h3 className="md:truncate text-xl font-semibold text-[#263238]">{job.title}</h3>

              <div className="absolute left-0 top-full z-20 mt-2 hidden max-w-xs rounded-lg bg-black px-3 py-2 text-sm text-white shadow-lg group-hover:block">
                {job.title}
              </div>
            </div>

            <div className="group relative min-w-0">
              <p className="md:truncate text-sm text-[#707070]">
                {job.company}
                <span className="ml-1 text-green-500">●</span>
              </p>

              <div className="absolute left-0 top-full z-20 mt-2 hidden max-w-xs rounded-lg bg-black px-3 py-2 text-sm text-white shadow-lg group-hover:block">
                {job.company}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#E8F8E8] px-3 py-1">
          <span className="text-lg font-semibold text-[#4CAF50]">{job.salary}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-[#BDBDBD]" />

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} />

          <span className="font-medium text-[#1E293B]">{job.location}</span>

        </div>

        <div className="flex items-center gap-2">
          <Clock3 size={16} />
          <span className="font-medium">{job.time}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span className="font-medium">{job.date}</span>
        </div>

        <p className="text-xs text-[#9CA3AF]">{job.postedAt}</p>
      </div>

      <button className="mt-5 w-full rounded-xl bg-[#1565D8] py-3 text-base font-medium text-white transition-all hover:bg-[#0E4FB0] cursor-pointer">
        Apply
      </button>
    </div>
  );
}