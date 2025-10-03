import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Receipt } from 'lucide-react';
import PaymentForm from './PaymentForm';
import DisplayPayment from './display-payment';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type PageProps = {
  student: { name: string; program: string | null; email?: string | null };
  canSubmit: boolean;
  payment: {
    payment_id: number;
    or_number: string;
    payment_date: string; // YYYY-MM-DD (or ISO)
    receipt_image: string | null;
    status: 'pending' | 'approved' | 'rejected';
    remarks?: string | null;
    created_at?: string | null;
  } | null;
};

// DEV ONLY: simulate approval/opening the form (remove when API is ready)
const DEV_SIMULATE_PAYMENT = false;
// Default simulation values (used when no URL params are provided)
const SIM_DEFAULTS = {
  canSubmit: true,   // pretend the comprehensive application is approved
  debugOpen: false,  // force-enable the button even if not allowed
};

export default function Index() {
  const { props } = usePage<PageProps>();
  const { student, canSubmit, payment } = props;

  // DEV: read optional overrides from the query string (?pay_can=1&pay_debug=1)
  const devOverrides = useMemo(() => {
    if (!DEV_SIMULATE_PAYMENT || typeof window === 'undefined') {
      return { canSubmit: null as boolean | null, debugOpen: false };
    }
    const qs = new URLSearchParams(window.location.search);
    const can = qs.has('pay_can')
      ? qs.get('pay_can') === '1'
      : SIM_DEFAULTS.canSubmit;            // fallback to SIM_DEFAULTS
    const dbg = qs.get('pay_debug') === '1' || SIM_DEFAULTS.debugOpen;
    return { canSubmit: can, debugOpen: dbg };
  }, []);

  // Effective ability to open the form
  const effectiveCanSubmit = DEV_SIMULATE_PAYMENT && devOverrides.canSubmit !== null
    ? devOverrides.canSubmit
    : canSubmit;

  const canOpenForm = (effectiveCanSubmit) && (!payment || payment.status === 'rejected');

  const [open, setOpen] = useState(false);
  const [showSuccessPanel, setShowSuccessPanel] = useState(false); // ensure this exists

  const statusBadge = useMemo(() => {
    const s = payment?.status;
    const base = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium';
    if (s === 'approved') return <span className={`${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Approved</span>;
    if (s === 'rejected') return <span className={`${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>Rejected</span>;
    if (s === 'pending') return <span className={`${base} bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`}>Pending</span>;
    return <span className={`${base} bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300`}>No submission</span>;
  }, [payment?.status]);

  return (
    <AppLayout>
      <Head title="Comprehensive Exam • Payment" />

      <div className="flex h-full flex-1 flex-col gap-5 pt-5 px-7 overflow-auto">
        <div className="w-full px-2 bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {/* Header row (mirrors comprehensive exam header) */}
          <div className="flex flex-row items-center justify-between w-full p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                <Receipt className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">Comprehensive Exam Payment</span>
                <p className="block text-xs text-muted-foreground">Submit your official receipt for verification.</p>
                <div className="mt-1 text-xs">{statusBadge}</div>
              </div>
            </div>

            <Button
              className="bg-rose-500 text-sm px-5 rounded-md"
              onClick={() => setOpen(true)}
              disabled={!canOpenForm && !devOverrides.debugOpen}   // DEV: allow force-open
              title={
                canOpenForm || devOverrides.debugOpen
                  ? 'Submit payment'
                  : !effectiveCanSubmit
                    ? 'You can submit payment only after your comprehensive application is approved.'
                    : 'Payment already submitted'
              }
            >
              Submit payment
            </Button>
          </div>

          {/* Display card (expandable) */}
          <div className="p-1">
            {payment ? (
              <div id="payment-card">
                <DisplayPayment
                  payment={{
                    id: payment.payment_id,
                    status: payment.status,
                    or_number: payment.or_number,
                    payment_date: payment.payment_date,
                    receipt_image: payment.receipt_image,
                    remarks: payment.remarks ?? null,
                    created_at: payment.created_at ?? null,
                  }}
                  student={student}
                />
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No payment submitted yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal with success panel flow (like comprehensive exam form) */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setShowSuccessPanel(false);
        }}
      >
        <DialogContent className="flex h-[70vh] w-full max-w-3xl flex-col"> {/* slightly shorter modal */}

          {showSuccessPanel ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
              <Check size={48} className="text-rose-500" />
              <h2 className="text-2xl font-semibold">Payment Submitted!</h2>
              <p className="text-center text-gray-600">Your payment has been saved successfully.</p>
              <Button
                onClick={() => {
                  setOpen(false);
                  setTimeout(() => {
                    document.getElementById('payment-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="bg-rose-500"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-2">
              <PaymentForm
                canSubmit={canOpenForm || devOverrides.debugOpen}
                payment={payment}
                onSuccess={() => setShowSuccessPanel(true)} // show success card
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}