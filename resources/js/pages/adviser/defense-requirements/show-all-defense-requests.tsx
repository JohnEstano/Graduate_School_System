'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Paperclip, Search, X, CirclePlus } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { router } from '@inertiajs/react';
import { getProgramAbbreviation } from "@/utils/program-abbreviations";

type DefenseRequest = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    thesis_title: string;
    defense_type: string;
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
    adviser_status?: string;
    coordinator_status?: string;
};

function getDisplayName(req: DefenseRequest) {
    const middleInitial = req.middle_name ? `${req.middle_name[0].toUpperCase()}. ` : '';
    return `${req.first_name} ${middleInitial}${req.last_name}`;
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
    const [adviserStatusFilter, setAdviserStatusFilter] = useState<string[]>([]);
    const [coordinatorStatusFilter, setCoordinatorStatusFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [filtersOpen, setFiltersOpen] = useState<false | 'adviserStatus' | 'coordinatorStatus' | 'type'>(false);

    // Filtered requests by search and filters
    const filteredRequests = defenseRequests.filter(req => {
        const name = getDisplayName(req).toLowerCase();
        const thesis = req.thesis_title?.toLowerCase() || "";
        const q = search.toLowerCase();
        let match = name.includes(q) || thesis.includes(q);
        if (adviserStatusFilter.length) match = match && adviserStatusFilter.includes(req.adviser_status || '');
        if (coordinatorStatusFilter.length) match = match && coordinatorStatusFilter.includes(req.coordinator_status || '');
        if (typeFilter.length) match = match && typeFilter.includes(req.defense_type || '');
        return match;
    });

    return (
        <div className="flex flex-col flex-1 w-full min-h-[90vh] gap-2  pr-3 pl-0 relative overflow-x-hidden">
            {/* Header Card */}
            <div className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden mb-2">
                {/* Title & Description */}
                <div className="flex flex-row items-center justify-between w-full p-3 border-b border-border bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-900/30 border border-rose-500 dark:border-rose-400">
                            <Paperclip className="h-5 w-5 text-rose-400 dark:text-rose-300" />
                        </div>
                        <div>
                            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {title}
                            </span>
                            <span className="block text-xs text-muted-foreground dark:text-zinc-400">
                                {description}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Search and Filters Row */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            startIcon={Search}
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="max-w-xs text-sm h-8"
                        />
                        {/* Adviser Status filter */}
                        <Popover open={filtersOpen === 'adviserStatus'} onOpenChange={o => setFiltersOpen(o ? 'adviserStatus' : false)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                                >
                                    <CirclePlus className="h-4 w-4 mr-1" />
                                    Adviser Status
                                    {adviserStatusFilter.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                                            {adviserStatusFilter.length > 1 ? `${adviserStatusFilter.length} selected` : adviserStatusFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Pending', 'Endorsed', 'Rejected'].map(s => (
                                    <div
                                        key={s}
                                        onClick={() =>
                                            setAdviserStatusFilter(fs => fs.includes(s) ? fs.filter(x => x !== s) : [...fs, s])
                                        }
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                    >
                                        <Checkbox checked={adviserStatusFilter.includes(s)} />
                                        <span className="text-sm">{s}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdviserStatusFilter([])}>
                                    Clear
                                </Button>
                            </PopoverContent>
                        </Popover>
                        {/* Coordinator Status filter */}
                        <Popover open={filtersOpen === 'coordinatorStatus'} onOpenChange={o => setFiltersOpen(o ? 'coordinatorStatus' : false)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                                >
                                    <CirclePlus className="h-4 w-4 mr-1" />
                                    Coordinator Status
                                    {coordinatorStatusFilter.length > 0 && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                                            {coordinatorStatusFilter.length > 1 ? `${coordinatorStatusFilter.length} selected` : coordinatorStatusFilter[0]}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                {['Pending', 'Approved', 'Rejected'].map(s => (
                                    <div
                                        key={s}
                                        onClick={() =>
                                            setCoordinatorStatusFilter(fs => fs.includes(s) ? fs.filter(x => x !== s) : [...fs, s])
                                        }
                                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                    >
                                        <Checkbox checked={coordinatorStatusFilter.includes(s)} />
                                        <span className="text-sm">{s}</span>
                                    </div>
                                ))}
                                <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setCoordinatorStatusFilter([])}>
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
                        {(adviserStatusFilter.length > 0 || coordinatorStatusFilter.length > 0 || typeFilter.length > 0 || search.trim()) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 flex items-center gap-1"
                                onClick={() => {
                                    setAdviserStatusFilter([]);
                                    setCoordinatorStatusFilter([]);
                                    setTypeFilter([]);
                                    setSearch('');
                                }}
                            >
                                <X size={14} /> Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {/* Table content */}
            <div className="flex-1 flex flex-col gap-4 w-full min-h-0 overflow-x-hidden">
                <div className="flex flex-col w-full min-h-0 overflow-x-hidden">
                    <div className="relative w-full max-w-full">
                        <div className="w-full max-w-full">
                            <div className="overflow-x-auto w-full rounded-md border border-border bg-background">
                                <Table className="min-w-[900px] w-full text-sm table-auto">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-3 py-2 min-w-[220px] whitespace-nowrap">Thesis Title</TableHead>
                                            <TableHead className="px-3 py-2 min-w-[120px] whitespace-nowrap">Presenter</TableHead>
                                            <TableHead className="px-3 py-2 min-w-[100px] whitespace-nowrap">Program</TableHead>
                                            <TableHead className="px-3 py-2 min-w-[130px] text-center whitespace-nowrap">Submitted</TableHead>
                                            <TableHead className="px-3 py-2 min-w-[120px] text-center whitespace-nowrap">Adviser Status</TableHead>
                                            <TableHead className="px-3 py-2 min-w-[120px] text-center whitespace-nowrap">Coordinator Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.map(req => {
                                            return (
                                                <TableRow
                                                    key={req.id}
                                                    className="hover:bg-muted/40 cursor-pointer"
                                                    onClick={() => router.visit(`/adviser/defense-requirements/${req.id}/details`)}
                                                >
                                                    {/* Type badge before thesis title */}
                                                    <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle whitespace-nowrap max-w-[260px]" title={req.thesis_title}>
                                                        {req.defense_type && (
                                                            <Badge variant="outline" className="mr-2">{req.defense_type}</Badge>
                                                        )}
                                                        <span>{req.thesis_title}</span>
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle max-w-[140px] truncate" title={getDisplayName(req)}>
                                                        {getDisplayName(req)}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle max-w-[100px] truncate" title={getProgramAbbreviation(req.program)}>
                                                        {getProgramAbbreviation(req.program) || '—'}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap text-center align-middle max-w-[120px] truncate">
                                                        {req.created_at
                                                            ? dayjs(req.created_at).format('YYYY-MM-DD hh:mm A')
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-xs whitespace-nowrap text-center align-middle">
                                                        <Badge
                                                            className={
                                                                req.adviser_status === 'Endorsed'
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : req.adviser_status === 'Rejected'
                                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                                    : req.adviser_status === 'Pending'
                                                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                                            }
                                                        >
                                                            {req.adviser_status === 'Approved' ? 'Endorsed' : (req.adviser_status || '—')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-3 py-2 text-xs whitespace-nowrap text-center align-middle">
                                                        <Badge
                                                            className={
                                                                req.coordinator_status === 'Approved'
                                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                                    : req.coordinator_status === 'Rejected'
                                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                                    : req.coordinator_status === 'Pending'
                                                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                                            }
                                                        >
                                                            {req.coordinator_status || '—'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredRequests.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                    No defense requests found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* --- End Confirmation Dialog --- */}
        </div>
    );
}