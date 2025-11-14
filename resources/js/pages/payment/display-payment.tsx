'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Receipt, BadgeCheck, XCircle, Clock, ChevronDown, ExternalLink, HandCoinsIcon, CheckCircle, AlertCircle, FileText } from 'lucide-react';

type Student = { name: string; program: string | null; email?: string | null };

export type PaymentVM = {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  or_number: string;
  payment_date: string; // YYYY-MM-DD or ISO
  receipt_image: string | null;
  remarks: string | null;
  created_at: string | null;
};

type Props = {
  payment: PaymentVM;
  student: Student;
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
          <Clock size={14} /> Pending Review
        </Badge>
      );
  }
}

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

function TrackingProgress({ payment }: { payment: PaymentVM }) {
  const status = (payment.status || 'pending').toLowerCase();
  
  const stages = [
    {
      name: 'Payment Submitted',
      status: 'approved', // Always completed once submitted
      icon: FileText,
      description: 'Payment record created',
    },
    {
      name: 'Coordinator Review',
      status: status,
      icon: BadgeCheck,
      description: status === 'approved' ? 'Payment verified and approved' :
                   status === 'rejected' ? 'Payment rejected' :
                   'Under coordinator review',
      reason: payment.remarks,
    },
    {
      name: 'Final Approval',
      status: status === 'approved' ? 'approved' : 'pending',
      icon: CheckCircle,
      description: status === 'approved' 
                   ? 'Payment fully approved' 
                   : 'Awaiting coordinator approval',
    },
  ];

  const hasRejection = status === 'rejected';
  const allApproved = status === 'approved';

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className={`h-full transition-all duration-500 ${
              allApproved ? 'bg-green-500 w-full' :
              hasRejection ? 'bg-rose-500 w-1/3' :
              'bg-blue-500 w-1/3'
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

      {/* Rejection Reason in Progress */}
      {hasRejection && payment.remarks && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <div className="font-medium text-rose-700">Coordinator Review - Rejected</div>
              <div className="mt-1 text-rose-600">{payment.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisplayPayment({ payment, student }: Props) {
  const statusLower = (payment.status || 'pending').toLowerCase();
  const [expanded, setExpanded] = useState(statusLower === 'rejected');

  const createdAt = parseServerDate(payment.created_at || payment.payment_date);
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
        <div className="shrink-0">{statusBadge(payment.status)}</div>

        {/* Progress bar */}
        <div className="hidden md:block flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full transition-all ${
            statusLower === 'approved' ? 'w-full bg-green-500' :
            statusLower === 'rejected' ? 'w-1/4 bg-rose-500' :
            'w-1/2 bg-blue-500'
          }`} />
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {submittedWhen}
          {statusLower === 'rejected' && payment.remarks && (
            <span className="hidden sm:inline text-rose-600">• View reason</span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Details panel */}
      {expanded && (
        <div className="rounded-md p-4">
          {/* Header strip */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 border border-rose-200 p-2">
              <HandCoinsIcon className="h-5 w-5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-zinc-600">Student</div>
              <div className="truncate text-sm font-semibold">{student.name}</div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-2">
            {student.program && <Badge variant="secondary">{student.program}</Badge>}
            <Badge variant="secondary">Paid: {format(new Date(payment.payment_date + 'T00:00:00'), 'PPP')}</Badge>
            <Badge variant="secondary">OR: {payment.or_number}</Badge>
          </div>

          {/* Rejection Reason */}
          {statusLower === 'rejected' && payment.remarks && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <div className="font-medium text-rose-700">Payment Rejected</div>
                  <div className="mt-1 text-rose-600">{payment.remarks}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Progress */}
          <div className="mt-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <HandCoinsIcon className="h-4 w-4" />
              Payment Progress
            </div>
            <TrackingProgress payment={payment} />
          </div>

          {/* Quick summary */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Submitted</div>
              <div className="mt-1 text-sm">{createdAt ? format(createdAt, 'PPP p') : '—'}</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">OR Number</div>
              <div className="mt-1 text-sm">{payment.or_number || '—'}</div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[11px] text-muted-foreground">Payment Date</div>
              <div className="mt-1 text-sm">{format(new Date(payment.payment_date + 'T00:00:00'), 'PPP')}</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Two-column details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-zinc-600">Student Information</div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {student.name}</div>
                <div><span className="font-medium">Program:</span> {student.program || '—'}</div>
                <div><span className="font-medium">Email:</span> {student.email || '—'}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-zinc-600">Receipt Image</div>
              {payment.receipt_image ? (
                <a
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
                  href={`/storage/${payment.receipt_image}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Receipt className="h-4 w-4" />
                  View receipt
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              ) : (
                <div className="text-sm text-muted-foreground">No receipt uploaded.</div>
              )}
              {statusLower === 'approved' && !payment.remarks && (
                <div className="mt-3 text-xs text-green-600">Payment approved successfully</div>
              )}
              {statusLower === 'approved' && payment.remarks && (
                <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                  <span className="font-medium">Note:</span> {payment.remarks}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}