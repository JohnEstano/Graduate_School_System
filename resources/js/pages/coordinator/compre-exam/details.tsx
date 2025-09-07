import { Badge } from '@/components/ui/badge';
import type { CompreExamApplicationSummary } from './Index';
import { ClipboardList, CheckCircle2, XCircle, User2, GraduationCap, Mail } from 'lucide-react';

export default function Details({ application }: { application: CompreExamApplicationSummary }) {
  const elig = application.eligible;

  const statusBadge = (v: CompreExamApplicationSummary['application_status']) => {
    const s = v || 'not_yet_applied';
    const label = s === 'not_yet_applied' ? 'Not yet applied' : s[0].toUpperCase() + s.slice(1);
    const cls =
      s === 'approved'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
        : s === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
        : s === 'pending'
        ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900'
        : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800';
    return <Badge variant="outline" className={`rounded-full ${cls}`}>{label}</Badge>;
  };

  const permitBadge = (v: CompreExamApplicationSummary['permit_status']) => {
    if (!v) return <Badge variant="outline" className="rounded-full">—</Badge>;
    const s = v;
    const cls =
      s === 'approved'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
        : s === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
        : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
    return <Badge variant="outline" className={`rounded-full ${cls}`}>{s[0].toUpperCase() + s.slice(1)}</Badge>;
  };

  return (
    <div className="p-3 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Details</h2>
      </div>

      {/* Top summary */}
      <div className="rounded-lg border bg-white/60 dark:bg-background p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-medium">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-base md:text-[17px] font-semibold">
                {application.last_name}, {application.first_name} {application.middle_name ? `${application.middle_name[0]}.` : ''}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {application.email || '—'}
              </span>
              <span className="inline-flex items-center gap-1">
                ID:
                <span className="font-medium text-foreground">{application.school_id || '—'}</span>
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[15px]">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{application.program || '—'}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Eligibility */}
              <Badge
                variant="outline"
                className={
                  'rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 ' +
                  (elig
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                    : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900')
                }
              >
                {elig ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {elig ? 'Eligible' : 'Not eligible'}
              </Badge>

              {/* Applied */}
              <Badge variant="outline" className="rounded-full px-2.5 py-1">
                {application.applied ? 'Applied' : 'Not applied'}
              </Badge>

              {/* Application Status */}
              {statusBadge(application.application_status)}

              {/* Permit Status */}
              {permitBadge(application.permit_status)}
            </div>
          </div>
        </div>
      </div>

      {/* Lacking requirements */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Lacking requirements</div>
        {application.eligible || application.lacking.length === 0 ? (
          <div className="text-[13px] text-foreground">None</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {application.lacking.map((x, i) => (
              <Badge
                key={i}
                variant="outline"
                className="rounded-full bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                {x}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}