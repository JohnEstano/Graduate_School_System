'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Paperclip, Search, CheckCircle, XCircle, CircleArrowLeft, Trash2, Printer, X, Signature, Filter, CirclePlus, File, Users, ArrowRightLeft } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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
    manuscript_proposal?: string;
    similarity_index?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    advisers_endorsement?: string;
    reference_no?: string;
    priority?: string;
};

function getDisplayName(req: DefenseRequest) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
}

function AttachmentLinks(req: DefenseRequest) {
    const files = [
        { key: 'manuscript_proposal', label: 'Manuscript' },
        { key: 'similarity_index', label: 'Similarity' },
        { key: 'rec_endorsement', label: 'REC Endorsement' },
        { key: 'proof_of_payment', label: 'Proof of Payment' },
        { key: 'advisers_endorsement', label: 'Adviser Endorsement' },
        { key: 'avisee_adviser_attachment', label: 'Avisee-Adviser File' },
    ];
    return (
        <div className="flex flex-wrap gap-2">
            {files.map(f =>
                req[f.key as keyof DefenseRequest] ? (
                    <a
                        key={f.key}
                        href={`/storage/${req[f.key as keyof DefenseRequest]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-50 border text-xs hover:bg-zinc-100 truncate max-w-[120px]"
                        onClick={e => e.stopPropagation()}
                        title={req[f.key as keyof DefenseRequest]?.toString().split('/').pop()}
                    >
                        <Paperclip className="h-3 w-3 text-rose-500" />
                        <span className="truncate">
                            {f.label}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[60px]">
                            {req[f.key as keyof DefenseRequest]?.toString().split('/').pop()}
                        </span>
                    </a>
                ) : null
            )}
        </div>
    );
}

type Coordinator = {
    name: string;
    email: string;
};

export default function ShowAllDefenseRequests({
    defenseRequests = [],
    coordinator,
    title = "All Defense Requirements",
    description = "Review, approve, or reject defense requests from your advisees"
}: {
    defenseRequests: DefenseRequest[];
    coordinator?: Coordinator | null;
    title?: string;
    description?: string;
}) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkAction, setBulkAction] = useState<null | 'approve' | 'reject' | 'retrieve'>(null);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [filtersOpen, setFiltersOpen] = useState<false | 'priority' | 'type'>(false);

    // Filtered requests by search
    const filteredRequests = defenseRequests.filter(req => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || "";
        const q = search.toLowerCase();
        let match = name.includes(q) || thesis.includes(q);
        if (priorityFilter.length) match = match && priorityFilter.includes(req.priority || '');
        if (typeFilter.length) match = match && typeFilter.includes(req.defense_type || '');
        return match;
    });

    // Bulk select helpers
    const headerChecked = selected.length === filteredRequests.length && filteredRequests.length > 0;
    const toggleSelectAll = () =>
        setSelected(headerChecked ? [] : filteredRequests.map(r => r.id));
    const toggleSelectOne = (id: number) =>
        setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

    // Print handler
    function handleBulkPrint() {
        const rows = defenseRequests.filter(r => selected.includes(r.id));
        const w = window.open('', '', 'height=900,width=1200');
        if (!w) return;
        w.document.write(`
          <html>
            <head>
              <title>Print Selected</title>
              <style>
                body{font-family:Arial;padding:32px}
                h1{font-size:18px;margin:0 0 16px}
                table{border-collapse:collapse;width:100%}
                th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}
              </style>
            </head>
            <body>
              <h1>Defense Requests</h1>
              <table>
                <thead><tr><th>ID</th><th>Title</th><th>Presenter</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  ${rows.map(r => `<tr>
                    <td>${r.id}</td>
                    <td>${r.thesis_title}</td>
                    <td>${r.first_name} ${r.last_name}</td>
                    <td>${r.defense_type}</td>
                    <td>${r.status}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
              <script>window.print()</script>
            </body>
          </html>
        `);
        w.document.close();
    }

    // Bulk approve/reject handlers (replace with your actual API logic)
    const handleBulkAction = async (action: 'approve' | 'reject' | 'retrieve') => {
        setBulkAction(null);
        setSelected([]);
    };

    // Bulk delete handler (replace with your actual API logic)
    const handleBulkDelete = async () => {
        setConfirmBulkDelete(false);
        setSelected([]);
    };

    // Table columns config (like coordinator)
    const columns = {
        title: true,
        presenter: true,
        adviser: true,
        program: true,
        type: true,
        submitted_at: true,
        status: true,
    };

    return (
        <div className="flex flex-col pb-5 w-full">
            {/* Relationship Card - now above the header */}
            <div className="flex justify-end mb-2">
                <div className="flex items-center gap-2 bg-black text-white rounded px-3 py-2 text-xs font-medium">
                    <span className="flex items-center gap-1">
                        Adviser <span className="font-semibold">(You)</span>
                    </span>
                    <ArrowRightLeft className="h-4 w-4 mx-2" />
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 mr-1" />
                        Coordinator
                        <span className="font-semibold ml-1">
                            {coordinator ? coordinator.name : <span className="italic text-zinc-300">No coordinator registered</span>}
                        </span>
                    </span>
                </div>
            </div>
            {/* Header Card */}
            <div className="w-full bg-white border border-zinc-200 rounded-lg overflow-hidden mb-4">
                <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
                    {/* Left: Title & Description */}
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
                            <File className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <span className="text-base font-semibold">
                                {title}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {description}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Search and Filters Row */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-white">
                    {/* Search input left */}
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            startIcon={Search}
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="max-w-xs text-sm py-1 h-8"
                        />
                        {/* Priority filter */}
                        <Popover open={filtersOpen === 'priority'} onOpenChange={o => setFiltersOpen(o ? 'priority' : false)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                                >
                                    <CirclePlus className="h-4 w-4 mr-1" />
                                    Priority
                                    {priorityFilter.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                                            {priorityFilter.length > 1 ? `${priorityFilter.length} selected` : priorityFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Low', 'Medium', 'High'].map(p => (
                                    <div
                                        key={p}
                                        onClick={() =>
                                            setPriorityFilter(fp => fp.includes(p) ? fp.filter(x => x !== p) : [...fp, p])
                                        }
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                    >
                                        <Checkbox checked={priorityFilter.includes(p)} />
                                        <span className="text-sm">{p}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setPriorityFilter([])}>
                                    Clear
                                </Button>
                            </PopoverContent>
                        </Popover>
                        {/* Type filter */}
                        <Popover open={filtersOpen === 'type'} onOpenChange={o => setFiltersOpen(o ? 'type' : false)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                                >
                                    <CirclePlus className="h-4 w-4 mr-1" />
                                    Type
                                    {typeFilter.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                                            {typeFilter.length > 1 ? `${typeFilter.length} selected` : typeFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Proposal', 'Prefinal', 'Final'].map(t => (
                                    <div
                                        key={t}
                                        onClick={() =>
                                            setTypeFilter(ft => ft.includes(t) ? ft.filter(x => x !== t) : [...ft, t])
                                        }
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                    >
                                        <Checkbox checked={typeFilter.includes(t)} />
                                        <span className="text-sm">{t}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setTypeFilter([])}>
                                    Clear
                                </Button>
                            </PopoverContent>
                        </Popover>
                        {/* Reset button */}
                        {(priorityFilter.length > 0 || typeFilter.length > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 flex items-center gap-1"
                                onClick={() => {
                                    setPriorityFilter([]);
                                    setTypeFilter([]);
                                }}
                            >
                                <X size={14} /> Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Responsive Table */}
            <div className="relative w-full max-w-full">
                <div className="overflow-x-auto w-full rounded-md border border-border bg-background">
                    <Table className="min-w-[900px] w-full text-sm table-auto">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] py-2">
                                    <Checkbox
                                        checked={headerChecked}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="px-3 min-w-[180px] whitespace-nowrap">Title</TableHead>
                                <TableHead className="px-2 min-w-[120px] whitespace-nowrap">Presenter</TableHead>
                                <TableHead className="px-2 min-w-[100px] whitespace-nowrap">Program</TableHead>
                                <TableHead className="text-center px-2 min-w-[90px] whitespace-nowrap">Type</TableHead>
                                <TableHead className="px-2 min-w-[130px] text-center whitespace-nowrap">Submitted</TableHead>
                                <TableHead className="px-2 min-w-[180px] whitespace-nowrap">Attachments</TableHead>
                                <TableHead className="px-2 min-w-[100px] text-center whitespace-nowrap">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map(req => {
                                const isSelected = selected.includes(req.id);
                                return (
                                    <TableRow key={req.id} className="hover:bg-muted/40">
                                        <TableCell className="px-2 py-2">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectOne(req.id)}
                                                className="action-btn"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </TableCell>
                                        <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle whitespace-nowrap max-w-[220px]" title={req.thesis_title}>
                                            {req.thesis_title}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle max-w-[140px] truncate" title={getDisplayName(req)}>
                                            {getDisplayName(req)}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle max-w-[100px] truncate">
                                            {req.program || '—'}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-center align-middle whitespace-nowrap">
                                            <Badge variant="outline">{req.defense_type || '—'}</Badge>
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap text-center align-middle max-w-[120px] truncate">
                                            {req.created_at
                                                ? dayjs(req.created_at).format('YYYY-MM-DD hh:mm A')
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="px-2 py-2 max-w-[180px] truncate">
                                            <AttachmentLinks {...req} />
                                        </TableCell>
                                        <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-center align-middle">
                                            <Badge
                                                className={
                                                    req.status === 'Approved'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : req.status === 'Rejected'
                                                        ? 'bg-red-100 text-red-700 border-red-200'
                                                        : req.status === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                                }
                                            >
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                        No defense requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- Floating Bulk Action Bar --- */}
            {selected.length > 0 && (
                <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white border border-border shadow-lg rounded-lg px-4 py-1 text-xs animate-in fade-in slide-in-from-bottom-2 dark:bg-muted dark:text-muted-foreground dark:border-border">
                    <span className="font-semibold min-w-[70px] text-center">{selected.length} selected</span>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                            onClick={() => setBulkAction('approve')}
                            aria-label="Approve"
                        >
                            <CheckCircle size={13} className="text-green-500" />
                            <span className="hidden sm:inline">Approve</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                            onClick={() => setBulkAction('reject')}
                            aria-label="Reject"
                        >
                            <XCircle size={13} className="text-red-500" />
                            <span className="hidden sm:inline">Reject</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                            onClick={() => setBulkAction('retrieve')}
                            aria-label="Retrieve"
                        >
                            <CircleArrowLeft size={13} className="text-blue-500" />
                            <span className="hidden sm:inline">Retrieve</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                            onClick={() => setConfirmBulkDelete(true)}
                            aria-label="Delete"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-1 py-1 h-7 w-auto text-xs flex items-center gap-1"
                            onClick={handleBulkPrint}
                            aria-label="Print"
                        >
                            <Printer size={13} />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="px-1 py-1 h-7 w-auto text-xs flex items-center"
                            onClick={() => setSelected([])}
                            aria-label="Clear selection"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            )}
            {/* --- End Floating Bulk Action Bar --- */}
        </div>
    );
}