'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useLeaveStore } from '../stores/use-leave-store';
import { EmployeeCard, LeaveForm, PageShell, PrimaryButton, defaultLeaveForm } from './leave-ui';

export const ApplyLeaveScreen = () => {
  const [phone, setPhone] = useState('');
  const [hasEmployee, setHasEmployee] = useState(false);
  const submitLeave = useLeaveStore((state) => state.submitLeave);

  return (
    <PageShell title="Apply Leaves" crumb="Leaves Apply">
      <section>
        <h2 className="text-xl font-bold text-black">Find Employee</h2>

        {!hasEmployee ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-black">
              Search by Phone Number <span className="text-red-500">*</span>
              <div className="mt-2 flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter employee phone number"
                    className="h-11 w-full rounded-lg border border-gray-200 px-4 pr-10 text-sm outline-none focus:border-[#0658C2] focus:ring-2 focus:ring-blue-100"
                  />
                  <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <PrimaryButton onClick={() => setHasEmployee(true)} className="lg:min-w-36">
                  Search
                </PrimaryButton>
              </div>
            </label>
          </div>
        ) : (
          <div className="mt-4">
            <EmployeeCard />
          </div>
        )}
      </section>

      {hasEmployee && (
        <section className="mt-7">
          <h2 className="text-xl font-bold text-black">Leave Details</h2>
          <div className="mt-5">
            <LeaveForm initialValues={defaultLeaveForm} onSubmit={submitLeave} />
          </div>
        </section>
      )}
    </PageShell>
  );
};
