import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Info, RefreshCcw, ShieldCheck, ShieldAlert, CalendarX, Plus } from 'lucide-react';
import DisplayApplication from './display-applications';
import CompreExamForm from './compre-exam-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Comprehensive Exam', href: '/comprehensive-exam' },
];

type Subject = { subject: string; date: string; startTime: string; endTime: string };

type ApplicationVM = {
  application_id: number;
  school_year: string;
  permit_status: string;
  final_approval_status: string;
  final_approval_reason?: string | null;
  registrar_status?: 'pending' | 'approved' | 'rejected' | null;
  registrar_reason?: string | null;
  dean_status?: 'pending' | 'approved' | 'rejected' | null;
  dean_reason?: string | null;
  contact_number?: string | null;
  telephone_number?: string | null;
  office_address?: string | null;
  program: string;
  created_at?: string;
  subjects: (Subject & { score?: number | null })[];
  average_score?: number | null;
  result_status?: 'passed' | 'failed' | null;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  student_id: string | number;
};

type PageProps = {
  application?: ApplicationVM | null;
};

type Eligibility = {
  examOpen: boolean | null;
  gradesComplete: boolean | null;
  noOutstandingBalance: boolean | null;
  loading: boolean;
  error?: string | null;
};

export default function ComprehensiveExamIndex() {
  const { props } = usePage<PageProps>();
  const { application } = props;

  const [open, setOpen] = useState(false);

  const [elig, setElig] = useState<Eligibility>({
    examOpen: null,
    gradesComplete: null,
    noOutstandingBalance: null,
    loading: true,
    error: null,
  });

  const [showEligDialog, setShowEligDialog] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // Dev simulation toggle
  const [simulateEligibility, setSimulateEligibility] = useState(true);

  const allStudentFlagsNull = (e: Eligibility) =>
    e.gradesComplete === null && e.noOutstandingBalance === null;

  const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  async function fetchEligibility() {
    // Skip network when simulation is enabled
    if (simulateEligibility) {
      setElig({
        examOpen: true,
        gradesComplete: true,
        noOutstandingBalance: true,
        loading: false,
        error: null,
      });
      return;
    }

    setElig((e) => ({ ...e, loading: true, error: null }));

    try {
      const headers: HeadersInit = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      const csrf = getCsrf();
      if (csrf) headers['X-CSRF-TOKEN'] = csrf;

      const [examStatusRes, studentEligRes] = await Promise.allSettled([
        fetch('/api/comprehensive-exam/status', { credentials: 'include', headers }),
        fetch('/api/comprehensive-exam/eligibility', { credentials: 'include', headers }),
      ]);

      let examOpen: boolean | null = null;
      if (examStatusRes.status === 'fulfilled' && examStatusRes.value.ok) {
        const j = await examStatusRes.value.json();
        examOpen = !!(j?.open ?? j?.isOpen);
      }

      let gradesComplete: boolean | null = null;
      let noOutstandingBalance: boolean | null = null;

      if (studentEligRes.status === 'fulfilled' && studentEligRes.value.ok) {
        const j = await studentEligRes.value.json();
        if (Array.isArray(j?.requirements)) {
          const reqs = j.requirements as Array<{ name: string; completed?: boolean }>;
            const find = (name: string) => reqs.find((r) => r.name === name)?.completed ?? null;
            gradesComplete = find('Complete grades (registrar verified)');
            noOutstandingBalance = find('No outstanding tuition balance');
        } else {
          gradesComplete = j?.gradesComplete ?? j?.completeGrades ?? null;
          noOutstandingBalance = j?.noOutstandingBalance ?? j?.hasNoOutstandingBalance ?? null;
        }
        gradesComplete = gradesComplete === null ? null : !!gradesComplete;
        noOutstandingBalance = noOutstandingBalance === null ? null : !!noOutstandingBalance;
      }

      const nextElig: Eligibility = {
        examOpen,
        gradesComplete,
        noOutstandingBalance,
        loading: false,
        error: null,
      };

      setElig(nextElig);

      if (!simulateEligibility && (gradesComplete === null || noOutstandingBalance === null) && retryCount < 5) {
        setTimeout(() => {
          setRetryCount((c) => c + 1);
          fetchEligibility();
        }, 3000);
      } else if (!allStudentFlagsNull(nextElig)) {
        setRetryCount(0);
      }
    } catch (e: any) {
      setElig({
        examOpen: null,
        gradesComplete: null,
        noOutstandingBalance: null,
        loading: false,
        error: e?.message ?? 'Unable to verify eligibility at this time.',
      });
    }
  }

  // Initial load
  useEffect(() => {
    fetchEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply simulation changes
  useEffect(() => {
    if (simulateEligibility) {
      setElig({
        examOpen: true,
        gradesComplete: true,
        noOutstandingBalance: true,
        loading: false,
        error: null,
      });
    } else {
      fetchEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulateEligibility]);

  const canApply = useMemo(
    () => !!(elig.examOpen && elig.gradesComplete && elig.noOutstandingBalance),
    [elig]
  );

  const examClosed = elig.examOpen === false;
  const status = application?.final_approval_status?.toLowerCase() ?? null;
  const hasPending = status === 'pending';
  const hasApproved = status === 'approved';

  const blockers = useMemo(
    () => [
      { label: 'Exam window is open', ok: elig.examOpen },
      { label: 'Complete grades (registrar verified)', ok: elig.gradesComplete },
      { label: 'No outstanding tuition balance', ok: elig.noOutstandingBalance },
    ],
    [elig]
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Comprehensive Exam" />
      <div className="flex flex-col px-7 pt-5 pb-5 w-full">
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="flex flex-row items-center justify-between w-full px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500 dark:border-rose-600">
                <GraduationCap className="h-5 w-5 text-rose-500 dark:text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comprehensive Exam</span>
                <p className="block text-xs text-muted-foreground dark:text-zinc-400">
                  Submit and track your comprehensive exam application.
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={canApply ? 'secondary' : 'outline'}
                    className={
                      examClosed
                        ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950'
                        : canApply
                        ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950'
                        : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }
                  >
                    {examClosed ? (
                      <span className="flex items-center gap-1">
                        <CalendarX className="h-3.5 w-3.5" />
                        Closed
                      </span>
                    ) : canApply ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Eligible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Not eligible
                      </span>
                    )}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={fetchEligibility}
                    disabled={elig.loading}
                    title={elig.loading ? 'Checking eligibility…' : 'Refresh eligibility'}
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${elig.loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowEligDialog(true)}
                    title="See eligibility details"
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>

                  {/* Subtle sync hint when polling */}
                  {retryCount > 0 && allStudentFlagsNull(elig) && !simulateEligibility && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Syncing eligibility… ({retryCount}/5)
                    </span>
                  )}
                </div>
                {elig.error && (
                  <div
                    role="alert"
                    className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium"
                  >
                    {elig.error}
                  </div>
                )}
                <label className="flex items-center gap-1 mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    aria-label="Simulate eligibility"
                    checked={simulateEligibility}
                    onChange={(e) => setSimulateEligibility(e.target.checked)}
                    className="h-3 w-3 accent-rose-600"
                  />
                  Dev: Simulate eligibility
                </label>
              </div>
            </div>

            <Button
              className="bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white text-sm px-5 rounded-md"
              onClick={() => setOpen(true)}
              disabled={!canApply || (!!application && (hasPending || hasApproved))}
              title={
                examClosed
                  ? 'Exam is closed'
                  : !canApply
                  ? 'You are not eligible yet'
                  : hasApproved
                  ? 'Application approved'
                  : hasPending
                  ? 'Application pending'
                  : 'Submit application'
              }
            >
              <Plus className="h-4 w-4" />
              Submit application
            </Button>
            <CompreExamForm open={open} onOpenChange={setOpen} />
          </div>

          <div className="dark:bg-zinc-900">
            {application ? (
              <DisplayApplication
                application={{
                  id: application.application_id,
                  first_name: application.first_name,
                  middle_initial: application.middle_name ? application.middle_name[0] : null,
                  last_name: application.last_name,
                  program: application.program,
                  school_year: application.school_year,
                  average_score: application.average_score ?? null,
                  result_status: application.result_status ?? null,
                  office_address: application.office_address ?? null,
                  mobile_no: application.contact_number ?? null,
                  telephone_no: application.telephone_number ?? null,
                  email: application.email,
                  status: (application.final_approval_status || 'Pending') as any,
                  registrar_status: application.registrar_status ?? null,
                  registrar_reason: application.registrar_reason ?? null,
                  dean_status: application.dean_status ?? null,
                  dean_reason: application.dean_reason ?? null,
                  subjects: application.subjects,
                  created_at: application.created_at ?? null,
                }}
              />
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground dark:text-zinc-400">
                No application submitted yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eligibility details dialog */}
      <Dialog open={showEligDialog} onOpenChange={setShowEligDialog}>
        <DialogContent className="sm:max-w-md dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">Comprehensive Exam Eligibility</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">
              You must meet all the requirements below before you can submit an application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {blockers.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border border-zinc-200 dark:border-zinc-700 px-3 py-2 dark:bg-zinc-800/50"
              >
                <span className="text-sm dark:text-zinc-300">{b.label}</span>
                <Badge
                  variant="outline"
                  className={
                    b.ok === true
                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950'
                      : b.ok === false
                      ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950'
                      : 'text-zinc-600 dark:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'
                  }
                >
                  {b.ok === true ? 'OK' : b.ok === false ? 'Missing' : 'Unknown'}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setShowEligDialog(false)}
              className="dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowEligDialog(false);
                if (canApply && !hasPending && !hasApproved) setOpen(true);
              }}
              disabled={!canApply || hasPending || hasApproved}
              title={
                !canApply
                  ? 'You are not eligible yet'
                  : hasApproved
                  ? 'Application approved'
                  : hasPending
                  ? 'Application pending'
                  : 'Apply now'
              }
              className="bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
