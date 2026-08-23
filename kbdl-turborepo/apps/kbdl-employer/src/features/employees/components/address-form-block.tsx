'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AsyncSearchSelect } from '@/components/ui/dropdowns/AsyncSearchSelect';
import { filterStates, lookupIndianPincode } from '../lib/india-address';

export type AddressBlockValues = {
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

type AddressFormBlockProps = {
  title: string;
  required?: boolean;
  disabled?: boolean;
  showErrors?: boolean;
  values: AddressBlockValues;
  errors?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  onChange: (patch: Partial<AddressBlockValues>) => void;
};

export function AddressFormBlock({
  title,
  required = false,
  disabled = false,
  showErrors = false,
  values,
  errors,
  onChange,
}: AddressFormBlockProps) {
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeHint, setPincodeHint] = useState<string | null>(null);

  const stateOptions = useMemo(
    () =>
      filterStates(stateSearch).map((state) => ({
        id: state,
        label: state,
      })),
    [stateSearch],
  );

  const filteredCityOptions = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    const base = cityOptions.length ? cityOptions : values.city ? [values.city] : [];
    const list = q ? base.filter((city) => city.toLowerCase().includes(q)) : base;
    return list.map((city) => ({ id: city, label: city }));
  }, [cityOptions, citySearch, values.city]);

  useEffect(() => {
    const digits = values.pincode.replace(/\D/g, '');
    if (digits.length !== 6 || disabled) {
      setPincodeHint(null);
      return;
    }

    let cancelled = false;
    setPincodeLoading(true);
    lookupIndianPincode(digits)
      .then((result) => {
        if (cancelled || !result) {
          if (!cancelled) setPincodeHint('Pincode not found — enter state and city manually.');
          return;
        }
        setCityOptions(result.cities);
        setPincodeHint(`Auto-filled from pincode (${result.district || result.state})`);
        onChange({
          state: result.state,
          city: result.cities[0] ?? result.district ?? values.city,
        });
      })
      .catch(() => {
        if (!cancelled) setPincodeHint('Could not lookup pincode — enter manually.');
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when pincode changes
  }, [values.pincode, disabled]);

  return (
    <section className="rounded-[20px] border border-[#D3D3D3] bg-[#FAFCFF] p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[#0658C2]" />
        <h3 className="text-base font-bold text-black">{title}</h3>
        {required && <span className="text-sm text-[#F54A4A]">*</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Country {required && <span className="text-[#F54A4A]">*</span>}</span><input disabled value="India" className="h-11 w-full rounded-lg border border-[#D3D3D3] bg-[#F3F3F3] px-4 text-sm text-[#525252]" /></label>

        <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Address Line {required && <span className="text-[#F54A4A]">*</span>}</span><input disabled={disabled} value={values.line1} onChange={(event) => onChange({ line1: event.target.value })} placeholder="House / Street / Village" className={`h-11 w-full rounded-lg border px-4 text-sm outline-none focus:border-[#0658C2] disabled:bg-[#F3F3F3] ${showErrors && required && !values.line1.trim() ? 'border-[#F54A4A]' : 'border-[#D3D3D3]'}`} />{showErrors && errors?.line1 && <span className="mt-1 block text-xs font-medium text-[#F54A4A]">{errors.line1}</span>}</label>

        <label className="block"><span className="mb-2 block text-sm font-semibold">Pincode {required && <span className="text-[#F54A4A]">*</span>}</span><input disabled={disabled} value={values.pincode} onChange={(event) => onChange({ pincode: event.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit pincode" inputMode="numeric" className={`h-11 w-full rounded-lg border px-4 text-sm outline-none focus:border-[#0658C2] disabled:bg-[#F3F3F3] ${showErrors && required && values.pincode.length !== 6 ? 'border-[#F54A4A]' : 'border-[#D3D3D3]'}`} />{(pincodeLoading || pincodeHint) && <span className="mt-1 block text-xs text-[#676767]">{pincodeLoading ? 'Looking up pincode…' : pincodeHint}</span>}{showErrors && errors?.pincode && <span className="mt-1 block text-xs font-medium text-[#F54A4A]">{errors.pincode}</span>}</label>

        <AsyncSearchSelect label="State" required={required} placeholder="Search state" valueId={values.state} valueLabel={values.state} search={stateSearch} onSearchChange={setStateSearch} options={stateOptions} error={showErrors ? errors?.state : undefined} onSelect={(option) => { onChange({ state: option.label }); setStateSearch(''); }} onClear={() => onChange({ state: '' })} />

        <div className="md:col-span-2"><AsyncSearchSelect label="City / Area" required={required} placeholder={cityOptions.length ? 'Search city from pincode results' : 'Enter pincode first or type city manually'} valueId={values.city} valueLabel={values.city} search={citySearch} onSearchChange={setCitySearch} options={filteredCityOptions} error={showErrors ? errors?.city : undefined} onSelect={(option) => { onChange({ city: option.label }); setCitySearch(''); }} onClear={() => onChange({ city: '' })} />{!cityOptions.length && <input disabled={disabled} value={values.city} onChange={(event) => onChange({ city: event.target.value })} placeholder="Or type city name" className={`mt-2 h-11 w-full rounded-lg border px-4 text-sm outline-none focus:border-[#0658C2] disabled:bg-[#F3F3F3] ${showErrors && required && !values.city.trim() ? 'border-[#F54A4A]' : 'border-[#D3D3D3]'}`} />}</div>
      </div>
    </section>
  );
}
