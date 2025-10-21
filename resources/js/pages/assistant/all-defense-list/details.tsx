import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  UserCheck,
  Signature,
  XCircle,
  CircleArrowLeft,
  User,
  Clock,
  FileText,
  Users,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PaymentValidationSection from "./payment-validation";

type DefenseRequestDetails = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  school_id?: string;
  program: string;
  thesis_title: string;
  defense_type: string;
  status?: string;
  priority?: string;
  workflow_state?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_end_time?: string;
  defense_mode?: string;
  defense_venue?: string;
  scheduling_notes?: string;
  adviser?: string;
  submitted_at?: string;
  panelists?: { id: number | null; name: string }[];
  defense_adviser?: string;
  defense_chairperson?: string;
  defense_panelist1?: string;
  defense_panelist2?: string;
  defense_panelist3?: string;
  defense_panelist4?: string;
  last_status_updated_by?: string;
  last_status_updated_by_name?: string;
  last_status_updated_at?: string;
  workflow_history?: any[];
  reference_no?: string;
  attachments?: any;
  amount?: number;
  program_level?: string;
  expected_rate?: number;
};

type PaymentRateRow = {
  program_level: string;
  type: string;
  defense_type: string;
  amount: number | string;
};

type Props = {
  defenseRequest?: DefenseRequestDetails;
};

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'PPP');
  } catch {
    return d;
  }
}

function formatTime12h(time?: string) {
  if (!time) return '';
  const [h, m] = (time || '').split(':');
  if (h === undefined || m === undefined) return time || '';
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return format(date, 'hh:mm a');
}

function getInitials(user: { first_name?: string; last_name?: string }) {
  const first = user.first_name?.trim()?.[0] ?? '';
  const last = user.last_name?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || 'U';
}

export default function Details({ defenseRequest: initialDefenseRequest }: Props) {
  const [details, setDetails] = useState<DefenseRequestDetails | null>(initialDefenseRequest ?? null);
  const [tab, setTab] = useState<'details' | 'payment'>('details');
  const [panelMembers, setPanelMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentRates, setPaymentRates] = useState<PaymentRateRow[]>([]);

  // Fetch panel members once
  useEffect(() => {
    let alive = true;
    async function loadPanelMembers() {
      setLoadingMembers(true);
      try {
        const res = await fetch('/api/panel-members', { 
          headers: { Accept: 'application/json' } 
        });
        if (res.ok) {
          const data = await res.json();
          if (alive) setPanelMembers(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.warn('Failed to load panel members', e);
      } finally {
        if (alive) setLoadingMembers(false);
      }
    }
    loadPanelMembers();
    return () => { alive = false; };
  }, []);

  // Fetch payment rates once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/dean/payment-rates/data', { headers: { Accept: 'application/json' } });
        const json = await r.json();
        const arr = Array.isArray(json?.rates) ? json.rates : (Array.isArray(json) ? json : []);
        if (alive) setPaymentRates(arr as any);
      } catch (e) {
        if (alive) setPaymentRates([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  function findPanelMember(name: string | null | undefined) {
    if (!name) return null;
    return panelMembers.find(m => m.name === name);
  }

  function getMemberReceivable(role: string): number | null {
    if (!details?.program_level || !details?.defense_type) return null;
    
    const rateType = role === 'Adviser' ? 'Adviser' : 
                     role === 'Chairperson' ? 'Chairperson' : 'Panelist';
    
    const rate = paymentRates.find(
      r => r.program_level === details.program_level && 
           r.defense_type === details.defense_type && 
           r.type === rateType
    );
    
    return rate ? Number(rate.amount) : null;
  }

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/assistant/all-defense-list' }
  ];
  if (details?.id) {
    const thesisForCrumb =
      (details.thesis_title?.length || 0) > 60
        ? details.thesis_title.slice(0, 57) + '...'
        : details.thesis_title || `Request #${details.id}`;
    breadcrumbs.push({
      title: thesisForCrumb,
      href: `/assistant/all-defense-list/${details.id}/details`
    });
  }

  // Helper for workflow history
  function resolveHistoryFields(item: any) {
    const event =
      item.event_type ||
      item.action ||
      item.status_change ||
      item.status ||
      item.type ||
      'Event';
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
    return { event, created, userName };
  }

  function formatReadableDate(d?: string) {
    if (!d) return '';
    try {
      return format(new Date(d), 'PPpp');
    } catch {
      return d;
    }
  }

  // Attachments
  function resolveFileUrl(url?: string | null) {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('/storage/')) return url;
    return `/storage/${url.replace(/^\/?storage\//, '')}`;
  }
  const attachments = [
    { label: "Adviser's Endorsement", url: resolveFileUrl(details?.attachments?.advisers_endorsement) },
    { label: 'REC Endorsement', url: resolveFileUrl(details?.attachments?.rec_endorsement) },
    { label: 'Proof of Payment', url: resolveFileUrl(details?.attachments?.proof_of_payment) },
    { label: 'Manuscript', url: resolveFileUrl(details?.attachments?.manuscript_proposal) },
    { label: 'Similarity Index', url: resolveFileUrl(details?.attachments?.similarity_index) },
    { label: 'Avisee-Adviser File', url: resolveFileUrl(details?.attachments?.avisee_adviser_attachment) },
    { label: 'AI Detection Certificate', url: resolveFileUrl(details?.attachments?.ai_detection_certificate) },
    { label: 'Endorsement Form', url: resolveFileUrl(details?.attachments?.endorsement_form) },
  ];

  const sectionClass = 'rounded-lg border p-5 space-y-3';

  const workflowSteps = [
    {
      key: 'submitted',
      label: 'Submitted',
      icon: <Send className="h-5 w-5" />,
    },
    {
      key: 'adviser-approved',
      label: 'Endorsed by Adviser',
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      key: 'coordinator-approved',
      label: 'Approved by Coordinator',
      icon: <Signature className="h-5 w-5" />,
    },
    {
      key: 'panels-assigned',
      label: 'Panels Assigned',
      icon: <User className="h-5 w-5" />,
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      key: 'retrieved',
      label: 'Retrieved',
      icon: <CircleArrowLeft className="h-5 w-5" />,
    },
  ];

  function getStepForEvent(event: string) {
    event = (event || '').toLowerCase();
    if (event.includes('submit')) return 'submitted';
    if (event.includes('adviser-approved') || event.includes('endorsed')) return 'adviser-approved';
    if (event.includes('coordinator-approved')) return 'coordinator-approved';
    if (event.includes('panel')) return 'panels-assigned';
    if (event.includes('schedule')) return 'scheduled';
    if (event.includes('rejected')) return 'rejected';
    if (event.includes('retrieved')) return 'retrieved';
    return '';
  }

  // Mark as Completed handler
  async function handleMarkCompleted() {
    if (!details) return;
    try {
      const res = await fetch(`/defense-requests/${details.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      
      if (res.ok) {
        setDetails({ 
          ...details, 
          status: 'Completed', 
          workflow_state: 'completed' 
        });
        toast.success('Defense marked as completed and honorarium payments created!');
        
        setTimeout(() => {
          router.visit('/assistant/all-defense-list');
        }, 1500);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to mark as completed');
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast.error('Error marking as completed');
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={details?.thesis_title || `Defense Request #${details?.id ?? ''}`} />
      <div className="p-5 space-y-6">
        {/* Toolbar with Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.visit('/assistant/all-defense-list')}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Tabs value={tab} onValueChange={v => setTab(v as 'details' | 'payment')}>
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="payment">Payment Validation</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {details?.status !== 'Completed' && tab === 'details' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkCompleted}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              Mark as Completed
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Tabbed content */}
          <div className="md:col-span-2 space-y-6">
            <Tabs value={tab} onValueChange={v => setTab(v as 'details' | 'payment')}>
              <TabsContent value="details" className="space-y-6">
                {/* Submission summary card */}
                <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
                  <div className="mb-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-2xl font-semibold">{details?.thesis_title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                    </div>
                    <div className="flex flex-col md:items-end gap-1">
                      {details?.status && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            details.status === 'Approved'
                              ? 'bg-green-100 text-green-600'
                              : details.status === 'Rejected'
                              ? 'bg-red-100 text-red-600'
                              : details.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : details.status === 'Completed'
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Status: {details.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Presenter</div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-base font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                            {getInitials(details!)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm leading-tight">
                            {details?.first_name} {details?.middle_name ? `${details.middle_name} ` : ''}{details?.last_name}
                          </div>
                          {details?.school_id && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {details.school_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Program</div>
                      <div className="font-medium text-sm">{details?.program}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Defense Type</div>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {details?.defense_type ?? '—'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                      <div className="font-medium text-sm">{formatDate(details?.scheduled_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Time</div>
                      <div className="font-medium text-sm">
                        {details?.scheduled_time
                          ? `${formatTime12h(details.scheduled_time)}${details.scheduled_end_time ? ' - ' + formatTime12h(details.scheduled_end_time) : ''}`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Venue</div>
                      <div className="font-medium text-sm">{details?.defense_venue || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Mode</div>
                      <div className="font-medium text-sm">{details?.defense_mode ? (details.defense_mode === 'face-to-face' ? 'Face-to-Face' : 'Online') : '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="font-medium text-sm">{details?.scheduling_notes || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Committee Table - NEW */}
                <div className="rounded-lg border p-5 space-y-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Committee
                  </h2>
                  <Separator />
                  {(() => {
                    const memberFor = (value: string | null | undefined, fallbackRole: string) => {
                      const resolved = findPanelMember(value);
                      return {
                        displayName: resolved?.name || value || '—',
                        email: resolved?.email || '',
                        rawValue: value || '',
                        role: fallbackRole,
                      };
                    };

                    const rows = [
                      { key: 'adviser', info: memberFor(details?.defense_adviser, 'Adviser') },
                      { key: 'chairperson', info: memberFor(details?.defense_chairperson, 'Chairperson') },
                      { key: 'panelist1', info: memberFor(details?.defense_panelist1, 'Panel Member') },
                      { key: 'panelist2', info: memberFor(details?.defense_panelist2, 'Panel Member') },
                      { key: 'panelist3', info: memberFor(details?.defense_panelist3, 'Panel Member') },
                      { key: 'panelist4', info: memberFor(details?.defense_panelist4, 'Panel Member') },
                    ].map(r => {
                      const namePresent = !!(r.info.rawValue || (r.info.displayName && r.info.displayName !== '—'));
                      const emailPresent = !!(r.info.email);
                      const status = namePresent ? (emailPresent ? 'Assigned' : 'Pending confirmation') : '—';
                      const receivable = namePresent ? getMemberReceivable(r.info.role) : null;

                      return {
                        name: r.info.displayName,
                        email: r.info.email || '—',
                        role: r.info.role,
                        status,
                        receivable,
                      };
                    });

                    const formatCurrency = (v: number | null) =>
                      v !== null
                        ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v)
                        : '—';

                    return (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Name & Email</TableHead>
                              <TableHead className="min-w-[100px]">Role</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
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
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      r.status === 'Assigned'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : r.status === 'Pending confirmation'
                                        ? 'bg-yellow-100 text-amber-700 dark:bg-yellow-900 dark:text-yellow-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                    )}
                                  >
                                    {r.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs font-medium">
                                  {formatCurrency(r.receivable)}
                                </TableCell>
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
                    {details?.reference_no && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Reference No.</span>
                        <span className="ml-auto text-xs">{details.reference_no}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground mt-4">
                  Last updated by:{' '}
                  {details?.last_status_updated_by_name ||
                    details?.last_status_updated_by ||
                    '—'}{' '}
                  {details?.last_status_updated_at
                    ? `(${formatReadableDate(details.last_status_updated_at)})`
                    : ''}
                </div>
              </TabsContent>
              <TabsContent value="payment">
                <PaymentValidationSection details={details!} resolveFileUrl={resolveFileUrl} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar: Workflow Progress */}
          <div className="w-full md:w-[340px] flex-shrink-0">
            <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900">
              <h2 className="text-xs font-semibold mb-8 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Workflow Progress
              </h2>
              <div className="flex flex-col gap-0 relative">
                {Array.isArray(details?.workflow_history) && details.workflow_history.length > 0 ? (
                  details.workflow_history.map((item: any, idx: number) => {
                    const { event, created, userName } = resolveHistoryFields(item);
                    const stepKey = getStepForEvent(event);
                    const step = workflowSteps.find(s => s.key === stepKey) || {
                      label: event.charAt(0).toUpperCase() + event.slice(1),
                      icon: <Clock className="h-5 w-5 text-gray-500" />,
                    };
                    const isLast = idx === details.workflow_history!.length - 1;
                    return (
                      <div key={idx} className="flex items-start gap-3 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 text-gray-500">
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
      </div>
    </AppLayout>
  );
}