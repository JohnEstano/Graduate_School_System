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
  Save,
  Loader2,
  ChevronsUpDown,
  Check,
  User as UserIcon,
  CheckCircle,
  UserCheck,
  Send,
  Users as UsersIcon,
  Clock,
  XCircle,
  CircleArrowLeft,
  Signature,
  User
} from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import { Calendar as CalendarCmp } from '@/components/ui/calendar';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

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
  coordinator_status?: string;
};

interface PageProps {
  defenseRequest: DefenseRequestFull;
  userRole: string;
}

function PanelMemberCombobox({
  label,
  value,
  onChange,
  options,
  disabled,
  taken
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: PanelMemberOption[];
  disabled?: boolean;
  taken: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return options;
    const qq = q.toLowerCase();
    return options.filter(
      o =>
        o.name.toLowerCase().includes(qq) ||
        (o.email && o.email.toLowerCase().includes(qq))
    );
  }, [q, options]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <Popover
        open={open}
        onOpenChange={o => {
          setOpen(o);
          if (!o) setQ('');
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-9 px-3 flex items-center justify-between rounded-md border bg-background text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/40 hover:bg-accent disabled:opacity-50"
            disabled={disabled}
          >
            <span
              className={`truncate ${!value ? 'text-muted-foreground' : ''}`}
            >
              {value || `Select ${label}`}
            </span>
            <ChevronsUpDown size={14} className="opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={q}
              onValueChange={setQ}
              placeholder="Search..."
              className="h-9"
              autoFocus
            />
            <CommandEmpty className="py-8 text-sm text-muted-foreground text-center">
              No matches.
            </CommandEmpty>
            <CommandGroup className="max-h-72 overflow-auto">
              {filtered.map(o => {
                const isSelected = o.name === value;
                const dup = taken.has(o.name) && !isSelected;
                return (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    disabled={dup}
                    onSelect={() => {
                      if (dup) return;
                      onChange(o.name);
                      setOpen(false);
                      setQ('');
                    }}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2
                      ${isSelected ? 'bg-muted' : ''}
                      ${
                        dup
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                  >
                    <div className="flex items-center w-full gap-2">
                      <Check
                        size={14}
                        className={
                          isSelected
                            ? 'opacity-100 text-muted-foreground'
                            : 'opacity-0'
                        }
                      />
                      <span className="text-sm truncate">{o.name}</span>
                    </div>
                    {o.email && (
                      <span className="pl-5 text-[11px] text-muted-foreground truncate max-w-[250px]">
                        {o.email}
                      </span>
                    )}
                    {dup && !isSelected && (
                      <span className="pl-5 text-[10px] text-muted-foreground">
                        Already chosen
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function DefenseRequestDetailsPage(rawProps: any) {
  const props: PageProps = rawProps || {};
  const requestProp: DefenseRequestFull | null = props.defenseRequest || null;
  const userRole: string = props.userRole || '';

  // Build breadcrumbs, use thesis title (truncated) instead of id
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/defense-request' }
  ];
  if (requestProp?.id) {
    const thesisForCrumb =
      (requestProp.thesis_title?.length || 0) > 60
        ? requestProp.thesis_title.slice(0, 57) + '...'
        : requestProp.thesis_title || `Request #${requestProp.id}`;
    breadcrumbs.push({
      title: thesisForCrumb,
      href: `/coordinator/defense-requests/${requestProp.id}/details`
    });
  }

  if (!requestProp) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Defense Request - Not Found" />
        <div className="p-6 space-y-4">
          <p className="text-sm text-red-500">
            No defense request loaded. Use the list page and click Details
            again.
          </p>
          <Button
            variant="outline"
            onClick={() => router.visit('/defense-request')}
          >
            Back to list
          </Button>
        </div>
      </AppLayout>
    );
  }

  const [request, setRequest] = useState<DefenseRequestFull>(requestProp);

  // Confirmation dialog state for approve/reject/retrieve
  const [confirm, setConfirm] = useState<{ open: boolean; action: 'approve' | 'reject' | 'retrieve' | null }>({
    open: false,
    action: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Panel members simple load
  const [panelMembers, setPanelMembers] = useState<PanelMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [panelLoadError, setPanelLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadAll() {
      setLoadingMembers(true);
      setPanelLoadError(null);
      const endpoints = [
        '/coordinator/defense/panel-members-all',
        '/api/panel-members'
      ];
      let loaded = false;
      for (const url of endpoints) {
        try {
          const r = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!r.ok) {
            console.warn('Panel member fetch failed', url, r.status);
            continue;
          }
          const data = await r.json();
          if (alive) {
            // Only keep Panelists
            setPanelMembers(Array.isArray(data) ? data.filter((m: any) => m.type === 'Panelist') : []);
            loaded = true;
          }
          break;
        } catch (e) {
          console.warn('Fetch error', url, e);
        }
      }
      if (!loaded && alive) {
        setPanelMembers([]);
        setPanelLoadError('Could not load panel members.');
      }
      if (alive) setLoadingMembers(false);
    }
    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  // Panels
  const [panels, setPanels] = useState({
    defense_chairperson: request.defense_chairperson ?? '',
    defense_panelist1: request.defense_panelist1 ?? '',
    defense_panelist2: request.defense_panelist2 ?? '',
    defense_panelist3: request.defense_panelist3 ?? '',
    defense_panelist4: request.defense_panelist4 ?? ''
  });

  // Schedule
  const [schedule, setSchedule] = useState({
    scheduled_date: request.scheduled_date ?? '',
    scheduled_time: request.scheduled_time ?? '',
    scheduled_end_time: request.scheduled_end_time ?? '',
    defense_mode: request.defense_mode ?? '',
    defense_venue: request.defense_venue ?? '',
    scheduling_notes: request.scheduling_notes ?? ''
  });

  const [savingPanels, setSavingPanels] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const taken = useMemo(
    () => new Set(Object.values(panels).filter(Boolean)),
    [panels]
  );

  const canEdit = ['Coordinator', 'Administrative Assistant', 'Dean'].includes(
    userRole
  );

  // Helper to always get a fresh CSRF token
  async function getFreshCsrfToken(): Promise<string> {
    try {
      await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
      const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      return token;
    } catch {
      return '';
    }
  }

  // Robust fetch with CSRF retry and refresh
  async function fetchWithCsrfRetry(url: string, options: RequestInit, retry = true) {
    if (!options.headers) options.headers = {};
    (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = await getFreshCsrfToken();
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch (err) {
      throw new Error('network');
    }
    if (res.status === 419 && retry) {
      // CSRF error, try to refresh token and retry once
      (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = await getFreshCsrfToken();
      try {
        res = await fetch(url, options);
      } catch (err) {
        throw new Error('network');
      }
    }
    return res;
  }

  async function savePanels() {
    const toastId = toast.loading('Saving panel assignments...');
    setSavingPanels(true);
    try {
      const res = await fetchWithCsrfRetry(
        `/coordinator/defense-requests/${request.id}/panels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(panels)
        }
      );

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const txt = await res.text();
          data = { error: txt };
        }
      } catch {
        data = { error: 'Invalid response' };
      }

      if (res.ok && data.ok) {
        setRequest(r => ({ ...r, ...data.request }));
        toast.success('Panels saved', {
          id: toastId,
          description: [
            panels.defense_chairperson,
            panels.defense_panelist1,
            panels.defense_panelist2,
            panels.defense_panelist3,
            panels.defense_panelist4
          ].filter(Boolean).join(', ')
        });
      } else {
        toast.error(data.error || `Failed (${res.status})`, { id: toastId });
      }
    } catch {
      toast.error('Network error saving panels', { id: toastId });
    } finally {
      setSavingPanels(false);
    }
  }

  async function saveSchedule() {
    // Validate times
    if (
      !schedule.scheduled_date ||
      !schedule.scheduled_time ||
      !schedule.scheduled_end_time ||
      !schedule.defense_mode ||
      !schedule.defense_venue
    ) {
      toast.error('Please fill in all required scheduling fields.');
      return;
    }
    // Time logic: start < end
    if (schedule.scheduled_time && schedule.scheduled_end_time) {
      const [sh, sm] = schedule.scheduled_time.split(':').map(Number);
      const [eh, em] = schedule.scheduled_end_time.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      if (end <= start) {
        toast.error('End time must be after start time.');
        return;
      }
    }
    const toastId = toast.loading('Saving schedule...');
    setSavingSchedule(true);
    try {
      const res = await fetchWithCsrfRetry(
        `/coordinator/defense-requests/${request.id}/schedule-json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(schedule)
        }
      );

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const txt = await res.text();
          data = { error: txt };
        }
      } catch {
        data = { error: 'Invalid response' };
      }

      if (res.ok && data.request) {
        setRequest(r => ({ ...r, ...data.request }));
        toast.success('Schedule saved', {
          id: toastId,
          description: `${schedule.scheduled_date || ''} ${
            schedule.scheduled_time || ''
          }${
            schedule.scheduled_end_time ? ' - ' + schedule.scheduled_end_time : ''
          }`
        });
      } else {
        toast.error(data.error || `Failed (${res.status})`, { id: toastId });
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'network') {
        toast.error('Network error saving schedule', { id: toastId });
      } else {
        toast.error('Unknown error saving schedule', { id: toastId });
      }
    } finally {
      setSavingSchedule(false);
    }
  }

  // --- Approve/Reject/Retrieve logic (robust, uses fetchWithCsrfRetry) ---
  async function handleStatusChange(action: 'approve' | 'reject' | 'retrieve') {
    if (!request.id) return;
    setIsLoading(true);

    let newStatus: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
    if (action === 'approve') newStatus = 'Approved';
    else if (action === 'reject') newStatus = 'Rejected';
    else if (action === 'retrieve') newStatus = 'Pending';

    try {
      const res = await fetchWithCsrfRetry(`/defense-requests/${request.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Invalid response from server.' };
      }
      if (res.ok) {
        if (data.request) {
          setRequest(data.request);
        } else {
          setRequest(r => ({
            ...r,
            coordinator_status: newStatus,
            workflow_state: data.workflow_state || r.workflow_state,
            workflow_history: data.workflow_history || r.workflow_history,
            status: data.status || r.status,
          }));
        }
        toast.success(`Coordinator status set to ${newStatus}`);
      } else {
        toast.error(data?.error || `Failed to update status (${res.status})`);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'network') {
        toast.error('Network error updating status. Please check your connection and try again.');
      } else {
        toast.error('Unknown error updating status.');
      }
    } finally {
      setIsLoading(false);
      setConfirm({ open: false, action: null });
    }
  }

  function formatDate(d?: string) {
    if (!d) return '—';
    try {
      return format(new Date(d), 'PPP');
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

  // Helper to resolve file URLs (add /storage/ if not already absolute)
  function resolveFileUrl(url?: string | null) {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('/storage/')) return url;
    return `/storage/${url.replace(/^\/?storage\//, '')}`;
  }

  // Attachments (show all, including manuscript, similarity, avisee, etc.)
  const attachments = [
    { label: "Adviser’s Endorsement", url: resolveFileUrl(request.advisers_endorsement) },
    { label: 'REC Endorsement', url: resolveFileUrl(request.rec_endorsement) },
    { label: 'Proof of Payment', url: resolveFileUrl(request.proof_of_payment) },
    { label: 'Manuscript', url: resolveFileUrl(request.manuscript_proposal) },
    { label: 'Similarity Index', url: resolveFileUrl(request.similarity_index) },
    { label: 'Avisee-Adviser File', url: resolveFileUrl(request.avisee_adviser_attachment) },
    { label: 'AI Detection Certificate', url: resolveFileUrl(request.ai_detection_certificate) },
    { label: 'Endorsement Form', url: resolveFileUrl(request.endorsement_form) },
  ];

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

  const sectionClass = 'rounded-lg border p-5 space-y-3'; // increased padding

  // Helper to get initials for avatar
  function getInitials(user: { first_name?: string; last_name?: string }) {
    const first = user.first_name?.trim()?.[0] ?? '';
    const last = user.last_name?.trim()?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
  }

  // Helper for readable date
  function formatReadableDate(d?: string) {
    if (!d) return '';
    try {
      return format(new Date(d), 'PPpp');
    } catch {
      return d;
    }
  }

  // Workflow stepper config
  const workflowSteps = [
    {
      key: 'submitted',
      label: 'Submitted',
      icon: <Send className="h-5 w-5" />,
    },
    {
      key: 'adviser-approved',
      label: 'Endorsed by Adviser', // CHANGED from "Approved by Adviser"
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      key: 'coordinator-approved',
      label: 'Approved by Coordinator',
      icon: <Signature className="h-5 w-5" />, 
    },
    {
      key: 'rejected',
      label: 'Rejected by Coordinator',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      key: 'retrieved',
      label: 'Retrieved (Set to Pending)',
      icon: <CircleArrowLeft className="h-5 w-5" />,
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
    // Add more steps as needed
  ];

  // Update this function:
  function getStepForEvent(event: string) {
    event = (event || '').toLowerCase();
    if (event.includes('submit')) return 'submitted';
    if (event.includes('adviser')) return 'adviser-approved';
    if (event.includes('rejected')) return 'rejected';
    if (event.includes('retrieved')) return 'retrieved';
    if (event.includes('coordinator')) return 'coordinator-approved';
    if (event.includes('panel')) return 'panels-assigned';
    if (event.includes('schedule')) return 'scheduled'; 
    return '';
  }

  function formatTime12h(time?: string) {
    if (!time) return '';
    const [h, m] = time.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m));
    return format(date, 'hh:mm a');
  }

  // Tabs: "details" and "assign-schedule"
  const [tab, setTab] = useState<'details' | 'assign-schedule'>('details');

  const statusMap: Record<string, string> = {
    'submitted': 'Submitted',
    'adviser-approved': 'Endorsed by Adviser',
    'adviser-rejected': 'Rejected by Adviser',
    'adviser-retrieved': 'Retrieved by Adviser',
    'coordinator-approved': 'Approved by Coordinator',
    'coordinator-rejected': 'Rejected by Coordinator',
    'coordinator-review': 'Pending Coordinator Action',
    'coordinator-retrieved': 'Retrieved by Coordinator',
    'panels-assigned': 'Panels Assigned',
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    // Add more as needed
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Toaster position="bottom-right" richColors closeButton />
      <div className="p-5 space-y-6">
        <Head title={request.thesis_title || `Defense Request #${request.id}`} />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.visit('/defense-request')}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Tabs value={tab} onValueChange={v => setTab(v as 'details' | 'assign-schedule')}>
              <TabsList className="h-8">
                <TabsTrigger value="details" className="flex items-center gap-1 text-sm px-3">
                  <FileText className="h-4 w-4" /> Details
                </TabsTrigger>
                <TabsTrigger value="assign-schedule" className="flex items-center gap-1 text-sm font-medium px-3">
                  <Calendar className="h-4 w-4" />
                  Assign &amp; Schedule
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              {/* Approve button: only enabled if not already approved or completed */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm({ open: true, action: 'approve' })}
                disabled={
                  isLoading ||
                  request.coordinator_status === 'Approved' ||
                  request.workflow_state === 'completed'
                }
              >
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                Approve
              </Button>
              {/* Reject button: only enabled if not already rejected, not approved, and not completed */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm({ open: true, action: 'reject' })}
                disabled={
                  isLoading ||
                  request.coordinator_status === 'Rejected' ||
                  request.coordinator_status === 'Approved' ||
                  request.workflow_state === 'completed'
                }
              >
                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                Reject
              </Button>
              {/* Retrieve button: enabled if currently rejected OR approved and not completed */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm({ open: true, action: 'retrieve' })}
                disabled={
                  isLoading ||
                  !['Rejected', 'Approved'].includes(request.coordinator_status || '') ||
                  request.workflow_state === 'completed'
                }
              >
                <CircleArrowLeft className="h-4 w-4 mr-1 text-blue-600" />
                Retrieve
              </Button>
            </div>
          )}
        </div>

        {/* Main content and Workflow Progress */}
        <div className="flex flex-col md:flex-row gap-5 mb-2">
          {/* Main column */}
          <div className="w-full md:max-w-3xl mx-auto flex flex-col gap-5">
            <Tabs value={tab} onValueChange={v => setTab(v as 'details' | 'assign-schedule')} className="w-full">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-5">
                {/* Submission summary card */}
                <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
                  {/* Thesis Title Header with Status */}
                  <div className="mb-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-2xl font-semibold">{request.thesis_title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                    </div>
                    <div className="flex flex-col md:items-end gap-1">
                      {/* Coordinator Status */}
                      {request.coordinator_status && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            request.coordinator_status === 'Approved'
                              ? 'bg-green-100 text-green-600'
                              : request.coordinator_status === 'Rejected'
                              ? 'bg-red-100 text-red-600'
                              : request.coordinator_status === 'Needs Signature'
                              ? 'bg-blue-100 text-blue-600'
                              : request.coordinator_status === 'Not Scheduled'
                              ? 'bg-yellow-100 text-yellow-700'
                              : request.coordinator_status === 'No Assigned Panelists'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Coordinator Status: {request.coordinator_status}
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
                      <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                      <div className="font-medium text-sm">{formatDate(request.scheduled_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Time</div>
                      <div className="font-medium text-sm">
                        {request.scheduled_time
                          ? `${formatTime12h(request.scheduled_time)}${request.scheduled_end_time ? ' - ' + formatTime12h(request.scheduled_end_time) : ''}`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Venue</div>
                      <div className="font-medium text-sm">{request.defense_venue || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Mode</div>
                      <div className="font-medium text-sm">{request.defense_mode ? (request.defense_mode === 'face-to-face' ? 'Face-to-Face' : 'Online') : '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="font-medium text-sm">{request.scheduling_notes || '—'}</div>
                    </div>
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
                    {[
                      {
                        label: 'Chairperson',
                        v: panels.defense_chairperson || request.defense_chairperson
                      },
                      {
                        label: 'Panelist 1',
                        v: panels.defense_panelist1 || request.defense_panelist1
                      },
                      {
                        label: 'Panelist 2',
                        v: panels.defense_panelist2 || request.defense_panelist2
                      },
                      {
                        label: 'Panelist 3',
                        v: panels.defense_panelist3 || request.defense_panelist3
                      },
                      {
                        label: 'Panelist 4',
                        v: panels.defense_panelist4 || request.defense_panelist4
                      }
                    ].map(r => (
                      <div key={r.label}>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {r.label}
                        </div>
                        <div className="font-medium">{r.v || '—'}</div>
                      </div>
                    ))}
                  </div>
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
                    {/* Reference No. as plain text if present */}
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

              {/* ASSIGN & SCHEDULE TAB */}
              <TabsContent value="assign-schedule" className="space-y-5">
                {/* Panel Assignment */}
                <div className={sectionClass}>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" /> Panel Assignment
                  </h2>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { label: 'Chairperson', key: 'defense_chairperson' },
                      { label: 'Panelist 1', key: 'defense_panelist1' },
                      { label: 'Panelist 2', key: 'defense_panelist2' },
                      { label: 'Panelist 3', key: 'defense_panelist3' },
                      { label: 'Panelist 4', key: 'defense_panelist4' }
                    ].map(({ label, key }) => (
                      <PanelMemberCombobox
                        key={key}
                        label={label}
                        value={panels[key as keyof typeof panels]}
                        onChange={v => setPanels(p => ({ ...p, [key]: v }))}
                        options={panelMembers}
                        disabled={!canEdit || loadingMembers}
                        taken={taken}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={savePanels}
                      disabled={!canEdit || savingPanels}
                      className="gap-2 dark:bg-rose-500 text-white hover:cursor-pointer"
                    >
                      {savingPanels && <Loader2 className="animate-spin h-4 w-4" />}
                      <Save className="h-4 w-4" />
                      Save Panel Assignment
                    </Button>
                  </div>
                  {panelLoadError && (
                    <div className="text-xs text-red-500 mt-2">{panelLoadError}</div>
                  )}
                </div>
                {/* Scheduling */}
                <div className={sectionClass}>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Scheduling
                  </h2>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Date</div>
                      {/* --- SHADCN Date Picker --- */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !schedule.scheduled_date && "text-muted-foreground"
                            )}
                            disabled={!canEdit}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {schedule.scheduled_date
                              ? formatDate(schedule.scheduled_date)
                              : "Pick a date"}  
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarCmp
                            mode="single"
                            selected={
                              schedule.scheduled_date
                                ? new Date(schedule.scheduled_date)
                                : undefined
                            }
                            onSelect={date => {
                              setSchedule(s => ({
                                ...s,
                                scheduled_date: date
                                  ? format(date, "yyyy-MM-dd")
                                  : ""
                              }));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Start Time</div>
                      <Input
                        type="time"
                        value={schedule.scheduled_time}
                        onChange={e =>
                          setSchedule(s => ({ ...s, scheduled_time: e.target.value }))
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">End Time</div>
                      <Input
                        type="time"
                        value={schedule.scheduled_end_time}
                        onChange={e =>
                          setSchedule(s => ({ ...s, scheduled_end_time: e.target.value }))
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Mode</div>
                      <Select
                        value={schedule.defense_mode}
                        onValueChange={v =>
                          setSchedule(s => ({ ...s, defense_mode: v }))
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="face-to-face">Face-to-Face</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Venue</div>
                      <Input
                        value={schedule.defense_venue}
                        onChange={e =>
                          setSchedule(s => ({ ...s, defense_venue: e.target.value }))
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <Input
                        value={schedule.scheduling_notes}
                        onChange={e =>
                          setSchedule(s => ({ ...s, scheduling_notes: e.target.value }))
                        }
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={saveSchedule}
                      disabled={!canEdit || savingSchedule}
                      className="gap-2 dark:bg-rose-500 dark:text-white hover:cursor-pointer"
                    >
                      {savingSchedule && <Loader2 className="animate-spin h-4 w-4" />}
                      <Save className="h-4 w-4" />
                      Save Schedule
                    </Button>
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
              {/* Stepper */}
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
          {request.last_status_updated_by_name ||
            request.last_status_updated_by ||
            '—'}{' '}
          {request.last_status_updated_at
            ? `(${request.last_status_updated_at})`
            : ''}
        </div>
      </div>

      {/* Confirmation Dialog for Approve/Reject/Retrieve */}
      <Dialog open={confirm.open} onOpenChange={o => { if (!o) setConfirm({ open: false, action: null }); }}>
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            {confirm.action === 'approve'
              ? 'Please review before approving.'
              : 'Apply this status change?'}
          </DialogDescription>
          <div className="mt-3 text-sm space-y-3">
            <p>
              Set request to{' '}
              <span className="font-semibold">
                {confirm.action === 'approve'
                  ? 'Approved'
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
                  Approving this defense request authorizes the use of your signature
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
