'use client';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  CircleArrowLeft,
  Signature,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type DefenseRequestFull = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  school_id: string;
  program: string;
  thesis_title: string;
  defense_type: string;
  status?: string;
  priority?: 'Low' | 'Medium' | 'High';
  workflow_state?: string;
  defense_adviser?: string;
  advisers_endorsement?: string;
  rec_endorsement?: string;
  proof_of_payment?: string;
  reference_no?: string;
  manuscript_proposal?: string;
  similarity_index?: string;
  avisee_adviser_attachment?: string;
  submitted_at?: string;
  workflow_history?: any[];
  last_status_updated_by?: string;
  last_status_updated_at?: string;
};

interface PageProps {
  defenseRequest: DefenseRequestFull;
  userRole: string;
}

export default function DetailsRequirementsPage(rawProps: any) {
  const props: PageProps = rawProps || {};
  const requestProp: DefenseRequestFull | null = props.defenseRequest || null;
  const userRole: string = props.userRole || '';

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'All Defense Requirements', href: '/all-defense-requirements' }
  ];
  if (requestProp?.id) {
    const thesisForCrumb =
      (requestProp.thesis_title?.length || 0) > 60
        ? requestProp.thesis_title.slice(0, 57) + '...'
        : requestProp.thesis_title || `Request #${requestProp.id}`;
    breadcrumbs.push({
      title: thesisForCrumb,
      href: `/adviser/defense-requirements/${requestProp.id}/details`
    });
  }

  if (!requestProp) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Defense Request - Not Found" />
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-500">
            No defense request loaded. Use the list page and click Details again.
          </p>
          <Button
            variant="outline"
            onClick={() => router.visit('/all-defense-requirements')}
          >
            Back to list
          </Button>
        </div>
      </AppLayout>
    );
  }

  const [request, setRequest] = useState<DefenseRequestFull>(requestProp);
  const [confirm, setConfirm] = useState<{ open: boolean; action: 'approve' | 'reject' | 'retrieve' | null }>({
    open: false,
    action: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  function csrf() {
    return (
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
        ?.content || ''
    );
  }

  // --- Approve/Reject/Retrieve logic ---
  async function handleStatusChange(action: 'approve' | 'reject' | 'retrieve') {
    if (!request.id) return;
    setIsLoading(true);
    let newStatus: DefenseRequestFull['status'] = 'Pending';
    if (action === 'approve') newStatus = 'Approved';
    else if (action === 'reject') newStatus = 'Rejected';
    else if (action === 'retrieve') newStatus = 'Pending';

    try {
      const res = await fetch(`/adviser/defense-requirements/${request.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf(),
          Accept: 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.request) {
          setRequest(data.request);
        } else {
          setRequest(r => ({
            ...r,
            status: newStatus,
            workflow_history: data.workflow_history || r.workflow_history,
          }));
        }
        toast.success(`Request set to ${newStatus}`);
      } else {
        toast.error(data?.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    } finally {
      setIsLoading(false);
      setConfirm({ open: false, action: null });
    }
  }

  function getInitials(user: { first_name?: string; last_name?: string }) {
    const first = user.first_name?.trim()?.[0] ?? '';
    const last = user.last_name?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    try {
      return dayjs(d).format('YYYY-MM-DD hh:mm A');
    } catch {
      return d;
    }
  }

  function statusBadgeColor(s?: string) {
    if (!s) return 'bg-gray-100 text-gray-600';
    if (/approved/i.test(s)) return 'bg-green-100 text-green-600';
    if (/reject/i.test(s)) return 'bg-red-100 text-red-600';
    return 'bg-amber-100 text-amber-600';
  }

  // Attachments
  const attachments = [
    { label: "Adviser’s Endorsement", url: request.advisers_endorsement },
    { label: 'REC Endorsement', url: request.rec_endorsement },
    { label: 'Proof of Payment', url: request.proof_of_payment },
    { label: 'Reference No.', url: request.reference_no },
    { label: 'Manuscript', url: request.manuscript_proposal },
    { label: 'Similarity Index', url: request.similarity_index },
    { label: 'Avisee-Adviser File', url: request.avisee_adviser_attachment },
  ];

  // Workflow stepper config
  const workflowSteps = [
    {
      key: 'submitted',
      label: 'Submitted',
      icon: <Signature className="h-5 w-5" />,
    },
    {
      key: 'adviser-approved',
      label: 'Endorsed by Adviser',
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      key: 'coordinator-approved',
      label: 'Approved by Coordinator',
      icon: <Signature className="h-5 w-5" />,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      key: 'retrieved',
      label: 'Retrieved (Set to Pending)',
      icon: <CircleArrowLeft className="h-5 w-5" />,
    },
  ];

  function getStepForEvent(event: string) {
    event = (event || '').toLowerCase();
    if (event.includes('submit')) return 'submitted';
    if (event.includes('adviser')) return 'adviser-approved';
    if (event.includes('rejected')) return 'rejected';
    if (event.includes('retrieved')) return 'retrieved';
    if (event.includes('coordinator')) return 'coordinator-approved';
    return '';
  }

  function formatReadableDate(d?: string) {
    if (!d) return '';
    try {
      return dayjs(d).format('YYYY-MM-DD hh:mm A');
    } catch {
      return d;
    }
  }

  // Helper for workflow history rendering robustness
  function resolveHistoryFields(item: any) {
    const event =
      item.event_type ||
      item.action ||
      item.status_change ||
      item.status ||
      item.type ||
      'Event';
    const desc =
      item.description ||
      item.details ||
      item.note ||
      item.notes ||
      item.remarks ||
      '';
    const from = item.from_state || item.from || item.previous_state;
    const to = item.to_state || item.to || item.new_state;
    const created =
      item.created_at ||
      item.timestamp ||
      item.performed_at ||
      item.date ||
      '';
    const userName =
      item.user_name ||
      item.user?.name ||
      item.actor_name ||
      item.actor ||
      item.performed_by_name ||
      item.performed_by ||
      '';
    return { event, desc, from, to, created, userName };
  }

  const sectionClass = 'rounded-lg border p-5 space-y-3';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Toaster position="bottom-right" richColors closeButton />
      <div className="p-5 space-y-6">
        <Head title={request.thesis_title || `Defense Request #${request.id}`} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => router.visit('/all-defense-requirements')}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'approve' })}
              disabled={isLoading || request.status === 'Approved'}
            >
              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
              Endorse
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'reject' })}
              disabled={isLoading || request.status === 'Rejected'}
            >
              <XCircle className="h-4 w-4 mr-1 text-red-600" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'retrieve' })}
              disabled={isLoading || request.status === 'Pending'}
            >
              <CircleArrowLeft className="h-4 w-4 mr-1 text-blue-600" />
              Retrieve
            </Button>
          </div>
        </div>

        {/* Main content and sidebar layout */}
        <div className="flex flex-col md:flex-row gap-5 mb-2">
          {/* Main column: all cards stacked, fixed width */}
          <div className="w-full md:max-w-3xl mx-auto flex flex-col gap-5">
            {/* Submission summary card */}
            <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
              {/* Thesis Title Header with Status */}
              <div className="mb-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="text-2xl font-semibold">{request.thesis_title}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                </div>
                {request.status && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 md:mt-0 ${statusBadgeColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                )}
              </div>
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Presenter</div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-base font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                        {getInitials(request)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm leading-tight">
                        {request.first_name} {request.middle_name ? `${request.middle_name} ` : ''}{request.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {request.school_id}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Program</div>
                  <div className="font-medium text-sm">{request.program}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Defense Type</div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {request.defense_type ?? '—'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
                  <div className="font-medium text-sm">{formatDate(request.submitted_at)}</div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className={sectionClass}>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Attachments
              </h2>
              <Separator />
              <div className="space-y-2 text-sm">
                {attachments.map(a =>
                  a.url ? (
                    <a
                      key={a.label}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted transition"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{a.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
                        {typeof a.url === 'string' ? a.url.split('/').pop() : ''}
                      </span>
                    </a>
                  ) : null
                )}
                {!attachments.some(a => a.url) && (
                  <p className="text-sm text-muted-foreground">
                    No attachments.
                  </p>
                )}
              </div>
            </div>

            {/* Committee (read-only summary) */}
            <div className={sectionClass}>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Committee
              </h2>
              <Separator />
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Adviser
                  </div>
                  <div className="font-medium">
                    {request.defense_adviser || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Progress Stepper sidebar */}
          <div className="w-full md:w-[340px] flex-shrink-0">
            <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900 sticky top-24 h-fit">
              <h2 className="text-xs font-semibold mb-8 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Workflow Progress
              </h2>
              <div className="flex flex-col gap-0 relative">
                {Array.isArray(request.workflow_history) && request.workflow_history.length > 0 ? (
                  request.workflow_history.map((item: any, idx: number) => {
                    const { event, created, userName } = resolveHistoryFields(item);
                    const stepKey = getStepForEvent(event);
                    const step = workflowSteps.find(s => s.key === stepKey) || {
                      label: event.charAt(0).toUpperCase() + event.slice(1),
                      icon: <Clock className="h-5 w-5 text-gray-500" />,
                    };
                    const isLast = Array.isArray(request.workflow_history) && idx === request.workflow_history.length - 1;
                    const iconBoxColor = 'bg-gray-100 text-gray-500';
                    return (
                      <div key={idx} className="flex items-start gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBoxColor}`}>
                            {step.icon}
                          </div>
                          {!isLast && (
                            <div className="h-8 border-l-2 border-dotted border-gray-300 dark:border-zinc-700 mx-auto"></div>
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-semibold text-xs">{step.label}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {userName && <span>{userName}</span>}
                            {created && (
                              <span>
                                {' '}
                                &middot; {formatReadableDate(created)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground">No workflow history yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          Last updated by:{' '}
          {request.last_status_updated_by || '—'}{' '}
          {request.last_status_updated_at
            ? `(${request.last_status_updated_at})`
            : ''}
        </div>
      </div>

      {/* Confirmation Dialog for Endorse/Reject/Retrieve */}
      <Dialog open={confirm.open} onOpenChange={o => { if (!o) setConfirm({ open: false, action: null }); }}>
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            {confirm.action === 'approve'
              ? 'Please review before endorsing.'
              : 'Apply this status change?'}
          </DialogDescription>
          <div className="mt-3 text-sm space-y-3">
            <p>
              Set request to{' '}
              <span className="font-semibold">
                {confirm.action === 'approve'
                  ? 'Endorsed'
                  : confirm.action === 'reject'
                  ? 'Rejected'
                  : 'Pending'}
              </span>?
            </p>
            {confirm.action === 'approve' && (
              <div className="flex flex-col items-center gap-3 rounded-md border bg-muted/40 p-5">
                <div className="rounded-full bg-primary/10 p-4">
                  <Signature className="h-14 w-14 text-primary" />
                </div>
                <p className="text-center text-sm leading-relaxed">
                  Endorsing this defense request authorizes the use of your signature
                  on the official defense documents.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setConfirm({ open: false, action: null })}>Cancel</Button>
            <Button
              onClick={() => confirm.action && handleStatusChange(confirm.action)}
              disabled={isLoading}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}