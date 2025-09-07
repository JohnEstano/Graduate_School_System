import { Badge } from '@/components/ui/badge';
import type { CompreExamApplicationSummary } from './Index';
import { ClipboardList, CheckCircle2, XCircle, User2, GraduationCap, Mail, Clock, Stamp, FileCheck } from 'lucide-react';

export default function Details({ application }: { application: CompreExamApplicationSummary }) {
  const elig = application.eligible;

  const ReviewBadge = (s: CompreExamApplicationSummary['application_status']) => {
    const v = s || 'not_yet_applied';
    const map: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
        rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
        pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
        not_yet_applied: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800',
    };
    const icon =
        v === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
        v === 'rejected' ? <XCircle className="h-3.5 w-3.5" /> :
        <Clock className="h-3.5 w-3.5" />;

    const label = v === 'not_yet_applied' ? 'Not yet applied' : v[0].toUpperCase() + v.slice(1);

    return (
        <Badge
        variant="outline"
        title={`Review status: ${label}`}
        className={`rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 ${map[v]}`}
        >
        {icon}
        <span className="hidden sm:inline">Review:</span> {label}
        </Badge>
    );
    };

    const PermitBadge = (v: CompreExamApplicationSummary['permit_status']) => {
    if (!v) {
        return (
        <Badge variant="outline" title="Permit status: —" className="rounded-full px-2.5 py-1 inline-flex items-center gap-1.5">
            <Stamp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Permit:</span> —
        </Badge>
        );
    }
    const map: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
        rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
        pending: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900', // different hue from Review
    };
    const icon =
        v === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
        v === 'rejected' ? <XCircle className="h-3.5 w-3.5" /> :
        <Stamp className="h-3.5 w-3.5" />;

    const label = v[0].toUpperCase() + v.slice(1);

    return (
        <Badge
        variant="outline"
        title={`Permit status: ${label}`}
        className={`rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 ${map[v]}`}
        >
        {icon}
        <span className="hidden sm:inline">Permit:</span> {label}
        </Badge>
    );
    };

    const SubmissionBadge = (applied: boolean) => (
    <Badge
        variant="outline"
        title={`Submission: ${applied ? 'Submitted' : 'Not submitted'}`}
        className="rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
    >
        <FileCheck className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Submission:</span> {applied ? 'Submitted' : 'Not submitted'}
    </Badge>
    );

  return (
    <div className="max-w-md w-full p-1 text-sm mx-auto">
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
                {/* Eligibility (kept the same but you can prefix too) */}
                <Badge
                    variant="outline"
                    className={
                    'rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 ' +
                    (elig
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                        : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900')
                    }
                    title={`Eligibility: ${elig ? 'Eligible' : 'Not eligible'}`}
                >
                    {elig ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Eligibility:</span> {elig ? 'Eligible' : 'Not eligible'}
                </Badge>

                {/* Submission */}
                {SubmissionBadge(application.applied)}

                {/* Review (Application status) */}
                {ReviewBadge(application.application_status)}

                {/* Permit */}
                {PermitBadge(application.permit_status)}
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