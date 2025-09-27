import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { ChevronDown, GraduationCap, Hourglass, Check, X, Eye, CheckCircle, Users, Calendar, Paperclip, MoreVertical, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import SubmitDefenseRequirements from './submit-defense-requirements';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info as InfoIcon } from "lucide-react";

dayjs.extend(relativeTime);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requirements', href: '/defense-requirements' },
];

type DefenseRequirement = {
    id: number;
    first_name: string;
    last_name: string;
    thesis_title: string;
    adviser: string;
    status: string;
    reference_no: string;
    program: string;
    created_at?: string;
    workflow_state?: string;           // <-- added
    defense_chairperson?: string;      // optional (for row-only display)
    defense_panelist1?: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    scheduled_end_time?: string;
    formatted_time_range?: string;
    defense_venue?: string;
    defense_mode?: string;
};

type DefenseRequest = {
    id: number;
    thesis_title: string;
    school_id: string;
    status: string;
    defense_adviser:string;
    workflow_state: string;
    workflow_state_display?: string;
    date_of_defense?: string;
    mode_defense?: string;
    chairperson?: string;
    panel_members?: string[];
    defense_chairperson?: string;
    defense_panelist1?: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    scheduled_end_time?: string;
    formatted_time_range?: string;
    defense_venue?: string;
    defense_mode?: string;
    adviser_comments?: string;
    coordinator_comments?: string;
    manuscript_proposal?: string;
    similarity_index?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    submitted_by?: string;
    panels_assigned_at?: string; // <-- Added missing property
    scheduling_notes?: string; // <-- Added missing property
};

type PageProps = {
    auth: {
        user: {
            role: string;
            school_id: string;
        };
    };
    defenseRequirements?: DefenseRequirement[];
    defenseRequest?: DefenseRequest | null;
    acceptDefense?: boolean; // <-- added
};

export default function DefenseRequestIndex() {
    const { props } = usePage<PageProps>();
    const { defenseRequirements = [], defenseRequest: initialDefenseRequest, acceptDefense = true } = props; // <-- get acceptDefense

    const [showClosedAlert, setShowClosedAlert] = useState(!acceptDefense);

    const [defenseRequest, setDefenseRequest] = useState<DefenseRequest | null>(initialDefenseRequest || null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>(dayjs().format('h:mm A'));
    const [loading, setLoading] = useState(false); // Add this state

    // Terminal workflow states where student may start a new submission
    const TERMINAL_WORKFLOW_STATES = new Set([
        'cancelled',
        'adviser-rejected',
        'coordinator-rejected',
        'completed'
    ]);

    // Active workflow exists if we have a defenseRequest and it is NOT terminal
    const hasActiveWorkflow =
        !!defenseRequest &&
        !TERMINAL_WORKFLOW_STATES.has(
            (defenseRequest.workflow_state || '').toLowerCase()
        );

    const [open, setOpen] = useState(false);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);

    // Unsubmit dialog states
    const [unsubmitDialogOpen, setUnsubmitDialogOpen] = useState(false);
    const [unsubmitReason, setUnsubmitReason] = useState('');
    const [unsubmitOtherReason, setUnsubmitOtherReason] = useState('');
    const [unsubmitTargetId, setUnsubmitTargetId] = useState<number | null>(null);
    const [processingUnsubmit, setProcessingUnsubmit] = useState(false);

    const [openItemId, setOpenItemId] = useState<number | null>(null);

    // Canonical ordered states for stepper
    const STATE_ORDER = [
        'submitted',
        'adviser-approved',         // (adviser done; coordinator may review)
        'coordinator-approved',
        'panels-assigned',
        'scheduled',
        'completed'
    ] as const;

    type CanonicalState = typeof STATE_ORDER[number];

    // Normalize any raw workflow_state to one of the canonical states (or fallback)
    function normalizeWorkflowState(raw?: string | null): CanonicalState | null {
        if (!raw) return null;
        const r = raw.toLowerCase();

        if (r === 'submitted' || r === 'adviser-review') return 'submitted';
        if (r === 'adviser-approved' || r === 'coordinator-review') return 'adviser-approved';
        if (r === 'coordinator-approved') return 'coordinator-approved';
        if (r === 'panels-assigned' || r === 'panel-assigned') return 'panels-assigned';
        if (r === 'scheduled') return 'scheduled';
        if (r === 'completed') return 'completed';
        return null;
    }

    function currentStepperIndex(dr: DefenseRequest | null): number {
        if (!dr) return 0;
        // If panels already assigned but state not yet updated
        if (dr.panels_assigned_at && !['panels-assigned','scheduled','completed'].includes(dr.workflow_state || '')) {
            return STATE_ORDER.indexOf('panels-assigned');
        }
        const norm = normalizeWorkflowState(dr.workflow_state);
        if (!norm) return 0;
        return STATE_ORDER.indexOf(norm);
    }

    useEffect(() => {
        if (!defenseRequest) return;
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/defense-request/${defenseRequest.id}`);
                if (response.ok) {
                    const updatedRequest = await response.json();
                    if (updatedRequest.workflow_state !== defenseRequest.workflow_state) {
                        setDefenseRequest(updatedRequest);
                        setLastUpdateTime(dayjs().format('h:mm A'));
                        console.log('Defense request status updated:', updatedRequest.workflow_state);
                    }
                    // --- ADDED: Check for rejection states ---
                    if (['adviser-rejected','coordinator-rejected'].includes(updatedRequest.workflow_state)) {
                        // reflect rejection in requirements list
                        const newList = defenseRequirements.map(r =>
                            r.thesis_title === updatedRequest.thesis_title
                                ? { ...r, status: 'Rejected' }
                                : r
                        );
                        // Only update if changed
                        // setDefenseRequirements state (create one if not present)
                    }
                }
            } catch (error) {
                console.error('Failed to poll defense request updates:', error);
            }
        }, 10000);
        return () => clearInterval(pollInterval);
    }, [defenseRequest?.id, defenseRequest?.workflow_state]);

    function handleSuccess() {
        setShowSuccessPanel(true);
    }

    function handleDialogClose() {
        setOpen(false);
        setShowSuccessPanel(false);
    }

    // Helper to check if unsubmit is allowed for a requirement
    function canUnsubmit(req: DefenseRequirement, dr: DefenseRequest | null) {
        if (!dr) return req.status?.toLowerCase() === 'pending';
        const allowedStates = ['pending', 'submitted', 'adviser-review'];
        // Disable if cancelled
        if (
            req.status?.toLowerCase() === 'cancelled' ||
            (dr.thesis_title === req.thesis_title && dr.workflow_state === 'cancelled')
        ) return false;
        return (
            req.status?.toLowerCase() === 'pending' ||
            (dr.thesis_title === req.thesis_title &&
                allowedStates.includes(dr.workflow_state))
        );
    }

    // --- Status mapping ---
    const statusDetails: Record<
        string,
        {
            title: string;
            description: string;
            color: string;
            icon: React.ReactNode;
            bg: string;
        }
    > = {
        pending: {
            title: 'Pending Review',
            description:
                'Your submission will be reviewed by your Adviser shortly. You will be notified once your requirements have been verified and the endorsement has been made.',
            color: 'text-muted-foreground',
            icon: <Hourglass className="h-4 w-4 opacity-60" />,
            bg: 'bg-secondary',
        },
        approved: {
            title: 'Approved',
            description:
                'Your defense requirements have been approved. Please wait for further instructions regarding your defense schedule.',
            color: 'text-green-600',
            icon: <Check className="h-4 w-4 text-green-600" />,
            bg: 'bg-green-50',
        },
        rejected: {
            title: 'Rejected',
            description:
                'Your defense requirements have been rejected. Please review the feedback and resubmit your documents.',
            color: 'text-rose-600',
            icon: <X className="h-4 w-4 text-rose-600" />,
            bg: 'bg-rose-50',
        },
        cancelled: {
            title: 'Cancelled',
            description:
                'This defense requirement submission was cancelled by you. If you wish to resubmit, please start a new submission.',
            color: 'text-red-600',
            icon: <X className="h-4 w-4 text-red-600" />,
            bg: 'bg-red-50',
        },
    };

    function getProgressAndDetails(req: DefenseRequirement) {
        // If global defenseRequest does not correspond to this row, but row itself has terminal/completed state,
        // use the row's own workflow_state to render status.
        const rowState = (req.workflow_state || '').toLowerCase();

        // Row-level completed (when not the active defenseRequest object)
        if ((!defenseRequest || defenseRequest.thesis_title !== req.thesis_title) && rowState === 'completed') {
            return {
                progress: 100,
                title: 'Defense Completed',
                description: '🎓 Congratulations! Your defense has been completed successfully.',
                color: 'text-green-600',
                icon: <GraduationCap className="h-4 w-4 text-green-600" />,
                bg: 'bg-green-50',
                progressColor: 'bg-green-500'
            };
        }

        // Row-level scheduled (fallback display if not active object)
        if ((!defenseRequest || defenseRequest.thesis_title !== req.thesis_title) && rowState === 'scheduled') {
            return {
                progress: 100,
                title: 'Defense Scheduled',
                description: 'Your defense has been scheduled. Prepare your presentation.',
                color: 'text-green-600',
                icon: <Calendar className="h-4 w-4 text-green-600" />,
                bg: 'bg-green-50',
                progressColor: 'bg-green-500'
            };
        }

        // Row-level adviser/coordinator rejection fallback
        if ((!defenseRequest || defenseRequest.thesis_title !== req.thesis_title) && ['adviser-rejected','coordinator-rejected'].includes(rowState)) {
            return {
                progress: 100,
                title: rowState === 'adviser-rejected' ? 'Rejected by Adviser' : 'Rejected by Coordinator',
                description: 'This defense request was rejected. You may submit a new one after addressing feedback.',
                color: 'text-red-600',
                icon: <X className="h-4 w-4 text-red-600" />,
                bg: 'bg-red-50',
                progressColor: 'bg-red-500'
            };
        }

        let progress = 0;
        let title = "Submitted";
        let description = "Your defense requirements have been submitted and are awaiting review.";
        let color = "text-muted-foreground";
        let icon = <Hourglass className="h-4 w-4 opacity-60" />;
        let bg = "bg-secondary";
        let progressColor = "bg-blue-500";

        // If there is a matching defenseRequest, use workflow_state for accurate tracking
        if (
            defenseRequest &&
            defenseRequest.thesis_title === req.thesis_title &&
            defenseRequest.school_id === props.auth.user.school_id
        ) {
            const workflowState = defenseRequest.workflow_state;
            
            switch (workflowState) {
                case 'submitted':
                case 'adviser-review':
                    progress = 20;
                    title = "Under Adviser Review";
                    description = "Your defense requirements are currently being <b>reviewed by your Adviser</b>. You will be notified once the review is complete.";
                    color = "text-blue-600";
                    icon = <Eye className="h-4 w-4 text-blue-600" />;
                    bg = "bg-blue-50";
                    progressColor = "bg-blue-500";
                    break;
                    
                case 'adviser-approved':
                case 'coordinator-review':
                    progress = 50;
                    title = "Approved by Adviser - Under Coordinator Review";
                    description = "Great! Your adviser has <b>approved</b> your defense requirements. The request is now being <b>reviewed by the Coordinator</b> for final approval and scheduling.";
                    color = "text-orange-600";
                    icon = <CheckCircle className="h-4 w-4 text-orange-600" />;
                    bg = "bg-orange-50";
                    progressColor = "bg-orange-500";
                    break;
                    
                case 'coordinator-approved':
                    progress = 75;
                    title = "Approved - Panel Assignment in Progress";
                    description = "Excellent! Your defense request has been <b>approved by the Coordinator</b>. Defense panel members are currently being assigned.";
                    color = "text-green-600";
                    icon = <Users className="h-4 w-4 text-green-600" />;
                    bg = "bg-green-50";
                    progressColor = "bg-green-500";
                    break;
                    
                case 'scheduled':
                    progress = 100;
                    title = "Defense Scheduled";
                    
                    // Get panel information
                    const chairperson = defenseRequest.defense_chairperson || "Chairperson not assigned";
                    const panelists = [
                        defenseRequest.defense_panelist1,
                        defenseRequest.defense_panelist2,
                        defenseRequest.defense_panelist3,
                        defenseRequest.defense_panelist4,
                    ].filter(Boolean);

                    const panelistText = panelists.length
                        ? panelists.map((name, idx) => `<br/>• <b>${name}</b> (Panelist ${idx + 1})`).join("")
                        : "<br/>• Panel members not yet assigned.";

                    // Format schedule information
                    let scheduleInfo = "";
                    if (defenseRequest.scheduled_date && defenseRequest.formatted_time_range) {
                        const scheduleDate = dayjs(defenseRequest.scheduled_date).format("MMMM D, YYYY");
                        scheduleInfo = `<br/><br/><div class="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <h4 class="font-semibold text-blue-800 mb-2">📅 Defense Schedule</h4>
                            <p><b>Date:</b> ${scheduleDate}</p>
                            <p><b>Time:</b> ${defenseRequest.formatted_time_range}</p>
                            ${defenseRequest.defense_venue ? `<p><b>Venue:</b> ${defenseRequest.defense_venue}</p>` : ''}
                            ${defenseRequest.defense_mode ? `<p><b>Mode:</b> ${defenseRequest.defense_mode}</p>` : ''}
                        </div>`;
                    } else if (defenseRequest.date_of_defense) {
                        // Fallback to old date field
                        const scheduleDate = dayjs(defenseRequest.date_of_defense).format("MMMM D, YYYY");
                        scheduleInfo = `<br/><br/><div class="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <h4 class="font-semibold text-blue-800 mb-2">📅 Defense Schedule</h4>
                            <p><b>Date:</b> ${scheduleDate}</p>
                            <p><em>Time and venue details will be announced soon.</em></p>
                        </div>`;
                    }

                    description = `🎉 <b>Congratulations!</b> Your defense has been fully scheduled and approved. 
                        <br/><br/><h4 class="font-semibold text-green-800 mb-2">👥 Defense Panel</h4>
                        • <b>${chairperson}</b> (Chairperson)${panelistText}${scheduleInfo}
                        <br/><br/><p class="text-sm text-gray-600 mt-3">💡 <b>Next Steps:</b> Prepare your defense presentation and materials. You will receive email notifications with additional details.</p>`;
                    color = "text-green-600";
                    icon = <Calendar className="h-4 w-4 text-green-600" />;
                    bg = "bg-green-50";
                    progressColor = "bg-green-500";
                    break;
                    
                case 'adviser-rejected':
                    progress = 100;
                    title = "Rejected by Adviser";
                    description = `Your defense request has been <b>rejected by your Adviser</b>. 
                        ${defenseRequest.adviser_comments ? `<br/><br/><b>Feedback:</b> "${defenseRequest.adviser_comments}"` : ''}
                        <br/><br/>Please address the feedback and submit a new set of requirements if needed.`;
                    color = "text-red-600";
                    icon = <X className="h-4 w-4 text-red-600" />;
                    bg = "bg-red-50";
                    progressColor = "bg-red-500";
                    break;
                    
                case 'coordinator-rejected':
                    progress = 100;
                    title = "Rejected by Coordinator";
                    description = `Your defense request has been <b>rejected by the Coordinator</b>. 
                        ${defenseRequest.coordinator_comments ? `<br/><br/><b>Feedback:</b> "${defenseRequest.coordinator_comments}"` : ''}
                        <br/><br/>Please address the feedback and resubmit if allowed.`;
                    color = "text-red-600";
                    icon = <X className="h-4 w-4 text-red-600" />;
                    bg = "bg-red-50";
                    progressColor = "bg-red-500";
                    break;
                    
                case 'completed':
                    progress = 100;
                    title = "Defense Completed";
                    description = "🎓 Congratulations! Your defense has been completed successfully.";
                    color = "text-green-600";
                    icon = <GraduationCap className="h-4 w-4 text-green-600" />;
                    bg = "bg-green-50";
                    progressColor = "bg-green-500";
                    break;
                    
                default:
                    // Handle any other states
                    progress = 10;
                    title = "Processing";
                    description = "Your defense request is being processed. Current status: " + (defenseRequest.workflow_state_display || workflowState);
                    color = "text-gray-600";
                    icon = <Hourglass className="h-4 w-4 text-gray-600" />;
                    bg = "bg-gray-50";
                    progressColor = "bg-gray-500";
                    break;
            }
        }

        return { progress, title, description, color, icon, bg, progressColor };
    }

    // --- UI ---
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requirements" />
           
            {/* Skeleton Loader */}
            {loading ? (
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    {/* Top short row */}
                    <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    {/* Main rows */}
                    <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    {/* Big rectangle for dashboard body */}
                    <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            ) : (
                <div className="flex flex-col px-7 pt-5 pb-5 w-full">
                     {/* Alert if submissions are closed */}
            {!acceptDefense && showClosedAlert && (
                <Alert
                    className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-100 flex items-start gap-3 px-6 py-5 rounded-xl mb-4 relative"
                >
                    <InfoIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <AlertTitle className="font-semibold mb-1">Defense Requirement Submissions Closed</AlertTitle>
                        <AlertDescription>
                            The defense requirement submission period is currently closed. Please contact your coordinator for more information.
                        </AlertDescription>
                    </div>
                    <button
                        type="button"
                        className="absolute top-2 right-2 text-yellow-900 dark:text-yellow-100 hover:text-yellow-700 dark:hover:text-yellow-300 rounded p-1"
                        aria-label="Close"
                        onClick={() => setShowClosedAlert(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </Alert>
            )}
                    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <div className="flex flex-row items-center justify-between w-full p-3 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500 dark:border-rose-700">
                                    <GraduationCap className="h-5 w-5 text-rose-400 dark:text-rose-300" />
                                </div>
                                <div>
                                    <span className="text-base font-semibold dark:text-white">
                                        Defense Requirements
                                    </span>
                                    <p className="block text-xs text-muted-foreground dark:text-zinc-400">
                                        This sections shows all your submitted defense requirements and their current status.
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="bg-rose-500 text-sm px-5 rounded-md dark:bg-rose-600 disabled:opacity-60"
                                onClick={() => setOpen(true)}
                                disabled={hasActiveWorkflow || !acceptDefense} // <-- disable if closed
                                title={
                                    !acceptDefense
                                        ? 'Defense requirement submissions are currently closed.'
                                        : hasActiveWorkflow
                                            ? 'You already have an active defense workflow. Finish (or reach a terminal state) before submitting another.'
                                            : 'Submit new defense requirements'
                                }
                            >
                                Submit requirements
                            </Button>
                            <SubmitDefenseRequirements
                                open={open}
                                onOpenChange={setOpen}
                                onFinish={handleSuccess}
                                acceptDefense={acceptDefense} // <-- pass to child
                            />
                        </div>
                        {defenseRequirements.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground dark:text-zinc-400">
                                No defense requirements submitted yet.
                            </div>
                        ) : (
                            // Sort by created_at descending (most recent first)
                            [...defenseRequirements]
                                .sort((a, b) => {
                                    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                                    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                                    return bTime - aTime;
                                })
                                .map((req) => {
                                    const details = getProgressAndDetails(req);
                                    const isOpen = openItemId === req.id;
                                    const timeSubmitted = req.created_at
                                        ? dayjs(req.created_at).fromNow()
                                        : 'Unknown';

                                    // Stepper workflow states
                                    const workflowSteps = [
                                        { key: 'submitted',            label: 'Submitted',          icon: <Hourglass className="w-4 h-4" /> },
                                        { key: 'adviser-approved',     label: 'Adviser Approved',   icon: <CheckCircle className="w-4 h-4" /> },
                                        { key: 'coordinator-approved', label: 'Coordinator Approved', icon: <CheckCircle className="w-4 h-4" /> },
                                        { key: 'panels-assigned',      label: 'Panels Assigned',    icon: <Users className="w-4 h-4" /> },
                                        { key: 'scheduled',            label: 'Scheduled',          icon: <Calendar className="w-4 h-4" /> },
                                        { key: 'completed',            label: 'Completed',          icon: <GraduationCap className="w-4 h-4" /> },
                                    ] as
                                    
                                    const;

                                    const activeObjForRow =
                                        defenseRequest && defenseRequest.thesis_title === req.thesis_title
                                            ? defenseRequest
                                            : (req.workflow_state ? { workflow_state: req.workflow_state } as any : defenseRequest);

                                    const stepIdx = currentStepperIndex(activeObjForRow as any);

                                    const wf = defenseRequest?.workflow_state;
                                    const normState = defenseRequest ? normalizeWorkflowState(wf) : null;

                                    // --- NEW: rejection detection & data ---
                                    const isRejectedActive =
                                        !!defenseRequest &&
                                        defenseRequest.thesis_title === req.thesis_title &&
                                        ['adviser-rejected','coordinator-rejected'].includes(defenseRequest.workflow_state || '');

                                    const rejectionByCoordinator = isRejectedActive && defenseRequest?.workflow_state === 'coordinator-rejected';
                                    const rejectionByAdviser     = isRejectedActive && defenseRequest?.workflow_state === 'adviser-rejected';

                                    const rejectionComment = rejectionByCoordinator
                                        ? defenseRequest?.coordinator_comments
                                        : rejectionByAdviser
                                            ? defenseRequest?.adviser_comments
                                            : null;

                                    const rejectionHeaderTitle = rejectionByCoordinator
                                        ? 'Rejected by Coordinator'
                                        : rejectionByAdviser
                                            ? 'Rejected by Adviser'
                                            : 'Rejected';

                                    // Existing cancellation logic
                                    const isCancelled =
                                        req.status?.toLowerCase() === 'cancelled' ||
                                        (defenseRequest &&
                                            defenseRequest.thesis_title === req.thesis_title &&
                                            defenseRequest.workflow_state === 'cancelled');

                                    // Completed (active or row-level)
                                    const rowStateRaw = (req.workflow_state || '').toLowerCase();
                                    const isCompletedRow =
                                        (defenseRequest &&
                                          defenseRequest.thesis_title === req.thesis_title &&
                                          defenseRequest.workflow_state === 'completed') ||
                                        rowStateRaw === 'completed';

                                    let currentIdx = 0;
                                    let headerTitle = "Submitted";
                                    let headerIcon = <Hourglass className="h-4 w-4 opacity-60 dark:text-zinc-400" />;
                                    let headerColor = "text-muted-foreground dark:text-zinc-300";
                                    let detailsTitle = "Submitted";
                                    let detailsDescription = "Your defense requirements have been submitted and are awaiting review.";
                                    let detailsBg = "bg-secondary";
                                    let detailsPanelists: { role: string, name: string }[] = [];

                                    // Row-level (non-active) state fallback so old completed/scheduled requests show correct header
                                    const isActiveRow =
                                        defenseRequest &&
                                        defenseRequest.thesis_title === req.thesis_title &&
                                        defenseRequest.school_id === props.auth.user.school_id;

                                    const rowState = (req.workflow_state || '').toLowerCase();

                                    if (!isActiveRow && rowState) {
                                        switch (rowState) {
                                            case 'completed':
                                                currentIdx = workflowSteps.length - 1;
                                                headerTitle = "Defense Completed";
                                                headerIcon = <GraduationCap className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Defense Completed";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "🎓 Congratulations! Your defense has been completed successfully.";
                                                break;
                                            case 'scheduled':
                                                currentIdx = workflowSteps.findIndex(s => s.key === 'scheduled');
                                                headerTitle = "Defense Scheduled";
                                                headerIcon = <Calendar className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Defense Scheduled";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "Your defense has been scheduled. Prepare your presentation.";
                                                break;
                                            case 'panels-assigned':
                                                currentIdx = workflowSteps.findIndex(s => s.key === 'panels-assigned');
                                                headerTitle = "Panels Assigned";
                                                headerIcon = <Users className="h-4 w-4 text-orange-600" />;
                                                headerColor = "text-orange-600";
                                                detailsTitle = "Panels Assigned";
                                                detailsBg = "bg-orange-50";
                                                detailsDescription = "Panel members have been assigned. Awaiting scheduling.";
                                                break;
                                            case 'coordinator-approved':
                                                currentIdx = workflowSteps.findIndex(s => s.key === 'coordinator-approved');
                                                headerTitle = "Coordinator Approved";
                                                headerIcon = <CheckCircle className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Coordinator Approved";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "Approved by Coordinator. Panel assignment in progress.";
                                                break;
                                            case 'adviser-approved':
                                                currentIdx = workflowSteps.findIndex(s => s.key === 'adviser-approved');
                                                headerTitle = "Adviser Approved";
                                                headerIcon = <CheckCircle className="h-4 w-4 text-orange-600" />;
                                                headerColor = "text-orange-600";
                                                detailsTitle = "Adviser Approved";
                                                detailsBg = "bg-orange-50";
                                                detailsDescription = "Approved by Adviser. Awaiting Coordinator review.";
                                                break;
                                            case 'adviser-rejected':
                                            case 'coordinator-rejected':
                                                currentIdx = 0;
                                                headerTitle = rowState === 'adviser-rejected' ? "Rejected by Adviser" : "Rejected by Coordinator";
                                                headerIcon = <X className="h-4 w-4 text-red-600" />;
                                                headerColor = "text-red-600";
                                                detailsTitle = headerTitle;
                                                detailsBg = "bg-red-50";
                                                detailsDescription = "This defense request was rejected. You may submit a new one after addressing feedback.";
                                                break;
                                            // submitted or anything else leave defaults
                                        }
                                    }

                                    if (isCancelled) {
                                        currentIdx = 0;
                                        headerTitle = "Cancelled";
                                        headerIcon = <X className="h-4 w-4 text-red-600" />;
                                        headerColor = "text-red-600";
                                        detailsTitle = "Cancelled";
                                        detailsBg = "bg-red-50";
                                        detailsDescription = "This submission was cancelled. You cannot make further changes to this request.";
                                    } else if (isRejectedActive) {
                                        // Rejected layout (similar style to cancelled but distinct explanation)
                                        currentIdx = 0;
                                        headerTitle = rejectionHeaderTitle;
                                        headerIcon = <X className="h-4 w-4 text-red-600" />;
                                        headerColor = "text-red-600";
                                        detailsTitle = rejectionHeaderTitle;
                                        detailsBg = "bg-red-50";
                                        detailsDescription = `
                                            <div class="space-y-2">
                                                <div>Your defense request has been <b>${rejectionHeaderTitle.toLowerCase()}</b>.</div>
                                                ${
                                                    rejectionComment
                                                        ? `<div class="text-sm"><b>Feedback:</b> "${rejectionComment}"</div>`
                                                        : ''
                                                }
                                                <div class="text-xs text-muted-foreground">
                                                    Please address the feedback and, if allowed, submit a new set of requirements or updated documents.
                                                </div>
                                            </div>`;
                                    } else if (defenseRequest &&
                                               defenseRequest.thesis_title === req.thesis_title &&
                                               defenseRequest.school_id === props.auth.user.school_id) {
                                        // Normal progression
                                        switch (normState) {
                                            case 'submitted':
                                                currentIdx = 0;
                                                headerTitle = "Under Adviser Review";
                                                headerIcon = <Eye className="h-4 w-4 text-blue-600" />;
                                                headerColor = "text-blue-600";
                                                detailsTitle = "Under Adviser Review";
                                                detailsBg = "bg-blue-50";
                                                detailsDescription = "Your defense requirements are being reviewed by your Adviser.";
                                                break;
                                            case 'adviser-approved':
                                                currentIdx = 1;
                                                headerTitle = "Adviser Approved";
                                                headerIcon = <CheckCircle className="h-4 w-4 text-orange-600" />;
                                                headerColor = "text-orange-600";
                                                detailsTitle = "Adviser Approved";
                                                detailsBg = "bg-orange-50";
                                                detailsDescription = "Approved by Adviser. Awaiting Coordinator review.";
                                                break;
                                            case 'coordinator-approved':
                                                currentIdx = 2;
                                                headerTitle = "Coordinator Approved";
                                                headerIcon = <CheckCircle className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Coordinator Approved";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "Approved by Coordinator. Panel assignment in progress.";
                                                break;
                                            case 'panels-assigned':
                                                currentIdx = 3;
                                                headerTitle = "Panels Assigned";
                                                headerIcon = <Users className="h-4 w-4 text-orange-600" />;
                                                headerColor = "text-orange-600";
                                                detailsTitle = "Panels Assigned";
                                                detailsBg = "bg-orange-50";
                                                detailsDescription = "Panel members have been assigned. Awaiting scheduling.";
                                                break;
                                            case 'scheduled':
                                                currentIdx = 4;
                                                headerTitle = "Defense Scheduled";
                                                headerIcon = <Calendar className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Defense Scheduled";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "Your defense has been scheduled. Prepare your presentation.";
                                                break;
                                            case 'completed':
                                                currentIdx = 5;
                                                headerTitle = "Defense Completed";
                                                headerIcon = <GraduationCap className="h-4 w-4 text-green-600" />;
                                                headerColor = "text-green-600";
                                                detailsTitle = "Defense Completed";
                                                detailsBg = "bg-green-50";
                                                detailsDescription = "🎓 Congratulations! Your defense has been completed successfully.";
                                                break;
                                            default:
                                                currentIdx = 0;
                                                headerTitle = "Processing";
                                                headerIcon = <Hourglass className="h-4 w-4 text-gray-600" />;
                                                headerColor = "text-gray-600";
                                                detailsTitle = "Processing";
                                                detailsBg = "bg-gray-50";
                                                detailsDescription = "Your defense request is being processed.";
                                        }

                                        if (!isCancelled &&
                                            defenseRequest?.panels_assigned_at &&
                                            currentIdx < 3) {
                                            currentIdx = 3;
                                            headerTitle = "Panels Assigned";
                                            headerIcon = <Users className="h-4 w-4 text-orange-600" />;
                                            headerColor = "text-orange-600";
                                            detailsTitle = "Panels Assigned";
                                            detailsBg = "bg-orange-50";
                                            detailsDescription = "Panel members have been assigned (state update pending).";
                                        }
                                    }

                                    // --- Replace stepper if rejected or cancelled ---
                                    const showStepper = !isCancelled && !isRejectedActive && !isCompletedRow;

                                    return (
                                        <React.Fragment key={req.id}>
                                            <div className="border-b border-zinc-200 dark:border-zinc-800 w-full" />
                                            <Collapsible open={isOpen} onOpenChange={(open) => setOpenItemId(open ? req.id : null)}>
                                                <CollapsibleTrigger asChild>
                                                    <div
                                                        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <ChevronDown
                                                            className={`transition-transform duration-200 h-4 w-4 text-muted-foreground dark:text-zinc-400 mr-3 ${isOpen ? 'rotate-180' : ''}`}
                                                        />
                                                        <div className="flex items-center gap-2 flex-1">
                                                            { (isCancelled || isRejectedActive)
                                                                ? <X className="h-4 w-4 text-red-600" />
                                                                : isCompletedRow
                                                                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                                                                    : React.cloneElement(headerIcon, { className: "h-4 w-4 text-muted-foreground dark:text-zinc-300" })
                                                            }
                                                             <span className={`font-semibold text-xs ${
                                                                (isCancelled || isRejectedActive)
                                                                    ? "text-red-600"
                                                                    : isCompletedRow
                                                                        ? "text-green-600"
                                                                        : "text-muted-foreground dark:text-zinc-300"
                                                             }`}>
                                                                 {headerTitle}
                                                             </span>
                                                        </div>
                                                        <div className="flex items-center w-64 justify-end">
                                                            {showStepper ? (
                                                                <>
                                                                    <div className="flex-1" />
                                                                    <div className="flex items-center gap-0">
                                                                        {workflowSteps.map((step, idx) => {
                                                                            const isActive = idx <= stepIdx;
                                                                            const stepBg = isActive
                                                                                ? 'bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-700'
                                                                                : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700';
                                                                            return (
                                                                                <React.Fragment key={step.key}>
                                                                                    <div className="flex items-center justify-center">
                                                                                        <div className={`rounded-full p-1 border ${stepBg}`}>
                                                                                            {step.icon}
                                                                                        </div>
                                                                                    </div>
                                                                                    {idx < workflowSteps.length - 1 && (
                                                                                        <div className={`h-1 w-6 ${idx < stepIdx ? 'bg-rose-500 dark:bg-rose-700' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center justify-center">
                                                                    {isCompletedRow ? (
                                                                        <div className="rounded-full p-2 border bg-green-500 text-white border-green-500">
                                                                            <Check className="w-4 h-4" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-full p-2 border bg-red-500 text-white border-red-500">
                                                                            <X className="w-4 h-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="px-4 py-3">
                                                        {/* Submission Info Section (unchanged except header state already handled) */}
                                                        <div className="mb-3 p-3 rounded border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 rounded-md relative">
                                                            <div className="flex flex-row gap-6 flex-wrap">
                                                                <div>
                                                                    <span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Thesis Title:</span>
                                                                    <div className="text-sm font-medium text-zinc-800 dark:text-white">{req.thesis_title}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Student Name:</span>
                                                                    <div className="text-sm text-zinc-800 dark:text-white">{req.first_name} {req.last_name}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Adviser:</span>
                                                                    <div className="text-sm text-zinc-800 dark:text-white">
                                                                        {
                                                                            defenseRequest &&
                                                                            defenseRequest.thesis_title === req.thesis_title &&
                                                                            defenseRequest.defense_adviser
                                                                                ? defenseRequest.defense_adviser
                                                                                : req.adviser || '—'
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Attachments */}
                                                            <div className="flex flex-row gap-2 mt-2 flex-wrap">
                                                                {defenseRequest?.manuscript_proposal && (
                                                                    <a
                                                                        href={defenseRequest.manuscript_proposal}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 min-w-[120px] max-w-[180px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition truncate"
                                                                        style={{ textDecoration: 'none' }}
                                                                    >
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-lg border border-rose-500 dark:border-rose-700 bg-rose-500 dark:bg-rose-600">
                                                                            <Paperclip className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-medium text-xs leading-tight truncate max-w-[100px] dark:text-white">Manuscript</span>
                                                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate max-w-[100px]">
                                                                                {defenseRequest.manuscript_proposal.split('/').pop()}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                                {defenseRequest?.similarity_index && (
                                                                    <a
                                                                        href={defenseRequest.similarity_index}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 min-w-[120px] max-w-[180px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition truncate"
                                                                        style={{ textDecoration: 'none' }}
                                                                    >
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-lg border border-rose-500 dark:border-rose-700 bg-rose-500 dark:bg-rose-600">
                                                                            <Paperclip className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-medium text-xs leading-tight truncate max-w-[100px] dark:text-white">Similarity</span>
                                                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate max-w-[100px]">
                                                                                {defenseRequest.similarity_index.split('/').pop()}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                                {defenseRequest?.rec_endorsement && (
                                                                    <a
                                                                        href={defenseRequest.rec_endorsement}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 min-w-[120px] max-w-[180px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition truncate"
                                                                        style={{ textDecoration: 'none' }}
                                                                    >
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-lg border border-rose-500 dark:border-rose-700 bg-rose-500 dark:bg-rose-600">
                                                                            <Paperclip className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-medium text-xs leading-tight truncate max-w-[100px] dark:text-white">Endorsement</span>
                                                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate max-w-[100px]">
                                                                                {defenseRequest.rec_endorsement.split('/').pop()}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                                {defenseRequest?.proof_of_payment && (
                                                                    <a
                                                                        href={defenseRequest.proof_of_payment}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 min-w-[120px] max-w-[180px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition truncate"
                                                                        style={{ textDecoration: 'none' }}
                                                                    >
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-lg border border-rose-500 dark:border-rose-700 bg-rose-500 dark:bg-rose-600">
                                                                            <Paperclip className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-medium text-xs leading-tight truncate max-w-[100px] dark:text-white">Payment</span>
                                                                            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate max-w-[100px]">
                                                                                {defenseRequest.proof_of_payment.split('/').pop()}
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {/* Defense Information (dynamic) */}
                                                            {defenseRequest &&
                                                             defenseRequest.thesis_title === req.thesis_title && (
                                                                <div className="mt-2 w-full border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-zinc-50 dark:bg-zinc-800/40">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                                                                            <Info className="w-3 h-3 text-rose-500" /> Defense Information
                                                                        </span>
                                                                        <span className="text-[10px] text-muted-foreground dark:text-zinc-400">
                                                                            State: {defenseRequest.workflow_state}
                                                                        </span>
                                                                    </div>

                                                                    {(() => {
                                                                        const wf = defenseRequest.workflow_state;
                                                                        const chair = defenseRequest.defense_chairperson;
                                                                        const p1 = defenseRequest.defense_panelist1;
                                                                        const p2 = defenseRequest.defense_panelist2;
                                                                        const p3 = defenseRequest.defense_panelist3;
                                                                        const p4 = defenseRequest.defense_panelist4;
                                                                        const anyPanels = [chair,p1,p2,p3,p4].some(Boolean);

                                                                        const scheduleDate = defenseRequest.scheduled_date
                                                                            ? dayjs(defenseRequest.scheduled_date).format("MMMM D, YYYY")
                                                                            : null;

                                                                        const timeRange = defenseRequest.formatted_time_range
                                                                            ? defenseRequest.formatted_time_range
                                                                            : (defenseRequest.scheduled_time && defenseRequest.scheduled_end_time
                                                                                ? `${defenseRequest.scheduled_time} - ${defenseRequest.scheduled_end_time}`
                                                                                : null);

                                                                        const mode = defenseRequest.defense_mode || defenseRequest.mode_defense;
                                                                        const venue = defenseRequest.defense_venue;
                                                                        const notes = defenseRequest.scheduling_notes;

                                                                        // Message helpers
                                                                        const awaitingAdviser = (
                                                                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                                                Awaiting adviser review. No coordinator actions yet.
                                                                            </div>
                                                                        );
                                                                        const awaitingCoordinator = (
                                                                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                                                Adviser approved. Awaiting coordinator review / panel assignment.
                                                                            </div>
                                                                        );
                                                                        const awaitingPanels = (
                                                                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                                                Coordinator approved. Panel assignment pending.
                                                                            </div>
                                                                        );
                                                                        const awaitingSchedule = (
                                                                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                                                                Panel assigned. Scheduling in progress.
                                                                            </div>
                                                                        );

                                                                        if (['adviser-rejected','coordinator-rejected','cancelled'].includes(wf)) {
                                                                            return (
                                                                                <div className="text-[11px] text-red-600">
                                                                                    No further defense information (request {wf.replace('-',' ')}).
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <div className="space-y-3">
                                                                                {/* Panels */}
                                                                                {['panels-assigned','scheduled','completed'].includes(wf) && anyPanels && (
                                                                                    <div>
                                                                                        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                                                            Committee
                                                                                        </div>
                                                                                        <ul className="pl-3 list-disc space-y-0.5">
                                                                                            {chair && <li className="text-[11px] text-zinc-700 dark:text-zinc-300"><b>{chair}</b> (Chairperson)</li>}
                                                                                            {p1 && <li className="text-[11px] text-zinc-700 dark:text-zinc-300">{p1} (Panelist 1)</li>}
                                                                                            {p2 && <li className="text-[11px] text-zinc-700 dark:text-zinc-300">{p2} (Panelist 2)</li>}
                                                                                            {p3 && <li className="text-[11px] text-zinc-700 dark:text-zinc-300">{p3} (Panelist 3)</li>}
                                                                                            {p4 && <li className="text-[11px] text-zinc-700 dark:text-zinc-300">{p4} (Panelist 4)</li>}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}

                                                                                {/* Schedule (only when scheduled or completed) */}
                                                                                {['scheduled','completed'].includes(wf) && (
                                                                                    <div className="rounded-md border border-blue-200 dark:border-blue-600/40 bg-blue-50 dark:bg-blue-900/20 p-2.5">
                                                                                        <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                                                                            Schedule
                                                                                        </div>
                                                                                        <div className="space-y-0.5">
                                                                                            <div className="text-[11px] text-blue-800 dark:text-blue-200">
                                                                                                <b>Date:</b> {scheduleDate || 'TBD'}
                                                                                            </div>
                                                                                            <div className="text-[11px] text-blue-800 dark:text-blue-200">
                                                                                                <b>Time:</b> {timeRange || 'TBD'}
                                                                                            </div>
                                                                                            {mode && (
                                                                                                <div className="text-[11px] text-blue-800 dark:text-blue-200">
                                                                                                    <b>Mode:</b> {mode}
                                                                                                </div>
                                                                                            )}
                                                                                            {venue && (
                                                                                                <div className="text-[11px] text-blue-800 dark:text-blue-200">
                                                                                                    <b>Venue:</b> {venue}
                                                                                                </div>
                                                                                            )}
                                                                                            {notes && (
                                                                                                <div className="text-[11px] text-blue-800 dark:text-blue-200">
                                                                                                    <b>Notes:</b> {notes}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* State guidance (only if earlier states) */}
                                                                                {['submitted','adviser-review'].includes(wf) && awaitingAdviser}
                                                                                {['adviser-approved','coordinator-review'].includes(wf) && awaitingCoordinator}
                                                                                {wf === 'coordinator-approved' && !anyPanels && awaitingPanels}
                                                                                {wf === 'panels-assigned' && !scheduleDate && awaitingSchedule}

                                                                                {/* Quick summary line */}
                                                                                <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700 mt-2 text-[10px] text-muted-foreground dark:text-zinc-500">
                                                                                    Last workflow state: {wf}
                                                                                    {scheduleDate && ` • Scheduled for ${scheduleDate}`}
                                                                                    {mode && ` • Mode: ${mode}`}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                            {/* Submitted at info, top right */}
                                                            <div className="absolute right-3 top-2 flex items-center gap-2">
                                                                <span className="text-[10px] text-muted-foreground dark:text-zinc-400 whitespace-nowrap">
                                                                    Submitted {timeSubmitted}
                                                                </span>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            className="h-6 w-6 p-0"
                                                                            disabled={!!isCancelled}
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem
                                                                            disabled={!canUnsubmit(req, defenseRequest)}
                                                                            onSelect={(e) => {
                                                                                e.preventDefault();
                                                                                if (!canUnsubmit(req, defenseRequest)) return;
                                                                                setUnsubmitTargetId(req.id);
                                                                                setUnsubmitReason('');
                                                                                setUnsubmitOtherReason('');
                                                                                setUnsubmitDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            Unsubmit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem>
                                                                            {/* Example: View Details */}
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem>
                                                                            {/* Example: Download */}
                                                                            Download
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                        {/* REMOVE THIS SECTION:
                                                        <div className={`flex flex-col ${detailsBg} dark:bg-zinc-900 p-3 rounded-md`}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className={`font-semibold text-xs ${
                                                                    (isCancelled || isRejectedActive)
                                                                        ? "text-red-600"
                                                                        : "text-muted-foreground dark:text-zinc-300"
                                                                }`}>
                                                                    {detailsTitle}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className="text-xs p-2 text-muted-foreground dark:text-zinc-400 space-y-2"
                                                                dangerouslySetInnerHTML={{ __html: detailsDescription }}
                                                            />
                                                            <div className="flex flex-col items-end mt-4 gap-1">
                                                                {defenseRequest && (
                                                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-400 whitespace-nowrap">
                                                                        Last updated: {lastUpdateTime}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        */}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </React.Fragment>
                                    );
                                })
                        )}
                    </div>
                    <Dialog open={unsubmitDialogOpen} onOpenChange={setUnsubmitDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you sure?</DialogTitle>
                                <DialogDescription>
                                    Please select a reason for unsubmission.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <RadioGroup
                                    value={unsubmitReason}
                                    onValueChange={setUnsubmitReason}
                                >
                                    <div className="flex items-center gap-2 mt-2">
                                        <RadioGroupItem value="mistake" id="reason-mistake" />
                                        <label htmlFor="reason-mistake" className="text-sm">I made a mistake in filling up the forms</label>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <RadioGroupItem value="cancel" id="reason-cancel" />
                                        <label htmlFor="reason-cancel" className="text-sm">I'd like to just cancel the submission</label>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <RadioGroupItem value="outdated" id="reason-outdated" />
                                        <label htmlFor="reason-outdated" className="text-sm">The submission was outdated</label>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <RadioGroupItem value="other" id="reason-other" />
                                        <label htmlFor="reason-other" className="text-sm">Other...</label>
                                    </div>
                                </RadioGroup>
                                {unsubmitReason === 'other' && (
                                    <Input
                                        placeholder="Enter your reason"
                                        value={unsubmitOtherReason}
                                        onChange={e => setUnsubmitOtherReason(e.target.value)}
                                        className="text-sm"
                                    />
                                )}
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setUnsubmitDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        disabled={processingUnsubmit || !unsubmitReason || (unsubmitReason === 'other' && !unsubmitOtherReason)}
                                        onClick={async () => {
                                            setProcessingUnsubmit(true);
                                            try {
                                                const csrfToken =
                                                    (window as any).Laravel?.csrfToken ||
                                                    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                                                const res = await fetch(`/defense-requirements/${unsubmitTargetId}/unsubmit`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Accept': 'application/json',
                                                        'X-CSRF-TOKEN': csrfToken || '',
                                                    },
                                                    body: JSON.stringify({
                                                        reason: unsubmitReason === 'other' ? unsubmitOtherReason : unsubmitReason,
                                                        _token: csrfToken || '',
                                                    }),
                                                });

                                                if (res.ok) {
                                                    setUnsubmitDialogOpen(false);
                                                    window.location.reload();
                                                } else {
                                                    let data = {};
                                                    try {
                                                        data = await res.json();
                                                    } catch (e) {}
                                                    alert(
                                                        typeof data === 'object' && data !== null && 'message' in data
                                                            ? (data as { message?: string }).message
                                                            : 'Failed to unsubmit. You can only unsubmit requirements that are still pending or under adviser review.'
                                                    );
                                                }
                                            } catch (err) {
                                                alert('Network error. Please try again.');
                                            } finally {
                                                setProcessingUnsubmit(false);
                                            }
                                        }}
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </AppLayout>
    );
}
