export const INDIAN_RELIGIONS = [
  'Hinduism',
  'Islam',
  'Christianity',
  'Sikhism',
  'Buddhism',
  'Jainism',
  'Zoroastrianism',
  'Judaism',
  'Baháʼí',
  'Other',
  'Prefer not to say',
] as const;

/** Common languages spoken in India (searchable multi-select). */
export const INDIAN_LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Odia',
  'Assamese',
  'Urdu',
  'Sanskrit',
  'Konkani',
  'Manipuri',
  'Nepali',
  'Sindhi',
  'Kashmiri',
  'Dogri',
  'Maithili',
  'Santali',
  'Bodo',
  'Bhojpuri',
  'Haryanvi',
  'Rajasthani',
] as const;

export function filterOptions(options: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...options];
  return options.filter((item) => item.toLowerCase().includes(q));
}

export function parseCommaList(value: string): string[] {
  return [...new Set(value.split(',').map((part) => part.trim()).filter(Boolean))];
}

export function joinCommaList(values: string[]): string {
  return values.join(', ');
}
