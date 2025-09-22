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
import { RequirementCollapseHeader } from "@/components/defense/RequirementCollapseHeader";

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
    workflow_state?: string; // added
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

                            // NEW: derive a user-facing state label focused on adviser perspective
                            const workflow = ((req as any).workflow_state || '').toLowerCase();
                            let adviserLabel = '';
                            if (!workflow || ['submitted','pending','adviser-pending',''].includes(workflow)) {
                                adviserLabel = 'Waiting for your review';
                            } else if (['adviser-approved'].includes(workflow)) {
                                adviserLabel = 'Waiting for coordinator';
                            } else if (['adviser-rejected'].includes(workflow)) {
                                adviserLabel = 'Rejected';
                            } else {
                                adviserLabel = 'In progress';
                            }

                            const labelColorClasses = adviserLabel === 'Waiting for your review'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : adviserLabel === 'Rejected'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : adviserLabel === 'Waiting for coordinator'
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-zinc-100 text-zinc-700 border-zinc-200';

                            return (
                                <div key={req.id} className="border-b border-zinc-200 bg-white">
                                    <Collapsible
                                        open={isOpen}
                                        onOpenChange={(open) => setOpenItems(prev => ({ ...prev, [req.id]: open }))}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <RequirementCollapseHeader
                                              req={req}
                                              isOpen={isOpen}
                                              onToggle={() => setOpenItems(prev => ({ ...prev, [req.id]: !isOpen }))}
                                            />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            {/* NEW CLEAN LAYOUT */}
                                            <div className="px-5 pb-6 pt-4 bg-white">
                                                {/* Status / Banner */}
                                                {(() => {
                                                    const wf = (req.workflow_state || '').toLowerCase();
                                                    let short = 'Pending';
                                                    let desc = '';
                                                    if (!wf || ['submitted','pending','adviser-pending',''].includes(wf)) {
                                                        short = 'Pending';
                                                        desc = `This defense request for ${getDisplayName(req)} (${req.thesis_title}) is waiting for your review.`;
                                                    } else if (wf === 'adviser-approved') {
                                                        short = 'Pending';
                                                        desc = `Approved by you. Awaiting Coordinator review.`;
                                                    } else if (wf === 'adviser-rejected') {
                                                        short = 'Rejected';
                                                        desc = `You rejected this request.`;
                                                    } else if (wf === 'completed') {
                                                        short = 'Completed';
                                                        desc = `Defense processing completed.`;
                                                    } else {
                                                        short = wf;
                                                        desc = `Current state: ${wf}.`;
                                                    }

                                                    const color =
                                                        short === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        short === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-zinc-50 text-zinc-700 border-zinc-100';

                                                    return (
                                                        <div className={`border ${color} rounded-md px-4 py-3 mb-5`}>
                                                            <p className="text-sm font-semibold mb-1">{short}</p>
                                                            <p className="text-xs leading-relaxed">{desc}</p>
                                                        </div>
                                                    );
                                                })()}
                                                {/* Details */}
                                                <div className="grid gap-6 md:grid-cols-2 mb-6">
                                                    <div className="space-y-3">
                                                        <Detail label="Thesis Title" value={req.thesis_title || '—'} />
                                                        <Detail label="Student Name" value={getDisplayName(req)} />
                                                        <Detail label="Student ID" value={req.school_id || '—'} />
                                                        <Detail label="Program" value={req.program || '—'} />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Detail label="Defense Type" value={req.defense_type || '—'} />
                                                        <Detail label="Adviser" value={req.defense_adviser || 'You'} />
                                                        <Detail label="Submitted" value={timeSubmitted} />
                                                        <Detail label="Workflow State" value={(req.workflow_state || 'pending').toLowerCase()} />
                                                    </div>
                                                </div>
                                                {/* Attachments */}
                                                <div className="mb-6">
                                                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-zinc-500">Attachments</p>
                                                    <ul className="space-y-1">
                                                        {req.rec_endorsement && <AttachmentLine file={req.rec_endorsement} label="REC Endorsement" />}
                                                        {req.proof_of_payment && <AttachmentLine file={req.proof_of_payment} label="Proof of Payment" />}
                                                        {req.manuscript_proposal && <AttachmentLine file={req.manuscript_proposal} label="Manuscript Proposal" />}
                                                        {req.similarity_index && <AttachmentLine file={req.similarity_index} label="Similarity Index" />}
                                                        {!req.rec_endorsement && !req.proof_of_payment && !req.manuscript_proposal && !req.similarity_index && (
                                                            <li className="text-xs text-zinc-500">No files uploaded.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                                {/* Comment + Actions only if awaiting adviser decision */}
                                                {(!req.workflow_state || ['submitted','pending','adviser-pending',''].includes((req.workflow_state || '').toLowerCase())) && (
                                                    <div className="mt-2 border-t pt-4">
                                                        <label className="block text-xs font-semibold mb-1 text-zinc-600">Comment (optional)</label>
                                                        <textarea
                                                            placeholder="Add an optional remark for the student..."
                                                            value={commentDraft[req.id] || ''}
                                                            onChange={e => setCommentDraft(c => ({ ...c, [req.id]: e.target.value }))}
                                                            className="w-full border rounded-md p-2 text-xs resize-y min-h-[70px] focus:outline-none focus:ring-1 focus:ring-rose-300"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-3">
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
                                                                variant="default"
                                                                className="text-xs bg-emerald-600 hover:bg-emerald-600/90"
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
                                                                <CircleArrowRight className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium break-words">{value}</p>
        </div>
    );
}

function AttachmentLine({ file, label }: { file: string; label: string }) {
    const name = file.split('/').pop();
    return (
        <li>
            <a
                href={`/storage/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-xs text-sky-700 hover:underline"
            >
                <Paperclip className="h-3.5 w-3.5 text-sky-600 group-hover:text-sky-700" />
                <span className="font-medium">{label}</span>
                <span className="text-zinc-500 truncate max-w-[180px]">{name}</span>
            </a>
        </li>
    );
}