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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

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

  const [tab, setTab] = useState<'details' | 'link-documents'>('details');

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

  // For document linking form
  const [aiDetectionCertFile, setAiDetectionCertFile] = useState<File | null>(null);
  const [endorsementFormFile, setEndorsementFormFile] = useState<File | null>(null);
  const [aiDetectionCertUploading, setAiDetectionCertUploading] = useState(false);
  const [endorsementFormUploading, setEndorsementFormUploading] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  const aiDetectionInputRef = useRef<HTMLInputElement>(null);
  const endorsementInputRef = useRef<HTMLInputElement>(null);

  function csrf() {
    return (
      (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
        ?.content || ''
    );
  }

  // --- Add state for missing docs alert ---
  const [missingDocsAlert, setMissingDocsAlert] = useState<string | null>(null);

  // --- Approve/Reject/Retrieve logic ---
  async function handleStatusChange(action: 'approve' | 'reject' | 'retrieve') {
    if (!request.id) return;

    // Restrict Endorse if required documents are missing
    if (action === 'approve') {
      if (!request.ai_detection_certificate || !request.endorsement_form) {
        setMissingDocsAlert(
          'You must upload both the AI Detection Certificate and Endorsement Form before endorsing this request.'
        );
        setConfirm({ open: false, action: null });
        toast.error('You must upload both the AI Detection Certificate and Endorsement Form before endorsing.');
        return;
      }
      // Restrict Endorse if no coordinator relationship exists
      if (!coordinators.length || !coordinators[0].id) {
        setMissingDocsAlert(
          'You must have a coordinator linked before you can endorse this request.'
        );
        setConfirm({ open: false, action: null });
        toast.error('You must have a coordinator linked before you can endorse.');
        return;
      }
    }

    setIsLoading(true);
    setMissingDocsAlert(null);

    // Map action to new adviser_status value
    let newAdviserStatus: string = 'Pending';
    if (action === 'approve') newAdviserStatus = 'Approved';
    else if (action === 'reject') newAdviserStatus = 'Rejected';
    else if (action === 'retrieve') newAdviserStatus = 'Pending';

    try {
      const payload: any = { adviser_status: newAdviserStatus };
      // Only include coordinator_user_id when approving and a coordinator is available
      if (action === 'approve' && coordinators.length > 0 && coordinators[0].id) {
        payload.coordinator_user_id = coordinators[0].id;
      }

      const res = await fetchWithCsrfRetry(`/adviser/defense-requirements/${request.id}/adviser-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.request) {
          setRequest(data.request); // This will update workflow_history and re-render the workflow section
        } else {
          setRequest(r => ({
            ...r,
            adviser_status: newAdviserStatus,
            workflow_history: data.workflow_history || r.workflow_history,
            workflow_state: data.workflow_state || r.workflow_state,
          }));
        }
        toast.success(`Adviser status set to ${newAdviserStatus}`);
      } else {
        toast.error(data?.error || 'Failed to update adviser status');
      }
    } catch {
      toast.error('Network error updating adviser status');
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

  // Helper to resolve file URLs (add /storage/ if not already absolute)
  function resolveFileUrl(url?: string | null) {
    if (!url) return null;
    if (/^https?:\/\//i.test(url) || url.startsWith('/storage/')) return url;
    return `/storage/${url.replace(/^\/?storage\//, '')}`;
  }

  // Attachments
  const attachments = [
    { label: "Adviser’s Endorsement", url: resolveFileUrl(request.advisers_endorsement) },
    { label: 'REC Endorsement', url: resolveFileUrl(request.rec_endorsement) },
    { label: 'Proof of Payment', url: resolveFileUrl(request.proof_of_payment) },
    { label: 'Reference No.', url: request.reference_no }, // Not a file, keep as is
    { label: 'Manuscript', url: resolveFileUrl(request.manuscript_proposal) },
    { label: 'Similarity Index', url: resolveFileUrl(request.similarity_index) },
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

  // Handle document submission for the "Link Documents" tab
  async function handleDocumentsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!request.id) return;
    if (!aiDetectionCertFile && !endorsementFormFile) {
      toast.error('Please select at least one document to upload.');
      return;
    }

    const formData = new FormData();
    if (aiDetectionCertFile) {
      formData.append('ai_detection_certificate', aiDetectionCertFile);
    }
    if (endorsementFormFile) {
      formData.append('endorsement_form', endorsementFormFile);
    }

    try {
      if (aiDetectionCertFile) setAiDetectionCertUploading(true);
      if (endorsementFormFile) setEndorsementFormUploading(true);

      const res = await fetchWithCsrfRetry(`/adviser/defense-requirements/${request.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setRequest(r => ({
          ...r,
          ai_detection_certificate: data.ai_detection_certificate || r.ai_detection_certificate,
          endorsement_form: data.endorsement_form || r.endorsement_form,
          advisers_endorsement: data.advisers_endorsement || r.advisers_endorsement,
        }));
        setAiDetectionCertFile(null);
        setEndorsementFormFile(null);
        toast.success('Documents uploaded successfully.');
      } else {
        toast.error(data?.error || 'Failed to upload documents.');
      }
    } catch {
      toast.error('Network error uploading documents.');
    } finally {
      setAiDetectionCertUploading(false);
      setEndorsementFormUploading(false);
    }
  }

  // Add state for templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    setTemplatesLoading(true);
    fetch('/api/document-templates')
      .then(r => r.json())
      .then(setTemplates)
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Helper to get template name by defense type
  function getTemplateNameForDefenseType(defenseType: string) {
    if (/proposal/i.test(defenseType)) return "Endorsement Form (Proposal)";
    if (/prefinal/i.test(defenseType)) return "Endorsement Form (Prefinal)";
    if (/final/i.test(defenseType)) return "Endorsement (Final)";
    return null;
  }

  // Auto Generate handler
  async function handleAutoGenerate() {
    setAutoGenerating(true);
    toast.loading("Generating document...");
    const templateName = getTemplateNameForDefenseType(request.defense_type || "");
    if (templatesLoading) {
      toast.error("Templates are still loading. Please wait.");
      setAutoGenerating(false);
      return;
    }
    const template = templates.find(t => t.name === templateName);
    if (!template) {
      toast.error("No template found for this defense type.");
      setAutoGenerating(false);
      return;
    }
    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/pdf",
          "X-CSRF-TOKEN": csrf(),
        },
        body: JSON.stringify({
          template_id: template.id,
          defense_request_id: request.id,
          fields: {},
        }),
      });
      if (!res.ok) {
        toast.error("Failed to generate document.");
        setAutoGenerating(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'endorsement_form.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Endorsement Form generated and downloaded!");
    } catch (e) {
      toast.error("Network error generating document.");
    } finally {
      setAutoGenerating(false);
      toast.dismiss();
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

  // Always show missing docs alert if not linked
  const missingDocs =
    !request.ai_detection_certificate || !request.endorsement_form;
  const missingDocsAlertMsg = !request.ai_detection_certificate && !request.endorsement_form
    ? "*You haven't uploaded the AI Detection Certificate and Endorsement Form yet."
    : !request.ai_detection_certificate
      ? "*You haven't uploaded the AI Detection Certificate yet."
      : !request.endorsement_form
        ? "*You haven't uploaded the Endorsement Form yet."
        : null;


  const coordinators = props.coordinators ?? [];
  const loadingCoordinators = false; // No need to fetch, already loaded



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
                  <FileText className="h-4 w-4" /> Details
                </TabsTrigger>
                <TabsTrigger value="link-documents" className="flex items-center gap-1 text-sm font-medium px-3">
                  <FileText className="h-4 w-4" /> Link Documents
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Always show missing docs alert here, regardless of tab */}
            {missingDocs && (
              <span className="ml-4 text-xs text-rose-600 font-medium">
                {missingDocsAlertMsg}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'approve' })}
              disabled={
                isLoading ||
                request.adviser_status === 'Approved' ||
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
              disabled={isLoading || request.adviser_status === 'Rejected'}
            >
              <XCircle className="h-4 w-4 mr-1 text-red-600" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirm({ open: true, action: 'retrieve' })}
              disabled={isLoading || request.adviser_status === 'Pending'}
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

                {/* Attachments moved to sidebar */}
                <div className={sectionClass}>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Attachments
                  </h2>
                  {missingDocs && (
                    <div className="mb-2">
                      <span className="text-xs text-rose-600 font-medium">{missingDocsAlertMsg}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-2 text-sm mt-3">
                    {attachments
                      .filter(a => a.label !== 'AI Detection Certificate' && a.label !== 'Endorsement Form')
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
                      <span className="font-medium">AI Detection Certificate</span>
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
              </TabsContent>

              {/* LINK DOCUMENTS TAB */}
              <TabsContent value="link-documents" className="space-y-5">
                <form onSubmit={handleDocumentsSubmit} className="space-y-5">
                  {/* AI Detection Certificate Section */}
                  <div className={sectionClass + " text-sm"}>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" /> AI Detection Certificate
                    </h2>
                    <Separator />
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <label
                          htmlFor="ai-detection-upload"
                          className="block text-xs font-medium text-zinc-700 dark:text-zinc-200"
                        >
                          Upload Certificate
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

                  {/* Endorsement Form Section */}
                  <div className={sectionClass + " text-sm"}>
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Endorsement Form
                    </h2>
                    <Separator />
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <label
                          htmlFor="endorsement-upload"
                          className="block text-xs font-medium text-zinc-700 dark:text-zinc-200"
                        >
                          Upload Endorsement Form
                        </label>
                        {request.endorsement_form && !endorsementFormFile ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              type="text"
                              value={request.endorsement_form.split('/').pop() || ''}
                              disabled
                              className="flex-1 bg-zinc-100 text-zinc-700 cursor-default"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setRequest(r => ({ ...r, endorsement_form: undefined }));
                                if (endorsementInputRef.current) endorsementInputRef.current.value = "";
                              }}
                              title="Remove linked file"
                            >
                              <XCircle className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              id="endorsement-upload"
                              ref={endorsementInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="flex-1 text-xs file:bg-rose-500 file:text-white file:rounded file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:cursor-pointer"
                              style={{ maxWidth: 220 }}
                              onChange={e => setEndorsementFormFile(e.target.files?.[0] || null)}
                              disabled={endorsementFormUploading}
                            />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {endorsementFormFile
                            ? `Selected: ${endorsementFormFile.name}`
                            : null}
                        </div>
                        {/* Auto Generate button on a separate row */}
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAutoGenerate}
                            disabled={endorsementFormUploading || autoGenerating || templatesLoading}
                          >
                            {autoGenerating || templatesLoading ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Generating...
                              </span>
                            ) : (
                              "Auto Generate"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
                      disabled={aiDetectionCertUploading || endorsementFormUploading}
                    >
                      {aiDetectionCertUploading || endorsementFormUploading ? (
                        <span>Uploading...</span>
                      ) : (
                        <span>Submit Documents</span>
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
            {confirm.action === 'approve' && coordinators.length > 0 && (
              <div className="text-xs text-muted-foreground">
                This will be sent to your coordinator: <span className="font-semibold">{coordinators[0].name}</span>
              </div>
            )}
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
