'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { BookOpen, BadgeCheck, XCircle, Clock, ChevronDown, Hourglass, CheckCircle, AlertCircle, FileText } from 'lucide-react';


export type ExamSubject = {
  subject: string;
  date: string;       
  startTime: string; 
  endTime: string;  
  score?: number | null;
};

export type ExamApplicationFull = {
  id?: number;
  first_name: string;
  middle_initial: string | null;
  last_name: string;
  program: string;
  school_year: string;
  average_score?: number | null;
  result_status?: 'passed' | 'failed' | null;
  office_address?: string | null;
  mobile_no?: string | null;
  telephone_no?: string | null;
  email?: string | null;
  status?: string; // Overall status for display
  registrar_status?: 'pending' | 'approved' | 'rejected' | null; // Registrar review status
  registrar_reason?: string | null;
  dean_status?: 'pending' | 'approved' | 'rejected' | null; // Dean review status (final_approval_status in DB)
  dean_reason?: string | null;
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

function TrackingProgress({ application }: { application: ExamApplicationFull }) {
  // Normalize statuses to lowercase for consistent comparisons
  const registrarStatusRaw = application.registrar_status || 'pending';
  const registrarStatus = (typeof registrarStatusRaw === 'string' ? registrarStatusRaw : String(registrarStatusRaw)).toLowerCase();
  // Dean status should be pending if registrar hasn't approved yet, otherwise use actual value
  const deanStatus = registrarStatus === 'approved'
    ? ((application.dean_status || 'pending') as string).toLowerCase()
    : 'pending';

  // Determine final approval based on both registrar and dean approvals
  const finalStatus = (registrarStatus === 'approved' && deanStatus === 'approved') ? 'approved' : 'pending';
  
  const stages = [
    {
      name: 'Registrar Review',
      status: registrarStatus,
      icon: FileText,
      description: registrarStatus === 'approved' ? 'Documents verified' : 
                   registrarStatus === 'rejected' ? 'Documents rejected' : 
                   'Verifying documents',
      reason: application.registrar_reason,
    },
    {
      name: 'Dean Review',
      status: registrarStatus === 'approved' ? deanStatus : 'pending',
      icon: BadgeCheck,
      description: deanStatus === 'approved' ? 'Approved by Dean' :
                   deanStatus === 'rejected' ? 'Rejected by Dean' :
                   registrarStatus === 'approved' ? 'Under Dean review' : 'Awaiting registrar approval',
      reason: application.dean_reason,
    },
    {
      name: 'Final Approval',
      status: (registrarStatus === 'approved' && deanStatus === 'approved') ? 'approved' : 'pending',
      icon: CheckCircle,
      description: (registrarStatus === 'approved' && deanStatus === 'approved') 
                   ? 'Application fully approved' 
                   : (registrarStatus === 'approved' && deanStatus === 'approved') 
                   ? 'Processing final approval' 
                   : 'Awaiting registrar and dean approvals',
    },
  ];

  // Determine overall status for color coding
  const hasRejection = registrarStatus === 'rejected' || deanStatus === 'rejected';
  const allApproved = registrarStatus === 'approved' && deanStatus === 'approved';

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className={`h-full transition-all duration-500 ${
              allApproved ? 'bg-green-500 w-full' :
              hasRejection ? 'bg-rose-500 w-1/3' :
              deanStatus === 'approved' ? 'bg-blue-500 w-2/3' :
              registrarStatus === 'approved' ? 'bg-blue-500 w-1/3' :
              'bg-blue-500 w-0'
            }`}
          />
        </div>
        
        {/* Stage Indicators */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = stage.status === 'approved';
            const isRejected = stage.status === 'rejected';
            const isActive = !isCompleted && !isRejected && stage.status === 'pending' && 
                           (index === 0 || stages[index - 1].status === 'approved');
            
            return (
              <div key={index} className="flex flex-col items-center" style={{ width: '30%' }}>
                <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isRejected ? 'bg-rose-500 border-rose-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle size={20} /> :
                   isRejected ? <XCircle size={20} /> :
                   <StageIcon size={20} />}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    isCompleted ? 'text-green-700' :
                    isRejected ? 'text-rose-700' :
                    isActive ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {stage.name}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    isCompleted ? 'text-green-600' :
                    isRejected ? 'text-rose-600' :
                    isActive ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                    {stage.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Reasons */}
      {stages.some(s => s.status === 'rejected' && s.reason) && (
        <div className="mt-4 space-y-2">
          {stages.map((stage, index) => (
            stage.status === 'rejected' && stage.reason ? (
              <div key={index} className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <div className="font-medium text-rose-700">{stage.name} - Rejected</div>
                    <div className="mt-1 text-rose-600">{stage.reason}</div>
                  </div>
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}

export default function DisplayApplication({ application }: Props) {
  // Normalize statuses to lowercase for comparison
  const registrarStatus = (application.registrar_status || 'pending').toLowerCase();
  // Only consider dean status if registrar has approved
  const deanStatus = registrarStatus === 'approved'
    ? ((application.dean_status || 'pending').toLowerCase())  
    : 'pending';
  const hasRejection = registrarStatus === 'rejected' || deanStatus === 'rejected';
  const allApproved = registrarStatus === 'approved' && deanStatus === 'approved';
  const [expanded, setExpanded] = useState<boolean>(hasRejection);

  // Debug logging
  React.useEffect(() => {
    console.log('===== Application Progress Debug =====');
    console.log('Full application object:', application);
    console.log('Raw status values:', {
      'application.registrar_status': application.registrar_status,
      'typeof registrar_status': typeof application.registrar_status,
      'application.dean_status': application.dean_status,
      'typeof dean_status': typeof application.dean_status,
      'application.status': application.status,
      'application.registrar_reason': application.registrar_reason,
      'application.dean_reason': application.dean_reason,
    });
    console.log('After normalization:', {
      registrarStatus,
      deanStatus,
      hasRejection,
      allApproved,
      currentStage: getCurrentStage()
    });
    console.log('====================================');
  }, [application]);

  // Determine current stage for display
  const getCurrentStage = () => {
    if (allApproved) return 'Approved';
    if (hasRejection) return 'Rejected';
    if (registrarStatus === 'approved') return 'Dean Review';
    return 'Registrar Review';
  };

  const currentStage = getCurrentStage();

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
  const avg = application.average_score ?? null;
  const result = (application.result_status ?? undefined) as 'passed' | 'failed' | undefined;
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
        className="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-rose-50"
      >
        {/* Left: current stage indicator */}
        <div className="shrink-0">
          {hasRejection ? (
            <Badge className="bg-rose-100 text-rose-700 border border-rose-200 gap-1">
              <XCircle size={14} /> {currentStage}
            </Badge>
          ) : allApproved ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200 gap-1">
              <CheckCircle size={14} /> {currentStage}
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200 gap-1">
              <Clock size={14} /> {currentStage}
            </Badge>
          )}
        </div>

        {/* Middle: progress bar */}
        <div className="hidden md:block flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full transition-all ${
            allApproved ? 'w-full bg-green-500' :
            hasRejection ? 'w-1/4 bg-rose-500' :
            deanStatus === 'approved' ? 'w-3/4 bg-blue-500' :
            registrarStatus === 'approved' ? 'w-1/2 bg-blue-500' :
            'w-1/4 bg-blue-500'
          }`} />
        </div>

        {/* Right: submitted when + chevron */}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {submittedWhen}
          {hasRejection && (
            <span className="hidden sm:inline text-rose-600">• View reason</span>
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
            {typeof avg === 'number' && (
              <Badge variant="secondary" className={avg <= 74 ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-green-300 text-green-700 bg-green-50'}>
                Average: {avg}
              </Badge>
            )}
            {result && (
              <Badge className={result === 'failed' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-green-100 text-green-700 border border-green-200'}>
                {result === 'failed' ? 'Failed' : 'Passed'}
              </Badge>
            )}
          </div>

          {/* Tracking Progress */}
          <div className="mt-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="h-4 w-4" />
              Application Progress
            </div>
            <TrackingProgress application={application} />
          </div>

          {/* Quick summary */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                        <div className="pl-3">
                          {typeof s.score === 'number' ? (
                            <Badge variant="outline" className={s.score <= 74 ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-green-300 text-green-700 bg-green-50'}>
                              Score: {s.score}
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-500">No score</span>
                          )}
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