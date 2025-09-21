'use client';

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Hourglass, Check, X, Paperclip, CircleArrowRight, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@/components/ui/button";
import EndorseDefenseDialog from './endorse-defense-dialog';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';  // Sonner toast

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
    defense_adviser: string;
};

const statusDetails: Record<string,{icon: React.ReactNode;}> = {
    pending: { icon: <Hourglass className="h-4 w-4 opacity-60" /> },
    approved: { icon: <Check className="h-4 w-4 text-green-600" /> },
    rejected: { icon: <X className="h-4 w-4 text-rose-600" /> },
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

    const source = (defenseRequirements && defenseRequirements.length > 0)
        ? defenseRequirements
        : defenseRequests;

    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
    const [endorseDialogId, setEndorseDialogId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [commentDraft, setCommentDraft] = useState<Record<number,string>>({});

    useEffect(() => {
        setOpenItems({});
        setEndorseDialogId(null);
    }, [source]);

    const filteredRequirements = source.filter(req => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || "";
        const q = search.toLowerCase();
        return name.includes(q) || thesis.includes(q);
    });

    return (
        <div className="flex flex-col pb-5 w-full">
            <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                            <Paperclip className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                            <span className="text-base font-semibold">
                                All Defense Requirements
                            </span>
                            <span className="block text-xs text-muted-foreground ">
                                This section shows all defense requirements submitted by your students
                            </span>
                        </div>
                    </div>
                </div>

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
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs text-muted-foreground font-semibold">Thesis title:</span>
                                                    <span className="text-sm font-bold">{req.thesis_title}</span>
                                                    <Badge variant="secondary" className="w-fit text-xs ml-2">
                                                        {req.defense_type}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <FileAttachment file={req.rec_endorsement} label="REC Endorsement" />
                                                    <FileAttachment file={req.proof_of_payment} label="Proof of Payment" />
                                                    <FileAttachment file={req.manuscript_proposal} label="Manuscript Proposal" />
                                                    <FileAttachment file={req.similarity_index} label="Similarity Index" />
                                                </div>
                                                <textarea
                                                  placeholder="Optional comment..."
                                                  value={commentDraft[req.id] || ''}
                                                  onChange={e => setCommentDraft(c => ({ ...c, [req.id]: e.target.value }))}
                                                  className="w-full border rounded p-2 text-xs mb-2"
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={async () => {
                                                            try {
                                                                await adviserDecisionRequest(req.id,'reject', commentDraft[req.id] || '');
                                                                (req as any).workflow_state = 'adviser-rejected';
                                                                (req as any).status = 'Rejected';
                                                                toast.success('Request rejected.');
                                                                setOpenItems(prev => ({ ...prev, [req.id]: false }));
                                                            } catch(e:any) {
                                                                toast.error(e.message || 'Error rejecting');
                                                            }
                                                        }}
                                                    >
                                                        <X className="w-4 h-4 mr-1 text-rose-600" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={async () => {
                                                            try {
                                                                await adviserDecisionRequest(req.id,'approve', commentDraft[req.id] || '');
                                                                (req as any).workflow_state = 'adviser-approved';
                                                                (req as any).status = 'Pending';
                                                                toast.success('Request approved.');
                                                                setOpenItems(prev => ({ ...prev, [req.id]: false }));
                                                            } catch(e:any) {
                                                                toast.error(e.message || 'Error approving');
                                                            }
                                                        }}
                                                    >
                                                        <CircleArrowRight className="w-4 h-4 mr-1 text-green-600" />
                                                        Approve
                                                    </Button>
                                                    {endorseDialogId === req.id && (
                                                        <EndorseDefenseDialog
                                                            request={req}
                                                            open={endorseDialogId === req.id}
                                                            onOpenChange={(open: boolean) => !open && setEndorseDialogId(null)}
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

// Sonner request helper
async function adviserDecisionRequest(id: number, decision: 'approve'|'reject', comment: string) {
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    const res = await fetch(`/defense-requests/${id}/adviser-decision`, {
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'X-CSRF-TOKEN': csrf,
            'Accept':'application/json'
        },
        body: JSON.stringify({ decision, comment })
    });
    let json: any = {};
    try { json = await res.json(); } catch {}
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
}