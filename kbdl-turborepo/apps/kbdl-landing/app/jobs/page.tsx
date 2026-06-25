import { DownloadSection } from "../../components/ui/download";
import HeroBanners from "../../components/ui/hero-banners";
import { BriefcaseBusiness, Search } from 'lucide-react';
import JobCard from '../../components/ui/JobCards';
import { jobs } from '../../app/data/jobs';


export default function Jobs () {
    return (
        <main>
            <HeroBanners/>
            <section className="h-screen bg-[#F8F9FC] py-[35px] md:py-[55px] lg:py-[70px] px-4 md:px-8">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Heading */}
                    <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-2 flex items-center gap-3">
                        <BriefcaseBusiness size={26} />

                        <h1 className="text-3xl font-bold text-[#1E293B]">
                            Job Opportunities
                        </h1>
                        </div>

                        <p className="text-sm leading-6 text-[#64748B]">
                            Discover verified blue collar job opportunities from trusted
                            employers. Browse jobs based on your skills, preferred location,
                            and shift availability.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]"
                        />

                        <input
                        type="text"
                        placeholder="Search jobs..."
                        className="h-12 w-[320px] rounded-xl border border-[#D9D9D9] bg-white px-4 pr-12 text-sm outline-none focus:border-[#1565D8]"
                        />
                    </div>
                    </div>

                </div>
                {/* Scrollable Jobs Section */}
                <div className="h-[calc(100vh-190px)] overflow-y-auto">
                    <div className="container mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 pb-[16px]">
                        {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                    </div>
                </div>
            </section>
            <DownloadSection/>
        </main>
    )
}