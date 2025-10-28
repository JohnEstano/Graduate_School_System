'use client';

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  CircleArrowLeft,
  Users,
  Clock,
  Send,
  UserCheck,
  Signature,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import EndorsementDialog from './endorsement-dialog';

type DefenseRequestFull = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  school_id: string;
  program: string;
  thesis_title: string;
  defense_type: string;
  priority?: 'Low' | 'Medium' | 'High';
  workflow_state?: string;
  defense_adviser?: string;
  defense_chairperson?: string; // ADD THIS
  defense_panelist1?: string; // ADD THIS
  defense_panelist2?: string; // ADD THIS
  defense_panelist3?: string; // ADD THIS
  defense_panelist4?: string; // ADD THIS
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
  ai_detection_certificate?: string;
  endorsement_form?: string;
  adviser_status?: string;
  coordinator_status?: string;
  defense_venue?: string;
  defense_mode?: string;
  scheduling_notes?: string;
  scheduled_time?: string;
  scheduled_date?: string;
  scheduled_end_time?: string;
};

interface PageProps {
  defenseRequest: DefenseRequestFull;
  userRole: string;
  coordinators?: { id?: number; name: string; email: string }[]; // <-- add id
}

type WorkflowStepKey =
  | 'submitted'
  | 'adviser-approved'
  | 'adviser-rejected'
  | 'adviser-retrieved'
  | 'coordinator-approved'
  | 'coordinator-rejected'
  | 'coordinator-retrieved'
  | 'panels-assigned'
  | 'scheduled';

type WorkflowStep = {
  key: WorkflowStepKey;
  label: string;
  icon: React.ReactElement;
};

export default function DetailsRequirementsPage(rawProps: any) {
  const props: PageProps = rawProps || {};
  const requestProp: DefenseRequestFull | null = props.defenseRequest || null;
  const userRole: string = props.userRole || '';

  const [tab, setTab] = useState<'details' | 'upload-certificate'>('details');

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
  const [confirm, setConfirm] = useState<{ open: boolean; action: 'reject' | 'retrieve' | null }>({
    open: false,
    action: null,
  });
  const [endorsementDialogOpen, setEndorsementDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // For AI Declaration Form upload
  const [aiDetectionCertFile, setAiDetectionCertFile] = useState<File | null>(null);
  const [aiDetectionCertUploading, setAiDetectionCertUploading] = useState(false);
  const aiDetectionInputRef = useRef<HTMLInputElement>(null);

  function csrf() {
    const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    return token;
  }

  // Fetch fresh CSRF token from server
  async function refreshCsrfToken() {
    try {
      // Make a simple GET request to refresh the session
      await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
      // Give it a moment to update the meta tag
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('Failed to refresh CSRF token:', err);
    }
  }

  // --- Reject/Retrieve logic (Approve is handled by endorsement dialog) ---
  async function handleStatusChange(action: 'reject' | 'retrieve') {
    if (!request.id) return;

    setIsLoading(true);

    // Refresh CSRF token before making the request
    await refreshCsrfToken();

    // Map action to new adviser_status value
    let newAdviserStatus: string = 'Pending';
    if (action === 'reject') newAdviserStatus = 'Rejected';
    else if (action === 'retrieve') newAdviserStatus = 'Pending';

    try {
      const response = await fetch(`/adviser/defense-requirements/${request.id}/adviser-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf(),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ adviser_status: newAdviserStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state with the server response
      setRequest(prev => ({
        ...prev,
        adviser_status: data.adviser_status || newAdviserStatus,
        workflow_state: data.workflow_state || prev.workflow_state,
        workflow_history: data.workflow_history || prev.workflow_history,
        last_status_updated_by: data.last_status_updated_by || prev.last_status_updated_by,
        last_status_updated_at: data.last_status_updated_at || prev.last_status_updated_at,
      }));

      setConfirm({ open: false, action: null });
      
      toast.success(`Status updated to ${newAdviserStatus}!`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
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

  // Helper to resolve file URLs (add /storage/ if not already absolute)
  function resolveFileUrl(url?: string | null) {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('/storage/')) return url;
    return `/storage/${url.replace(/^\/?storage\//, '')}`;
  }

    // Attachments
  const attachments = [
    { label: "Adviser's Endorsement", url: resolveFileUrl(request.advisers_endorsement) },
    { label: 'REC Endorsement', url: resolveFileUrl(request.rec_endorsement) },
    { label: 'Proof of Payment', url: resolveFileUrl(request.proof_of_payment) },
    { label: 'Reference No.', url: request.reference_no }, // Not a file, keep as is
    { label: 'Manuscript', url: resolveFileUrl(request.manuscript_proposal) },
    { label: 'Similarity Form', url: resolveFileUrl(request.similarity_index) },
    { label: 'Avisee-Adviser File', url: resolveFileUrl(request.avisee_adviser_attachment) },
  ];

  // --- FINAL CONSISTENT WORKFLOW STEPS AND MAPPING ---
  const workflowSteps: WorkflowStep[] = [
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
      key: 'adviser-rejected',
      label: 'Rejected by Adviser',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      key: 'adviser-retrieved',
      label: 'Retrieved by Adviser',
      icon: <CircleArrowLeft className="h-5 w-5" />,
    },
    {
      key: 'coordinator-approved',
      label: 'Approved by Coordinator',
      icon: <Signature className="h-5 w-5" />,
    },
    {
      key: 'coordinator-rejected',
      label: 'Rejected by Coordinator',
      icon: <XCircle className="h-5 w-5" />,
    },
    {
      key: 'coordinator-retrieved',
      label: 'Retrieved by Coordinator',
      icon: <CircleArrowLeft className="h-5 w-5" />,
    },
    {
      key: 'panels-assigned',
      label: 'Panels Assigned',
      icon: <Users className="h-5 w-5" />,
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  // Map event/to_state to workflow step key
  function getStepForEvent(event: string): WorkflowStepKey | 'adviser-pending' | '' {
    event = (event || '').toLowerCase();
    if (event === 'submitted') return 'submitted';
    if (event === 'adviser-approved') return 'adviser-approved';
    if (event === 'adviser-rejected') return 'adviser-rejected';
    if (event === 'adviser-retrieved') return 'adviser-retrieved';
    if (event === 'adviser-review' || event === 'pending') return 'adviser-pending';
    if (event === 'coordinator-approved') return 'coordinator-approved';
    if (event === 'coordinator-rejected') return 'coordinator-rejected';
    if (event === 'coordinator-retrieved') return 'coordinator-retrieved';
    if (event === 'panels-assigned') return 'panels-assigned';
    if (event === 'scheduled') return 'scheduled';
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

    // Handle AI Declaration Form upload
  async function handleAiCertificateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!request.id) return;
    if (!aiDetectionCertFile) {
      toast.error('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('ai_detection_certificate', aiDetectionCertFile);
    
    setAiDetectionCertUploading(true);
    
    // Refresh CSRF token before upload
    await refreshCsrfToken();

    try {
      const response = await fetch(`/adviser/defense-requirements/${request.id}/documents`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf(),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update local state
      setRequest(prev => ({
        ...prev,
        ai_detection_certificate: data.ai_detection_certificate || prev.ai_detection_certificate,
      }));

      setAiDetectionCertFile(null);
      if (aiDetectionInputRef.current) aiDetectionInputRef.current.value = '';
      
      toast.success('AI Declaration Form uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setAiDetectionCertUploading(false);
    }
  }

  const sectionClass = 'rounded-lg border p-5 space-y-3';

  // Add this helper for display
  function getAdviserStatusDisplay(status?: string) {
    if (status === 'Approved') return 'Endorsed';
    if (status === 'Rejected') return 'Rejected';
    return status || '—';
  }
  function getCoordinatorStatusDisplay(status?: string) {
    if (status === 'Approved') return 'Approved';
    if (status === 'Rejected') return 'Rejected';
    return status || '—';
  }

  const coordinators = props.coordinators ?? [];
  const loadingCoordinators = false; // No need to fetch, already loaded

  // Add panelMembers state for resolving panel member info
  const [panelMembers, setPanelMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  // Helper to find panelist by name
  function findPanelMember(name: string | null | undefined) {
    if (!name) return null;
    return panelMembers.find(m => m.name === name);
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
              onClick={() => router.visit('/all-defense-requirements')}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
              <TabsList className="h-8">
                <TabsTrigger value="details" className="flex items-center gap-1 text-sm font-medium px-3">
                  <Info className="h-4 w-4" /> Details
                </TabsTrigger>
                <TabsTrigger value="upload-certificate" className="flex items-center gap-1 text-sm font-medium px-3">
                  <FileText className="h-4 w-4" /> Upload AI Declaration Form
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEndorsementDialogOpen(true)}
              disabled={
                isLoading ||
                request.adviser_status === 'Approved' ||
                request.coordinator_status === 'Approved' ||
                !coordinators.length || !coordinators[0].id // Disable if no coordinator
              }
            >
              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
              Endorse
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'reject' })}
              disabled={
                isLoading || 
                request.adviser_status === 'Rejected' ||
                request.coordinator_status === 'Approved' // Disable if coordinator already approved
              }
            >
              <XCircle className="h-4 w-4 mr-1 text-red-600" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'retrieve' })}
              disabled={
                isLoading || 
                request.adviser_status === 'Pending' ||
                request.coordinator_status === 'Approved' // Disable if coordinator already approved
              }
            >
              <CircleArrowLeft className="h-4 w-4 mr-1 text-blue-600" />
              Retrieve
            </Button>
          </div>
        </div>

        {/* Main content and sidebar layout */}
        <div className="flex flex-col md:flex-row gap-5 mb-2">
          {/* Main column */}
          <div className="w-full md:max-w-3xl mx-auto flex flex-col gap-5">
            <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="w-full">
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-5">
                {/* Submission summary card */}
                <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
                  {/* Thesis Title Header with Adviser Status */}
                  <div className="mb-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-2xl font-semibold">{request.thesis_title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                    </div>
                    <div className="flex flex-col md:items-end gap-1">
                      {/* Adviser Status */}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-2 md:mt-0 ${request.adviser_status === 'Approved'
                            ? 'bg-green-100 text-green-600'
                            : request.adviser_status === 'Rejected'
                              ? 'bg-red-100 text-red-600'
                              : request.adviser_status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        Adviser Status: {getAdviserStatusDisplay(request.adviser_status)}
                      </span>
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
                      <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
                      <div className="font-medium text-sm">{formatDate(request.submitted_at)}</div>
                    </div>

                    {/* Program Coordinator */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Program Coordinator</div>
                      <div className="font-medium text-sm">
                        {coordinators.length > 0 ? (
                          coordinators.map((c, i) => (
                            <div key={i} className="text-sm">
                              {c.name}{c.email ? ` (${c.email})` : ''}
                            </div>
                          ))
                        ) : (
                          <span className="italic text-zinc-400">No coordinator registered</span>
                        )}
                      </div>
                    </div>

                    {/* Coordinator Status - top aligned so it stays part of the grid body */}
                    <div className="">
                      <div className="text-xs text-muted-foreground mb-1">Coordinator Status</div>
                      <div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${statusBadgeColor(request.coordinator_status)}`}
                        >
                          {getCoordinatorStatusDisplay(request.coordinator_status)}
                        </span>
                      </div>
                    </div>

                    {/* separator before scheduled info */}
                    <div className="md:col-span-2">
                      <Separator className="my-2" />
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                      <div className="font-medium text-sm">{formatDate(request.scheduled_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Time</div>
                      <div className="font-medium text-sm">
                        {request.scheduled_time
                          ? `${request.scheduled_time}${request.scheduled_end_time ? ' - ' + request.scheduled_end_time : ''}`
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
                      { key: 'adviser', info: memberFor(request.defense_adviser, 'Adviser') },
                      { key: 'chairperson', info: memberFor(request.defense_chairperson, 'Chairperson') },
                      { key: 'panelist1', info: memberFor(request.defense_panelist1, 'Panel Member') },
                      { key: 'panelist2', info: memberFor(request.defense_panelist2, 'Panel Member') },
                      { key: 'panelist3', info: memberFor(request.defense_panelist3, 'Panel Member') },
                      { key: 'panelist4', info: memberFor(request.defense_panelist4, 'Panel Member') },
                    ].map(r => {
                      const namePresent = !!(r.info.rawValue || (r.info.displayName && r.info.displayName !== '—'));
                      const emailPresent = !!(r.info.email);
                      const status = namePresent ? (emailPresent ? 'Assigned' : 'Pending confirmation') : '—';

                      return {
                        name: r.info.displayName,
                        email: r.info.email || '—',
                        role: r.info.role,
                        status,
                      };
                    });

                    return (
                      <div className="rounded-md  overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Name & Email</TableHead>
                              <TableHead className="min-w-[100px]">Role</TableHead>
                            
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
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Attachments
                  </h2>
                  <Separator />
                  <div className="space-y-2 text-sm mt-3">
                    {attachments
                      .filter(a => a.label !== 'AI Declaration Form' && a.label !== 'Endorsement Form')
                      .map(a =>
                        a.url ? (
                          <a
                            key={a.label}
                            href={a.label === 'Reference No.' ? undefined : a.url}
                            target={a.label === 'Reference No.' ? undefined : "_blank"}
                            rel={a.label === 'Reference No.' ? undefined : "noopener noreferrer"}
                            className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900 hover:bg-muted transition"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{a.label}</span>
                            <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
                              {typeof a.url === 'string' && a.label !== 'Reference No.' ? a.url.split('/').pop() : (a.url || '')}
                            </span>
                          </a>
                        ) : null
                      )}

                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">AI Declaration Form</span>
                      {request.ai_detection_certificate ? (
                        <a
                          href={request.ai_detection_certificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs underline truncate max-w-[180px]"
                        >
                          {request.ai_detection_certificate.split('/').pop()}
                        </a>
                      ) : (
                        <span className="ml-auto text-xs text-rose-600 font-semibold">Missing</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Endorsement Form</span>
                      {request.endorsement_form ? (
                        <a
                          href={request.endorsement_form}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs underline truncate max-w-[180px]"
                        >
                          {request.endorsement_form.split('/').pop()}
                        </a>
                      ) : (
                        <span className="ml-auto text-xs text-rose-600 font-semibold">Missing</span>
                      )}
                    </div>

                    {!attachments.some(a => a.url) &&
                      !request.ai_detection_certificate &&
                      !request.endorsement_form && (
                        <p className="text-sm text-muted-foreground">
                          No attachments.
                        </p>
                      )}
                  </div>
                </div>

                {/* Remove old Committee (read-only summary) section */}
              </TabsContent>

              {/* UPLOAD AI DECLARATION FORM TAB */}
              <TabsContent value="upload-certificate" className="space-y-5">
                <form onSubmit={handleAiCertificateSubmit} className="space-y-5">
                  {/* AI Declaration Form Section */}
                  <div className={sectionClass + " text-sm"}>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" /> AI Declaration Form
                    </h2>
                    <Separator />
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <label
                          htmlFor="ai-detection-upload"
                          className="block text-xs font-medium text-zinc-700 dark:text-zinc-200"
                        >
                          Upload Declaration Form
                        </label>
                        {request.ai_detection_certificate && !aiDetectionCertFile ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              type="text"
                              value={request.ai_detection_certificate.split('/').pop() || ''}
                              disabled
                              className="flex-1 bg-zinc-100 text-zinc-700 cursor-default"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setRequest(r => ({ ...r, ai_detection_certificate: undefined }));
                                if (aiDetectionInputRef.current) aiDetectionInputRef.current.value = "";
                              }}
                              title="Remove linked file"
                            >
                              <XCircle className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              id="ai-detection-upload"
                              ref={aiDetectionInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="flex-1 text-xs file:bg-rose-500 file:text-white file:rounded file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:cursor-pointer"
                              style={{ maxWidth: 220 }}
                              onChange={e => setAiDetectionCertFile(e.target.files?.[0] || null)}
                              disabled={aiDetectionCertUploading}
                            />
                            {aiDetectionCertUploading && (
                              <span className="text-xs text-muted-foreground">Uploading...</span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {aiDetectionCertFile
                            ? `Selected: ${aiDetectionCertFile.name}`
                            : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                      disabled={aiDetectionCertUploading || !aiDetectionCertFile}
                    >
                      {aiDetectionCertUploading ? (
                        <span>Uploading...</span>
                      ) : (
                        <span>Upload Declaration Form</span>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

            </Tabs>
          </div>

          {/* Workflow Progress Stepper sidebar */}
          <div className="w-full md:w-[340px] flex-shrink-0 space-y-4">
            {/* Workflow Progress card (unchanged content moved below attachments) */}
            <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900 h-fit">
              <h2 className="text-xs font-semibold mb-8 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Workflow Progress
              </h2>
              {/* Stepper */}
              <div className="flex flex-col gap-0 relative">
                {Array.isArray(request.workflow_history) && request.workflow_history.length > 0 ? (
                  request.workflow_history.map((item: any, idx: number) => {
                    // Map "adviser-status-updated" to the actual workflow step
                    let event = item.action;
                    if (event === "adviser-status-updated" && item.to_state) {
                      event = item.to_state;
                    }
                    if (event === "adviser-review" || event === "pending") {
                      event = "adviser-review";
                    }
                    const stepKey = getStepForEvent(event);
                    const step = workflowSteps.find(s => s.key === stepKey) || {
                      label: event.charAt(0).toUpperCase() + event.slice(1),
                      icon: <Clock className="h-5 w-5 text-gray-500" />,
                    };
                    const isLast = idx === ((request.workflow_history ?? []).length - 1);
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
                            {item.user_name && <span>{item.user_name}</span>}
                            {item.timestamp && (
                              <span>
                                {' '}
                                &middot; {formatReadableDate(item.timestamp)}
                              </span>
                            )}
                          </div>

                          {item.comment && (
                            <div className="text-xs text-muted-foreground mt-1">{item.comment}</div>
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

      {/* Confirmation Dialog for Reject/Retrieve */}
      <Dialog open={confirm.open} onOpenChange={o => { if (!o) setConfirm({ open: false, action: null }); }}>
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Apply this status change?
          </DialogDescription>
          <div className="mt-3 text-sm space-y-3">
            <p>
              Set request to{' '}
              <span className="font-semibold">
                {confirm.action === 'reject' ? 'Rejected' : 'Pending'}
              </span>?
            </p>
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

      {/* Endorsement Dialog */}
      <EndorsementDialog
        open={endorsementDialogOpen}
        onOpenChange={setEndorsementDialogOpen}
        defenseRequest={request}
        coordinatorId={coordinators.length > 0 ? coordinators[0].id : undefined}
        coordinatorName={coordinators.length > 0 ? coordinators[0].name : 'Coordinator'}
        onEndorseComplete={() => {
          // Simply reload the entire page to get fresh data
          window.location.reload();
        }}
      />
    </AppLayout>
  );
}

// Add this helper function in your file (or a utils file)
async function fetchWithCsrfRetry(url: string, options: RequestInit, retry = true) {
  options.headers = {
    ...(typeof options.headers === 'object' && options.headers !== null ? options.headers : {}),
    'X-CSRF-TOKEN': csrf(),
  };
  const res = await fetch(url, options);
  if (res.status === 419 && retry) {
    if (!options.headers || typeof options.headers !== 'object') {
      options.headers = {};
    }
    (options.headers as Record<string, string>)['X-CSRF-TOKEN'] = csrf();
    return fetchWithCsrfRetry(url, options, false);
  }
  return res;
}
function csrf(): string {
  return (
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
      ?.content || ''
  );
}

// (Removed unused handleAssignPanels function)
