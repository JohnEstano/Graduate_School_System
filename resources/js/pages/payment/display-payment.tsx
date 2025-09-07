'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Receipt, BadgeCheck, XCircle, Clock, ChevronDown, ExternalLink, HandCoinsIcon, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type Student = { name: string; program: string | null; email?: string | null };

export type PaymentVM = {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  or_number: string;
  payment_date: string; // YYYY-MM-DD or ISO
  receipt_image: string | null;
  remarks: string | null;
  created_at: string | null;
  amount_paid?: number | null; // NEW: displayable amount
};

type Props = {
  payment: PaymentVM;
  student: Student;
  onResubmit?: () => void; // optional CTA when rejected
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
        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 gap-1">
          <Clock size={14} /> Pending Review
        </Badge>
      );
  }
}

// Parse "YYYY-MM-DD HH:mm:ss" as UTC; fall back to local if ISO is provided
function parseServerDate(dt?: string | null) {
  if (!dt) return null;
  if (/T.+(Z|[+-]\d{2}:\d{2})$/.test(dt)) return new Date(dt);
  return new Date(dt.replace(' ', 'T') + 'Z');
}

export default function DisplayPayment({ payment, student, onResubmit }: Props) {
  // Auto-expand when rejected so the reason is visible
  const [expanded, setExpanded] = useState(payment.status === 'rejected');
  useEffect(() => {
    if (payment.status === 'rejected') setExpanded(true);
  }, [payment.status]);
  const detailsId = useId();
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createdAt = parseServerDate(payment.created_at || payment.payment_date);
  const submittedWhen = createdAt
    ? `Submitted ${formatDistanceToNow(createdAt, { addSuffix: true })}`
    : '';

  // Progress styling by status
  const prog = (() => {
    const s = (payment.status || 'pending').toLowerCase();
    if (s === 'approved') {
      return {
        wrap: 'bg-emerald-100 ring-1 ring-emerald-200/60',
        fill: 'bg-emerald-500',
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
      wrap: 'bg-amber-100 ring-1 ring-amber-200/60',
      fill: 'bg-amber-300',
      width: '66%',
    };
  })();

  const amountPH = useMemo(() => {
    const n = payment.amount_paid;
    if (n == null || isNaN(Number(n))) return null;
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(n));
  }, [payment.amount_paid]);

  const receiptUrl = useMemo(() => {
    if (!payment.receipt_image) return null;
    // Accept full URLs or storage paths
    return payment.receipt_image.startsWith('http')
      ? payment.receipt_image
      : `/storage/${payment.receipt_image}`;
  }, [payment.receipt_image]);

  const status = (payment.status || 'pending').toLowerCase();
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';

  return (
    <div className="w-full">
      {/* Status row (click to expand/collapse) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition"
        aria-expanded={expanded}
        aria-controls={detailsId}
      >
        <div className="shrink-0">{statusBadge(payment.status)}</div>

        {/* Progress bar */}
        <div
          className={`hidden md:block flex-1 h-2 rounded-full overflow-hidden ${prog.wrap}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={prog.width === '100%' ? 100 : prog.width === '66%' ? 66 : 24}
          aria-label="Payment review progress"
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

      {/* Rejection banner only when rejected */}
      {isRejected && payment.remarks && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="status" aria-live="polite">
          <XCircle className="mt-0.5 h-4 w-4" />
          <div className="min-w-0">
            <div className="font-medium">Reason for rejection</div>
            <div className="break-words">{payment.remarks}</div>
          </div>
        </div>
      )}

      {/* Details panel */}
      {expanded && (
        <div id={detailsId} className="mt-3 rounded-md p-2">
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

          {/* Badges (deduplicated) */}
          <div className="mt-2 flex flex-wrap gap-2">
            {student.program && <Badge variant="secondary">{student.program}</Badge>}
            {amountPH && <Badge variant="secondary">Amount: {amountPH}</Badge>}
          </div>

          <Separator className="my-4" />

          {/* Two-column details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-zinc-600">Payment Details</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">OR Number:</span>
                  <span>{payment.or_number || '—'}</span>
                  {!!payment.or_number && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(payment.or_number);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        } catch {}
                      }}
                      title="Copy OR number"
                    >
                      <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div><span className="font-medium">Payment Date:</span> {format(new Date(payment.payment_date + 'T00:00:00'), 'PPP')}</div>
                {/* Remarks: show once; if approved, mark as “Previously rejected” */}
                {!isRejected && payment.remarks && (
                  <div className="rounded-md border border-slate-200 p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Remarks</span>
                      {isApproved && (
                        <Badge variant="secondary" className="text-[11px]">Previously rejected</Badge>
                      )}
                    </div>
                    <div className="mt-1">{payment.remarks}</div>
                  </div>
                )}
                {payment.status === 'rejected' && onResubmit && (
                  <div>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      onClick={onResubmit}
                    >
                      Resubmit payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt preview column unchanged */}
            <div>
              <div className="mb-2 text-xs text-zinc-600">Receipt</div>
              {receiptUrl ? (
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-1 text-primary-600 underline hover:no-underline text-sm">
                      View receipt <ExternalLink className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <div className="max-h-[70vh] overflow-auto">
                      <img src={receiptUrl} alt="Payment receipt image" className="w-full h-auto rounded-md" />
                    </div>
                  </DialogContent>
                </Dialog>
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