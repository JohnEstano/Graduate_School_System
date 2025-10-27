'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { BookOpen, BadgeCheck, XCircle, Clock, ChevronDown, Hourglass } from 'lucide-react';


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
  status?: string;
  registrar_reason?: string | null;
  subjects?: ExamSubject[];
  created_at?: string | null;
};

type Props = {
  application: ExamApplicationFull;
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

export default function DisplayApplication({ application }: Props) {
  const isRejected = (application.status || '').toLowerCase() === 'rejected';
  const [expanded, setExpanded] = useState<boolean>(isRejected);

  // Safely parse server timestamps (e.g., "YYYY-MM-DD HH:mm:ss") as local time when appropriate
  function parseServerDate(dt?: string | null) {
    if (!dt) return null;
    // if already ISO with timezone (e.g., 2025-10-22T12:34:56Z or ...+08:00), use as-is
    if (/T.+(Z|[+-]\d{2}:\d{2})$/.test(dt)) return new Date(dt);
    // date-only "YYYY-MM-DD" -> treat as local start of day
    if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return new Date(dt + 'T00:00:00');
    // "YYYY-MM-DD HH:mm:ss" -> convert to "YYYY-MM-DDTHH:mm:ss" and treat as local time (do NOT append 'Z')
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) return new Date(dt.replace(' ', 'T'));
    // Fallback to Date constructor
    return new Date(dt);
  }

  const subjects = application.subjects ?? [];
  // Use parseServerDate for subject date when available (preserve local interpretation)
  const firstDate = subjects[0]?.date ? parseServerDate(subjects[0].date + (subjects[0].date.length === 10 ? 'T00:00:00' : '')) : null;

  const createdAt = parseServerDate(application.created_at);
  const submittedWhen = createdAt
    ? `Submitted ${formatDistanceToNow(createdAt, { addSuffix: true })}`
    : '';

  return (
    <div className="w-full">
      {/* Status row (click to expand/collapse) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-md  px-3 py-3 text-left transition hover:bg-rose-50"
      >
        {/* Left: status badge */}
        <div className="shrink-0">{statusBadge(application.status)}</div>

        {/* Middle: soft progress bar (visual accent only) */}
        <div className="hidden md:block flex-1 h-2 rounded-full bg-rose-100 overflow-hidden">
          <div className="h-full bg-rose-200" />
        </div>

        {/* Right: submitted when + chevron */}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {submittedWhen}
          {isRejected && application.registrar_reason && (
            <span className="hidden sm:inline text-rose-600">• Reason available</span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Details panel */}
      {expanded && (
        <div className="rounded-md p-4">
          {/* Header strip similar to defense details */}
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
            {firstDate && (
              <Badge variant="secondary">First Exam: {format(firstDate, 'PPP')}</Badge>
            )}
            {subjects.length > 0 && (
              <Badge variant="secondary">
                {subjects.length} Subject{subjects.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Quick summary */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Status</div>
              <div className="mt-1">{statusBadge(application.status)}</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Submitted</div>
              <div className="mt-1 text-sm">{createdAt ? format(createdAt, 'PPP p') : '—'}</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Program</div>
              <div className="mt-1 text-sm truncate">{application.program || '—'}</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">School Year</div>
              <div className="mt-1 text-sm">{application.school_year || '—'}</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Two-column content like defense details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact */}
            <div>
              <div className="mb-2 text-xs text-zinc-600">Contact</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {application.email || '—'}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span> {application.mobile_no || '—'}
                </div>
                <div>
                  <span className="font-medium">Telephone:</span> {application.telephone_no || '—'}
                </div>
                <div>
                  <span className="font-medium">Office Address:</span> {application.office_address || '—'}
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div>
              <div className="mb-2 text-xs text-zinc-600">Subjects & Schedule</div>
              {subjects.length ? (
                <div className="space-y-2">
                  {subjects.map((s, i) => {
                    const d = s.date
                      ? parseServerDate(s.date.length === 10 ? s.date + 'T00:00:00' : s.date)
                      : null;
                    return (
                      <div
                        key={i}
                        className="flex w-full items-center justify-between rounded-lg border p-2 transition hover:bg-zinc-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{s.subject}</div>
                          <div className="text-xs text-muted-foreground">
                            {d ? format(d, 'PPP') : '—'} • {formatTime12hr(s.startTime)} - {formatTime12hr(s.endTime)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No subjects added.</div>
              )}
            </div>
          </div>

          {/* Rejection reason callout */}
          {application.status?.toLowerCase() === 'rejected' && application.registrar_reason && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Rejection reason</div>
                  <div className="mt-0.5 whitespace-pre-wrap">{application.registrar_reason}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to format times like "13:30" -> "01:30 PM"
function formatTime12hr(timeStr?: string) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = ((h % 12) || 12).toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hr}:${mm} ${ampm}`;
}