'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, FileText, Hourglass, Check, X, Search, Eye } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const res = await fetch(`/defense-requests/${id}/adviser-decision`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ decision, comments }),
                credentials: 'same-origin'
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Decision failed:', res.status, res.statusText, errorData);
                alert(`Failed to process decision: ${errorData.message || res.statusText}. Please try again.`);
                return;
            }
            
            const result = await res.json();
            if (result.success) {
                // Refresh the page to show updated data
                window.location.reload();
            } else {
                alert('Decision processing failed. Please try again.');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please check your connection and try again.');
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
        }
    }

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
                                {title}
                            </span>
                            <span className="block text-xs text-muted-foreground ">
                                {description}
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
                                            <div className="px-4 py-3 space-y-4">
                                                {/* Status Description */}
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

                                                {/* Request Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="font-medium text-gray-700">Thesis Title:</span>
                                                        <p className="text-gray-600 mt-1">{req.thesis_title}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Defense Type:</span>
                                                        <p className="text-gray-600 mt-1">{req.defense_type}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Student ID:</span>
                                                        <p className="text-gray-600 mt-1">{req.school_id}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Program:</span>
                                                        <p className="text-gray-600 mt-1">{req.program}</p>
                                                    </div>
                                                </div>

                                                {/* Attachments */}
                                                <div>
                                                    <span className="font-medium text-gray-700 text-xs">Attachments:</span>
                                                    <div className="mt-2 space-y-2">
                                                        {req.rec_endorsement && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <a 
                                                                    href={`/storage/${req.rec_endorsement}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline"
                                                                >
                                                                    REC Endorsement
                                                                </a>
                                                            </div>
                                                        )}
                                                        {req.proof_of_payment && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <a 
                                                                    href={`/storage/${req.proof_of_payment}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline"
                                                                >
                                                                    Proof of Payment
                                                                </a>
                                                            </div>
                                                        )}
                                                        {req.manuscript_proposal && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <a 
                                                                    href={`/storage/${req.manuscript_proposal}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline"
                                                                >
                                                                    Manuscript Proposal
                                                                </a>
                                                            </div>
                                                        )}
                                                        {req.similarity_index && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <a 
                                                                    href={`/storage/${req.similarity_index}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline"
                                                                >
                                                                    Similarity Index
                                                                </a>
                                                            </div>
                                                        )}
                                                        {req.advisers_endorsement && (
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                                <a 
                                                                    href={`/storage/${req.advisers_endorsement}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:underline"
                                                                >
                                                                    Adviser's Endorsement
                                                                </a>
                                                            </div>
                                                        )}
                                                        {req.reference_no && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-700">Reference No: <strong>{req.reference_no}</strong></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Workflow History & Comments */}
                                                {(req.adviser_comments || req.coordinator_comments || req.workflow_history?.length) && (
                                                    <div>
                                                        <span className="font-medium text-gray-700 text-xs">Workflow History:</span>
                                                        <div className="mt-2 space-y-2">
                                                            {req.adviser_comments && (
                                                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                                                    <div className="text-xs font-medium text-blue-800">Adviser Comment:</div>
                                                                    <div className="text-xs text-blue-700 mt-1">{req.adviser_comments}</div>
                                                                    {req.adviser_reviewed_at && (
                                                                        <div className="text-xs text-blue-600 mt-1">
                                                                            {dayjs(req.adviser_reviewed_at).format('MMM D, YYYY [at] h:mm A')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {req.coordinator_comments && (
                                                                <div className="bg-green-50 border border-green-200 rounded p-2">
                                                                    <div className="text-xs font-medium text-green-800">Coordinator Comment:</div>
                                                                    <div className="text-xs text-green-700 mt-1">{req.coordinator_comments}</div>
                                                                    {req.coordinator_reviewed_at && (
                                                                        <div className="text-xs text-green-600 mt-1">
                                                                            {dayjs(req.coordinator_reviewed_at).format('MMM D, YYYY [at] h:mm A')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {req.workflow_history?.map((entry, index) => (
                                                                <div key={index} className="bg-gray-50 border border-gray-200 rounded p-2">
                                                                    <div className="text-xs font-medium text-gray-800">
                                                                        {entry.action.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} by {entry.user_name}
                                                                    </div>
                                                                    {entry.comment && (
                                                                        <div className="text-xs text-gray-700 mt-1">{entry.comment}</div>
                                                                    )}
                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                        {dayjs(entry.timestamp).format('MMM D, YYYY [at] h:mm A')}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                {showActions && (req.workflow_state === 'adviser-review' || req.workflow_state === 'submitted') && (
                                                    <div className="flex gap-2 pt-2 border-t">
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
                                                            className="bg-green-600 hover:bg-green-700"
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