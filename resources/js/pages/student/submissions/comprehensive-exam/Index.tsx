import AppLayout from '@/layouts/app-layout';
import AcademicRecordsDashboard from '@/pages/legacy/AcademicRecordsDashboard';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Info, RefreshCcw, ShieldCheck, ShieldAlert, CalendarX } from 'lucide-react';
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
  contact_number?: string | null;
  telephone_number?: string | null;
  office_address?: string | null;
  program: string;
  created_at?: string;
  subjects: Subject[];
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
  documentsComplete: boolean | null;
  noOutstandingBalance: boolean | null;
  loading: boolean;
  error?: string | null;
};

// DEV: simulation (remove/disable when API is ready)
const DEV_SIMULATE = true;
// Toggle these to simulate your state
const SIM_ELIG = {
  examOpen: true,            // set false to simulate "exam closed"
  gradesComplete: true,      // set false to simulate not complete
  documentsComplete: true,   // set false to simulate not complete
  noOutstandingBalance: true // set false to simulate with balance
};

export default function ComprehensiveExamIndex() {
  const { props } = usePage<PageProps>();
  const { application } = props;

  const [open, setOpen] = useState(false);

  // Eligibility state (student side only)
  const [elig, setElig] = useState<Eligibility>({
    examOpen: null,
    gradesComplete: null,
    documentsComplete: null,
    noOutstandingBalance: null,
    loading: true,
    error: null,
  });

  const [showEligDialog, setShowEligDialog] = useState(false);

  async function fetchEligibility() {
    // Simulation short-circuit
    if (DEV_SIMULATE) {
      // Optional: override via URL, e.g. ?open=1&grades=1&docs=0&bal=1
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const getBool = (k: string, fallback: boolean) =>
        q?.has(k) ? q.get(k) === '1' : fallback;

      setElig({
        examOpen: getBool('open', SIM_ELIG.examOpen),
        gradesComplete: getBool('grades', SIM_ELIG.gradesComplete),
        documentsComplete: getBool('docs', SIM_ELIG.documentsComplete),
        noOutstandingBalance: getBool('bal', SIM_ELIG.noOutstandingBalance),
        loading: false,
        error: null,
      });
      return;
    }

    setElig((e) => ({ ...e, loading: true, error: null }));
    try {
      // Adjust these endpoints to your backend/API gateway.
      const [examStatusRes, studentEligRes] = await Promise.allSettled([
        fetch('/api/comprehensive-exam/status', { credentials: 'include' }),
        fetch('/api/comprehensive-exam/eligibility', { credentials: 'include' }),
      ]);

      let examOpen: boolean | null = null;
      if (examStatusRes.status === 'fulfilled' && examStatusRes.value.ok) {
        const j = await examStatusRes.value.json();
        examOpen = !!(j?.open ?? j?.isOpen);
      }

      let gradesComplete: boolean | null = null;
      let documentsComplete: boolean | null = null;
      let noOutstandingBalance: boolean | null = null;
      if (studentEligRes.status === 'fulfilled' && studentEligRes.value.ok) {
        const j = await studentEligRes.value.json();
        gradesComplete = !!(j?.gradesComplete ?? j?.completeGrades);
        documentsComplete = !!(j?.documentsComplete ?? j?.completeDocuments);
        noOutstandingBalance = !!(j?.noOutstandingBalance ?? j?.hasNoOutstandingBalance);
      }

      setElig({
        examOpen,
        gradesComplete,
        documentsComplete,
        noOutstandingBalance,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setElig((prev) => ({
        ...prev,
        loading: false,
        error: 'Unable to verify eligibility at this time.',
      }));
    }
  }

  useEffect(() => {
    fetchEligibility();
  }, []);

  const canApply = useMemo(() => {
    return !!(
      elig.examOpen &&
      elig.gradesComplete &&
      elig.documentsComplete &&
      elig.noOutstandingBalance
    );
  }, [elig]);

  const examClosed = elig.examOpen === false; // NEW
  const hasPending = application ? (application.final_approval_status?.toLowerCase() === 'pending') : false;

  // Reasons to show when not eligible
  const blockers = useMemo(() => {
    const arr: { label: string; ok: boolean | null }[] = [
      { label: 'Exam window is open', ok: elig.examOpen },
      { label: 'Complete grades (registrar verified)', ok: elig.gradesComplete },
      { label: 'Complete documents submitted', ok: elig.documentsComplete },
      { label: 'No outstanding tuition balance', ok: elig.noOutstandingBalance },
    ];
    return arr;
  }, [elig]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Comprehensive Exam" />
      <div className="flex flex-col px-7 pt-5 pb-5 w-full">
        <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="flex flex-row items-center justify-between w-full p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                <GraduationCap className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">Comprehensive Exam</span>
                <p className="block text-xs text-muted-foreground">
                  Submit and track your comprehensive exam application.
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={canApply ? 'secondary' : 'outline'}
                    className={
                      examClosed
                        ? 'border-rose-300 text-rose-700 bg-rose-50'
                        : canApply
                        ? 'border-green-300 text-green-700 bg-green-50'
                        : ''
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
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${elig.loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowEligDialog(true)}
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comprehensive Exam" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-2xl font-semibold mb-2">Comprehensive Exam</h1>
                        <p className="text-sm text-muted-foreground">Review your academic records below before proceeding with exam submissions.</p>
                    </div>
                    <AcademicRecordsDashboard />

                </div>
              </div>
            </div>

            <Button
              className="bg-rose-500 text-sm px-5 rounded-md"
              onClick={() => setOpen(true)}
              disabled={!canApply || (!!application && hasPending)}
              title={
                examClosed
                  ? 'Exam is closed'
                  : !canApply
                  ? 'You are not eligible yet'
                  : hasPending
                  ? 'Application pending'
                  : 'Submit application'
              }
            >
              Submit application
            </Button>
            <CompreExamForm open={open} onOpenChange={setOpen} />
          </div>

          <div>
            {application ? (
              <DisplayApplication
                application={{
                  id: application.application_id,
                  first_name: application.first_name,
                  middle_initial: application.middle_name ? application.middle_name[0] : null,
                  last_name: application.last_name,
                  program: application.program,
                  school_year: application.school_year,
                  office_address: application.office_address ?? null,
                  mobile_no: application.contact_number ?? null,
                  telephone_no: application.telephone_number ?? null,
                  email: application.email,
                  status: (application.final_approval_status || 'Pending') as any,
                  subjects: application.subjects,
                  created_at: application.created_at ?? null,
                }}
              />
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No application submitted yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Eligibility details dialog */}
      <Dialog open={showEligDialog} onOpenChange={setShowEligDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comprehensive Exam Eligibility</DialogTitle>
            <DialogDescription>
              You must meet all the requirements below before you can submit an application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {blockers.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded border px-3 py-2">
                <span className="text-sm">{b.label}</span>
                <Badge
                  variant="outline"
                  className={
                    b.ok === true
                      ? 'border-green-300 text-green-700 bg-green-50'
                      : b.ok === false
                      ? 'border-rose-300 text-rose-700 bg-rose-50'
                      : 'text-zinc-600'
                  }
                >
                  {b.ok === true ? 'OK' : b.ok === false ? 'Missing' : 'Unknown'}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowEligDialog(false)}>Close</Button>
            <Button onClick={() => { setShowEligDialog(false); if (canApply && !hasPending) setOpen(true); }} disabled={!canApply || hasPending}>
              Apply Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
