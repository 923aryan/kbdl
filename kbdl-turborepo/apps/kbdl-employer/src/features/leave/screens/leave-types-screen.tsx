'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  createCompanyLeaveType,
  fetchCompanyLeaveCatalog,
  updateCompanyLeavePolicy,
  updateCompanyLeaveType,
  type CompanyLeaveCatalog,
} from '../api';
import { PageShell, PrimaryButton } from './leave-ui';

export const LeaveTypesScreen = () => {
  const [catalog, setCatalog] = useState<CompanyLeaveCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newType, setNewType] = useState({ name: '', days_per_year: 12, is_paid: true });
  const [policyDraft, setPolicyDraft] = useState({
    accrue_per_month: 1,
    annual_quota: 12,
    max_carry_forward: 12,
    carry_forward_at_year_end: true,
    encash_excess: true,
    lines: '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    fetchCompanyLeaveCatalog(true)
      .then((data) => {
        setCatalog(data);
        setPolicyDraft({
          accrue_per_month: data.policy.accrue_per_month,
          annual_quota: data.policy.annual_quota,
          max_carry_forward: data.policy.max_carry_forward,
          carry_forward_at_year_end: data.policy.carry_forward_at_year_end,
          encash_excess: data.policy.encash_excess,
          lines: data.policy.lines.join('\n'),
        });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load leave catalog'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newType.name.trim()) {
      setError('Leave type name is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await createCompanyLeaveType({
        name: newType.name.trim(),
        days_per_year: Number(newType.days_per_year),
        is_paid: newType.is_paid,
      });
      setCatalog(data);
      setNewType({ name: '', days_per_year: 12, is_paid: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add leave type');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    setBusy(true);
    setError(null);
    try {
      setCatalog(await updateCompanyLeaveType(id, { is_active: !is_active }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update leave type');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDays = async (id: string, days_per_year: number) => {
    setBusy(true);
    setError(null);
    try {
      setCatalog(await updateCompanyLeaveType(id, { days_per_year }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update leave type');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePolicy = async () => {
    const lines = policyDraft.lines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setError('Add at least one policy line');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await updateCompanyLeavePolicy({
        accrue_per_month: Number(policyDraft.accrue_per_month),
        annual_quota: Number(policyDraft.annual_quota),
        max_carry_forward: Number(policyDraft.max_carry_forward),
        carry_forward_at_year_end: policyDraft.carry_forward_at_year_end,
        encash_excess: policyDraft.encash_excess,
        lines,
      });
      setCatalog(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Leave Types" crumb="Leave Types">
      <p className="mb-5 text-sm text-gray-600">
        Leave types and policy belong to the company, like departments. Employees use this catalog
        when leave is applied.
      </p>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && !catalog ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#676767]">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading company leave…
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">Company leave types</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_auto_auto]">
              <input
                value={newType.name}
                onChange={(event) => setNewType((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Casual Leave"
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0658C2]"
              />
              <input
                type="number"
                min={0}
                value={newType.days_per_year}
                onChange={(event) =>
                  setNewType((current) => ({ ...current, days_per_year: Number(event.target.value) }))
                }
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0658C2]"
              />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={newType.is_paid}
                  onChange={(event) =>
                    setNewType((current) => ({ ...current, is_paid: event.target.checked }))
                  }
                />
                Paid
              </label>
              <PrimaryButton onClick={handleCreate} className="h-11 px-5 text-sm">
                Add type
              </PrimaryButton>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#FAFAFA] text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Days / year</th>
                    <th className="px-3 py-2">Paid</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(catalog?.types ?? []).map((type) => (
                    <tr key={type.id}>
                      <td className="px-3 py-2 font-medium text-black">{type.name}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={type.days_per_year}
                          disabled={busy}
                          onBlur={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isFinite(next) && next !== type.days_per_year) {
                              void handleSaveDays(type.id, next);
                            }
                          }}
                          className="h-9 w-24 rounded-md border border-gray-200 px-2 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">{type.is_paid ? 'Paid' : 'Unpaid'}</td>
                      <td className="px-3 py-2">{type.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleToggle(type.id, type.is_active)}
                          className="text-sm font-semibold text-[#0658C2]"
                        >
                          {type.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(catalog?.types ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No leave types yet. Add the first one.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">Company policy</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Accrue / month
                <input
                  type="number"
                  min={0}
                  value={policyDraft.accrue_per_month}
                  onChange={(event) =>
                    setPolicyDraft((current) => ({
                      ...current,
                      accrue_per_month: Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Annual quota
                <input
                  type="number"
                  min={0}
                  value={policyDraft.annual_quota}
                  onChange={(event) =>
                    setPolicyDraft((current) => ({
                      ...current,
                      annual_quota: Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Max carry forward
                <input
                  type="number"
                  min={0}
                  value={policyDraft.max_carry_forward}
                  onChange={(event) =>
                    setPolicyDraft((current) => ({
                      ...current,
                      max_carry_forward: Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                />
              </label>
              <div className="flex flex-col justify-end gap-2 text-sm font-medium text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={policyDraft.carry_forward_at_year_end}
                    onChange={(event) =>
                      setPolicyDraft((current) => ({
                        ...current,
                        carry_forward_at_year_end: event.target.checked,
                      }))
                    }
                  />
                  Carry forward at year-end
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={policyDraft.encash_excess}
                    onChange={(event) =>
                      setPolicyDraft((current) => ({
                        ...current,
                        encash_excess: event.target.checked,
                      }))
                    }
                  />
                  Encash excess
                </label>
              </div>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              Policy lines
              <textarea
                value={policyDraft.lines}
                onChange={(event) =>
                  setPolicyDraft((current) => ({ ...current, lines: event.target.value }))
                }
                rows={8}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-4">
              <PrimaryButton onClick={handleSavePolicy} className="h-11 px-6 text-sm">
                Save policy
              </PrimaryButton>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
};
