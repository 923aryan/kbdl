/** Indian states & UTs for searchable address dropdowns (country fixed: IN). */
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type PincodeLookupResult = {
  state: string;
  district: string;
  cities: string[];
};

type PostalPincodeOffice = {
  State?: string;
  District?: string;
  Name?: string;
};

type PostalPincodeResponse = {
  Status?: string;
  PostOffice?: PostalPincodeOffice[];
};

/** Free India Post pincode lookup — fills state + city/district options. */
export async function lookupIndianPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const digits = pincode.replace(/\D/g, '');
  if (digits.length !== 6) return null;

  const response = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as PostalPincodeResponse[];
  const block = payload[0];
  if (!block || block.Status !== 'Success' || !block.PostOffice?.length) return null;

  const state = block.PostOffice[0]?.State?.trim() ?? '';
  const district = block.PostOffice[0]?.District?.trim() ?? '';
  const cities = [
    ...new Set(
      block.PostOffice.map((office) => office.Name?.trim() || office.District?.trim() || '')
        .filter(Boolean),
    ),
  ];

  if (!state) return null;
  return { state, district, cities: cities.length ? cities : district ? [district] : [] };
}

export function filterStates(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...INDIAN_STATES];
  return INDIAN_STATES.filter((state) => state.toLowerCase().includes(q));
}
