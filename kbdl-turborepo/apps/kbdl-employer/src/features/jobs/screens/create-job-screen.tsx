'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createJobSchema } from '@repo/validator/shared';
import { EmploymentType, JobStatus, JobWorkType, SalaryType } from '../../../lib/constants';
import { Briefcase, Calendar, DollarSign, Eye, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { createEmployerJob } from '../api';

const jobFormSchema = createJobSchema.shape.body;
type JobFormData = z.input<typeof jobFormSchema>;

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

// ── Shared input / select classes ─────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 shadow-sm';

const selectCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer shadow-sm';

// ── Section card ──────────────────────────────────────────────────────────────
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm space-y-5">
      <h2 className="text-lg font-bold text-gray-900">
        {number}. {title}
      </h2>
      {children}
    </div>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-blue-500" />
      </div>
      <span className="text-sm text-gray-500 flex-1">{label}</span>
      <span className="text-sm font-semibold text-gray-900 max-w-30 text-right truncate">
        {value || 'Not Specified'}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CreateJobScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      employment_type: EmploymentType.full_time,
      work_type: JobWorkType.remote,
      salary_type: SalaryType.monthly,
      salary_min: undefined,
      salary_max: undefined,
      address: '',
      seats_available: undefined,
      job_start_time: undefined,
      is_negotiable: false,
    },
  });

  const watchAll = watch();

  const onSubmit = async (data: JobFormData, status: typeof JobStatus.open | typeof JobStatus.draft = JobStatus.open) => {
    setError(null);
    setSubmitting(true);
    try {
      await createEmployerJob({
        title: data.title,
        description: data.description,
        employment_type: data.employment_type,
        work_type: data.work_type,
        salary_type: data.salary_type,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        address: data.address || undefined,
        seats_available: data.seats_available,
        is_negotiable: data.is_negotiable,
        job_start_time: data.job_start_time,
        status,
      });
      router.push('/jobs'); // Redirect back to jobs list after creation
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create job.');
      setSubmitting(false); // Only set false if error, on success we navigate away
    }
  };

  // salary display for summary
  const salaryDisplay =
    watchAll.salary_min || watchAll.salary_max
      ? `₹${watchAll.salary_min || '0'} – ₹${watchAll.salary_max || '∞'}`
      : '';

  const employmentLabel: Record<string, string> = {
    [EmploymentType.full_time]: 'Full-Time',
    [EmploymentType.part_time]: 'Part-Time',
    [EmploymentType.contract]: 'Contract',
    [EmploymentType.internship]: 'Internship',
  };

  const workLabel: Record<string, string> = {
    [JobWorkType.remote]: 'Remote',
    [JobWorkType.onsite]: 'On-site',
    [JobWorkType.hybrid]: 'Hybrid',
  };

  const salaryLabel: Record<string, string> = {
    [SalaryType.monthly]: 'Monthly',
    [SalaryType.hourly]: 'Hourly',
    [SalaryType.weekly]: 'Weekly',
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Top Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create New Jobs</h1>
          <p className="text-sm text-gray-500 mt-2">
            Fill in the details to post a new job and find right candidate
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ── Left: form sections ── */}
          <div className="flex-1 w-full space-y-6">
            
            {/* 1. Job Information */}
            <Section number="1" title="Job Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Job Title" required error={errors.title?.message}>
                  <input
                    {...register('title')}
                    placeholder="Enter job title(e.g. Warehouse Assistant)"
                    className={inputCls}
                  />
                </Field>
                <Field label="Employment Type" required error={errors.employment_type?.message}>
                  <select {...register('employment_type')} className={selectCls}>
                    <option value={EmploymentType.full_time}>Full-Time</option>
                    <option value={EmploymentType.part_time}>Part-Time</option>
                    <option value={EmploymentType.contract}>Contract</option>
                    <option value={EmploymentType.internship}>Internship</option>
                  </select>
                </Field>
              </div>

              <Field label="Job Description" required error={errors.description?.message}>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe the job responsibilities, task and expectations"
                  className={`${inputCls} resize-none min-h-[120px]`}
                />
              </Field>
            </Section>

            {/* 2. Location */}
            <Section number="2" title="Location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Work Location" required error={errors.address?.message}>
                  <input
                    {...register('address')}
                    placeholder="Enter complete address"
                    className={inputCls}
                  />
                </Field>
                <Field label="Work Type" required error={errors.work_type?.message}>
                  <select {...register('work_type')} className={selectCls}>
                    <option value={JobWorkType.remote}>Remote</option>
                    <option value={JobWorkType.onsite}>On-site</option>
                    <option value={JobWorkType.hybrid}>Hybrid</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 3. Requirements */}
            <Section number="3" title="Requirements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Number of Openings" required error={errors.seats_available?.message}>
                  <input
                    {...register('seats_available', {
                      setValueAs: (v) => (v === '' ? undefined : Number(v)),
                    })}
                    placeholder="e.g. 5"
                    inputMode="numeric"
                    type="number"
                    className={inputCls}
                  />
                </Field>
                <Field label="Job Start Date & Time" error={errors.job_start_time?.message}>
                  <Controller
                    control={control}
                    name="job_start_time"
                    render={({ field: { onChange, value } }) => {
                      const dateStr = value ? new Date(value).toISOString().slice(0, 16) : '';
                      return (
                        <input
                          type="datetime-local"
                          value={dateStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            onChange(val ? new Date(val).toISOString() : undefined);
                          }}
                          className={inputCls}
                        />
                      );
                    }}
                  />
                </Field>
              </div>
            </Section>

            {/* 4. Salary & Benefits */}
            <Section number="4" title="Salary & Benefits">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field label="Salary Type" required error={errors.salary_type?.message}>
                  <select {...register('salary_type')} className={selectCls}>
                    <option value={SalaryType.monthly}>Monthly</option>
                    <option value={SalaryType.hourly}>Hourly</option>
                    <option value={SalaryType.weekly}>Weekly</option>
                  </select>
                </Field>
                <Field label="Minimum Salary" error={errors.salary_min?.message}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      {...register('salary_min', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      placeholder="25000"
                      inputMode="numeric"
                      type="number"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </Field>
                <Field label="Maximum Salary" error={errors.salary_max?.message}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      {...register('salary_max', {
                        setValueAs: (v) => (v === '' ? undefined : Number(v)),
                      })}
                      placeholder="50000"
                      inputMode="numeric"
                      type="number"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </Field>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="negotiable"
                  type="checkbox"
                  {...register('is_negotiable')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="negotiable"
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Salary is negotiable
                </label>
              </div>
            </Section>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="w-full lg:w-[340px] shrink-0 sticky top-10 space-y-5">
            
            {/* Summary Card */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Summary</h3>
              <div className="space-y-1">
                <SummaryRow icon={Briefcase} label="Job Title" value={watchAll.title || ''} />
                <SummaryRow
                  icon={Calendar}
                  label="Openings"
                  value={watchAll.seats_available?.toString() || ''}
                />
                <SummaryRow
                  icon={MapPin}
                  label="Location"
                  value={workLabel[watchAll.work_type] ?? watchAll.work_type}
                />
                <SummaryRow
                  icon={DollarSign}
                  label="Pay Type"
                  value={salaryLabel[watchAll.salary_type] ?? watchAll.salary_type}
                />
                <SummaryRow icon={DollarSign} label="Pay Rate" value={salaryDisplay} />
                <SummaryRow
                  icon={Calendar}
                  label="Start Date"
                  value={
                    watchAll.job_start_time
                      ? new Date(watchAll.job_start_time).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''
                  }
                />
                <SummaryRow
                  icon={Eye}
                  label="Employment"
                  value={employmentLabel[watchAll.employment_type] ?? watchAll.employment_type}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit((data) => onSubmit(data, JobStatus.open))}
                className="w-full bg-[#0a58ca] hover:bg-[#084298] text-white text-[15px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                {submitting ? 'Publishing...' : 'Publish Job'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit((data) => onSubmit(data, JobStatus.draft))}
                className="w-full bg-[#eef2f9] hover:bg-[#e2e8f0] text-[#475569] text-[15px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                Save as Draft
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
