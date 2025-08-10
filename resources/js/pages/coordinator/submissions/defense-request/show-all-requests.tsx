'use client';

import { useState, useMemo, useEffect } from 'react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Toaster, toast } from 'sonner';
import React from "react";
import * as ReactDOMClient from "react-dom/client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    CheckCircle,
    Trash2,
    Search,
    CirclePlus,
    Settings2,
    CircleX,
    X,
    Printer,
    Calendar as CalendarIcon,
    XCircle,
    Clock4,
    CircleArrowLeft
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import TableDefenseRequests from './table-defense-requests';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import PrintSelected from "./print-selected";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getProgramAbbr } from './Index';
import { Progress } from "@/components/ui/progress";
import Details from './details';

export type DefenseRequestSummary = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    program: string;
    thesis_title: string;
    date_of_defense: string;
    mode_defense: string;
    defense_type: string;
    status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
    priority: 'Low' | 'Medium' | 'High';
    last_status_updated_by?: string;
    last_status_updated_at?: string;
};

type ConfirmDialogState = {
    open: boolean;
    type: 'single' | 'bulk' | null;
    ids: number[];
    action: 'approve' | 'reject' | 'retrieve' | null;
};

function PaginationBar({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (page: number) => void }) {
    return (
        <div className="flex justify-between items-center gap-2 px-4 py-2">
            <span className="text-xs">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPageChange(1)}>&laquo;</Button>
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>&lsaquo;</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>&rsaquo;</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>&raquo;</Button>
            </div>
        </div>
    );
}

export default function ShowAllRequests({
    defenseRequests: initialRequests,
    onStatusChange,
}: {
    defenseRequests: DefenseRequestSummary[];
    onStatusChange: (id: number, newStatus: DefenseRequestSummary["status"]) => void;
}) {
    const [defenseRequests, setDefenseRequests] = useState(initialRequests);
    const [search, setSearch] = useState('');
    const [pageByTab, setPageByTab] = useState<{ [key: string]: number }>({
      pending: 1,
      rejected: 1,
      approved: 1,
    });
    const [selectedByTab, setSelectedByTab] = useState<{ [key: string]: number[] }>({
        pending: [],
        rejected: [],
        approved: [],
    });
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [selectedRequest, setSelectedRequest] = useState<DefenseRequestSummary | null>(null);
    const [columns, setColumns] = useState<Record<string, boolean>>({
        title: true,
        presenter: true,
        date: true,
        mode: true,
        type: true,
        priority: true,
    });
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        open: false,
        type: null,
        ids: [],
        action: null,
    });

    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [tab, setTab] = useState<'pending' | 'rejected' | 'approved'>('pending');
    const page = pageByTab[tab];
    const setPage = (p: number) => setPageByTab(prev => ({ ...prev, [tab]: p }));

    useEffect(() => {
        setDefenseRequests(initialRequests);
    }, [initialRequests]);

    useEffect(() => {
      setPageByTab(prev => ({ ...prev, [tab]: 1 }));
      setSelectedByTab((prev) => ({ ...prev, [tab]: [] }));
      setSelectedRequest(null);
      setSelectedIndex(0);
    }, [tab]);

    const filtered = useMemo(() => {
        let result = defenseRequests;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((r) =>
                (`${r.first_name} ${r.last_name} ${r.thesis_title}`.toLowerCase())
                    .includes(q)
            );
        }
        if (priorityFilter.length) {
            result = result.filter(
                (r) =>
                    r.priority &&
                    priorityFilter.includes(r.priority)
            );
        }
        if (typeFilter.length) {
            result = result.filter((r) =>
                typeFilter.includes(r.defense_type)
            );
        }
        if (dateRange?.from && dateRange?.to) {
            const start = startOfDay(dateRange.from);
            const end = endOfDay(dateRange.to);
            result = result.filter((r) => {
                const d = startOfDay(new Date(r.date_of_defense));
                return isWithinInterval(d, { start, end });
            });
        }
        return result;
    }, [search, priorityFilter, typeFilter, defenseRequests, dateRange]);

    const sorted = useMemo(() => {
        if (!sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const ta = new Date(a.date_of_defense).getTime();
            const tb = new Date(b.date_of_defense).getTime();
            return sortDir === 'asc' ? ta - tb : tb - ta;
        });
    }, [filtered, sortDir]);

    const tabRequests = {
        pending: sorted.filter(r => r.status === "Pending"),
        rejected: sorted.filter(r => r.status === "Rejected"),
        approved: sorted.filter(r => r.status === "Approved"),
    };

    const totalPages = Math.max(1, Math.ceil(tabRequests[tab].length / 10));
    const pagedRequests = {
        pending: tabRequests.pending.slice((pageByTab['pending'] - 1) * 10, pageByTab['pending'] * 10),
        rejected: tabRequests.rejected.slice((pageByTab['rejected'] - 1) * 10, pageByTab['rejected'] * 10),
        approved: tabRequests.approved.slice((pageByTab['approved'] - 1) * 10, pageByTab['approved'] * 10),
    };
    const paged = pagedRequests[tab];
    const pending = defenseRequests.filter(r => r.status === "Pending").length;
    const approved = defenseRequests.filter(r => r.status === "Approved").length;
    const rejected = defenseRequests.filter(r => r.status === "Rejected").length;

   
    const selected = selectedByTab[tab] || [];
    const setSelected = (arr: number[]) => setSelectedByTab((prev) => ({ ...prev, [tab]: arr }));

    const headerChecked =
        selected.length === paged.length && paged.length > 0;

    const toggleSelectAll = () =>
        setSelected(selected.length === paged.length ? [] : paged.map((r: DefenseRequestSummary) => r.id));
    const toggleSelectOne = (id: number) =>
        setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    const toggleSort = () =>
        setSortDir((d) =>
            d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'
        );

    const toggleColumn = (key: string) => {
        setColumns((cols) => ({
            ...cols,
            [key]: !cols[key],
        }));
    };

    function getCsrfToken() {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
    }

    const onStatusChangeInternal = async (id: number, status: string): Promise<void> => {
        const res = await fetch(`/defense-requests/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            const data = await res.json();
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    request.id === id
                        ? {
                            ...request,
                            status: data.status,
                            last_status_updated_by: data.last_status_updated_by,
                            last_status_updated_at: data.last_status_updated_at,
                        }
                        : request
                )
            );
            setSelectedRequest((prev) =>
                prev && prev.id === id
                    ? {
                        ...prev,
                        status: data.status,
                        last_status_updated_by: data.last_status_updated_by,
                        last_status_updated_at: data.last_status_updated_at,
                    }
                    : prev
            );
        }
    };

    const onPriorityChange = async (id: number, priority: string): Promise<void> => {
        const res = await fetch(`/defense-requests/${id}/priority`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({ priority }),
        });
        if (res.ok) {
            const data = await res.json();
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    request.id === id
                        ? {
                            ...request,
                            priority: data.priority,
                            last_status_updated_by: data.last_status_updated_by,
                            last_status_updated_at: data.last_status_updated_at,
                        }
                        : request
                )
            );
            setSelectedRequest((prev) =>
                prev && prev.id === id
                    ? {
                        ...prev,
                        priority: data.priority,
                        last_status_updated_by: data.last_status_updated_by,
                        last_status_updated_at: data.last_status_updated_at,
                    }
                    : prev
            );
            toast.success('Priority updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update priority', { position: 'bottom-right' });
        }
    };

    const bulkUpdateStatus = async (status: string) => {
        const res = await fetch('/defense-requests/bulk-status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({ ids: selected, status }),
        });
        let updated = [];
        let parsed = false;
        let raw = '';
        let errorMsg = '';
        try {
            raw = await res.clone().text();
            updated = JSON.parse(raw);
            parsed = true;
        } catch (e) { }
        if (res.ok) {
            const fallbackBy = (window as any)?.currentUserName || 'You';
            const fallbackAt = new Date().toISOString();
            setDefenseRequests((requests) => {
                let newRequests;
                if (parsed && Array.isArray(updated)) {
                    newRequests = requests.map((request) => {
                        const found = updated.find((u) => u.id === request.id);
                        if (found) {
                            return {
                                ...request,
                                status: found.status,
                                last_status_updated_by: found.last_status_updated_by,
                                last_status_updated_at: found.last_status_updated_at,
                            };
                        }
                        return request;
                    });
                } else {
                    newRequests = requests.map((request) => {
                        if (selected.includes(request.id)) {
                            return {
                                ...request,
                                status: status,
                                last_status_updated_by: fallbackBy,
                                last_status_updated_at: fallbackAt,
                            };
                        }
                        return request;
                    });
                }
                return [...newRequests];
            });
            setSelectedRequest((prev) => {
                if (!prev) return prev;
                if (parsed && Array.isArray(updated)) {
                    const found = updated.find((u) => u.id === prev.id);
                    if (found) {
                        return {
                            ...prev,
                            status: found.status,
                            last_status_updated_by: found.last_status_updated_by,
                            last_status_updated_at: found.last_status_updated_at,
                        } as DefenseRequestSummary;
                    }
                }
                if (selected.includes(prev.id)) {
                    return {
                        ...prev,
                        status: status,
                        last_status_updated_by: fallbackBy,
                        last_status_updated_at: fallbackAt,
                    } as DefenseRequestSummary;
                }
                return prev;
            });
            setSelected([]);
        } else {
            if (parsed && updated && (updated as any).error) {
                errorMsg = (updated as any).error;
            } else {
                errorMsg = 'Failed to update status';
            }
            toast.error(errorMsg, { position: 'bottom-right' });
        }
    };

    function handleBulkPrint() {
      const rows = defenseRequests.filter(r => selected.includes(r.id));
      const printWindow = window.open('', '', 'height=900,width=1200');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Selected</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 32px; }
              </style>
            </head>
            <body>
              <div id="print-root"></div>
            </body>
          </html>
        `);
        printWindow.document.close();

      
        printWindow.onload = () => {
          const printRoot = printWindow.document.getElementById('print-root');
          if (printRoot) {
            ReactDOMClient.createRoot(printRoot).render(
              <PrintSelected rows={rows} />
            );
            setTimeout(() => {
              printWindow.print();
            }, 500);
          } else {
          
            printWindow.document.body.innerHTML = "<p>Failed to load print content.</p>";
          }
        };
      }
    }

    function formatLocalDateTime(dateString?: string) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // --- Confirmation dialog helpers ---
    function openConfirmSingle(id: number, action: 'approve' | 'reject' | 'retrieve') {
        setConfirmDialog({ open: true, type: 'single', ids: [id], action });
    }
    function openConfirmBulk(action: 'approve' | 'reject' | 'retrieve') {
        setConfirmDialog({ open: true, type: 'bulk', ids: selected, action });
    }

    async function handleConfirmDialog() {
        if (!confirmDialog.action || confirmDialog.ids.length === 0) return;
        let status: string;
        if (confirmDialog.action === 'approve') status = 'Approved';
        else if (confirmDialog.action === 'reject') status = 'Rejected';
        else status = 'Pending';

        if (confirmDialog.type === 'single') {
            await onStatusChangeInternal(confirmDialog.ids[0], status);
        } else if (confirmDialog.type === 'bulk') {
            await bulkUpdateStatus(status);
        }
        setConfirmDialog({ open: false, type: null, ids: [], action: null });
        setSelected([]);
        toast.success(
            `Request status has been successfully updated to ${status}.`,
            {
                description:
                    confirmDialog.ids.length > 1
                        ? `Updated ${confirmDialog.ids.length} requests.`
                        : undefined,
                duration: 4000,
                position: 'bottom-right',
            }
        );
    }

    function handleRequestStatusAction(id: number, action: 'approve' | 'reject' | 'retrieve') {
        setConfirmDialog({ open: true, type: 'single', ids: [id], action });
    }

    return (
        <div className="p-2 flex flex-col gap-2 min-h-screen bg-background">
            <Toaster richColors position="bottom-right" />
            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(s => ({ ...s, open }))}>
                <DialogContent>
                    <div className="space-y-2">
                        <div className="text-lg font-semibold">
                            Confirm Status Update
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This will update the selected request{confirmDialog.ids.length > 1 ? 's' : ''} to <span className="font-semibold">
                                {confirmDialog.action === 'approve' ? 'Approved' : confirmDialog.action === 'reject' ? 'Rejected' : 'Pending'}
                            </span>.
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setConfirmDialog({ open: false, type: null, ids: [], action: null })}>
                                Cancel
                            </Button>
                            <Button
                                variant={
                                    confirmDialog.action === 'reject'
                                        ? 'destructive'
                                        : 'default'
                                }
                                onClick={handleConfirmDialog}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Card className="flex flex-col border-none shadow-none p-1 flex-1 min-h-0">
                <div className="flex flex-wrap items-center justify-between ">
                    <div className="flex flex-1 justify-between items-center flex-wrap gap-2 ">
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    startIcon={Search}
                                    onChange={(e) => {
                                        setSearch(e.currentTarget.value);
                                        setPage(1);
                                    }}
                                    className="pl-8 h-8  text-sm w-[250px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1"
                                        >
                                            <CirclePlus /> Priority
                                            {priorityFilter.length > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground"
                                                >
                                                    {priorityFilter.length > 1
                                                        ? `${priorityFilter.length} selected`
                                                        : priorityFilter[0]}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                        {['Low', 'Medium', 'High'].map((p) => (
                                            <div
                                                key={p}
                                                onClick={() =>
                                                    setPriorityFilter((fp) =>
                                                        fp.includes(p) ? fp.filter((x) => x !== p) : [...fp, p]
                                                    )
                                                }
                                                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                            >
                                                <Checkbox checked={priorityFilter.includes(p)} />
                                                <span className="text-sm">
                                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                                </span>
                                            </div>
                                        ))}
                                        <Separator className="my-2" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => setPriorityFilter([])}
                                        >
                                            <X /> Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1"
                                        >
                                            <CirclePlus /> Type
                                            {typeFilter.length > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground"
                                                >
                                                    {typeFilter.length > 1
                                                        ? `${typeFilter.length} selected`
                                                        : typeFilter[0]}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                        {['Proposal', 'Prefinal', 'Final'].map(
                                            (t) => (
                                                <div
                                                    key={t}
                                                    onClick={() =>
                                                        setTypeFilter((ft) =>
                                                            ft.includes(t) ? ft.filter((x) => x !== t) : [...ft, t]
                                                        )
                                                    }
                                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                                >
                                                    <Checkbox checked={typeFilter.includes(t)} />
                                                    <span className="text-sm">{t}</span>
                                                </div>
                                            )
                                        )}
                                        <Separator className="my-2" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => setTypeFilter([])}
                                        >
                                            <X /> Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1"
                                        >
                                            <CalendarIcon size={14} />
                                            Date
                                            {dateRange?.from && dateRange?.to && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-1 px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground"
                                                >
                                                    {`${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" side="bottom" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full mt-2"
                                            onClick={() => setDateRange(undefined)}
                                        >
                                            <span>Clear Dates</span>
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                                {(priorityFilter.length > 0 || dateRange?.from || dateRange?.to || typeFilter.length > 0) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 flex items-center gap-1"
                                        onClick={() => {
                                            setTypeFilter([]);
                                            setPriorityFilter([]);
                                            setDateRange(undefined);
                                        }}
                                        aria-label="Reset all filters"
                                    >
                                        <X className="w-4 h-4 rose-500" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                       
                    </div>
                </div>
                <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0">
                    <div className="bg-white w-full max-w-full flex-1 flex flex-col overflow-auto min-h-0 relative">
                        {/* --- BULK BAR, filters, tabs, etc. --- */}
                        {selected.length > 0 && (tab === 'pending' || tab === 'rejected') && (
                            <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white border border-border shadow-lg rounded-lg px-4 py-1 text-xs animate-in fade-in slide-in-from-bottom-2">
                                <span className="font-semibold min-w-[70px] text-center">{selected.length} selected</span>
                                <Separator orientation="vertical" className="h-5 mx-1" />
                                <div className="flex gap-1">
                                    {tab === 'pending' && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                                                onClick={() => openConfirmBulk('approve')}
                                                aria-label="Mark as Approved"
                                            >
                                                <CheckCircle size={13} className="text-green-500" />
                                                <span className="hidden sm:inline">Approve</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className=" px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                                                onClick={() => openConfirmBulk('reject')}
                                                aria-label="Mark as Rejected"
                                            >
                                                <CircleX size={13} className="text-red-500" />
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </>
                                    )}
                                    {tab === 'rejected' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className=" px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                                            onClick={() => openConfirmBulk('retrieve')}
                                            aria-label="Mark as Pending"
                                        >
                                            <CircleArrowLeft size={13} className="text-blue-500" />
                                            <span className="hidden sm:inline">Retrieve</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className=" px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                                        // onClick={...}
                                        aria-label="Delete"
                                    >
                                        <Trash2 size={13} />
                                        <span className="hidden sm:inline">Delete</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className=" px-1 py-1 h-7 w-auto text-xs flex items-center gap-1"
                                        onClick={handleBulkPrint}
                                        aria-label="Print"
                                    >
                                        <Printer size={13} />
                                        <span className="hidden sm:inline">Print</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className=" px-1 py-1 h-7 w-auto text-xs flex items-center"
                                        onClick={() => setSelected([])}
                                        aria-label="Clear selection"
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Separator className="mb-2" />
                        <div className="flex items-center justify-between mb-2">
                            <Tabs value={tab} onValueChange={v => setTab(v as any)} className="">
                                <TabsList>
                                    <TabsTrigger value="pending">
                                        <Clock4 />  Pending <Badge className="ml-1 text-rose-500" variant="secondary" >{pending}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected">
                                        <XCircle />  Rejected <Badge className="ml-1" variant="secondary">{rejected}</Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="approved">
                                        <CheckCircle />  Approved <Badge className="ml-1" variant="secondary">{approved}</Badge>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3"
                                        >
                                            <Settings2 />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-1" side="bottom" align="end">
                                        {[
                                            { key: 'title', label: 'Title' },
                                            { key: 'presenter', label: 'Presenter' },
                                            { key: 'date', label: 'Scheduled Date' },
                                            { key: 'mode', label: 'Mode' },
                                            { key: 'type', label: 'Type' },
                                            { key: 'priority', label: 'Priority' },
                                        ].map(({ key, label }) => (
                                            <div
                                                key={key}
                                                onClick={() => toggleColumn(key)}
                                                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                            >
                                                <Checkbox checked={columns[key]} />
                                                <span className="text-sm">{label}</span>
                                            </div>
                                        ))}
                                        <Separator className="my-2" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() =>
                                                setColumns({
                                                    title: true,
                                                    presenter: true,
                                                    date: true,
                                                    mode: true,
                                                    type: true,
                                                    priority: true,
                                                })
                                            }
                                        >
                                            Show all
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full flex-1 flex flex-col min-h-0">
                            <TabsContent value="pending" className="flex-1 flex flex-col min-h-0">
                                <Card className="border-none shadow-none p-1 flex-1 flex flex-col min-h-0">
                                    <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0">
                                        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                                            <TableDefenseRequests
                                                key="pending"
                                                paged={pagedRequests['pending']}
                                                columns={columns}
                                                selected={selected}
                                                toggleSelectOne={toggleSelectOne}
                                                headerChecked={headerChecked}
                                                toggleSelectAll={toggleSelectAll}
                                                toggleSort={toggleSort}
                                                sortDir={sortDir}
                                                setSelectedRequest={setSelectedRequest}
                                                setSelectedIndex={setSelectedIndex}
                                                sorted={pagedRequests['pending']}
                                                selectedRequest={selectedRequest}
                                                selectedIndex={selectedIndex}
                                                onStatusChange={async (id, status) => {
                                                  if (status === 'Approved') openConfirmSingle(id, 'approve');
                                                  else if (status === 'Rejected') openConfirmSingle(id, 'reject');
                                                }}
                                                onPriorityChange={onPriorityChange}
                                                formatLocalDateTime={formatLocalDateTime}
                                                openDropdownId={openDropdownId}
                                                setOpenDropdownId={setOpenDropdownId}
                                                tabType="pending"
                                                onRowApprove={id => openConfirmSingle(id, 'approve')}
                                                onRowReject={id => openConfirmSingle(id, 'reject')}
                                                onRowRetrieve={id => openConfirmSingle(id, 'retrieve')}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="rejected" className="flex-1 flex flex-col min-h-0">
                                <Card className="border-none shadow-none p-1 flex-1 flex flex-col min-h-0">
                                    <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0">
                                        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                                            <TableDefenseRequests
                                                key="rejected"
                                                paged={pagedRequests['rejected']}
                                                columns={columns}
                                                selected={selected}
                                                toggleSelectOne={toggleSelectOne}
                                                headerChecked={headerChecked}
                                                toggleSelectAll={toggleSelectAll}
                                                toggleSort={toggleSort}
                                                sortDir={sortDir}
                                                setSelectedRequest={setSelectedRequest}
                                                setSelectedIndex={setSelectedIndex}
                                                sorted={pagedRequests['rejected']}
                                                selectedRequest={selectedRequest}
                                                selectedIndex={selectedIndex}
                                                onStatusChange={async (id, status) => {
                                                    if (status === 'Pending') openConfirmSingle(id, 'retrieve');
                                                }}
                                                onPriorityChange={onPriorityChange}
                                                formatLocalDateTime={formatLocalDateTime}
                                                openDropdownId={openDropdownId}
                                                setOpenDropdownId={setOpenDropdownId}
                                                tabType="rejected"
                                                onRowApprove={id => openConfirmSingle(id, 'approve')}
                                                onRowReject={id => openConfirmSingle(id, 'reject')}
                                                onRowRetrieve={id => openConfirmSingle(id, 'retrieve')}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="approved" className="flex-1 flex flex-col min-h-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                                    {pagedRequests['approved'].map((r, i) => (
                                        <Card key={r.id} className="border border-border shadow-none p-4 flex flex-col gap-2">
                                            <div className="font-semibold text-base truncate" title={r.thesis_title}>{r.thesis_title}</div>
                                            <div className="text-xs text-muted-foreground mb-1 truncate">
                                                {r.first_name} {r.middle_name ? `${r.middle_name[0]}. ` : ''}{r.last_name}
                                            </div>
                                            <div className="flex flex-nowrap gap-2 text-xs overflow-x-auto">
                                                <Badge variant="outline" className="truncate max-w-[100px]" title={r.defense_type}>{r.defense_type}</Badge>
                                                <Badge variant="outline" className="truncate max-w-[80px]" title={r.priority}>{r.priority}</Badge>
                                            </div>
                                        
                                            <div className="flex flex-col gap-1 mt-2">
                                                <span className="text-xs text-muted-foreground">Honorarium Status</span>
                                                <Progress value={40} className="w-full h-2" />
                                                <span className="text-xs text-muted-foreground mt-1 block">Processing...</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      setSelectedRequest(r);
                                                      setSelectedIndex(i);
                                                    }}
                                                >
                                                    Details
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {pagedRequests['approved'].length === 0 && (
                                        <div className="col-span-full text-center text-muted-foreground py-8">No approved requests.</div>
                                    )}
                                </div>
                            
                                <Dialog open={!!selectedRequest} onOpenChange={open => { if (!open) setSelectedRequest(null); }}>
                                  <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh]">
                                    <div className="max-h-[80vh] overflow-y-auto px-1">
                                      {selectedRequest && (
                                        <Details
                                          request={selectedRequest as any}
                                          onNavigate={dir => {
                                            const arr = pagedRequests[tab];
                                            const ni = dir === 'next' ? selectedIndex + 1 : selectedIndex - 1;
                                            if (ni >= 0 && ni < arr.length) {
                                              setSelectedRequest(arr[ni]);
                                              setSelectedIndex(ni);
                                            }
                                          }}
                                          disablePrev={selectedIndex === 0}
                                          disableNext={selectedIndex === pagedRequests[tab].length - 1}
                                          onStatusAction={handleRequestStatusAction}
                                          onPriorityChange={onPriorityChange}
                                        />
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                            </TabsContent>
                        </Tabs>
                        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
