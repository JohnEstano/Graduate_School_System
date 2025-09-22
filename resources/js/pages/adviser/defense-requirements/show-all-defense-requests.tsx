'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Hourglass, Check, X, Search, Paperclip } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type DefenseRequest = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    thesis_title: string;
    defense_type: string;
    status: string;
    workflow_state: string;
    created_at?: string;
    program: string;
    school_id: string;
    defense_adviser: string;
    date_of_defense?: string;
    mode_defense?: string;
    priority?: string;
    advisers_endorsement?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    reference_no?: string;
    manuscript_proposal?: string;
    similarity_index?: string;
    adviser_comments?: string;
    adviser_reviewed_at?: string;
    adviser_reviewed_by?: number;
    coordinator_comments?: string;
    coordinator_reviewed_at?: string;
    workflow_history?: Array<{
        action: string;
        comment?: string;
        user_name: string;
        timestamp: string;
    }>;
};

function getDisplayName(req: DefenseRequest) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
}

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

export default function ShowAllDefenseRequests({
    defenseRequests = [],
    showActions = false,
    title = "Defense Requests",
    description = "This section shows defense requests"
}: { 
    defenseRequests: DefenseRequest[];
    showActions?: boolean;
    title?: string;
    description?: string;
}) {
    const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [confirmAction, setConfirmAction] = useState<{id: number; action: 'approve' | 'reject'; comments?: string} | null>(null);
    const [comments, setComments] = useState("");

    useEffect(() => {
        setOpenItems({});
    }, [defenseRequests]);

    async function handleDecision(id: number, decision: 'approve' | 'reject', comments?: string) {
        setProcessingId(id);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            if (!csrfToken) throw new Error('CSRF token not found');

            const res = await fetch(`/defense-requests/${id}/adviser-decision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ decision, comment: comments || '' }),
                credentials: 'same-origin'
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed: ${errorData.message || res.statusText}`);
                return;
            }
            const result = await res.json();
            if (result.success) window.location.reload();
            else alert('Decision failed.');
        } catch (e) {
            console.error(e);
            alert('Network error.');
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
        }
    }

    const filteredRequests = defenseRequests.filter(req => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || "";
        const q = search.toLowerCase();
        return name.includes(q) || thesis.includes(q);
    });

    return (
        <div className="flex flex-col pb-5 w-full">
            <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
                            <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <span className="text-base font-semibold">{title}</span>
                            <span className="block text-xs text-muted-foreground">{description}</span>
                        </div>
                    </div>
                </div>
                {/* Search */}
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
                            const timeSubmitted = req.created_at ? dayjs(req.created_at).fromNow() : "Unknown";

                            const wf = (req.workflow_state || '').toLowerCase();
                            const pillLabel = getAdviserWorkflowLabel(wf);
                            const pillClasses = statePillClasses(pillLabel);

                            return (
                                <div key={req.id} className="border-b border-zinc-200 bg-white">
                                    <Collapsible
                                        open={isOpen}
                                        onOpenChange={(open) => setOpenItems(prev => ({ ...prev, [req.id]: open }))}
                                    >
                                        {/* Trigger */}
                                        <CollapsibleTrigger asChild>
                                            <div className="group cursor-pointer bg-white hover:bg-zinc-50 transition">
                                                <div className="p-3 flex items-center gap-4">
                                                    <div className="shrink-0">
                                                        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                                                    </div>
                                                    <div className="shrink-0">
                                                        {details.icon}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-sm font-medium truncate">
                                                                {pillLabel === 'Waiting for your review' ? 'Under Adviser Review' : pillLabel}
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pillClasses}`}>
                                                                {pillLabel}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500 truncate">
                                                            {getDisplayName(req)} • {req.thesis_title || 'Untitled Thesis'}
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500 whitespace-nowrap">
                                                        {timeSubmitted && `Submitted ${timeSubmitted}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        {/* Content */}
                                        <CollapsibleContent>
                                            <div className="px-5 pb-6 pt-4 bg-white">
                                                {/* TOP META + ATTACHMENT CHIPS */}
                                                <div className="rounded-lg border border-zinc-200 mb-6">
                                                    <div className="flex flex-wrap items-start justify-between gap-6 p-4">
                                                        <div className="grid gap-6 sm:grid-cols-3 flex-1 min-w-0">
                                                            <HeaderMetaItem label="Thesis Title" value={req.thesis_title || '—'} />
                                                            <HeaderMetaItem label="Student Name" value={getDisplayName(req)} />
                                                            <HeaderMetaItem label="Adviser" value={req.defense_adviser || 'You'} />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 shrink-0 text-[11px] text-zinc-500">
                                                            <span>Submitted {timeSubmitted}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 px-4 pb-4">
                                                        {req.manuscript_proposal && <AttachmentChip file={req.manuscript_proposal} label="Manuscript" />}
                                                        {req.similarity_index && <AttachmentChip file={req.similarity_index} label="Similarity" />}
                                                        {req.rec_endorsement && <AttachmentChip file={req.rec_endorsement} label="Endorsement" />}
                                                        {req.proof_of_payment && <AttachmentChip file={req.proof_of_payment} label="Payment" />}
                                                        {req.advisers_endorsement && <AttachmentChip file={req.advisers_endorsement} label="Adviser Endorse." />}
                                                        {!req.manuscript_proposal && !req.similarity_index && !req.rec_endorsement && !req.proof_of_payment && !req.advisers_endorsement && (
                                                            <span className="text-xs text-zinc-500">No attachments uploaded.</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Banner */}
                                                {(() => {
                                                    let short = 'Pending';
                                                    let desc = '';
                                                    if (!wf || ['submitted','adviser-review','pending',''].includes(wf)) {
                                                        short = 'Pending';
                                                        desc = `This defense request for ${getDisplayName(req)} (${req.thesis_title}) is waiting for your review.`;
                                                    } else if (wf === 'adviser-approved') {
                                                        short = 'Pending';
                                                        desc = `Approved by you. Awaiting Coordinator review.`;
                                                    } else if (wf === 'adviser-rejected') {
                                                        short = 'Rejected';
                                                        desc = `You rejected this request. Student will revise and resubmit.`;
                                                    } else if (wf === 'coordinator-approved' || status === 'approved') {
                                                        short = 'Approved';
                                                        desc = `Coordinator approved. Ready / scheduled for defense.`;
                                                    } else if (wf === 'completed') {
                                                        short = 'Completed';
                                                        desc = `Defense process completed.`;
                                                    } else {
                                                        short = wf;
                                                        desc = `Current state: ${wf}.`;
                                                    }
                                                    const color =
                                                        short === 'Rejected'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                            : short === 'Approved'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : short === 'Completed'
                                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                                    : 'bg-zinc-50 text-zinc-700 border-zinc-100';

                                                    return (
                                                        <div className={`border ${color} rounded-md px-4 py-3 mb-6`}>
                                                            <p className="text-sm font-semibold mb-1">{short}</p>
                                                            <p className="text-xs leading-relaxed">{desc}</p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Details grid */}
                                                <div className="grid gap-6 md:grid-cols-2 mb-6">
                                                    <div className="space-y-3">
                                                        <Detail label="Thesis Title" value={req.thesis_title || '—'} />
                                                        <Detail label="Student Name" value={getDisplayName(req)} />
                                                        <Detail label="Student ID" value={req.school_id || '—'} />
                                                        <Detail label="Program" value={req.program || '—'} />
                                                        {req.reference_no && <Detail label="Reference No." value={req.reference_no} />}
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Detail label="Defense Type" value={req.defense_type || '—'} />
                                                        <Detail label="Adviser" value={req.defense_adviser || 'You'} />
                                                        <Detail label="Submitted" value={timeSubmitted} />
                                                        <Detail label="Workflow State" value={(req.workflow_state || 'pending').toLowerCase()} />
                                                        {req.date_of_defense && <Detail label="Defense Date" value={dayjs(req.date_of_defense).format('MMMM D, YYYY')} />}
                                                        {req.mode_defense && <Detail label="Mode" value={req.mode_defense} />}
                                                    </div>
                                                </div>

                                                {/* Workflow history / comments */}
                                                {(req.adviser_comments || req.coordinator_comments || req.workflow_history?.length) && (
                                                    <div className="mb-6">
                                                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-zinc-500">Workflow History</p>
                                                        <div className="space-y-2">
                                                            {req.adviser_comments && (
                                                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                                                    <div className="text-[11px] font-semibold text-blue-800">Adviser Comment</div>
                                                                    <div className="text-xs text-blue-700 mt-1">{req.adviser_comments}</div>
                                                                    {req.adviser_reviewed_at && (
                                                                        <div className="text-[10px] text-blue-600 mt-1">
                                                                            {dayjs(req.adviser_reviewed_at).format('MMM D, YYYY h:mm A')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {req.coordinator_comments && (
                                                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                                                    <div className="text-[11px] font-semibold text-green-800">Coordinator Comment</div>
                                                                    <div className="text-xs text-green-700 mt-1">{req.coordinator_comments}</div>
                                                                    {req.coordinator_reviewed_at && (
                                                                        <div className="text-[10px] text-green-600 mt-1">
                                                                            {dayjs(req.coordinator_reviewed_at).format('MMM D, YYYY h:mm A')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {req.workflow_history?.map((entry, idx) => (
                                                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2">
                                                                    <div className="text-[11px] font-semibold text-gray-800">
                                                                        {entry.action.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} by {entry.user_name}
                                                                    </div>
                                                                    {entry.comment && <div className="text-xs text-gray-700 mt-1">{entry.comment}</div>}
                                                                    <div className="text-[10px] text-gray-600 mt-1">
                                                                        {dayjs(entry.timestamp).format('MMM D, YYYY h:mm A')}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {showActions && (wf === 'adviser-review' || wf === 'submitted' || wf === 'pending') && (
                                                    <div className="flex gap-2 pt-4 border-t">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                            disabled={processingId === req.id}
                                                            onClick={() => setConfirmAction({id: req.id, action: 'reject'})}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                            disabled={processingId === req.id}
                                                            onClick={() => setConfirmAction({id: req.id, action: 'approve'})}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Approve
                                                        </Button>
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

            {/* Confirmation Dialog */}
            {confirmAction && (
                <Dialog open={true} onOpenChange={() => {setConfirmAction(null); setComments("");}}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {confirmAction.action === 'approve' ? 'Approve Defense Request' : 'Reject Defense Request'}
                            </DialogTitle>
                            <DialogDescription>
                                {confirmAction.action === 'approve' 
                                    ? 'This defense request will be forwarded to the Coordinator for final approval and scheduling.'
                                    : 'This defense request will be rejected and sent back to the student.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="comments" className="text-sm font-medium">
                                    Comments {confirmAction.action === 'reject' ? '(Required for rejection)' : '(Optional)'}
                                </Label>
                                <textarea
                                    id="comments"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder={confirmAction.action === 'approve' 
                                        ? "Add any feedback or notes for the student..."
                                        : "Please provide feedback on why this request is being rejected..."
                                    }
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={4}
                                    required={confirmAction.action === 'reject'}
                                />
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {setConfirmAction(null); setComments("");}}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => {
                                    if (confirmAction.action === 'reject' && !comments.trim()) {
                                        alert('Comments are required when rejecting a request.');
                                        return;
                                    }
                                    handleDecision(confirmAction.id, confirmAction.action, comments);
                                    setComments("");
                                }}
                                disabled={processingId === confirmAction.id}
                                className={confirmAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {processingId === confirmAction.id ? 'Processing...' : 
                                 confirmAction.action === 'approve' ? 'Approve & Forward' : 'Reject Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

// Helpers
function getAdviserWorkflowLabel(wf: string) {
    if (!wf || ['submitted','adviser-review','pending',''].includes(wf)) return 'Waiting for your review';
    if (wf === 'adviser-approved') return 'Waiting for coordinator';
    if (wf === 'adviser-rejected') return 'Rejected';
    if (wf === 'coordinator-approved') return 'Approved';
    if (wf === 'completed') return 'Completed';
    return 'In progress';
}
function statePillClasses(label: string) {
    if (label === 'Waiting for your review') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (label === 'Waiting for coordinator') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (label === 'Rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (label === 'Approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (label === 'Completed') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
}
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-zinc-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium break-words">{value}</p>
        </div>
    );
}

// Header meta + chips (no duplicate list, no shadows)
function HeaderMetaItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-1">{label}</p>
            <p className="text-sm font-semibold truncate">{value}</p>
        </div>
    );
}
function AttachmentChip({ file, label }: { file: string; label: string }) {
    const fileName = file.split('/').pop();
    return (
        <a
            href={`/storage/${file}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white pl-3 pr-4 py-2.5 hover:bg-zinc-50 transition text-xs"
        >
            <span className="h-8 w-8 flex items-center justify-center rounded-md bg-rose-500 text-white">
                <Paperclip className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-tight truncate">
                <span className="font-semibold text-[11px]">{label}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{fileName}</span>
            </span>
        </a>
    );
}