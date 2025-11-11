'use client';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  Loader2,
  User as UserIcon,
  CheckCircle,
  UserCheck,
  Send,
  Users as UsersIcon,
  Clock,
  XCircle,
  CircleArrowLeft,
  Signature,
  User,
  AlertTriangle,
  Banknote,
  DollarSign,
  Hourglass,
  ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { findPanelMember } from '@/utils/payment-rates';
import DeanApproveDialog from './dean-approve-dialog';

type PanelMemberOption = {
  id: string;
  name: string;
  email?: string;
  type?: string;
  status?: string;
};

export type DefenseRequestFull = {
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
  defense_chairperson?: string;
  defense_panelist1?: string;
  defense_panelist2?: string;
  defense_panelist3?: string;
  defense_panelist4?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_end_time?: string;
  defense_mode?: string;
  defense_venue?: string;
  aa_verification_status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed' | 'invalid';
  aa_verification_id?: number | null;
  invalid_comment?: string | null;
  scheduling_notes?: string;
  advisers_endorsement?: string;
  rec_endorsement?: string;
  proof_of_payment?: string;
  reference_no?: string;
  endorsement_form?: string | null;
  manuscript_proposal?: string | null;
  similarity_index?: string | null;
  avisee_adviser_attachment?: string | null;
  ai_detection_certificate?: string | null;
  last_status_updated_by?: string;
  last_status_updated_by_name?: string;
  last_status_updated_at?: string;
  workflow_history?: any[];
  adviser_status?: string;
  adviser_comments?: string;
  coordinator_status?: string;
  coordinator_comments?: string;
  dean_status?: string;
  dean_comments?: string;
  coordinator_signed_on_behalf?: boolean;
  program_level?: string;
  submitted_at?: string;
  amount?: number;
  coordinator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  dean?: {
    id: number;
    name: string;
    email: string;
  } | null;
  attachments?: {
    advisers_endorsement?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    manuscript_proposal?: string;
    similarity_index?: string;
    avisee_adviser_attachment?: string;
    ai_detection_certificate?: string;
    endorsement_form?: string;
    dean_endorsement_form?: string;
  };
};

interface PageProps {
  defenseRequest: DefenseRequestFull;
  userRole: string;
  deanId?: number;
  deanName?: string;
}

export default function DeanDefenseRequestDetailsPage(rawProps: any) {
  const props: PageProps = rawProps || {};
  const requestProp: DefenseRequestFull | null = props.defenseRequest || null;
  const userRole: string = props.userRole || '';
  const deanId: number | undefined = props.deanId;
  const deanName: string = props.deanName || 'Dean';

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/dean/defense-requests' }
  ];
  if (requestProp?.id) {
    const thesisForCrumb =
      (requestProp.thesis_title?.length || 0) > 60
        ? requestProp.thesis_title.slice(0, 57) + '...'
        : requestProp.thesis_title || `Request #${requestProp.id}`;
    breadcrumbs.push({
      title: thesisForCrumb,
      href: `/dean/defense-requests/${requestProp.id}/details`
    });
  }

  if (!requestProp) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-5">
          <p className="text-red-500">Defense request not found.</p>
        </div>
      </AppLayout>
    );
  }

  const [request, setRequest] = useState<DefenseRequestFull>(requestProp);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [panelMembers, setPanelMembers] = useState<PanelMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentRates, setPaymentRates] = useState<any[]>([]);

  // Fetch payment rates
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/payment-rates');
        if (alive && res.ok) {
          const data = await res.json();
          setPaymentRates(data || []);
        }
      } catch (err) {
        console.error('Failed to load payment rates:', err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadAll() {
      setLoadingMembers(true);
      try {
        const res = await fetch('/defense-request/panel-members');
        if (alive && res.ok) {
          const data = await res.json();
          setPanelMembers(data.panelMembers || []);
        }
      } catch (err) {
        console.error('Failed to load panel members:', err);
      } finally {
        if (alive) setLoadingMembers(false);
      }
    }
    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const canApprove = userRole === 'Dean' && request.coordinator_status === 'Approved' && request.dean_status !== 'Approved';

  function formatDate(d?: string) {
    if (!d) return '—';
    try {
      return format(new Date(d), 'MMM dd, yyyy');
    } catch {
      return d;
    }
  }

  function resolveFileUrl(url?: string | null) {
    if (!url) return null;
    return url.startsWith('http') || url.startsWith('/storage') ? url : `/storage/${url}`;
  }

  const attachments = [
    { label: "Adviser's Endorsement", url: resolveFileUrl(request.attachments?.advisers_endorsement || request.advisers_endorsement) },
    { label: 'REC Endorsement', url: resolveFileUrl(request.attachments?.rec_endorsement || request.rec_endorsement) },
    { label: 'Proof of Payment', url: resolveFileUrl(request.attachments?.proof_of_payment || request.proof_of_payment) },
    { label: 'Manuscript', url: resolveFileUrl(request.attachments?.manuscript_proposal || request.manuscript_proposal) },
    { label: 'Similarity Form', url: resolveFileUrl(request.attachments?.similarity_index || request.similarity_index) },
    { label: 'Advisee-Adviser File', url: resolveFileUrl(request.attachments?.avisee_adviser_attachment || request.avisee_adviser_attachment) },
    { label: 'AI Declaration Form', url: resolveFileUrl(request.attachments?.ai_detection_certificate || request.ai_detection_certificate) },
    { label: 'Coordinator Endorsement Form', url: resolveFileUrl(request.attachments?.endorsement_form || request.endorsement_form) },
    { label: 'Dean Endorsement Form', url: resolveFileUrl(request.attachments?.dean_endorsement_form) },
  ];

  function getInitials(user: { first_name?: string; last_name?: string }) {
    const f = (user.first_name || '').charAt(0).toUpperCase();
    const l = (user.last_name || '').charAt(0).toUpperCase();
    return `${f}${l}`;
  }

  function formatReadableDate(d?: string) {
    if (!d) return '—';
    try {
      return format(new Date(d), 'MMM dd, yyyy hh:mm a');
    } catch {
      return d;
    }
  }

  function formatTime12h(time?: string) {
    if (!time) return '—';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  const workflowSteps = [
    { key: 'submitted', label: 'Submitted', icon: <Send className="h-5 w-5" /> },
    { key: 'adviser-approved', label: 'Endorsed by Adviser', icon: <UserCheck className="h-5 w-5" /> },
    { key: 'adviser-rejected', label: 'Rejected by Adviser', icon: <XCircle className="h-5 w-5" /> },
    { key: 'adviser-retrieved', label: 'Retrieved by Adviser', icon: <CircleArrowLeft className="h-5 w-5" /> },
    { key: 'panels-assigned', label: 'Panels Assigned', icon: <UsersIcon className="h-5 w-5" /> },
    { key: 'scheduled', label: 'Scheduled', icon: <Clock className="h-5 w-5" /> },
    { key: 'coordinator-approved', label: 'Approved by Coordinator', icon: <Signature className="h-5 w-5" /> },
    { key: 'coordinator-rejected', label: 'Rejected by Coordinator', icon: <XCircle className="h-5 w-5" /> },
    { key: 'coordinator-retrieved', label: 'Retrieved by Coordinator', icon: <CircleArrowLeft className="h-5 w-5" /> },
    { key: 'dean-approved', label: 'Approved by Dean', icon: <CheckCircle className="h-5 w-5" /> },
    { key: 'dean-rejected', label: 'Rejected by Dean', icon: <XCircle className="h-5 w-5" /> },
    { key: 'payment-ready', label: 'Payment Ready for Finance', icon: <ArrowRight className="h-5 w-5" /> },
    { key: 'payment-in-progress', label: 'Payment In Progress', icon: <Hourglass className="h-5 w-5" /> },
    { key: 'payment-paid', label: 'Payment Paid', icon: <Banknote className="h-5 w-5" /> },
    { key: 'payment-invalid', label: 'Payment Invalid', icon: <AlertTriangle className="h-5 w-5" /> },
  ];

  function resolveHistoryFields(item: any) {
    return {
      event: item.event || item.status_change || item.action || 'Unknown',
      created: item.created_at || item.timestamp || item.date || '',
      userName: item.changed_by_name || item.user_name || item.actor || '',
      to: item.to_state || item.new_status || item.to || '',
      comment: item.comment || item.rejection_reason || item.notes || '',
    };
  }

  function getStepForEvent(event: string, toState?: string) {
    const ev = event.toLowerCase();
    if (ev.includes('submitted')) return 'submitted';
    if (ev.includes('adviser') && ev.includes('approved')) return 'adviser-approved';
    if (ev.includes('adviser') && ev.includes('rejected')) return 'adviser-rejected';
    if (ev.includes('adviser') && ev.includes('retrieved')) return 'adviser-retrieved';
    if (ev.includes('panels') || ev.includes('panel')) return 'panels-assigned';
    if (ev.includes('scheduled') || ev.includes('schedule')) return 'scheduled';
    if (ev.includes('coordinator') && ev.includes('approved')) return 'coordinator-approved';
    if (ev.includes('coordinator') && ev.includes('rejected')) return 'coordinator-rejected';
    if (ev.includes('coordinator') && ev.includes('retrieved')) return 'coordinator-retrieved';
    if (ev.includes('dean') && ev.includes('approved')) return 'dean-approved';
    if (ev.includes('dean') && ev.includes('rejected')) return 'dean-rejected';
    if (ev.includes('payment') && ev.includes('ready')) return 'payment-ready';
    if (ev.includes('payment') && ev.includes('progress')) return 'payment-in-progress';
    if (ev.includes('payment') && ev.includes('paid')) return 'payment-paid';
    if (ev.includes('payment') && ev.includes('invalid')) return 'payment-invalid';
    return 'submitted';
  }

  const sectionClass = 'rounded-lg border p-5 space-y-3';

  const [tab, setTab] = useState<'details'>('details');

  // Local helper to get receivable (matching coordinator logic)
  function getMemberReceivable(role: string): number | null {
    if (!request.program_level || !request.defense_type) {
      return null;
    }
    
    // Map role to payment rate type EXACTLY as stored in DB
    let rateType = '';
    if (role === 'Adviser') {
      rateType = 'Adviser';
    } else if (role === 'Panel Chair' || role === 'Chairperson') {
      rateType = 'Panel Chair';
    } else if (role.includes('Panel Member')) {
      rateType = role;
    } else if (role === 'Panelist') {
      rateType = 'Panel Member 1';
    } else {
      rateType = role;
    }
    
    // Normalize defense type for case-insensitive comparison
    const normalizeDefenseType = (dt: string) => dt.toLowerCase().replace(/[^a-z]/g, '');
    const targetDefenseType = normalizeDefenseType(request.defense_type);
    
    // Direct comparison with normalization
    const rate = paymentRates.find(
      r => {
        const matchesProgram = r.program_level === request.program_level;
        const matchesType = r.type === rateType;
        const matchesDefense = normalizeDefenseType(r.defense_type || '') === targetDefenseType;
        
        return matchesProgram && matchesType && matchesDefense;
      }
    );
    
    return rate ? Number(rate.amount) : null;
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Toaster position="bottom-right" richColors closeButton />
      <div className="p-5 space-y-6">
        <Head title={request.thesis_title || `Defense Request #${request.id}`} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.visit('/dean/defense-requests')}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Tabs value={tab} onValueChange={v => setTab(v as 'details')}>
              <TabsList className="h-8">
                <TabsTrigger value="details" className="flex items-center gap-1 text-sm px-3">
                  <FileText className="h-4 w-4" /> Details
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {canApprove && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setApproveDialogOpen(true)}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve & Sign
              </Button>
            </div>
          )}
        </div>

        {/* Main content and Workflow Progress */}
        <div className="flex flex-col md:flex-row gap-5 mb-2">
          {/* Main column */}
          <div className="w-full md:max-w-3xl mx-auto flex flex-col gap-5">
            <Tabs value={tab} onValueChange={v => setTab(v as 'details')} className="w-full">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-5">
                {/* Submission summary card */}
                <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
                  <div className="mb-1 flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-2xl font-semibold">{request.thesis_title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                    </div>
                    <div className="flex flex-col md:items-end gap-1">
                      {request.adviser_status && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-semibold px-3 py-1",
                            request.adviser_status === 'Approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : request.adviser_status === 'Rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          )}
                        >
                          Adviser Status: {request.adviser_status === 'Approved' ? 'Endorsed' : request.adviser_status}
                        </Badge>
                      )}
                      {request.coordinator_status && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-semibold px-3 py-1",
                            request.coordinator_status === 'Approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : request.coordinator_status === 'Rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          )}
                        >
                          Coordinator Status: {request.coordinator_status}
                        </Badge>
                      )}
                      {request.dean_status && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-semibold px-3 py-1",
                            request.dean_status === 'Approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : request.dean_status === 'Rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          )}
                        >
                          Dean Status: {request.dean_status}
                        </Badge>
                      )}
                      {request.coordinator_signed_on_behalf && (
                        <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-700">
                          Coordinator Signed on Behalf
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                    {/* Presenter */}
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

                    {/* Program */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Program</div>
                      <div className="font-medium text-sm">{request.program}</div>
                    </div>

                    {/* Defense Type */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Defense Type</div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {request.defense_type ?? '—'}
                      </Badge>
                    </div>

                    {/* Reference No. */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Reference No.</div>
                      <div className="font-medium text-sm">{request.reference_no || '—'}</div>
                    </div>

                    {/* Amount */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Amount</div>
                      <div className="font-medium text-sm">
                        {request.amount ? `₱${Number(request.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>

                    {/* AA Verification Status */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">AA Payment Status</div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-semibold px-2 py-1 h-fit flex items-center gap-1.5 w-fit",
                          request.aa_verification_status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : request.aa_verification_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : request.aa_verification_status === 'ready_for_finance'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : request.aa_verification_status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                            : request.aa_verification_status === 'invalid'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        )}
                      >
                        {request.aa_verification_status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {request.aa_verification_status === 'paid' && <Banknote className="h-3 w-3" />}
                        {request.aa_verification_status === 'ready_for_finance' && <DollarSign className="h-3 w-3" />}
                        {request.aa_verification_status === 'in_progress' && <Hourglass className="h-3 w-3" />}
                        {request.aa_verification_status === 'invalid' && <AlertTriangle className="h-3 w-3" />}
                        {!request.aa_verification_status && <Clock className="h-3 w-3" />}
                        {request.aa_verification_status === 'completed'
                          ? 'Completed'
                          : request.aa_verification_status === 'paid'
                          ? 'Paid'
                          : request.aa_verification_status === 'ready_for_finance'
                          ? 'Ready for Finance'
                          : request.aa_verification_status === 'in_progress'
                          ? 'In Progress'
                          : request.aa_verification_status === 'invalid'
                          ? 'Invalid'
                          : 'Pending'}
                      </Badge>
                    </div>

                    {request.invalid_comment && (
                      <div className="md:col-span-2">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Invalid Reason</p>
                          <p className="text-sm text-red-800">{request.invalid_comment}</p>
                        </div>
                      </div>
                    )}

                    {/* Submitted At */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
                      <div className="font-medium text-sm">{formatDate(request.submitted_at)}</div>
                    </div>

                    {/* Program Coordinator */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Program Coordinator</div>
                      <div className="font-medium text-sm">
                        {request.coordinator?.name || '—'}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Separator className="my-2" />
                    </div>

                    {/* Scheduled Date */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                      <div className="font-medium text-sm">{formatDate(request.scheduled_date)}</div>
                    </div>

                    {/* Time */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Time</div>
                      <div className="font-medium text-sm">
                        {request.scheduled_time
                          ? `${formatTime12h(request.scheduled_time)}${request.scheduled_end_time ? ' - ' + formatTime12h(request.scheduled_end_time) : ''}`
                          : '—'}
                      </div>
                    </div>

                    {/* Venue */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Venue</div>
                      <div className="font-medium text-sm">{request.defense_venue || '—'}</div>
                    </div>

                    {/* Mode */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Mode</div>
                      <div className="font-medium text-sm capitalize">
                        {request.defense_mode ? (request.defense_mode === 'face-to-face' ? 'Face-to-Face' : 'Online') : '—'}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="font-medium text-sm">{request.scheduling_notes || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Committee (READ-ONLY) */}
                <div className="rounded-lg border p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Committee
                  </h2>
                  <Separator />
                  {(() => {
                    const memberFor = (value: string | null | undefined, fallbackRole: string) => {
                      const resolved = findPanelMember(panelMembers, value);
                      return {
                          displayName: resolved?.name || value || '—',
                          email: resolved?.email || '',
                          rawValue: value || '',
                          role: fallbackRole,
                      };
                    };

                    const baseRows = [
                      { key: 'adviser', info: memberFor(request.defense_adviser, 'Adviser') },
                      { key: 'defense_chairperson', info: memberFor(request.defense_chairperson, 'Panel Chair') },
                      { key: 'defense_panelist1', info: memberFor(request.defense_panelist1, 'Panel Member 1') },
                      { key: 'defense_panelist2', info: memberFor(request.defense_panelist2, 'Panel Member 2') },
                      { key: 'defense_panelist3', info: memberFor(request.defense_panelist3, 'Panel Member 3') },
                    ];

                    if (request.program_level === 'Doctorate') {
                      baseRows.push(
                        { key: 'defense_panelist4', info: memberFor(request.defense_panelist4, 'Panel Member 4') }
                      );
                    }

                    const rows = baseRows.map(r => {
                      const namePresent = !!(r.info.rawValue || (r.info.displayName && r.info.displayName !== '—'));
                      const receivable = namePresent ? getMemberReceivable(r.info.role) : null;

                      return {
                          name: r.info.displayName,
                          email: r.info.email || '—',
                          role: r.info.role,
                          receivable,
                      };
                    });

                    const formatCurrency = (v: any) =>
                      typeof v === 'number'
                        ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v)
                        : v ?? '—';

                    return (
                      <div className="overflow-x-auto">
                        <Table className="border-0">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Name & Email</TableHead>
                              <TableHead className="min-w-[100px]">Role</TableHead>
                              <TableHead className="min-w-[140px] text-right">Receivable</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((r, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{r.name}</span>
                                    <span className="text-xs text-muted-foreground">{r.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">{r.role}</TableCell>
                                <TableCell className="text-right text-xs font-medium">{formatCurrency(r.receivable)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </div>

                {/* Attachments */}
                <div className={sectionClass}>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Attachments
                  </h2>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    {attachments.filter(a => !!a.url).length === 0 && (
                      <p className="text-sm text-muted-foreground">No attachments.</p>
                    )}
                    {attachments
                      .filter(a => !!a.url)
                      .map(a => (
                        <a
                          key={a.label}
                          href={a.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900 hover:bg-muted transition"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{a.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
                            {a.url?.split('/').pop()}
                          </span>
                        </a>
                      ))}
                    {request.reference_no && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Reference No.</span>
                        <span className="ml-auto text-xs">{request.reference_no}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
                    const { event, created, userName, to, comment } = resolveHistoryFields(item);
                    const stepKey = getStepForEvent(event, to);
                    const step = workflowSteps.find(s => s.key === stepKey) || {
                      label: event.charAt(0).toUpperCase() + event.slice(1),
                      icon: <Clock className="h-5 w-5 text-gray-500" />,
                    };
                    const isLast = Array.isArray(request.workflow_history) && idx === request.workflow_history.length - 1;
                    const isInvalid = event.toLowerCase().includes('invalid');
                    const iconBoxColor = isInvalid ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500';
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
                        <div className="pb-4 flex-1">
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
                          {comment && (
                            <div className={`mt-2 p-2 rounded text-[11px] ${
                              isInvalid 
                                ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                                : 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                            }`}>
                              {comment}
                            </div>
                          )}
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
      </div>

      {/* Dean Approve Dialog */}
      <DeanApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        defenseRequest={request}
        deanId={deanId}
        deanName={deanName}
        onApproveComplete={() => {
          console.log('🔄 Dean approval complete callback triggered');
          router.reload();
        }}
      />
    </AppLayout>
  );
}
