import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { ChevronDown, GraduationCap, Hourglass, Check, X, Eye, CheckCircle, Users, Calendar } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    created_at?: string; // <-- add created_at field if not present
    // add other fields as needed
};

type DefenseRequest = {
    id: number;
    thesis_title: string;
    school_id: string;
    status: string;
    workflow_state: string;
    workflow_state_display?: string;
    date_of_defense?: string;
    mode_defense?: string;
    chairperson?: string; // <-- add this
    panel_members?: string[]; // <-- add this (array of names)
    defense_chairperson?: string;
    defense_panelist1?: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    // New scheduling fields
    scheduled_date?: string;
    scheduled_time?: string;
    scheduled_end_time?: string;
    formatted_time_range?: string;
    defense_venue?: string;
    defense_mode?: string;
    // Comments and feedback
    adviser_comments?: string;
    coordinator_comments?: string;
    // ...other fields
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
};

export default function DefenseRequestIndex() {
    const { props } = usePage<PageProps>();
    const { defenseRequirements = [], defenseRequest: initialDefenseRequest } = props;

    // State for real-time updates
    const [defenseRequest, setDefenseRequest] = useState<DefenseRequest | null>(initialDefenseRequest || null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>(dayjs().format('h:mm A'));

    // Check if there is a pending request
    const hasPending = defenseRequirements.some(
        (req) => req.status?.toLowerCase() === 'pending'
    );

    const [open, setOpen] = useState(false);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);

    // Real-time polling for defense request updates
    useEffect(() => {
        if (!defenseRequest) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/defense-request/${defenseRequest.id}`);
                if (response.ok) {
                    const updatedRequest = await response.json();
                    
                    // Check if workflow state changed
                    if (updatedRequest.workflow_state !== defenseRequest.workflow_state) {
                        setDefenseRequest(updatedRequest);
                        setLastUpdateTime(dayjs().format('h:mm A'));
                        
                        // You could add a toast notification here
                        console.log('Defense request status updated:', updatedRequest.workflow_state);
                    }
                }
            } catch (error) {
                console.error('Failed to poll defense request updates:', error);
            }
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(pollInterval);
    }, [defenseRequest?.id, defenseRequest?.workflow_state]);

    function handleSuccess() {
        setShowSuccessPanel(true);
    }

    function handleDialogClose() {
        setOpen(false);
        setShowSuccessPanel(false);
    }

    // Track open state for each collapsible by id
    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

    function handleToggle(id: number, isOpen: boolean) {
        setOpenItems((prev) => ({
            ...prev,
            [id]: isOpen,
        }));
    }

    // Status mapping
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
    };

    // Enhanced function to determine realistic progress based on workflow_state
    function getProgressAndDetails(req: DefenseRequirement) {
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
                    description = "Your defense requirements are currently being <b>reviewed by your Adviser</b>. This may take 2-3 business days.";
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
                        <br/><br/>Please address the feedback and resubmit your requirements.`;
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
                        <br/><br/>Please address the feedback and resubmit your requirements.`;
                    color = "text-red-600";
                    icon = <X className="h-4 w-4 text-red-600" />;
                    bg = "bg-red-50";
                    progressColor = "bg-red-500";
                    break;
                    
                case 'completed':
                    progress = 100;
                    title = "Defense Completed";
                    description = "🎓 Congratulations! Your defense has been completed successfully.";
                    color = "text-purple-600";
                    icon = <GraduationCap className="h-4 w-4 text-purple-600" />;
                    bg = "bg-purple-50";
                    progressColor = "bg-purple-500";
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requirements" />
            <div className="flex flex-col px-7 pt-5 pb-5 w-full">
                <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="flex flex-row items-center justify-between w-full p-3 border-b">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                                <GraduationCap className="h-5 w-5 text-rose-400" />
                            </div>
                            <div>
                                <span className="text-base font-semibold">
                                    Defense Requirements
                                </span>
                                <p className="block text-xs text-muted-foreground">
                                    This sections shows all your submitted defense requirements and their current status.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="bg-rose-500 text-sm px-5 rounded-md"
                            onClick={() => setOpen(true)}
                            disabled={hasPending}
                        >
                            Submit requirements
                        </Button>
                        <SubmitDefenseRequirements
                            open={open}
                            onOpenChange={setOpen}
                            onFinish={handleSuccess}
                        />
                    </div>
                    {defenseRequirements.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No defense requirements submitted yet.
                        </div>
                    ) : (
                        defenseRequirements
                            .slice()
                            .sort((a, b) => {

                                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                                return bTime - aTime;
                            })
                            .map((req) => {
                                const details = getProgressAndDetails(req);
                                const isOpen = openItems[req.id] ?? false;

                                const timeSubmitted = req.created_at
                                    ? dayjs(req.created_at).fromNow()
                                    : 'Unknown';

                                return (
                                    <React.Fragment key={req.id}>
                                        {/* Separator at the top of each record */}
                                        <div className="border-b border-zinc-200 w-full" />
                                        <Collapsible
                                            open={isOpen}
                                            onOpenChange={(open) => handleToggle(req.id, open)}
                                        >
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center justify-between px-4 py-3 cursor-pointer bg-white">
                                                    <div className="flex items-center gap-2">
                                                        {details.icon}
                                                        <span className={`font-semibold text-xs ${details.color}`}>
                                                            {details.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Progress
                                                            value={details.progress}
                                                            className="h-2 w-64"
                                                        />
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                Submitted {timeSubmitted}
                                                            </span>
                                                            {defenseRequest && (
                                                                <span className="text-xs text-green-600 whitespace-nowrap">
                                                                    Last updated: {lastUpdateTime}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronDown
                                                            className={`transition-transform duration-200 h-4 w-4 text-muted-foreground ${isOpen ? 'rotate-180' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className="px-4 py-3">
                                                    <div className={`flex flex-col ${details.bg} p-3 rounded`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`font-semibold text-xs text-zinc-600`}>
                                                                {details.title}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="text-xs text-muted-foreground space-y-2"
                                                            dangerouslySetInnerHTML={{ __html: details.description }}
                                                        />
                                                    </div>
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </React.Fragment>
                                );
                            })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
