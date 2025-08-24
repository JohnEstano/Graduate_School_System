'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FileText, Hourglass, Check, X, Paperclip, CircleArrowRight, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@/components/ui/button";
import EndorseDefenseDialog from './endorse-defense-dialog'; // Add this import
import { Input } from "@/components/ui/input";

dayjs.extend(relativeTime);

type DefenseRequirement = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    thesis_title: string;
    defense_type: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    manuscript_proposal?: string;
    similarity_index?: string;
    status: string;
    created_at?: string;
    program: string;
    school_id: string;
    defense_adviser: string; // <-- Add this line
};

const statusDetails: Record<
    string,
    {
        icon: React.ReactNode;
    }
> = {
    pending: {
        icon: <Hourglass className="h-4 w-4 opacity-60" />,
    },
    approved: {
        icon: <Check className="h-4 w-4 text-green-600" />,
    },
    rejected: {
        icon: <X className="h-4 w-4 text-rose-600" />,
    },
};

function getDisplayName(req: DefenseRequirement) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
}

function FileAttachment({ file, label }: { file?: string; label: string }) {
    if (!file) return null;
    const fileName = file.split('/').pop();
    return (
        <a
            href={`/storage/${file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-white w-full max-w-md"
        >
            <div className="h-7 w-7 flex items-center justify-center rounded-md bg-rose-500 border border-rose-500">
                <Paperclip className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-xs">{label}</span>
                <span className="text-xs text-muted-foreground">{fileName}</span>
            </div>
        </a>
    );
}

function UserAvatar({ name }: { name: string }) {
    const initial = name?.charAt(0).toUpperCase() || "?";
    return (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 mr-1">
            {initial}
        </span>
    );
}

export default function ShowAllDefenseRequirements({
    defenseRequirements = [],
    defenseRequests = [],
}: { defenseRequirements: DefenseRequirement[]; defenseRequests: any[] }) {
    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
    const [endorseDialogId, setEndorseDialogId] = useState<number | null>(null);
    const [search, setSearch] = useState(""); // Add search state

    useEffect(() => {
        setOpenItems({});
        setEndorseDialogId(null);
    }, [defenseRequirements]);

    // Filter out requirements that have already been endorsed
    const endorsedKeys = new Set(
        defenseRequests.map(req => `${req.school_id}-${req.thesis_title}`.toLowerCase())
    );
    const filteredRequirements = defenseRequirements.filter(req => {
        const key = `${req.school_id}-${req.thesis_title}`.toLowerCase();
        return !endorsedKeys.has(key);
    }).filter(req => {
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
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                            <Paperclip className="h-5 w-5 text-rose-400" />
                        </div>
                        <div className=''>
                            <span className="text-base font-semibold">
                                All Defense Requirements
                            </span>
                            <span className="block text-xs text-muted-foreground ">
                                This section shows all defense requirements submitted by your students
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
                {filteredRequirements.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground bg-white">
                        No pending defense requirements found.
                    </div>
                ) : (
                    filteredRequirements
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
                                                    {details.icon}
                                                    {/* Group avatar and name closely */}
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
                                            <div className="px-4 py-4 bg-white rounded-b">
                                                {/* Thesis title and badge row */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-muted-foreground font-semibold">Thesis title:</span>
                                                    <span className="text-sm font-bold">{req.thesis_title}</span>
                                                    <Badge variant="secondary" className="w-fit text-xs ml-2">
                                                        {req.defense_type}
                                                    </Badge>
                                                </div>
                                                {/* File attachments */}
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <FileAttachment file={req.rec_endorsement} label="REC Endorsement" />
                                                    <FileAttachment file={req.proof_of_payment} label="Proof of Payment" />
                                                    <FileAttachment file={req.manuscript_proposal} label="Manuscript Proposal" />
                                                    <FileAttachment file={req.similarity_index} label="Similarity Index" />
                                                </div>
                                                {/* Action buttons */}
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {/* handle reject */ }}>
                                                        <X className="w-4 h-4 mr-1 text-rose-600" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => setEndorseDialogId(req.id)}
                                                    >
                                                        <CircleArrowRight className="w-4 h-4 mr-1 text-green-600" />
                                                        Proceed Endorsement
                                                    </Button>
                                                    {/* Endorse Defense Dialog */}
                                                    {endorseDialogId === req.id && (
                                                        <EndorseDefenseDialog
                                                            request={req}
                                                            open={endorseDialogId === req.id}
                                                            onOpenChange={(open: boolean) => {
                                                                if (!open) setEndorseDialogId(null);
                                                            }}
                                                        />
                                                    )}
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