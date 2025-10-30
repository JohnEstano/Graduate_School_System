import { Badge } from '@/components/ui/badge';
import type { ComprePaymentSummary } from './Index';
import { CreditCard, User2, GraduationCap, Mail, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export default function Details({ payment }: { payment: ComprePaymentSummary }) {
  const statusCls =
    payment.status === 'approved'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
      : payment.status === 'rejected'
      ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
      : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';

  const money = (amt?: number | null) =>
    amt == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amt);

  const wasRejected = payment.status === 'approved' && !!payment.remarks;

  return (
    <div className="max-w-md w-full text-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Details</h2>
      </div>

      <div className="rounded-lg border bg-white/60 dark:bg-background p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-medium">
              <User2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-base md:text-[17px] font-semibold">
                {payment.last_name}, {payment.first_name} {payment.middle_name ? `${payment.middle_name[0]}.` : ''}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {payment.email || '—'}
              </span>
              <span className="inline-flex items-center gap-1">
                ID: <span className="font-medium text-foreground">{payment.school_id || '—'}</span>
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-2 text-[15px] min-w-0">
              <GraduationCap className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="text-foreground leading-tight break-words whitespace-normal min-w-0">
                {payment.program || '—'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`rounded-full ${statusCls}`}>
                {payment.status[0].toUpperCase() + payment.status.slice(1)}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {payment.submitted_at ? format(new Date(payment.submitted_at), 'MMM dd, yyyy') : '—'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Reference</div>
            <div className="font-medium inline-flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              {payment.reference || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Amount</div>
            <div className="font-medium">{money(payment.amount)}</div>
          </div>
          {payment.remarks ? (
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">
                Remarks{wasRejected ? ' (from previous rejection)' : ''}
              </div>
              <div className="font-normal text-foreground">{payment.remarks}</div>
            </div>
          ) : null}
          {payment.proof_url ? (
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Proof</div>
              <a href={payment.proof_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                {payment.proof_url}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}