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
  User as UserIcon
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
import { cn } from '@/lib/utils';

type PanelMemberOption = {
  id: string;
  name: string;
  email?: string;
  type?: string;
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
  last_status_updated_by?: string;          // could be an id
  last_status_updated_by_name?: string;     // added: friendly name if backend provides
  last_status_updated_at?: string;
  workflow_history?: any[];
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
                      {o.type && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {o.type}
                        </span>
                      )}
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
            setPanelMembers(Array.isArray(data) ? data : []);
            console.log(
              'Loaded panel members from',
              url,
              'count:',
              Array.isArray(data) ? data.length : 0
            );
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

  function csrf() {
    return (
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
        ?.content || ''
    );
  }

  async function savePanels() {
    const toastId = toast.loading('Saving panel assignments...');
    setSavingPanels(true);
    try {
      const res = await fetch(
        `/coordinator/defense-requests/${request.id}/panels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
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
    const toastId = toast.loading('Saving schedule...');
    setSavingSchedule(true);
    try {
      const res = await fetch(
        `/coordinator/defense-requests/${request.id}/schedule-json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf()
          },
          body: JSON.stringify(schedule)
        }
      );
      const data = await res.json();
      if (res.ok) {
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
        toast.error(data.error || 'Failed to save schedule', { id: toastId });
      }
    } catch {
      toast.error('Network error saving schedule', { id: toastId });
    } finally {
      setSavingSchedule(false);
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

  const attachments = [
    { label: "Adviser’s Endorsement", url: request.advisers_endorsement },
    { label: 'REC Endorsement', url: request.rec_endorsement },
    { label: 'Proof of Payment', url: request.proof_of_payment },
    { label: 'Reference No.', url: request.reference_no }
  ];

  function parseISODate(d: string) {
    const parts = d.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(NaN);
  }
  function formatISODate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
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

  const sectionClass = 'rounded-lg border p-5 space-y-3'; // increased padding

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Toaster position="bottom-right" richColors closeButton />
      <div className="p-5 space-y-6">
        <Head title={request.thesis_title || `Defense Request #${request.id}`} />
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => router.visit('/defense-request')}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Defense Request Details</h1>
          {request.status && (
            <span
              className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadgeColor(
                request.status
              )}`}
            >
              {request.status}
            </span>
          )}
          {request.priority && (
            <Badge variant="outline" className="ml-1 text-xs">
              {request.priority}
            </Badge>
          )}
          {request.defense_type && (
            <Badge className="ml-1 text-xs" variant="secondary">
              {request.defense_type}
            </Badge>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="col-span-2 space-y-5">
            {/* Submission */}
            <div className={sectionClass}>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Submission
              </h2>
              <Separator />
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Thesis Title
                  </div>
                  <div className="font-medium">{request.thesis_title}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Presenter
                  </div>
                  <div className="font-medium">
                    {request.first_name} {request.middle_name || ''}{' '}
                    {request.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.school_id}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Program
                  </div>
                  <div className="font-medium">{request.program}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Workflow State
                  </div>
                  <div className="font-medium">
                    {request.workflow_state || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Scheduled Date
                  </div>
                  <div className="font-medium">
                    {formatDate(request.scheduled_date)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    Time
                  </div>
                  <div className="font-medium">
                    {request.scheduled_time
                      ? `${request.scheduled_time} - ${
                          request.scheduled_end_time || ''
                        }`
                      : '—'}
                  </div>
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
                        {a.url.split('/').pop()}
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

            {/* Workflow History */}
            <div className={sectionClass}>
              <h2 className="text-sm font-semibold">Workflow History</h2>
              <Separator />
              {Array.isArray(request.workflow_history) &&
              request.workflow_history.length > 0 ? (
                <ScrollArea className="h-60">
                  <ul className="space-y-3 text-xs pr-2">
                    {request.workflow_history.map((e: any, i: number) => {
                      const { event, desc, from, to, created, userName } =
                        resolveHistoryFields(e);
                      return (
                        <li key={i} className="border rounded-md p-3 bg-background">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{event}</span>
                            {from || to ? (
                              <span className="text-[10px] text-muted-foreground">
                                {from ? from : '—'} ➜ {to ? to : '—'}
                              </span>
                            ) : null}
                          </div>
                          {desc && (
                            <div className="text-muted-foreground mb-2 leading-snug">
                              {desc}
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {userName && (
                              <span className="inline-flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                {userName}
                              </span>
                            )}
                            {created && (
                              <span>
                                {created}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No workflow history yet.
                </p>
              )}
            </div>
          </div>

            {/* Right Column */}
          <div className="space-y-6">
            <div className="rounded-lg border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Panel Assignment</h2>
                {loadingMembers && (
                  <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                )}
              </div>
              <Separator />
              <div className="space-y-3">
                {panelLoadError && (
                  <div className="text-[11px] text-red-500">
                    {panelLoadError}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 px-2"
                      onClick={() => {
                        // retry
                        setPanelMembers([]);
                        setPanelLoadError(null);
                        (async () => {
                          setLoadingMembers(true);
                          try {
                            const r = await fetch(
                              '/coordinator/defense/panel-members-all'
                            );
                            if (!r.ok) throw 0;
                            const data = await r.json();
                            setPanelMembers(Array.isArray(data) ? data : []);
                          } catch {
                            setPanelLoadError('Could not load panel members.');
                          } finally {
                            setLoadingMembers(false);
                          }
                        })();
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}
                {[
                  { key: 'defense_chairperson', label: 'Chairperson *' },
                  { key: 'defense_panelist1', label: 'Panelist 1 *' },
                  { key: 'defense_panelist2', label: 'Panelist 2' },
                  { key: 'defense_panelist3', label: 'Panelist 3' },
                  { key: 'defense_panelist4', label: 'Panelist 4' }
                ].map(f => (
                  <PanelMemberCombobox
                    key={f.key}
                    label={f.label}
                    value={(panels as any)[f.key]}
                    onChange={v =>
                      setPanels(p => ({ ...p, [f.key]: v }))
                    }
                    options={panelMembers}
                    disabled={!canEdit || loadingMembers}
                    taken={taken}
                  />
                ))}
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={savePanels}
                  disabled={
                    savingPanels ||
                    !panels.defense_chairperson ||
                    !panels.defense_panelist1
                  }
                >
                  {savingPanels && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  <Save className="h-4 w-4 mr-1" /> Save Panels
                </Button>
              )}
              <div className="text-[11px] text-muted-foreground">
                Adviser: {request.defense_adviser || '—'}
              </div>
            </div>

            <div className="rounded-lg border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Scheduling</h2>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  {/* Date Picker */}
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-medium">Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left h-8 px-2 text-xs',
                            !schedule.scheduled_date && 'text-muted-foreground'
                          )}
                          disabled={!canEdit}
                        >
                          {schedule.scheduled_date
                            ? format(
                                parseISODate(schedule.scheduled_date),
                                'PPP'
                              )
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto" align="start">
                        <CalendarCmp
                          mode="single"
                          selected={
                            schedule.scheduled_date
                              ? parseISODate(schedule.scheduled_date)
                              : undefined
                          }
                          onSelect={d =>
                            d &&
                            setSchedule(s => ({
                              ...s,
                              scheduled_date: formatISODate(d)
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Mode Select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium">Mode *</label>
                    <Select
                      value={schedule.defense_mode}
                      onValueChange={v =>
                        setSchedule(s => ({ ...s, defense_mode: v }))
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="h-8 text-xs px-2">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="face-to-face">Face-to-Face</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium">Start *</label>
                    <Input
                      type="time"
                      value={schedule.scheduled_time}
                      onChange={e =>
                        setSchedule(s => ({ ...s, scheduled_time: e.target.value }))
                      }
                      disabled={!canEdit}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* End Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium">End *</label>
                    <Input
                      type="time"
                      value={schedule.scheduled_end_time}
                      onChange={e =>
                        setSchedule(s => ({
                          ...s,
                          scheduled_end_time: e.target.value
                        }))
                      }
                      disabled={!canEdit}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Venue */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium">
                    Venue / Link *
                  </label>
                  <Input
                    value={schedule.defense_venue}
                    onChange={e =>
                      setSchedule(s => ({
                        ...s,
                        defense_venue: e.target.value
                      }))
                    }
                    disabled={!canEdit}
                    className="h-8 text-xs"
                    placeholder="Room or URL"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full border rounded p-2 text-xs bg-background"
                    value={schedule.scheduling_notes}
                    disabled={!canEdit}
                    onChange={e =>
                      setSchedule(s => ({
                        ...s,
                        scheduling_notes: e.target.value
                      }))
                    }
                    placeholder="Optional notes..."
                  />
                </div>

                {/* Duration */}
                {schedule.scheduled_time && schedule.scheduled_end_time && (
                  <p className="text-[10px] text-muted-foreground">
                    Duration:{' '}
                    {(() => {
                      try {
                        const [h1, m1] = schedule.scheduled_time
                          .split(':')
                          .map(Number);
                        const [h2, m2] = schedule.scheduled_end_time
                          .split(':')
                          .map(Number);
                        const mins = h2 * 60 + m2 - (h1 * 60 + m1);
                        return mins > 0 ? `${mins} mins` : '—';
                      } catch {
                        return '—';
                      }
                    })()}
                  </p>
                )}
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={
                    savingSchedule ||
                    !schedule.scheduled_date ||
                    !schedule.scheduled_time ||
                    !schedule.scheduled_end_time ||
                    !schedule.defense_mode ||
                    !schedule.defense_venue
                  }
                  onClick={saveSchedule}
                >
                  {savingSchedule && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  <Save className="h-4 w-4 mr-1" />
                  Save Schedule
                </Button>
              )}
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
    </AppLayout>
  );
}
