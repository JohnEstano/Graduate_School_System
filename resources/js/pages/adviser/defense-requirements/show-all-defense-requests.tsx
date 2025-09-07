'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Hourglass, Check, X, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Input } from "@/components/ui/input";

dayjs.extend(relativeTime);

type DefenseRequest = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    thesis_title: string;
    defense_type: string;
    status: string;
    created_at?: string;
    program: string;
    school_id: string;
    defense_adviser: string;
    date_of_defense?: string;
    mode_defense?: string;
    priority?: string;
};

const statusDetails: Record<
    string,
    {
        icon: React.ReactNode;
        getDescription: (req: DefenseRequest) => React.ReactElement;
        color: string;
        bg: string;
    }
> = {
    pending: {
        icon: <Hourglass className="h-4 w-4 opacity-60" />,
        getDescription: (req) => (
            <span>
                This defense request for <b>{getDisplayName(req)}</b> (<b>{req.thesis_title}</b>) is <b>awaiting review</b> by the Coordinator.
            </span>
        ),
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        bg: "bg-zinc-50",
    },
    approved: {
        icon: <Check className="h-4 w-4 text-green-600" />,
        getDescription: (req) => (
            <span>
                This defense request for <b>{getDisplayName(req)}</b> (<b>{req.thesis_title}</b>) has been <b>approved</b> by the Coordinator and is <b>ready for defense</b>.<br />
                {req.date_of_defense && (
                    <span>
                        The defense is set on <b>{dayjs(req.date_of_defense).format("MMMM D, YYYY")}</b>
                    </span>
                )}
                {req.mode_defense && (
                    <span>
                        {' '}and will be conducted <b>{req.mode_defense}</b>.
                    </span>
                )}
            </span>
        ),
        color: "bg-green-100 text-green-800 border-green-300",
        bg: "bg-green-50",
    },
    rejected: {
        icon: <X className="h-4 w-4 text-rose-600" />,
        getDescription: (req) => (
            <span>
                This defense request for <b>{getDisplayName(req)}</b> (<b>{req.thesis_title}</b>) has been <b>rejected</b> by the Coordinator. Please review the <b>feedback</b> and <b>resubmit</b> if necessary.
            </span>
        ),
        color: "bg-rose-100 text-rose-800 border-rose-300",
        bg: "bg-rose-50",
    },
    "needs-info": {
        icon: <FileText className="h-4 w-4 text-blue-600" />,
        getDescription: (req) => (
            <span>
                <b>Additional information</b> is required for this defense request for <b>{getDisplayName(req)}</b> (<b>{req.thesis_title}</b>). Please check the <b>comments</b> from the Coordinator and provide the <b>requested details</b>.
            </span>
        ),
        color: "bg-blue-100 text-blue-800 border-blue-300",
        bg: "bg-blue-50",
    },
};

function getDisplayName(req: DefenseRequest) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
}

function UserAvatar({ name }: { name: string }) {
    const initial = name?.charAt(0).toUpperCase() || "?";
    return (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 mr-1">
            {initial}
        </span>
    );
}

export default function ShowAllDefenseRequests({
    defenseRequests = [],
}: { defenseRequests: DefenseRequest[] }) {
    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
    const [search, setSearch] = useState("");

    useEffect(() => {
        setOpenItems({});
    }, [defenseRequests]);

    // Filter requests by search
    const filteredRequests = defenseRequests.filter(req => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || "";
        const q = search.toLowerCase();
        return name.includes(q) || thesis.includes(q);
    });

    return (
        <div className="flex flex-col pb-5 w-full">
            <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
                            <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <span className="text-base font-semibold">
                                Endorsed Defense Requests
                            </span>
                            <span className="block text-xs text-muted-foreground ">
                                This section shows all defense requests endorsed by you
                            </span>
                        </div>
                    </div>
                </div>
                {/* Search bar row */}
                <div className="flex items-center px-4 py-3 border-b bg-white">
                    <Input
                        type="text"
                        startIcon={Search}
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="max-w-xs text-sm py-1 h-8"
                    />
                </div>
                {filteredRequests.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground bg-white">
                        No defense requests found.
                    </div>
                ) : (
                    filteredRequests
                        .slice()
                        .sort((a, b) => {
                            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                            return bTime - aTime;
                        })
                        .map((req) => {
                            const status = req.status?.toLowerCase() || "pending";
                            const details = statusDetails[status] || statusDetails["pending"];
                            const isOpen = openItems[req.id] ?? false;
                            const timeSubmitted = req.created_at
                                ? dayjs(req.created_at).fromNow()
                                : "Unknown";

                            return (
                                <div key={req.id} className="border-b border-zinc-200 bg-white">
                                    <Collapsible
                                        open={isOpen}
                                        onOpenChange={(open) => setOpenItems(prev => ({ ...prev, [req.id]: open }))}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between px-4 py-3 cursor-pointer bg-white hover:bg-zinc-50 transition">
                                                <div className="flex items-center gap-4">
                                                    {/* Show only the icon for status */}
                                                    <span>
                                                        {details.icon}
                                                    </span>
                                                    <div className="flex items-center">
                                                        <UserAvatar name={req.first_name} />
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {getDisplayName(req)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        Submitted {timeSubmitted}
                                                    </span>
                                                    <ChevronDown
                                                        className={`transition-transform duration-200 h-4 w-4 text-muted-foreground ${isOpen ? "rotate-180" : ""}`}
                                                    />
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="px-4 py-3">
                                                <div className={`flex flex-col ${details.bg} p-3 rounded`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-semibold text-xs text-zinc-600`}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground space-y-2">
                                                        <div>{details.getDescription(req)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
}