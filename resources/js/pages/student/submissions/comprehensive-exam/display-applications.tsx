'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { BookOpen, BadgeCheck, XCircle, ChevronDown, Hourglass, RefreshCcw } from 'lucide-react';
import { router } from '@inertiajs/react';

export type ExamSubject = {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type ExamApplicationFull = {
  id?: number;
  first_name: string;
  middle_initial: string | null;
  last_name: string;
  program: string;
  school_year: string;
  office_address?: string | null;
  mobile_no?: string | null;
  telephone_no?: string | null;
  email?: string | null;
  status?: string;           // expected to mirror final_approval_status: pending|approved|rejected
  remarks?: string | null;   // rejection reason (if any)
  subjects?: ExamSubject[];
  created_at?: string | null;
};

type Props = {
  application: ExamApplicationFull;
  onResubmit?: () => void; // optional callback; defaults to navigating to /comprehensive-exam
};

function statusBadge(status?: string) {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-700 border border-green-200 gap-1">
          <BadgeCheck size={14} /> Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-rose-100 text-rose-700 border border-rose-200 gap-1">
          <XCircle size={14} /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-700 border border-gray-200 gap-1">
          <Hourglass size={14} /> Pending Review
        </Badge>
      );
  }
}

export default function DisplayApplication({ application, onResubmit }: Props) {
  const status = useMemo(() => (application.status || 'pending').toLowerCase(), [application.status]);
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const previouslyRejected = isApproved && !!application.remarks;

  const [expanded, setExpanded] = useState(isRejected);
  useEffect(() => {
    if (isRejected) setExpanded(true);
  }, [isRejected]);

  // Safely parse server timestamps (treat MySQL timestamps as LOCAL, not UTC)
  function parseServerDate(dt?: string | null) {
    if (!dt) return null;
    // If ISO with timezone/offset, let the browser handle it
    if (/T.+(Z|[+-]\d{2}:\d{2})$/.test(dt)) return new Date(dt);
    // MySQL "YYYY-MM-DD HH:mm:ss" (no tz) => interpret as local time
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) return new Date(dt.replace(' ', 'T'));
    // Fallback
    return new Date(dt);
  }

  const subjects = application.subjects ?? [];
  const firstDate = subjects[0]?.date ? new Date(subjects[0].date + 'T00:00:00') : null;

  const createdAt = parseServerDate(application.created_at);
  const submittedWhen = createdAt
    ? `Submitted ${formatDistanceToNow(createdAt, { addSuffix: true })}`
    : '';

  // Progress styling by status
  const prog = useMemo(() => {
    if (isApproved) return { wrap: 'bg-emerald-100', fill: 'bg-emerald-500', pct: 100 };
    if (isRejected) return { wrap: 'bg-rose-100', fill: 'bg-rose-500', pct: 24 };
    return { wrap: 'bg-amber-100', fill: 'bg-amber-400', pct: 66 };
  }, [isApproved, isRejected]);

  const handleResubmit = () => {
    // Guard: no resubmission unless rejected
    if (!isRejected) return;
    if (onResubmit) return onResubmit();
    router.visit('/comprehensive-exam');
  };

  // Optional Eligibility (API-first; fallback to URL toggles ?grades=1&docs=0&bal=1)
  type Elig = { gradesComplete: boolean | null; documentsComplete: boolean | null; noOutstandingBalance: boolean | null; loading: boolean };
  const [elig, setElig] = useState<Elig>({ gradesComplete: null, documentsComplete: null, noOutstandingBalance: null, loading: true });
  async function fetchEligibility() {
    setElig((e) => ({ ...e, loading: true }));
    const urls = [
      '/api/student/comprehensive-exam/eligibility',
      '/api/comprehensive-exam/eligibility?self=1',
    ];
    let data: any = null;
    for (const u of urls) {
      try {
        const res = await fetch(u, { credentials: 'include' });
        if (res.ok) { data = await res.json(); break; }
      } catch { /* ignore */ }
    }
    const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const toBool = (v: any): boolean | null =>
      typeof v === 'boolean' ? v : v === 1 || v === '1' ? true : v === 0 || v === '0' ? false : null;
    setElig({
      gradesComplete: toBool(data?.gradesComplete ?? data?.completeGrades ?? qs?.get('grades')),
      documentsComplete: toBool(data?.documentsComplete ?? data?.completeDocuments ?? qs?.get('docs')),
      noOutstandingBalance: toBool(data?.noOutstandingBalance ?? data?.hasNoOutstandingBalance ?? qs?.get('bal')),
      loading: false,
    });
  }
  useEffect(() => { fetchEligibility(); }, []); // run once

  const eligChip = (ok: boolean | null) => {
    const cls = ok === true
      ? 'border-green-300 text-green-700 bg-green-50'
      : ok === false
      ? 'border-rose-300 text-rose-700 bg-rose-50'
      : 'border-slate-300 text-slate-600 bg-slate-50';
    return <Badge variant="outline" className={cls}>{ok === true ? 'OK' : ok === false ? 'Needs attention' : 'Unknown'}</Badge>;
  };

  // When formatting subject dates, ensure local date (avoid UTC shift on "YYYY-MM-DD")
  const toLocalDateOnly = (d?: string) => (d ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : null);

  return (
    <div className="w-full">
      {/* Status row (click to expand/collapse) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition"
        aria-expanded={expanded}
      >
        {/* Left: status badge */}
        <div className="shrink-0">{statusBadge(application.status)}</div>

        {/* Middle: progress bar with ARIA */}
        <div
          className={`hidden md:block flex-1 h-2 rounded-full overflow-hidden ${prog.wrap}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={prog.pct}
          aria-label="Application review progress"
        >
          <div className={`h-full ${prog.fill} transition-all duration-500`} style={{ width: `${prog.pct}%` }} />
        </div>

        {/* Right: submitted when + chevron */}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {submittedWhen}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Rejection reason banner (only when rejected) */}
      {isRejected && application.remarks && (
        <div
          className="mx-3 mb-2 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="status"
          aria-live="polite"
        >
          <XCircle className="mt-0.5 h-4 w-4" />
          <div className="min-w-0">
            <div className="font-medium">Reason for rejection</div>
            <div className="break-words">{application.remarks}</div>
          </div>
        </div>
      )}

      {/* Details panel */}
      {expanded && (
        <div className="rounded-md p-4 m-2 border border-rose-200 bg-rose-50/20">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 border border-rose-200 p-2">
              <BookOpen className="h-5 w-5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-zinc-600">Applicant</div>
              <div className="truncate text-sm font-semibold">
                {`${application.first_name} ${application.middle_initial ? application.middle_initial + '. ' : ''}${application.last_name}`}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{application.program}</Badge>
            <Badge variant="secondary">{application.school_year}</Badge>
            {firstDate && <Badge variant="secondary">First Exam: {format(firstDate, 'PPP')}</Badge>}
            {subjects.length > 0 && (
              <Badge variant="secondary">
                {subjects.length} Subject{subjects.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <Separator className="my-4" />

          {/* Two-column content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact */}
            <div>
              <div className="mb-2 text-xs text-zinc-600">Contact</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  {application.email ? <a className="underline hover:no-underline" href={`mailto:${application.email}`}>{application.email}</a> : '—'}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span>{' '}
                  {application.mobile_no ? <a className="underline hover:no-underline" href={`tel:${application.mobile_no}`}>{application.mobile_no}</a> : '—'}
                </div>
                <div>
                  <span className="font-medium">Telephone:</span> {application.telephone_no || '—'}
                </div>
                <div>
                  <span className="font-medium">Office Address:</span> {application.office_address || '—'}
                </div>

                {/* If approved but remarks exist from a past rejection, show once (no banner) */}
                {status !== 'rejected' && application.remarks && (
                   <div className="rounded-md border border-slate-200 p-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Remarks</span>
                      {previouslyRejected && <Badge variant="secondary" className="text-[11px]">Previously rejected</Badge>}
                    </div>
                     <div className="text-sm">{application.remarks}</div>
                   </div>
                 )}

                {/* Resubmit CTA when rejected */}
                {isRejected && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResubmit}
                      disabled={!isRejected}
                      aria-disabled={!isRejected}
                      className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      Resubmit application
                    </button>
                  </div>
                )}
              </div>
            </div>

             {/* Subjects */}
            <div>
              <div className="mb-2 text-xs text-zinc-600">Subjects & Schedule</div>
              {subjects.length ? (
                <div className="space-y-2">
                  {subjects.map((s, i) => (
                    <div key={i} className="flex w-full items-center justify-between rounded-lg border p-2 transition hover:bg-zinc-50">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.date ? format(toLocalDateOnly(s.date)!, 'PPP') : '—'} • {s.startTime || '—'} - {s.endTime || '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No subjects added.</div>
              )}
            </div>
          </div>

          {/* Eligibility (moved below Contact and Subjects) */}
          <Separator className="my-4" />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-zinc-600">Eligibility</div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-60"
                onClick={fetchEligibility}
                disabled={elig.loading || isApproved}
                aria-disabled={elig.loading || isApproved}
                title={isApproved ? 'Already approved' : 'Refresh eligibility'}
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${elig.loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            {(elig.gradesComplete ?? elig.documentsComplete ?? elig.noOutstandingBalance) !== null ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="flex items-center justify-between rounded border px-3 py-2">
                  <span>Complete grades</span>
                  {eligChip(elig.gradesComplete)}
                </div>
                <div className="flex items-center justify-between rounded border px-3 py-2">
                  <span>Complete documents</span>
                  {eligChip(elig.documentsComplete)}
                </div>
                <div className="flex items-center justify-between rounded border px-3 py-2">
                  <span>No outstanding tuition balance</span>
                  {eligChip(elig.noOutstandingBalance)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Eligibility data unavailable.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}