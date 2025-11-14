'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Receipt, BadgeCheck, XCircle, Clock, ChevronDown, ExternalLink, HandCoinsIcon } from 'lucide-react';

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

// Parse server dates without forcing UTC.
// - If ISO already has Z or +hh:mm, trust it.
// - If "YYYY-MM-DD HH:mm:ss", treat as local (no Z).
function parseServerDate(dt?: string | null) {
  if (!dt) return null;
  if (/T.+(Z|[+-]\d{2}:\d{2})$/.test(dt)) return new Date(dt);          // ISO with zone
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(dt)) {              // MySQL-style
    return new Date(dt.replace(' ', 'T'));                               // local time
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return new Date(`${dt}T00:00:00`); // date only
  return new Date(dt);                                                   // fallback
}

export default function DisplayPayment({ payment, student }: Props) {
  const [expanded, setExpanded] = useState(false);

  const createdAt = parseServerDate(payment.created_at || payment.payment_date);
  const submittedWhen = createdAt
    ? `Submitted ${formatDistanceToNow(createdAt, { addSuffix: true })}`
    : '';

  // Progress styling by status
  const prog = (() => {
    const s = (payment.status || 'pending').toLowerCase();
    if (s === 'approved') {
      return {
        wrap: 'bg-rose-100 ring-1 ring-rose-200/60',
        fill: 'bg-rose-500',
        width: '100%',
      };
    }
    if (s === 'rejected') {
      return {
        wrap: 'bg-rose-100 ring-1 ring-rose-200/60',
        fill: 'bg-rose-400',
        width: '24%',
      };
    }
    // pending
    return {
      wrap: 'bg-rose-100 ring-1 ring-rose-200/60',
      fill: 'bg-rose-300',
      width: '66%',
    };
  })();

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
        <div
          className={`hidden md:block flex-1 h-2 rounded-full overflow-hidden ${prog.wrap}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={prog.width === '100%' ? 100 : prog.width === '66%' ? 66 : 24}
          data-status={payment.status}
        >
          <div
            className={`h-full ${prog.fill} transition-all duration-500 ease-out`}
            style={{ width: prog.width }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {submittedWhen}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Details panel */}
      {expanded && (
        <div className="mt-3 rounded-md p-2">
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
            <Badge variant="secondary">{payment.status[0].toUpperCase() + payment.status.slice(1)}</Badge>
            <Badge variant="secondary">Paid: {format(new Date(payment.payment_date + 'T00:00:00'), 'PPP')}</Badge>
          </div>

          <Separator className="my-4" />

          {/* Two-column details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-zinc-600">Payment Details</div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">OR Number:</span> {payment.or_number || '—'}</div>
                <div><span className="font-medium">Payment Date:</span> {format(new Date(payment.payment_date + 'T00:00:00'), 'PPP')}</div>
                {payment.remarks && (
                  <div className="rounded-md border border-slate-200 p-2">
                    <span className="font-medium">Remarks:</span> {payment.remarks}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-zinc-600">Receipt</div>
              {payment.receipt_image ? (
                <a
                  className="inline-flex items-center gap-1 text-primary-600 underline hover:no-underline text-sm"
                  href={`/storage/${payment.receipt_image}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View receipt <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="text-sm text-muted-foreground">No receipt uploaded.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}