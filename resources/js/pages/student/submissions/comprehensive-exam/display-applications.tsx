'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { BookOpen, BadgeCheck, XCircle, Clock, ChevronDown, Hourglass} from 'lucide-react';


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
  status?: string; // pending|approved|rejected|...
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
  const [expanded, setExpanded] = useState(false);

  // Safely parse server timestamps (e.g., "YYYY-MM-DD HH:mm:ss") as UTC
  function parseServerDate(dt?: string | null) {
    if (!dt) return null;
    // if already ISO with timezone, use as-is
    if (/T.+(Z|[+-]\d{2}:\d{2})$/.test(dt)) return new Date(dt);
    // convert "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ssZ" (UTC)
    return new Date(dt.replace(' ', 'T') + 'Z');
  }

  const subjects = application.subjects ?? [];
  const firstDate = subjects[0]?.date ? new Date(subjects[0].date + 'T00:00:00') : null;

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
                  {subjects.map((s, i) => (
                    <div
                      key={i}
                      className="flex w-full items-center justify-between rounded-lg border p-2 transition hover:bg-zinc-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.date ? format(new Date(s.date), 'PPP') : '—'} • {s.startTime || '—'} - {s.endTime || '—'}
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
        </div>
      )}
    </div>
  );
}