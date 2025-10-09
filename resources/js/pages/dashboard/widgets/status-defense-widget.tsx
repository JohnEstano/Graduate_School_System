import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Hourglass, Check, X } from "lucide-react";

type RawDefenseRequest = {
    id: number;
    thesis_title: string;
    status?: string;
    normalized_status?: string;
    workflow_state?: string | null;
    created_at?: string | null;
};

type Props = {
    recentRequests?: RawDefenseRequest[];
    loading?: boolean;
};

const TERMINAL = new Set([
    "cancelled",
    "adviser-rejected",
    "coordinator-rejected",
    "completed",
]);

const WF_MAP: Record<
    string,
    { label: string; icon: React.ReactNode }
> = {
    submitted: {
        label: "Submitted",
        icon: <Hourglass className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "adviser-review": {
        label: "Under Adviser Review",
        icon: <Hourglass className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "adviser-approved": {
        label: "Approved by Adviser",
        icon: <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "coordinator-review": {
        label: "Coordinator Review",
        icon: <Hourglass className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "coordinator-approved": {
        label: "Coordinator Approved",
        icon: <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "panels-assigned": {
        label: "Panels Assigned",
        icon: <GraduationCap className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    scheduled: {
        label: "Defense Scheduled",
        icon: <GraduationCap className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    completed: {
        label: "Defense Completed",
        icon: <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "adviser-rejected": {
        label: "Rejected (Adviser)",
        icon: <X className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    "coordinator-rejected": {
        label: "Rejected (Coordinator)",
        icon: <X className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
    cancelled: {
        label: "Cancelled",
        icon: <X className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    },
};

function resolveWorkflowLabel(r: RawDefenseRequest) {
    const wf = (r.workflow_state || "").toLowerCase();
    if (wf && WF_MAP[wf]) return WF_MAP[wf];

    const status = (r.normalized_status || r.status || "").toLowerCase();
    if (status.includes("reject"))
        return {
            label: "Rejected",
            icon: <X className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
        };
    if (status.includes("approve"))
        return {
            label: "Approved",
            icon: <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
        };
    if (status === "cancelled")
        return {
            label: "Cancelled",
            icon: <X className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
        };
    return {
        label: "Submitted",
        icon: <Hourglass className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
    };
}

const StatusDefenseWidget: React.FC<Props> = ({
    recentRequests = [],
    loading = false,
}) => {
    const sorted = [...recentRequests].sort((a, b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
    });

    const active =
        sorted.find(
            (r) => !TERMINAL.has((r.workflow_state || "").toLowerCase())
        ) || sorted[0];

    let statusContent;
    if (loading) {
        statusContent = (
            <div className="flex items-center gap-3 mt-2">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
        );
    } else if (!active) {
        statusContent = (
            <div className="flex items-center gap-2 mt-2">
                <Hourglass className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    No Submission
                </span>
            </div>
        );
    } else {
        const { label, icon } = resolveWorkflowLabel(active);
        statusContent = (
            <div className="flex items-center gap-2 mt-2">
                {icon}
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{label}</span>
            </div>
        );
    }

    return (
        <Card className="col-span-1 rounded-2xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
            <div className="flex items-center justify-between px-6 pt-5">
                <div className="text-sm font-medium text-muted-foreground">
                    Defense Status
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-semibold px-3 py-1"
                    type="button"
                    asChild
                >
                    <a href="/defense-requirements">View More</a>
                </Button>
            </div>
            <div className="px-6">
                {statusContent}
                <div className="text-xs mt-2 mb-2 text-muted-foreground line-clamp-1">
                    {active?.thesis_title
                        ? active.thesis_title
                        : <span className="italic">Untitled Thesis</span>}
                </div>
            </div>
            <CardContent className="flex-1 flex items-end w-full p-0">
                <div className="flex items-center justify-end w-full pr-6 pb-4">
                    <GraduationCap className="text-rose-500 dark:text-rose-400 size-7" />
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusDefenseWidget;