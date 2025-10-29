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
  DollarSign,
  Hourglass,
  Banknote,
  CircleCheck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import PaymentValidationSection from "./payment-validation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { postWithCsrf, fetchWithCsrf } from '@/utils/csrf';

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
  coordinator_status?: string;
  coordinator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  aa_verification_status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed' | 'invalid';
  aa_verification_id?: number | null;
  invalid_comment?: string | null;
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
  const [panelMembers, setPanelMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [paymentRates, setPaymentRates] = useState<PaymentRateRow[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: (() => void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    action: null,
  });

  // Invalid comment dialog state
  const [invalidCommentDialog, setInvalidCommentDialog] = useState<{
    open: boolean;
    comment: string;
  }>({
    open: false,
    comment: '',
  });

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
        console.error('Failed to load payment rates:', e);
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
    if (!details?.program_level || !details?.defense_type) {
      return null;
    }
    
    // Map role to payment rate type EXACTLY as stored in DB
    // IMPORTANT: Database stores "Panel Member 1", "Panel Member 2", etc. with numbers!
    let rateType = '';
    if (role === 'Adviser') {
      rateType = 'Adviser';
    } else if (role === 'Panel Chair' || role === 'Chairperson') {
      rateType = 'Panel Chair';
    } else if (role.includes('Panel Member')) {
      // Keep the full role name including number (Panel Member 1, Panel Member 2, etc.)
      rateType = role;
    } else if (role === 'Panelist') {
      // Generic panelist - try to find any Panel Member rate
      rateType = 'Panel Member 1'; // Default to Panel Member 1
    } else {
      // Default fallback
      rateType = role;
    }
    
    // Normalize defense type for case-insensitive comparison
    const normalizeDefenseType = (dt: string) => dt.toLowerCase().replace(/[^a-z]/g, '');
    const targetDefenseType = normalizeDefenseType(details.defense_type);
    
    // Direct comparison with normalization
    const rate = paymentRates.find(
      r => {
        const matchesProgram = r.program_level === details.program_level;
        const matchesType = r.type === rateType;
        const matchesDefense = normalizeDefenseType(r.defense_type || '') === targetDefenseType;
        
        return matchesProgram && matchesType && matchesDefense;
      }
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
    { label: 'Similarity Form', url: resolveFileUrl(details?.attachments?.similarity_index) },
    { label: 'Avisee-Adviser File', url: resolveFileUrl(details?.attachments?.avisee_adviser_attachment) },
    { label: 'AI Declaration Form', url: resolveFileUrl(details?.attachments?.ai_detection_certificate) },
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
      key: 'payment-ready',
      label: 'Payment Ready for Finance',
      icon: <ArrowRight className="h-5 w-5" />,
    },
    {
      key: 'payment-in-progress',
      label: 'Payment In Progress',
      icon: <Hourglass className="h-5 w-5" />,
    },
    {
      key: 'payment-paid',
      label: 'Payment Paid',
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      key: 'payment-invalid',
      label: 'Payment Invalid',
      icon: <AlertTriangle className="h-5 w-5" />,
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
    if (event.includes('payment ready') || event.includes('ready for finance')) return 'payment-ready';
    if (event.includes('payment in progress') || event.includes('in progress')) return 'payment-in-progress';
    if (event.includes('payment paid') || event.includes('paid')) return 'payment-paid';
    if (event.includes('payment invalid') || event.includes('invalid')) return 'payment-invalid';
    if (event.includes('rejected')) return 'rejected';
    if (event.includes('retrieved')) return 'retrieved';
    return '';
  }

  // Mark as Completed handler - Updates BOTH defense status AND AA status
  async function handleMarkCompleted() {
    if (!details) return;
    
    setIsUpdating(true);
    const toastId = toast.loading('Marking as completed...');
    
    try {
      const url = `/defense-requests/${details.id}/complete`;
      console.log('📡 Sending request to:', url);
      
      // Use the centralized CSRF utility
      const res = await postWithCsrf(url, {});
      
      console.log('📥 Response status:', res.status, res.statusText);
      
      // Handle CSRF token mismatch (419)
      if (res.status === 419) {
        console.error('❌ CSRF token mismatch (419)');
        toast.error('Session expired. Please refresh the page and try again.', { id: toastId });
        return;
      }
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text);
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Server error. Please check the server logs.');
        }
        
        throw new Error('Server returned an invalid response');
      }
      
      const data = await res.json();
      console.log('📦 Response data:', data);
      
      if (res.ok && data.success) {
        // Update local state immediately - both defense status AND AA status
        setDetails(prev => prev ? { 
          ...prev, 
          status: 'Completed', 
          workflow_state: 'completed',
          aa_verification_status: 'completed',
          aa_verification_id: data.aa_verification_id
        } : prev);
        
        console.log('✅ Defense marked as completed');
        toast.success('Defense marked as completed', { id: toastId });
        
      } else {
        const errorMsg = data.error || data.message || 'Failed to mark as completed';
        console.error('❌ Mark completed failed:', data);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error('💥 Error marking as completed:', error);
      
      let errorMessage = 'Error marking as completed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUpdating(false);
      setConfirmDialog({ open: false, title: '', description: '', action: null });
    }
  }

  // Update AA Status only
  async function handleUpdateAAStatus(newStatus: 'ready_for_finance' | 'in_progress' | 'paid' | 'completed') {
    if (!details) return;
    
    setIsUpdating(true);
    const statusLabels = {
      ready_for_finance: 'Ready for Finance',
      in_progress: 'In Progress',
      paid: 'Paid',
      completed: 'Completed'
    };
    const toastId = toast.loading(`Updating to ${statusLabels[newStatus]}...`);
    
    try {
      const url = `/assistant/aa-verification/${details.id}/status`;
      console.log('📡 Sending request to:', url);
      console.log('📦 Payload:', { status: newStatus });
      
      // Use the centralized CSRF utility
      const res = await postWithCsrf(url, { status: newStatus });
      
      console.log('📥 Response status:', res.status, res.statusText);
      
      // Handle CSRF token mismatch (419)
      if (res.status === 419) {
        console.error('❌ CSRF token mismatch (419)');
        toast.error('Session expired. Please refresh the page and try again.', { id: toastId });
        return;
      }
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text);
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Server error. Please check the server logs.');
        }
        
        throw new Error('Server returned an invalid response');
      }
      
      const data = await res.json();
      console.log('📦 Response data:', data);
      
      if (res.ok && data.success) {
        // Update local state immediately
        setDetails(prev => prev ? { 
          ...prev, 
          aa_verification_status: newStatus,
          aa_verification_id: data.aa_verification_id
        } : prev);
        
        console.log('✅ Status updated successfully');
        
        // Success messages
        if (newStatus === 'ready_for_finance') {
          toast.success(`Status updated to ${statusLabels[newStatus]}. Honorarium & student records created.`, { 
            id: toastId,
            duration: 4000 
          });
        } else {
          toast.success(`Status updated to ${statusLabels[newStatus]}`, { id: toastId });
        }
        
      } else {
        const errorMsg = data.error || data.message || 'Failed to update status';
        console.error('❌ Status update failed:', data);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error('💥 Error updating AA status:', error);
      
      let errorMessage = 'Error updating status';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUpdating(false);
      setConfirmDialog({ open: false, title: '', description: '', action: null });
    }
  }

  // Mark as Invalid with comment
  async function handleMarkInvalid() {
    if (!details) return;
    
    const comment = invalidCommentDialog.comment.trim();
    if (!comment) {
      toast.error('Please provide a reason for marking as invalid');
      return;
    }
    
    setIsUpdating(true);
    setInvalidCommentDialog({ open: false, comment: '' });
    
    const toastId = toast.loading('Marking as invalid...');
    
    try {
      const url = `/assistant/aa-verification/${details.id}/status`;
      console.log('📡 Sending request to:', url);
      console.log('📦 Payload:', { status: 'invalid', invalid_comment: comment });
      
      const res = await postWithCsrf(url, { 
        status: 'invalid',
        invalid_comment: comment 
      });
      
      console.log('📥 Response status:', res.status, res.statusText);
      
      if (res.status === 419) {
        console.error('❌ CSRF token mismatch (419)');
        toast.error('Session expired. Please refresh the page and try again.', { id: toastId });
        return;
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Server returned an invalid response');
      }
      
      const data = await res.json();
      console.log('📦 Response data:', data);
      
      if (res.ok && data.success) {
        setDetails(prev => prev ? { 
          ...prev, 
          aa_verification_status: 'invalid',
          aa_verification_id: data.aa_verification_id,
          invalid_comment: comment
        } : prev);
        
        console.log('✅ Marked as invalid successfully');
        toast.success('Payment marked as invalid', { id: toastId });
      } else {
        const errorMsg = data.error || data.message || 'Failed to mark as invalid';
        console.error('❌ Failed:', data);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error('💥 Error marking as invalid:', error);
      
      let errorMessage = 'Error marking as invalid';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  }
  
  // Open confirmation dialog
  function openConfirmDialog(
    title: string,
    description: string,
    action: () => void
  ) {
    setConfirmDialog({
      open: true,
      title,
      description,
      action,
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={details?.thesis_title || `Defense Request #${details?.id ?? ''}`} />
      <div className="p-5 space-y-6">
        {/* Toolbar - NO MORE TABS */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.visit('/assistant/all-defense-list')}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* AA Status Update Buttons - Can change status freely */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                openConfirmDialog(
                  'Mark as Ready for Finance?',
                  `This will create honorarium payment records, sync to student and panelist records, and make records visible in Honorarium page.`,
                  () => handleUpdateAAStatus('ready_for_finance')
                );
              }}
              disabled={isUpdating}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4 text-blue-600" />
              Ready for Finance
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                openConfirmDialog(
                  'Mark as In Progress?',
                  'This indicates the payment processing has started.',
                  () => handleUpdateAAStatus('in_progress')
                );
              }}
              disabled={isUpdating}
              className="gap-2"
            >
              <Hourglass className="h-4 w-4 text-amber-600" />
              In Progress
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                openConfirmDialog(
                  'Mark as Paid?',
                  'This confirms that all honorarium payments have been processed.',
                  () => handleUpdateAAStatus('paid')
                );
              }}
              disabled={isUpdating}
              className="gap-2"
            >
              <Banknote className="h-4 w-4 text-emerald-600" />
              Paid
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setInvalidCommentDialog({ open: true, comment: '' });
              }}
              disabled={isUpdating}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Mark as Invalid
            </Button>
            
            {/* Hidden but functional - Mark as Completed */}
            {false && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  openConfirmDialog(
                    'Mark as Completed?',
                    'This action will finalize the defense and AA payment status.',
                    handleMarkCompleted
                  );
                }}
                disabled={isUpdating}
                className="gap-2"
              >
                <CircleCheck className="h-4 w-4 text-green-600" />
                Mark as Completed
              </Button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Submission summary card - MATCHING COORDINATOR LAYOUT */}
            <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900">
              {/* Thesis Title Header */}
              <div className="mb-1 flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div className="flex-1">
                  <div className="text-2xl font-semibold">{details?.thesis_title}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">Thesis Title</div>
                </div>
                {/* AA STATUS BADGE - Primary status display */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-semibold px-3 py-1 h-fit flex items-center gap-1.5",
                    details?.aa_verification_status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : details?.aa_verification_status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : details?.aa_verification_status === 'ready_for_finance'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : details?.aa_verification_status === 'in_progress'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      : details?.aa_verification_status === 'invalid'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  )}
                >
                  {details?.aa_verification_status === 'completed' && <CircleCheck className="h-3.5 w-3.5" />}
                  {details?.aa_verification_status === 'paid' && <Banknote className="h-3.5 w-3.5" />}
                  {details?.aa_verification_status === 'ready_for_finance' && <DollarSign className="h-3.5 w-3.5" />}
                  {details?.aa_verification_status === 'in_progress' && <Hourglass className="h-3.5 w-3.5" />}
                  {details?.aa_verification_status === 'invalid' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {!details?.aa_verification_status && <Clock className="h-3.5 w-3.5" />}
                  {details?.aa_verification_status === 'completed'
                    ? 'Completed'
                    : details?.aa_verification_status === 'paid'
                    ? 'Paid'
                    : details?.aa_verification_status === 'ready_for_finance'
                    ? 'Ready for Finance'
                    : details?.aa_verification_status === 'in_progress'
                    ? 'In Progress'
                    : details?.aa_verification_status === 'invalid'
                    ? 'Invalid'
                    : 'Pending'}
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                {/* Presenter */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Presenter</div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-base font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                        {getInitials({ first_name: details?.first_name, last_name: details?.last_name })}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm leading-tight">
                        {details?.first_name} {details?.middle_name ? `${details.middle_name} ` : ''}{details?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {details?.school_id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Program */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Program</div>
                  <div className="font-medium text-sm">{details?.program}</div>
                </div>

                {/* Defense Type */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Defense Type</div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {details?.defense_type ?? '—'}
                  </Badge>
                </div>

                {/* Submitted At */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
                  <div className="font-medium text-sm">{formatDate(details?.submitted_at)}</div>
                </div>

                {/* Program Coordinator */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Program Coordinator</div>
                  <div className="font-medium text-sm">
                    {details?.coordinator?.name || '—'}
                  </div>
                </div>

                {/* Coordinator Status */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Coordinator Status</div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-semibold",
                      details?.coordinator_status === 'Approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : details?.coordinator_status === 'Rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    )}
                  >
                    {details?.coordinator_status || 'Pending'}
                  </Badge>
                </div>

                {/* Separator before payment info */}
                <div className="md:col-span-2">
                  <Separator className="my-2" />
                </div>

                {/* Amount */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Amount</div>
                  <div className="font-medium text-sm">
                    {details?.amount 
                      ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(details.amount)
                      : '—'}
                  </div>
                </div>

                {/* Reference No */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Reference No.</div>
                  <div className="font-medium text-sm">
                    {details?.reference_no || '—'}
                  </div>
                </div>

                {/* Separator before schedule info */}
                <div className="md:col-span-2">
                  <Separator className="my-2" />
                </div>

                {/* Scheduled Date */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Scheduled Date</div>
                  <div className="font-medium text-sm">{formatDate(details?.scheduled_date)}</div>
                </div>

                {/* Time */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Time</div>
                  <div className="font-medium text-sm">
                    {details?.scheduled_time
                      ? `${formatTime12h(details.scheduled_time)}${details.scheduled_end_time ? ' - ' + formatTime12h(details.scheduled_end_time) : ''}`
                      : '—'}
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Venue</div>
                  <div className="font-medium text-sm">{details?.defense_venue || '—'}</div>
                </div>

                {/* Mode */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Mode</div>
                  <div className="font-medium text-sm capitalize">
                    {details?.defense_mode ? (details.defense_mode === 'face-to-face' ? 'Face-to-Face' : 'Online') : '—'}
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Notes</div>
                  <div className="font-medium text-sm">{details?.scheduling_notes || '—'}</div>
                </div>
              </div>
            </div>

            {/* Committee Table */}
            <div className="rounded-lg border p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" /> Committee
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
                  { key: 'chairperson', info: memberFor(details?.defense_chairperson, 'Panel Chair') },
                  { key: 'panelist1', info: memberFor(details?.defense_panelist1, 'Panel Member 1') },
                  { key: 'panelist2', info: memberFor(details?.defense_panelist2, 'Panel Member 2') },
                  { key: 'panelist3', info: memberFor(details?.defense_panelist3, 'Panel Member 3') },
                  { key: 'panelist4', info: memberFor(details?.defense_panelist4, 'Panel Member 4') },
                ].map(r => {
                  const namePresent = !!(r.info.rawValue || (r.info.displayName && r.info.displayName !== '—'));
                  const receivable = namePresent ? getMemberReceivable(r.info.role) : null;

                  return {
                    name: r.info.displayName,
                    email: r.info.email || '—',
                    role: r.info.role,
                    receivable,
                  };
                });

                const formatCurrency = (v: number | null) =>
                  v !== null
                    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v)
                    : '—';

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
                {/* Reference No. as plain text if present */}
                {details?.reference_no && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Reference No.</span>
                    <span className="ml-auto text-xs">{details.reference_no}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Workflow Progress Stepper sidebar */}
          <div className="w-full md:w-[340px] flex-shrink-0">
            <div className="rounded-xl border p-5 bg-white dark:bg-zinc-900 sticky top-24 h-fit">
              <h2 className="text-xs font-semibold mb-8 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Workflow Progress
              </h2>
              {/* Stepper */}
              <div className="flex flex-col gap-0 relative">
                {Array.isArray(details?.workflow_history) && details.workflow_history.length > 0 ? (
                  details.workflow_history.map((item: any, idx: number) => {
                    const { event, created, userName } = resolveHistoryFields(item);
                    const stepKey = getStepForEvent(event);
                    const step = workflowSteps.find(s => s.key === stepKey) || {
                      label: event.charAt(0).toUpperCase() + event.slice(1),
                      icon: <Clock className="h-5 w-5 text-gray-500" />,
                    };
                    const isLast = Array.isArray(details.workflow_history) && idx === details.workflow_history.length - 1;
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
                          {/* Show comment for invalid payments */}
                          {item.comment && stepKey === 'payment-invalid' && (
                            <div className="mt-2 text-[11px] p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
                              <strong>Reason:</strong> {item.comment}
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
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, title: '', description: '', action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.action) {
                  confirmDialog.action();
                }
              }}
              disabled={isUpdating}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invalid Comment Dialog */}
      <Dialog open={invalidCommentDialog.open} onOpenChange={(open) => setInvalidCommentDialog({ ...invalidCommentDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment as Invalid</DialogTitle>
            <DialogDescription>
              Please provide a reason for marking this payment as invalid. This will be recorded in the workflow history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter reason for marking as invalid..."
              value={invalidCommentDialog.comment}
              onChange={(e) => setInvalidCommentDialog({ ...invalidCommentDialog, comment: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvalidCommentDialog({ open: false, comment: '' })}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkInvalid}
              disabled={isUpdating || !invalidCommentDialog.comment.trim()}
              variant="destructive"
            >
              Mark as Invalid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}