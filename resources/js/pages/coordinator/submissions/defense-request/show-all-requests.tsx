'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { Head, router } from '@inertiajs/react';

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
  X,
  Printer,
  Calendar as CalendarIcon,
  XCircle,
  Clock4,
  CircleArrowLeft,
  Signature,
  Filter
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import TableDefenseRequests from './table-defense-requests';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export type DefenseRequestSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  thesis_title: string;
  date_of_defense?: string;
  scheduled_date?: string;       // backend name
  mode_defense?: string;
  defense_mode?: string;         // backend name
  defense_type: string;
  status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
  priority: 'Low' | 'Medium' | 'High';
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
};

interface ShowAllRequestsProps {
  defenseRequests?: DefenseRequestSummary[];
  onStatusChange?: (id: number, newStatus: DefenseRequestSummary['status']) => void;
  withLayout?: boolean;
}

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
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

function ShowAllRequestsInner({ defenseRequests: initial, onStatusChange }: ShowAllRequestsProps) {
  const [singleConfirm, setSingleConfirm] = useState<{open:boolean,id:number|null,action:'approve'|'reject'|'retrieve'|null}>({
    open:false,id:null,action:null
  });

  function getCsrfToken(): string {
    const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return el?.content || '';
  }

  const normalizeRequests = (list: DefenseRequestSummary[]) =>
    list.map(r => ({
      ...r,
      date_of_defense: r.date_of_defense || r.scheduled_date || undefined,
      mode_defense: r.mode_defense || r.defense_mode || undefined
    }));

  // 1. Initialize from props
  const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>(() =>
    initial ? normalizeRequests(initial) : []
  );

  // 2. Update local state if props change (e.g., after Inertia navigation)
  useEffect(() => {
    if (initial) setDefenseRequests(normalizeRequests(initial));
  }, [initial]);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = useState(1);

  const [selectedByTab, setSelectedByTab] = useState<{ [k: string]: number[] }>({ pending: [], rejected: [], approved: [] });

  // Update columns state to reflect new columns for each tab
  const [columns, setColumns] = useState<Record<string, boolean>>({
    title: true,
    presenter: true,
    adviser: true,      // Added
    submitted_at: true, // Added
    program: true,      // Added
    date: true,
    mode: true,
    type: true,
    priority: true
  });

  // Helper to get columns per tab
  function getColumnsForTab(tab: 'pending' | 'rejected' | 'approved') {
    if (tab === 'pending' || tab === 'rejected') {
      return {
        title: columns.title,
        presenter: columns.presenter,
        adviser: columns.adviser,
        submitted_at: columns.submitted_at,
        program: columns.program,
        type: columns.type,
        priority: columns.priority
      };
    }
    // Approved tab: keep all columns
    return columns;
  }

  // Bulk status confirm (single-row actions removed)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'retrieve' | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Include ALL states that can still need coordinator action.
  // (If a new state appears we still keep it because we don't hard‑filter now.)
  const PENDING_STATES = new Set([
    'submitted',
    'adviser-review',
    'adviser-approved',
    'coordinator-review',
    'needs-info'
  ]);

  // NOTE: We no longer drop items by workflow_state on the frontend;
  // we rely on the backend "status" normalization.
  const fetchDefenseRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/coordinator/defense-requests/all-defense-requests');
      if (response.ok) {
        const data: DefenseRequestSummary[] = await response.json();
        setDefenseRequests(normalizeRequests(data));
      } else {
        toast.error('Failed to fetch defense requests');
      }
    } catch {
      toast.error('Error fetching defense requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initial) fetchDefenseRequests();
  }, [fetchDefenseRequests, initial]);

  // Filtered and sorted requests (all in one)
  const filtered = useMemo(() => {
    let result = defenseRequests;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (`${r.first_name} ${r.last_name} ${r.thesis_title}`).toLowerCase().includes(q)
      );
    }
    if (priorityFilter.length) result = result.filter(r => r.priority && priorityFilter.includes(r.priority));
    if (typeFilter.length) result = result.filter(r => typeFilter.includes(r.defense_type));
    if (dateRange?.from && dateRange?.to) {
      const start = startOfDay(dateRange.from);
      const end = endOfDay(dateRange.to);
      result = result.filter(r => {
        if (!r.date_of_defense) return false;
        const d = startOfDay(new Date(r.date_of_defense));
        return isWithinInterval(d, { start, end });
      });
    }
    return result;
  }, [search, priorityFilter, typeFilter, defenseRequests, dateRange]);

  const sorted = useMemo(() => {
    if (!sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const ta = a.date_of_defense ? new Date(a.date_of_defense).getTime() : 0;
      const tb = b.date_of_defense ? new Date(b.date_of_defense).getTime() : 0;
      return sortDir === 'asc' ? ta - tb : tb - ta;
    });
  }, [filtered, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / 10));
  const paged = sorted.slice((page - 1) * 10, page * 10);

  const selected = selectedByTab['all'] || [];
  const setSelected = (arr: number[]) => setSelectedByTab(prev => ({ ...prev, all: arr }));
  const headerChecked = selected.length === paged.length && paged.length > 0;
  const toggleSelectAll = () => setSelected(headerChecked ? [] : paged.map(r => r.id));
  const toggleSelectOne = (id: number) => setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const toggleSort = () => setSortDir(d => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
  const toggleColumn = (key: string) => setColumns(cols => ({ ...cols, [key]: !cols[key] }));

  const updateLocalStatus = (id: number, newStatus: DefenseRequestSummary['status']) => {
    setDefenseRequests(prev => prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)));
    onStatusChange?.(id, newStatus);
  };

  const bulkUpdateStatus = async (status: string) => {
    try {
      const res = await fetch('/defense-requests/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json'
        },
        body: JSON.stringify({ ids: selected, status })
      });
      const data = await res.json();
      if (res.ok && data.updated_ids) {
        setDefenseRequests(prev =>
          prev.map(r =>
            data.updated_ids.includes(r.id) ? { ...r, status: data.status as DefenseRequestSummary['status'] } : r
          )
        );
        setSelected([]);
        toast.success('Bulk updated');
      } else {
        toast.error(data?.error || 'Bulk update failed');
      }
    } catch {
      toast.error('Bulk update error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetch('/defense-requests/bulk-remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json'
        },
        body: JSON.stringify({ ids: selected })
      });
      const data = await res.json();
      if (res.ok) {
        setDefenseRequests(prev => prev.filter(r => !selected.includes(r.id)));
        setSelected([]);
        toast.success('Deleted');
      } else toast.error(data?.error || 'Delete failed');
    } catch {
      toast.error('Delete error');
    }
  };

  function openConfirmBulk(action: 'approve' | 'reject' | 'retrieve') {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  }

  const handleConfirmBulk = async () => {
    if (!confirmAction || selected.length === 0) {
      setConfirmDialogOpen(false);
      return;
    }
    let newStatus: DefenseRequestSummary['status'] = 'Pending';
    if (confirmAction === 'approve') newStatus = 'Approved';
    else if (confirmAction === 'reject') newStatus = 'Rejected';
    else if (confirmAction === 'retrieve') newStatus = 'Pending';
    await bulkUpdateStatus(newStatus);
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    toast.success(`Updated to ${newStatus}`);
  };

  const onPriorityChange = async (id: number, priority: string) => {
    try {
      const res = await fetch(`/defense-requests/${id}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json'
        },
        body: JSON.stringify({ priority })
      });
      if (res.ok) {
        setDefenseRequests(prev => prev.map(r => (r.id === id ? { ...r, priority: priority as any } : r)));
        toast.success('Priority updated');
      } else toast.error('Failed to update priority');
    } catch {
      toast.error('Error updating priority');
    }
  };

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
            <thead><tr><th>ID</th><th>Title</th><th>Presenter</th><th>Type</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              ${rows.map(r => `<tr>
                <td>${r.id}</td>
                <td>${r.thesis_title}</td>
                <td>${r.first_name} ${r.last_name}</td>
                <td>${r.defense_type}</td>
                <td>${r.priority}</td>
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

  const updateOneStatus = useCallback(async (id: number, status: DefenseRequestSummary['status']) => {
    try {
      const res = await fetch(`/defense-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          Accept: 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setDefenseRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        onStatusChange?.(id, status);
        toast.success(`Request #${id} set to ${status}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    }
  }, [onStatusChange]);

  function openConfirmSingle(id:number, action:'approve'|'reject'|'retrieve') {
    setSingleConfirm({open:true,id,action});
  }

  async function handleSingleConfirm() {
    if (!singleConfirm.id || !singleConfirm.action) {
      setSingleConfirm({open:false,id:null,action:null});
      return;
    }
    let newStatus: DefenseRequestSummary['status'] = 'Pending';
    if (singleConfirm.action === 'approve') newStatus = 'Approved';
    else if (singleConfirm.action === 'reject') newStatus = 'Rejected';
    else if (singleConfirm.action === 'retrieve') newStatus = 'Pending';
    await updateOneStatus(singleConfirm.id, newStatus);
    setSingleConfirm({open:false,id:null,action:null});
  }

  async function handleBulkStatusChange(newStatus: 'Pending' | 'Approved' | 'Rejected') {
    if (selected.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/defense-requests/bulk-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          ids: selected,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Update local state
        setDefenseRequests(prev =>
          prev.map(r =>
            selected.includes(r.id) ? { ...r, status: newStatus } : r
          )
        );
        setSelected([]); // Clear selection
      } else {
        // Handle error (show toast, etc.)
      }
    } catch (e) {
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Head title="Defense Requests" />
      <Toaster richColors position="bottom-right" />
      <div className="flex h-full flex-1 flex-col gap-2 overflow-auto rounded-xl pt-6 pr-3 pl-3 relative">

        {/* Header row */}
        <div className="w-full bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
                <Signature className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <span className="text-base font-semibold">
                  Defense Requests
                </span>
                <span className="block text-xs text-muted-foreground">
                  This section shows all defense requests. Search, filter, and manage requests.
                </span>
              </div>
            </div>
            {/* You can add a button here if needed */}
          </div>
          {/* Search bar row with filters */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                startIcon={Search}
                placeholder="Search..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="max-w-xs text-sm h-8"
                disabled={isLoading}
              />
              {/* Priority filter */}
              <Popover>
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
                        setPriorityFilter(fp => (fp.includes(p) ? fp.filter(x => x !== p) : [...fp, p]))
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
              <Popover>
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
                        setTypeFilter(ft => (ft.includes(t) ? ft.filter(x => x !== t) : [...ft, t]))
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
              {/* Date filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                  >
                    <CalendarIcon size={14} />
                    Date
                    {dateRange?.from && dateRange?.to && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                        {`${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" side="bottom" align="start">
                  <DatePicker mode="range" selected={dateRange} onSelect={setDateRange} />
                  <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setDateRange(undefined)}>
                    Clear Dates
                  </Button>
                </PopoverContent>
              </Popover>
              {/* Reset button */}
              {(priorityFilter.length > 0 || typeFilter.length > 0 || dateRange?.from || search.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => {
                    setPriorityFilter([]);
                    setTypeFilter([]);
                    setDateRange(undefined);
                    setSearch('');
                  }}
                >
                  <X size={14} /> Reset
                </Button>
              )}
            </div>
            {/* You can add a right-side button here if needed */}
          </div>
        </div>

        {/* Table and bulk bar */}
        {selected.length > 0 && (
          <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white border border-border shadow-lg rounded-lg px-4 py-1 text-xs animate-in fade-in slide-in-from-bottom-2 dark:bg-muted dark:text-muted-foreground dark:border-border">
            <span className="font-semibold min-w-[70px] text-center">{selected.length} selected</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => openConfirmBulk('approve')}
                aria-label="Approve"
                disabled={isLoading}
              >
                <CheckCircle size={13} className="text-green-500" />
                <span className="hidden sm:inline">{isLoading ? "Updating..." : "Approve"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => openConfirmBulk('reject')}
                aria-label="Reject"
                disabled={isLoading}
              >
                <XCircle size={13} className="text-red-500" />
                <span className="hidden sm:inline">{isLoading ? "Updating..." : "Reject"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => openConfirmBulk('retrieve')}
                aria-label="Retrieve"
                disabled={isLoading}
              >
                <CircleArrowLeft size={13} className="text-blue-500" />
                <span className="hidden sm:inline">{isLoading ? "Updating..." : "Retrieve"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => setConfirmBulkDelete(true)}
                aria-label="Delete"
                disabled={isLoading}
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">{isLoading ? "Deleting..." : "Delete"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={handleBulkPrint}
                aria-label="Print"
                disabled={isLoading}
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

        {/* Table */}
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <TableDefenseRequests
            paged={paged}
            columns={{
              title: columns.title,
              presenter: columns.presenter,
              adviser: columns.adviser,
              submitted_at: columns.submitted_at,
              program: columns.program,
              status: true,
              type: columns.type,
              priority: columns.priority
            }}
            selected={selected}
            toggleSelectOne={toggleSelectOne}
            headerChecked={headerChecked}
            toggleSelectAll={toggleSelectAll}
            toggleSort={toggleSort}
            sortDir={sortDir}
            onPriorityChange={onPriorityChange}
            onRowApprove={id => openConfirmSingle(id, 'approve')}
            onRowReject={id => openConfirmSingle(id, 'reject')}
            onRowRetrieve={id => openConfirmSingle(id, 'retrieve')}
            onViewDetails={id => router.visit(`/coordinator/defense-requests/${id}/details`)}
          />
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Single row confirm dialog */}
      <Dialog open={singleConfirm.open} onOpenChange={o => { if(!o) setSingleConfirm({open:false,id:null,action:null}); }}>
        <DialogContent>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            {singleConfirm.action === 'approve'
              ? 'Please review before approving.'
              : 'Apply this status change?'}
          </DialogDescription>
          <div className="mt-3 text-sm space-y-3">
            {singleConfirm.id && (
              <p>
                Request #{singleConfirm.id}: Set to{' '}
                <span className="font-semibold">
                  {singleConfirm.action === 'approve'
                    ? 'Approved'
                    : singleConfirm.action === 'reject'
                    ? 'Rejected'
                    : 'Pending'}
                </span>?
              </p>
            )}
            {singleConfirm.action === 'approve' && (
              <div className="flex flex-col items-center gap-3 rounded-md border bg-muted/40 p-5">
                <div className="rounded-full bg-primary/10 p-4">
                  <Signature className="h-14 w-14 text-primary" />
                </div>
                <p className="text-center text-sm leading-relaxed">
                  Approving this defense request authorizes the use of your signature
                  on the official defense documents.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSingleConfirm({open:false,id:null,action:null})}>Cancel</Button>
            <Button onClick={handleSingleConfirm}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={o => { if (!o) { setConfirmDialogOpen(false); setConfirmAction(null); } }}>
        <DialogContent>
          <DialogTitle>Status Update</DialogTitle>
          <DialogDescription>
            {confirmAction === 'approve'
              ? 'Review before bulk approval.'
              : 'Confirm the status change.'}
          </DialogDescription>
          <div className="space-y-3 mt-2 text-sm">
            <p>
              Update {selected.length} request{selected.length !== 1 && 's'} to{' '}
              <span className="font-semibold">
                {confirmAction === 'approve'
                  ? 'Approved'
                  : confirmAction === 'reject'
                  ? 'Rejected'
                  : 'Pending'}
              </span>?
            </p>
            {confirmAction === 'approve' && (
              <div className="flex flex-col items-center gap-3 rounded-md border bg-muted/40 p-5">
                <div className="rounded-full bg-primary/10 p-4">
                  <Signature className="h-14 w-14 text-primary" />
                </div>
                <p className="text-center text-sm leading-relaxed">
                  Approving these defense requests authorizes the use of your signature
                  on their official defense documents.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setConfirmDialogOpen(false); setConfirmAction(null); }}>Cancel</Button>
              <Button onClick={handleConfirmBulk}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirm */}
      <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <DialogContent>
          <DialogTitle>Delete Requests</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
          <div className="space-y-2 mt-2">
            <p className="text-sm">Delete {selected.length} selected request(s)?</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
              <Button variant="destructive" onClick={async () => { await handleBulkDelete(); setConfirmBulkDelete(false); }}>Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ShowAllRequests(props: ShowAllRequestsProps) {
  if (props.withLayout) {
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Defense Requests', href: '/defense-request' }
    ];
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ShowAllRequestsInner {...props} />
      </AppLayout>
    );
  }
  return <ShowAllRequestsInner {...props} />;
}