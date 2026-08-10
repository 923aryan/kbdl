'use client';

import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Check, Clock, MapPin, Phone, Star, User, X, XCircle } from 'lucide-react';
import {
  getJobApplications,
  JobApplication,
  rejectJobApplicant,
  selectJobApplicant,
} from '../api';

interface JobApplicationsDrawerProps {
  open: boolean;
  jobId?: string;
  jobTitle?: string;
  onClose: () => void;
}

export function JobApplicationsDrawer({
  open,
  jobId,
  jobTitle,
  onClose,
}: JobApplicationsDrawerProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !jobId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getJobApplications(jobId, 1, 20)
      .then((result) => {
        if (active) {
          setApplications(result.applications);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Unable to load applications.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, jobId]);

  const updateApplication = async (applicationId: string, action: 'accept' | 'reject') => {
    if (!jobId) return;

    setUpdatingId(applicationId);
    setError(null);

    try {
      if (action === 'accept') {
        await selectJobApplicant(jobId, applicationId);
      } else {
        await rejectJobApplicant(jobId, applicationId);
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status: action === 'accept' ? 'selected' : 'rejected' }
            : application,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the application.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
              Applications
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {jobTitle ?? 'Job applications'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close applications drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading applications…
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No applications found for this job.
            </div>
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <p className="text-sm font-semibold text-slate-900">
                        {application.user?.name ||
                          `${application.user?.first_name ?? ''} ${application.user?.last_name ?? ''}`.trim() ||
                          'Applicant'}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{application.user?.email ?? 'No email provided'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CandidateDetail icon={Phone} label="Contact" value={application.user?.phone_no ?? 'Not provided'} />
                  <CandidateDetail icon={BriefcaseBusiness} label="Experience" value={application.user?.experience != null ? `${application.user.experience} year${application.user.experience === 1 ? '' : 's'}` : 'Not provided'} />
                  <CandidateDetail icon={MapPin} label="Location" value={[application.user?.area, application.user?.city].filter(Boolean).join(', ') || 'Not provided'} />
                  <CandidateDetail icon={Star} label="Rating" value={application.user?.rating_avg != null ? `${application.user.rating_avg}/5` : 'Not rated'} />
                  <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Clock size={14} />
                      Applied
                    </div>
                    <div>
                      {application.applied_at
                        ? new Date(application.applied_at).toLocaleString()
                        : 'Unknown'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="font-semibold text-slate-900">Notes</div>
                    <div>{application.employer_notes ?? 'No notes yet'}</div>
                  </div>
                </div>
                {application.user?.skills?.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-900">Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.user.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {['applied', 'under_review', 'shortlisted'].includes(application.status) ? (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={updatingId === application.id}
                      onClick={() => updateApplication(application.id, 'accept')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check size={16} />
                      {updatingId === application.id ? 'Updating…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === application.id}
                      onClick={() => updateApplication(application.id, 'reject')}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-1 break-words">{value}</div>
    </div>
  );
}
