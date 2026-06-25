'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Calendar, MapPin, Briefcase, DollarSign, Eye } from 'lucide-react';
import { createEmployerJob, getEmployerJob, updateEmployerJob } from '../api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { createJobSchema } from '@repo/validator/shared';

const jobFormSchema = createJobSchema.shape.body;
type JobFormInput = z.input<typeof jobFormSchema>;
type JobFormData = z.output<typeof jobFormSchema>;

type CreateJobScreenProps = {
  jobId?: string;
};

const DEFAULT_VALUES: JobFormInput = {
  title: '',
  description: '',
  employment_type: 'full_time',
  work_type: 'remote',
  salary_type: 'monthly',
  salary_min: undefined,
  salary_max: undefined,
  address: '',
  seats_available: undefined,
  job_start_time: undefined,
  is_negotiable: false,
};

const FIELD_LABELS: Partial<Record<keyof JobFormInput, string>> = {
  title: 'Job Title',
  description: 'Job Description',
  employment_type: 'Employment Type',
  work_type: 'Work Type',
  salary_type: 'Salary Type',
  salary_min: 'Minimum Salary',
  salary_max: 'Maximum Salary',
  address: 'Work Location',
  seats_available: 'Number of Openings',
  job_start_time: 'Job Start Date & Time',
};

const FIELD_ORDER = Object.keys(FIELD_LABELS) as (keyof JobFormInput)[];

function toDateTimeLocalInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
}

function getFormErrorMessage(error: unknown) {
  return typeof error === 'object' && error && 'message' in error
    ? String(error.message)
    : undefined;
}

// ── Reusable field wrapper ────────────────────────────────────────────────────
function Field({
  label,
  required,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
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
    </div>
  );
}

function ErrorSummary({
  serverError,
  validationErrors,
}: {
  serverError?: string | null;
  validationErrors: { label: string; message: string }[];
}) {
  if (!serverError && validationErrors.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <AlertCircle size={18} className="text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-red-800">Please fix these errors</h2>
          {serverError && <p className="mt-1 text-sm font-medium">{serverError}</p>}
          {validationErrors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {validationErrors.map((item) => (
                <li key={item.label} className="leading-5">
                  <span className="font-semibold">{item.label}:</span> {item.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
export function CreateJobScreen({ jobId }: CreateJobScreenProps = {}) {
  const router = useRouter();
  const isEditing = Boolean(jobId);
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<JobFormInput, unknown, JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watchAll = watch();
  const validationErrors = useMemo(
    () =>
      FIELD_ORDER.map((name) => {
        const message = getFormErrorMessage(errors[name]);
        return message ? { label: FIELD_LABELS[name] ?? String(name), message } : null;
      }).filter((item): item is { label: string; message: string } => Boolean(item)),
    [errors],
  );

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    const loadJob = async () => {
      setLoadingJob(true);
      setError(null);
      try {
        const job = await getEmployerJob(jobId);
        if (cancelled) return;

        reset({
          title: job.title,
          description: job.description ?? '',
          employment_type: (job.employment_type as JobFormInput['employment_type']) ?? 'full_time',
          work_type: (job.work_type as JobFormInput['work_type']) ?? 'remote',
          salary_type: (job.salary_type as JobFormInput['salary_type']) ?? 'monthly',
          salary_min: job.salary_min ?? undefined,
          salary_max: job.salary_max ?? undefined,
          address: job.address ?? '',
          seats_available: job.seats_available ?? undefined,
          job_start_time: job.job_start_time ?? undefined,
          job_end_time: job.job_end_time ?? undefined,
          is_negotiable: job.is_negotiable ?? false,
          status: (job.status as JobFormInput['status']) ?? 'draft',
        });
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Unable to load job.');
        }
      } finally {
        if (!cancelled) {
          setLoadingJob(false);
        }
      }
    };

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId, reset]);

  const onSubmit = async (data: JobFormData, status: 'open' | 'draft' = 'open') => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
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
      };

      if (jobId) {
        await updateEmployerJob(jobId, payload);
      } else {
        await createEmployerJob(payload);
      }
      router.push('/jobs'); // Redirect back to jobs list after creation
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to ${isEditing ? 'update' : 'create'} job.`);
      setSubmitting(false); // Only set false if error, on success we navigate away
    }
  };

  const onInvalidSubmit = () => {
    setError(null);
    requestAnimationFrame(() => {
      errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // salary display for summary
  const salaryDisplay =
    watchAll.salary_min || watchAll.salary_max
      ? `₹${watchAll.salary_min || '0'} – ₹${watchAll.salary_max || '∞'}`
      : '';

  const employmentLabel: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    internship: 'Internship',
  };

  const workLabel: Record<string, string> = {
    remote: 'Remote',
    onsite: 'On-site',
    hybrid: 'Hybrid',
  };

  const salaryLabel: Record<string, string> = {
    monthly: 'Monthly',
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Top Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isEditing ? 'Edit Job' : 'Create New Jobs'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isEditing
              ? 'Update this job posting and choose whether it should be published or saved as draft'
              : 'Fill in the details to post a new job and find right candidate'}
          </p>
        </div>

        <div ref={errorSummaryRef}>
          <ErrorSummary serverError={error} validationErrors={validationErrors} />
        </div>

        {loadingJob ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500 shadow-sm">
            Loading job...
          </div>
        ) : (
          <>
            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ── Left: form sections ── */}
          <div className="flex-1 w-full space-y-6">
            
            {/* 1. Job Information */}
            <Section number="1" title="Job Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Job Title" required>
                  <input
                    {...register('title')}
                    placeholder="Enter job title(e.g. Warehouse Assistant)"
                    className={inputCls}
                  />
                </Field>
                <Field label="Employment Type" required>
                  <select {...register('employment_type')} className={selectCls}>
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </Field>
              </div>

              <Field label="Job Description" required>
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
                <Field label="Work Location" required>
                  <input
                    {...register('address')}
                    placeholder="Enter complete address"
                    className={inputCls}
                  />
                </Field>
                <Field label="Work Type" required>
                  <select {...register('work_type')} className={selectCls}>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 3. Requirements */}
            <Section number="3" title="Requirements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Number of Openings" required>
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
                <Field label="Job Start Date & Time">
                  <Controller
                    control={control}
                    name="job_start_time"
                    render={({ field: { onChange, value } }) => {
                      const dateStr = toDateTimeLocalInput(value);
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
                <Field label="Salary Type" required>
                  <select {...register('salary_type')} className={selectCls}>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </Field>
                <Field label="Minimum Salary">
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
                <Field label="Maximum Salary">
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
                onClick={handleSubmit((data) => onSubmit(data, 'open'), onInvalidSubmit)}
                className="w-full bg-[#0a58ca] hover:bg-[#084298] text-white text-[15px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                {submitting ? 'Saving...' : isEditing ? 'Update & Publish' : 'Publish Job'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit((data) => onSubmit(data, 'draft'), onInvalidSubmit)}
                className="w-full bg-[#eef2f9] hover:bg-[#e2e8f0] text-[#475569] text-[15px] font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {isEditing ? 'Update as Draft' : 'Save as Draft'}
              </button>
            </div>

          </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
