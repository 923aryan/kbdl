"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, Star, ArrowRight, Calendar, Clock } from "lucide-react";
import HeroBanners from '../../components/ui/hero-banners';


/* =========================================================
   TYPES
========================================================= */
type BlogCategory = "Jobs & Workforce" | "How-to Guides" | "Industry News";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  image: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt: string;
  readTimeMinutes: number;
  featured?: boolean;
}

interface PopularPost {
  id: string;
  slug: string;
  title: string;
  image: string;
}

/* =========================================================
   DUMMY DATA — replace with a real fetch once /blog API exists.
   Keep this same BlogPost shape so nothing below needs to change.
========================================================= */
const dummyBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "how-to-find-verified-factory-jobs-near-you-2026",
    title: "How to Find Verified Factory Jobs Near You in 2026",
    excerpt:
      "Learn the best strategies to browse and apply for verified manufacturing and factory positions in your city without any middlemen or delays.",
    category: "How-to Guides",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80",
    authorName: "Kaam Badlo Private Limited",
    publishedAt: "2026-07-15",
    readTimeMinutes: 7,
    featured: true,
  },
  {
    id: "2",
    slug: "step-by-step-guide-to-swapping-shifts",
    title: "A Step-by-Step Guide to Swapping Shifts on KaamBadlo",
    excerpt: "Shift swapping has never been easier. Follow this simple guide to instantly swap your shift with an eligible coworker.",
    category: "How-to Guides",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
    authorName: "Priya Nair",
    authorAvatar: "https://i.pravatar.cc/64?img=47",
    publishedAt: "2025-05-28",
    readTimeMinutes: 4,
  },
  {
    id: "3",
    slug: "blue-collar-employment-trends-2025",
    title: "Blue-Collar Employment in India: Trends to Watch in 2025",
    excerpt: "The blue-collar job market is evolving fast. Discover the top hiring trends, in-demand skills, and cities driving growth.",
    category: "Industry News",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
    authorName: "Ankit Verma",
    authorAvatar: "https://i.pravatar.cc/64?img=12",
    publishedAt: "2025-05-15",
    readTimeMinutes: 6,
  },
  {
    id: "4",
    slug: "getting-paid-same-day-instant-pay",
    title: "Getting Paid Same Day: How KaamBadlo Instant Pay Works",
    excerpt: "No more waiting for weekly wages. Understand how our same-day payment system ensures your money reaches you on time, every time.",
    category: "How-to Guides",
    image: "https://images.unsplash.com/photo-1580983230786-e0d4784dd4ee?auto=format&fit=crop&w=800&q=80",
    authorName: "Suresh Kumar",
    authorAvatar: "https://i.pravatar.cc/64?img=33",
    publishedAt: "2025-04-10",
    readTimeMinutes: 3,
  },
  {
    id: "5",
    slug: "warehouse-logistics-fastest-growing-sector",
    title: "Warehouse & Logistics: Fastest-Growing Job Sector in India",
    excerpt: "E-commerce growth is fueling an unprecedented demand for warehouse workers. Here is what that means for job seekers.",
    category: "Industry News",
    image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80",
    authorName: "Deepa Joshi",
    authorAvatar: "https://i.pravatar.cc/64?img=25",
    publishedAt: "2025-03-22",
    readTimeMinutes: 5,
  },
  {
    id: "6",
    slug: "apply-smartly-what-employers-look-for",
    title: "Apply Smartly: Don't Just Apply Randomly — Here's What Employers Look For",
    excerpt: "Recruiters scan applications in seconds. Here's how to structure yours so it doesn't get skipped over.",
    category: "Jobs & Workforce",
    image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=800&q=80",
    authorName: "Kaam Badlo Private Limited",
    publishedAt: "2025-03-02",
    readTimeMinutes: 5,
  },
  {
    id: "7",
    slug: "assembly-line-safety-checklist",
    title: "The 10-Point Safety Checklist Every Assembly Line Worker Needs",
    excerpt: "A quick, practical checklist to run through before every shift on the floor — printable and supervisor-approved.",
    category: "Jobs & Workforce",
    image: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=800&q=80",
    authorName: "Ankit Verma",
    authorAvatar: "https://i.pravatar.cc/64?img=12",
    publishedAt: "2025-02-18",
    readTimeMinutes: 4,
  },
  {
    id: "8",
    slug: "skill-card-verification-explained",
    title: "What Is a Skill Card, and Why Does Verification Matter?",
    excerpt: "Your skill card follows you across every job on the platform. Here's what gets checked, and why it saves you time later.",
    category: "How-to Guides",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    authorName: "Priya Nair",
    authorAvatar: "https://i.pravatar.cc/64?img=47",
    publishedAt: "2025-01-30",
    readTimeMinutes: 6,
  },
];

const dummyPopularPosts: PopularPost[] = [
  { id: "p1", slug: "apply-smartly-what-employers-look-for", title: "Apply Smartly: Don't just apply randomly. Here's what employer looks for...", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=200&q=80" },
  { id: "p2", slug: "apply-smartly-what-employers-look-for", title: "Apply Smartly: Don't just apply randomly. Here's what employer looks for...", image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=200&q=80" },
  { id: "p3", slug: "apply-smartly-what-employers-look-for", title: "Apply Smartly: Don't just apply randomly. Here's what employer looks for...", image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=200&q=80" },
  { id: "p4", slug: "apply-smartly-what-employers-look-for", title: "Apply Smartly: Don't just apply randomly. Here's what employer looks for...", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=200&q=80" },
  { id: "p5", slug: "apply-smartly-what-employers-look-for", title: "Apply Smartly: Don't just apply randomly. Here's what employer looks for...", image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=200&q=80" },
];

const dummyPopularSearches: string[] = [
  "Test 1", "Test 2", "Test 3", "Test 2", "Test 1", "Test 3",
  "Test 3", "Test 1", "Test 2", "Test 1", "Test 3", "Test 2",
  "Test 1", "Test 2", "Test 3", "Test 2", "Test 1", "Test 3",
];

const blogCategories = ["All", "Jobs & Workforce", "How-to Guides", "Industry News"] as const;

const PAGE_SIZE = 6;

/* =========================================================
   HELPERS
========================================================= */
function formatBlogDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const categoryStyles: Record<string, string> = {
  "Jobs & Workforce": "bg-white/95 text-[#1E293B]",
  "How-to Guides": "bg-white/95 text-[#1E293B]",
  "Industry News": "bg-[#01122E]/95 text-white",
};

/* =========================================================
   PAGE
========================================================= */
export default function BlogPage() {
  const posts = dummyBlogPosts;

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const featuredPost = useMemo(
    () => posts.find((post) => post.featured) ?? posts[0],
    [posts],
  );

  const filteredPosts = useMemo(() => {
    let result = posts.filter((post) => post.id !== featuredPost?.id);

    if (activeCategory !== "All") {
      result = result.filter((post) => post.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(term) ||
          post.excerpt.toLowerCase().includes(term),
      );
    }

    result = [...result].sort((a, b) => {
      const diff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return result;
  }, [posts, featuredPost, activeCategory, searchTerm, sortOrder]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setVisibleCount(PAGE_SIZE);
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: wire up to the real newsletter API once available
    setSubscribed(true);
  }

  return (
    <main>
      {/* ============ HERO ============ */}
              <>
                <HeroBanners />
              </>

      {/* ============ CATEGORY TABS ============ */}
      <div className="flex flex-wrap gap-3 bg-[#F1F4F9] px-4 py-4 md:px-8">
        <div className="container mx-auto flex max-w-7xl flex-wrap gap-3">
          {blogCategories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#0658C2] text-white"
                    : "border border-[#D9D9D9] bg-white text-[#475569] hover:border-[#0658C2] hover:text-[#0658C2]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ MAIN LIST SECTION ============ */}
      <section className="bg-white px-4 py-10 md:px-8 md:py-14">
        <div className="container mx-auto max-w-7xl">
          {/* Heading row */}
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1E293B]">Latest Articles</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Showing {visiblePosts.length} of {filteredPosts.length} articles
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search articles..."
                  className="h-12 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 pr-12 text-sm outline-none focus:border-[#1565D8] sm:w-[280px]"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="h-12 rounded-xl border border-[#D9D9D9] bg-white px-4 text-sm text-[#475569] outline-none focus:border-[#1565D8]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>
          </div>

          {/* Featured post */}
          {featuredPost && activeCategory === "All" && !searchTerm && (
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group relative mb-10 block h-[420px] w-full overflow-hidden rounded-2xl md:h-[460px]"
            >
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#01122E]/90 via-[#01122E]/30 to-transparent" />
              <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95">
                <Star size={18} className="fill-[#F5A623] text-[#F5A623]" />
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h2 className="max-w-2xl text-2xl font-bold leading-snug text-white md:text-3xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-[15px]">
                  {featuredPost.excerpt}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0658C2] text-sm font-semibold text-white">KB</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{featuredPost.authorName}</p>
                      <p className="text-xs text-white/60">{formatBlogDate(featuredPost.publishedAt)}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    Read More <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          )}

          <div className="mb-6 flex items-center gap-4">
            <span className="text-xs font-semibold tracking-wider text-[#94A3B8]">MORE ARTICLES</span>
            <div className="h-px flex-1 bg-[#EDEFF3]" />
          </div>

          {/* Grid + sidebar */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              {visiblePosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {visiblePosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#EDEFF3] bg-white transition-shadow hover:shadow-lg"
                    >
                      <div className="relative h-[190px] w-full overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold ${categoryStyles[post.category]}`}>
                          {post.category}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-[15px] font-semibold leading-snug text-[#1E293B] group-hover:text-[#0658C2]">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#64748B]">{post.excerpt}</p>

                        <div className="mt-3 flex items-center gap-3 text-[11px] text-[#94A3B8]">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {formatBlogDate(post.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {post.readTimeMinutes} min read</span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#F1F4F9] pt-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 overflow-hidden rounded-full bg-[#E2E8F0]">
                              {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[#475569]">KB</div>
                              )}
                            </div>
                            <span className="text-xs font-medium text-[#334155]">{post.authorName}</span>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#0658C2]">
                            Read <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-[#64748B]">No articles match your search just yet.</p>
              )}

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 4)}
                    className="flex items-center gap-2 rounded-xl bg-[#0658C2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#044499]"
                  >
                    Load More Articles <RefreshCw size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-8">
              <div>
                <h3 className="mb-4 text-base font-bold text-[#1E293B]">Popular Posts</h3>
                <div className="flex flex-col gap-4">
                  {dummyPopularPosts.map((post, index) => (
                    <Link key={`${post.id}-${index}`} href={`/blog/${post.slug}`} className="group flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div>
                        <p className="line-clamp-2 text-[13px] font-medium leading-5 text-[#1E293B] group-hover:text-[#0658C2]">{post.title}</p>
                        <span className="mt-1 inline-block text-xs font-semibold text-[#0658C2]">Read More →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-base font-bold text-[#1E293B]">Popular Search</h3>
                <div className="flex flex-wrap gap-2">
                  {dummyPopularSearches.map((term, index) => (
                    <button
                      key={`${term}-${index}`}
                      type="button"
                      className="rounded-lg bg-[#EEF0FB] px-3 py-1.5 text-xs font-medium text-[#4C5FAD] transition-colors hover:bg-[#0658C2] hover:text-white"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="bg-[#0B1330] px-4 py-16 md:px-8">
        <div className="container mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-block rounded-full bg-[#0658C2] px-4 py-1.5 text-xs font-semibold text-white">STAY UPDATED</span>
          <h2 className="text-2xl font-bold text-white md:text-3xl">Get the Latest Job &amp; Workforce Tips</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#94A3B8]">
            Join thousands of workers who receive our weekly newsletter packed with job alerts, skill tips, and industry news.
          </p>
          <form onSubmit={handleSubscribe} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-12 flex-1 rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white placeholder-white/40 outline-none focus:border-[#0658C2]"
            />
            <button type="submit" className="h-12 rounded-lg bg-[#0658C2] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#044499]">
              {subscribed ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}