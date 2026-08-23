'use client';

import type { CompanyCatalogView } from '@repo/types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  createCatalogBranch,
  createCatalogDepartment,
  createCatalogDesignation,
  createCatalogHoliday,
  createCatalogWorkShift,
  fetchCompanyCatalog,
  saveCatalogHq,
} from '../api';

const empty: CompanyCatalogView = {
  hq: null,
  departments: [],
  designations: [],
  branches: [],
  work_shifts: [],
  holidays: [],
};

export function CompanyOrgSetupScreen() {
  const [catalog, setCatalog] = useState<CompanyCatalogView>(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dept, setDept] = useState({ name: '', description: '' });
  const [title, setTitle] = useState({ name: '', description: '' });
  const [branch, setBranch] = useState({ name: '', latitude: '', longitude: '' });
  const [hq, setHq] = useState({ latitude: '', longitude: '' });
  const [shift, setShift] = useState({ name: '', start_time: '09:00', end_time: '18:00', break_minutes: 60 });
  const [holiday, setHoliday] = useState({ date: '', name: '', is_optional: false });

  const load = () => {
    setLoading(true);
    fetchCompanyCatalog()
      .then((res) => {
        setCatalog(res.data);
        if (res.data.hq) {
          setHq({
            latitude: String(res.data.hq.latitude),
            longitude: String(res.data.hq.longitude),
          });
        }
      })
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to load catalog'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (task: () => Promise<{ data: CompanyCatalogView }>, ok: string) => {
    setBusy(true);
    try {
      const res = await task();
      setCatalog(res.data);
      toast.success(ok);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const useMyLocation = (target: 'hq' | 'branch') => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude.toFixed(6);
        const longitude = pos.coords.longitude.toFixed(6);
        if (target === 'hq') setHq({ latitude, longitude });
        else setBranch((current) => ({ ...current, latitude, longitude }));
      },
      () => toast.error('Could not read GPS. Allow location and try again.'),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#676767]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading company catalog…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-[#0658C2]">Company · catalogs</p>
        <h1 className="mt-1 text-2xl font-bold">Set up company catalogs</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#676767]">
          Fill these before onboarding employees. Departments, job titles, work shifts, and punch
          locations are company-wide. Employees mark attendance within 50 metres of the branch GPS
          you save here. Leave types are under Leave → Leave Types. A manager applying leave picks
          one of those types (Casual, Sick, Earned, …) for the employee.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/employees/onboard" className="inline-flex h-10 items-center rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white">
            Onboard employee
          </Link>
          <Link href="/leave/types" className="inline-flex h-10 items-center rounded-lg border border-[#D3D3D3] px-4 text-sm font-semibold">
            Leave types
          </Link>
        </div>

        <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Punch locations</h2>
          <p className="mt-1 text-sm text-[#676767]">
            Head office is the fallback GPS. Each branch needs its own lat/long so workers at that
            site can punch in. Paste coordinates from Google Maps or use this device’s GPS.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input value={hq.latitude} onChange={(e) => setHq({ ...hq, latitude: e.target.value })} placeholder="HQ latitude" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input value={hq.longitude} onChange={(e) => setHq({ ...hq, longitude: e.target.value })} placeholder="HQ longitude" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <button type="button" onClick={() => useMyLocation('hq')} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm font-semibold">
              Use my GPS
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => saveCatalogHq({ latitude: Number(hq.latitude), longitude: Number(hq.longitude) }),
                  'Head-office location saved',
                )
              }
              className="h-11 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Save HQ
            </button>
          </div>
          <p className="mt-2 text-xs text-[#676767]">
            HQ GPS: {catalog.hq ? `${catalog.hq.latitude}, ${catalog.hq.longitude}` : 'not set'}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
            <input value={branch.name} onChange={(e) => setBranch({ ...branch, name: e.target.value })} placeholder="Branch name e.g. Plant 1" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input value={branch.latitude} onChange={(e) => setBranch({ ...branch, latitude: e.target.value })} placeholder="Latitude" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input value={branch.longitude} onChange={(e) => setBranch({ ...branch, longitude: e.target.value })} placeholder="Longitude" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <button type="button" onClick={() => useMyLocation('branch')} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm font-semibold">
              GPS
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void run(async () => {
                  const res = await createCatalogBranch({
                    name: branch.name,
                    latitude: Number(branch.latitude),
                    longitude: Number(branch.longitude),
                  });
                  setBranch({ name: '', latitude: '', longitude: '' });
                  return res;
                }, 'Branch added');
              }}
              className="h-11 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add branch
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {catalog.branches.map((row) => (
              <li key={row.id} className="flex justify-between rounded-lg bg-[#F6F7F9] px-3 py-2">
                <span>{row.name}</span>
                <span className="text-[#676767]">
                  {row.has_location ? `${row.latitude}, ${row.longitude}` : 'no GPS — punch will fail'}
                </span>
              </li>
            ))}
            {catalog.branches.length === 0 ? <li className="text-[#676767]">No branches yet</li> : null}
          </ul>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CatalogCard
            title="Departments"
            hint="Shown on employee onboard. Add Production, Maintenance, etc."
            name={dept.name}
            extra={dept.description}
            extraPlaceholder="Description (optional)"
            onName={(name) => setDept({ ...dept, name })}
            onExtra={(description) => setDept({ ...dept, description })}
            onAdd={() =>
              void run(async () => {
                const res = await createCatalogDepartment(dept);
                setDept({ name: '', description: '' });
                return res;
              }, 'Department added')
            }
            busy={busy}
            rows={catalog.departments.map((row) => row.name)}
          />
          <CatalogCard
            title="Job titles"
            hint="Designations such as Worker, Supervisor, Technician."
            name={title.name}
            extra={title.description}
            extraPlaceholder="Description (optional)"
            onName={(name) => setTitle({ ...title, name })}
            onExtra={(description) => setTitle({ ...title, description })}
            onAdd={() =>
              void run(async () => {
                const res = await createCatalogDesignation(title);
                setTitle({ name: '', description: '' });
                return res;
              }, 'Job title added')
            }
            busy={busy}
            rows={catalog.designations.map((row) => row.name)}
          />
        </div>

        <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Work shifts</h2>
          <p className="mt-1 text-sm text-[#676767]">Templates assigned on onboard. Attendance punches against the assigned shift.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_110px_110px_110px_auto]">
            <input value={shift.name} onChange={(e) => setShift({ ...shift, name: e.target.value })} placeholder="e.g. Morning" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input type="time" value={shift.start_time} onChange={(e) => setShift({ ...shift, start_time: e.target.value })} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input type="time" value={shift.end_time} onChange={(e) => setShift({ ...shift, end_time: e.target.value })} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input type="number" min={0} value={shift.break_minutes} onChange={(e) => setShift({ ...shift, break_minutes: Number(e.target.value) })} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const res = await createCatalogWorkShift(shift);
                  setShift({ name: '', start_time: '09:00', end_time: '18:00', break_minutes: 60 });
                  return res;
                }, 'Shift added')
              }
              className="h-11 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add shift
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {catalog.work_shifts.map((row) => (
              <li key={row.id} className="flex justify-between rounded-lg bg-[#F6F7F9] px-3 py-2">
                <span>{row.name}</span>
                <span className="text-[#676767]">
                  {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)} · break {row.break_minutes}m
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Company holidays</h2>
          <p className="mt-1 text-sm text-[#676767]">Used when marking holiday attendance.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto_auto]">
            <input type="date" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <input value={holiday.name} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} placeholder="e.g. Diwali" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={holiday.is_optional} onChange={(e) => setHoliday({ ...holiday, is_optional: e.target.checked })} />
              Optional
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const res = await createCatalogHoliday(holiday);
                  setHoliday({ date: '', name: '', is_optional: false });
                  return res;
                }, 'Holiday added')
              }
              className="h-11 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add holiday
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {catalog.holidays.map((row) => (
              <li key={row.id} className="flex justify-between rounded-lg bg-[#F6F7F9] px-3 py-2">
                <span>{row.name}</span>
                <span className="text-[#676767]">
                  {row.date}
                  {row.is_optional ? ' · optional' : ''}
                </span>
              </li>
            ))}
            {catalog.holidays.length === 0 ? <li className="text-[#676767]">No holidays yet</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function CatalogCard({
  title,
  hint,
  name,
  extra,
  extraPlaceholder,
  onName,
  onExtra,
  onAdd,
  busy,
  rows,
}: {
  title: string;
  hint: string;
  name: string;
  extra: string;
  extraPlaceholder: string;
  onName: (value: string) => void;
  onExtra: (value: string) => void;
  onAdd: () => void;
  busy: boolean;
  rows: string[];
}) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[#676767]">{hint}</p>
      <div className="mt-4 grid gap-3">
        <input value={name} onChange={(e) => onName(e.target.value)} placeholder="Name" className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
        <input value={extra} onChange={(e) => onExtra(e.target.value)} placeholder={extraPlaceholder} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm" />
        <button type="button" disabled={busy} onClick={onAdd} className="h-11 rounded-lg bg-[#0658C2] text-sm font-semibold text-white disabled:opacity-60">
          Add
        </button>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((row) => (
          <li key={row} className="rounded-lg bg-[#F6F7F9] px-3 py-2">
            {row}
          </li>
        ))}
      </ul>
    </section>
  );
}
