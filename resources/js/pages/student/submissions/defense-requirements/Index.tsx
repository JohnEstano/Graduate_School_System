import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { ChevronDown, GraduationCap, Hourglass, Check, X } from 'lucide-react';
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

type PageProps = {
    auth: {
        user: {
            role: string;
            school_id: string;
        };
    };
    defenseRequirements?: DefenseRequirement[];
};

export default function DefenseRequestIndex() {
    const { props } = usePage<PageProps>();
    const { defenseRequirements = [] } = props;

    // Check if there is a pending request
    const hasPending = defenseRequirements.some(
        (req) => req.status?.toLowerCase() === 'pending'
    );

    const [open, setOpen] = useState(false);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);

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
                                <p className="text-sm text-muted-foreground">
                                    Below are your submitted defense requirements and their current status.
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
                                const status = req.status?.toLowerCase() || 'pending';
                                const details = statusDetails[status] || statusDetails['pending'];
                                const isOpen = openItems[req.id] ?? false; // default closed

                                // Format time submitted
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
                                                    {/* Removed border-b from this div */}
                                                    <div className="flex items-center gap-2">
                                                        {details.icon}
                                                        <span className={`font-semibold text-xs ${details.color}`}>
                                                            {details.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                           Submitted {timeSubmitted}
                                                        </span>
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
                                                        <div className="text-xs text-muted-foreground space-y-2">
                                                            <div>{details.description}</div>
                                                        </div>
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
