'use client';

import { useMemo, useState } from 'react';

type FormState = {
  title: string;
  subtitle: string;
  author: string;
  category: string;
  location: string;
  tags: string;
  imageUrl: string;
  body: string;
  verified: boolean;
};

const initialState: FormState = {
  title: 'How to Find Verified Factory Jobs Near You in 2026',
  subtitle:
    'A practical roadmap for browsing and applying to real factory openings without getting trapped by middlemen or fake postings.',
  author: 'Kaam Badlo Team',
  category: 'How-to Guide',
  location: 'Noida, Uttar Pradesh',
  tags: 'Factory Jobs, Verified Employers, Job Search 2026',
  imageUrl:
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
  body: 'Start by checking the verification badge, reading the pay terms carefully, and applying directly through the official posting. A verified listing helps you avoid agent fees and fake addresses.',
  verified: true,
};

export default function TestBlogPage() {
  const [form, setForm] = useState<FormState>(initialState);

  const tagList = useMemo(() => {
    return form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [form.tags]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row">
        <section className="w-full lg:w-[45%]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
                Admin test form
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Blog / article preview tester
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Fill in the fields below and the right-side preview will update instantly.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Subtitle</label>
                <textarea
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="Enter article subtitle"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Author</label>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option>How-to Guide</option>
                    <option>Industry News</option>
                    <option>Employer Update</option>
                    <option>Worker Tips</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                    placeholder="e.g. Noida, Uttar Pradesh"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Image URL</label>
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                    placeholder="Paste image URL"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tags</label>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="Separate tags with commas"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Body</label>
                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="Enter article body content"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="verified"
                  checked={form.verified}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                Show verified badge
              </label>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-[55%]">
          <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-white text-slate-900 shadow-2xl shadow-black/20">
            <img src={form.imageUrl} alt={form.title} className="h-64 w-full object-cover" />
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
                <span className="rounded-full bg-sky-100 px-3 py-1">{form.category}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{form.location}</span>
                {form.verified ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    Verified
                  </span>
                ) : null}
              </div>

              <h2 className="text-3xl font-semibold text-slate-900">{form.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{form.subtitle}</p>

              <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 font-semibold text-white">
                  {form.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">{form.author}</p>
                  <p>Admin preview • live output</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                <p>{form.body}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto mt-8 max-w-7xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-white">What each input shows</h3>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          <li>
            <span className="font-semibold text-white">Title:</span> shows in the main heading.
          </li>
          <li>
            <span className="font-semibold text-white">Subtitle:</span> shows under the heading as
            supporting text.
          </li>
          <li>
            <span className="font-semibold text-white">Author:</span> appears in the author block
            and initials circle.
          </li>
          <li>
            <span className="font-semibold text-white">Category:</span> appears as a badge at the
            top.
          </li>
          <li>
            <span className="font-semibold text-white">Location:</span> appears as a location badge.
          </li>
          <li>
            <span className="font-semibold text-white">Tags:</span> each comma-separated value
            becomes a hashtag chip.
          </li>
          <li>
            <span className="font-semibold text-white">Image URL:</span> shows in the hero image
            area.
          </li>
          <li>
            <span className="font-semibold text-white">Body:</span> appears inside the main content
            card.
          </li>
          <li>
            <span className="font-semibold text-white">Verified checkbox:</span> toggles the green
            Verified badge.
          </li>
        </ul>
      </section>
    </main>
  );
}
