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
  Signature            // <-- added
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import TableDefenseRequests from './table-defense-requests';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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

  const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>(initial || []);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const [tab, setTab] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [pageByTab, setPageByTab] = useState<{ [k: string]: number }>({ pending: 1, rejected: 1, approved: 1 });

  const [selectedByTab, setSelectedByTab] = useState<{ [k: string]: number[] }>({ pending: [], rejected: [], approved: [] });

  const [columns, setColumns] = useState<Record<string, boolean>>({
    title: true,
    presenter: true,
    date: true,
    mode: true,
    type: true,
    priority: true
  });

  // Bulk status confirm (single-row actions removed)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'retrieve' | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const page = pageByTab[tab];
  const setPage = (p: number) => setPageByTab(prev => ({ ...prev, [tab]: p }));

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
        // Do NOT filter out adviser-approved anymore.
        // (If you still want to hide impossible states you can do it here.)
        setDefenseRequests(data);
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

  const tabRequests = {
    pending: sorted.filter(r => r.status === 'Pending'),
    rejected: sorted.filter(r => r.status === 'Rejected'),
    approved: sorted.filter(r => r.status === 'Approved')
  };

  const totalPages = Math.max(1, Math.ceil(tabRequests[tab].length / 10));
  const pagedRequests = {
    pending: tabRequests.pending.slice((pageByTab.pending - 1) * 10, pageByTab.pending * 10),
    rejected: tabRequests.rejected.slice((pageByTab.rejected - 1) * 10, pageByTab.rejected * 10),
    approved: tabRequests.approved.slice((pageByTab.approved - 1) * 10, pageByTab.approved * 10)
  };

  const pendingCount = tabRequests.pending.length;
  const rejectedCount = tabRequests.rejected.length;
  const approvedCount = tabRequests.approved.length;

  const selected = selectedByTab[tab] || [];
  const setSelected = (arr: number[]) => setSelectedByTab(prev => ({ ...prev, [tab]: arr }));
  const headerChecked = selected.length === pagedRequests[tab].length && pagedRequests[tab].length > 0;

  const toggleSelectAll = () => setSelected(headerChecked ? [] : pagedRequests[tab].map(r => r.id));
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
      if (res.ok) {
        setDefenseRequests(prev => prev.map(r => (selected.includes(r.id) ? { ...r, status: status as any } : r)));
        selected.forEach(id => updateLocalStatus(id, status as any));
        setSelected([]);
        toast.success('Bulk updated');
      } else toast.error('Bulk update failed');
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

  return (
    <div className="p-2 flex flex-col gap-2 min-h-screen bg-background overflow-x-hidden">
      <Head title="Defense Requests Management" />
      <Toaster richColors position="bottom-right" />

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
              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                <Signature className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  Approving this defense request will mean you allow the use of your signature
                  for the required official defense documents.
                </span>
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
              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                <Signature className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  Approving these defense requests will mean you allow the use of your signature
                  for their official defense documents.
                </span>
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

      <Card className="flex flex-col border-none shadow-none p-1 flex-1 min-h-0">
        <div className="flex flex-wrap items-center">
          <Tabs value={tab} onValueChange={v => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="pending"><Clock4 /> Pending <Badge className="ml-1" variant="secondary">{pendingCount}</Badge></TabsTrigger>
              <TabsTrigger value="rejected"><XCircle /> Rejected <Badge className="ml-1" variant="secondary">{rejectedCount}</Badge></TabsTrigger>
              <TabsTrigger value="approved"><CheckCircle /> Approved <Badge className="ml-1" variant="secondary">{approvedCount}</Badge></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Ensure internal scrolling containers manage overflow, not the page */}
          {/* Toolbar */}
            <div className="flex items-center justify-between mt-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-2 h-8 text-sm w-[230px]"
                  />
                  <Search className="absolute right-2 top-1.5 h-4 w-4 text-muted-foreground" />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1">
                      <CirclePlus /> Priority
                      {priorityFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-2 py-0.5 rounded-full text-xs">
                          {priorityFilter.length > 1 ? `${priorityFilter.length} selected` : priorityFilter[0]}
                        </Badge>
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
                    <Separator className="my-2" />
                    <Button size="sm" variant="ghost" className="w-full" onClick={() => setPriorityFilter([])}>
                      <X size={14} /> Clear
                    </Button>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1">
                      <CirclePlus /> Type
                      {typeFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-2 py-0.5 rounded-full text-xs">
                          {typeFilter.length > 1 ? `${typeFilter.length} selected` : typeFilter[0]}
                        </Badge>
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
                    <Separator className="my-2" />
                    <Button size="sm" variant="ghost" className="w-full" onClick={() => setTypeFilter([])}>
                      <X size={14} /> Clear
                    </Button>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1">
                      <CalendarIcon size={14} />
                      Date
                      {dateRange?.from && dateRange?.to && (
                        <Badge variant="secondary" className="ml-1 px-2 py-0.5 rounded-full text-xs">
                          {`${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`}
                        </Badge>
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

                {(priorityFilter.length > 0 || typeFilter.length > 0 || dateRange?.from) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 flex items-center gap-1"
                    onClick={() => {
                      setPriorityFilter([]);
                      setTypeFilter([]);
                      setDateRange(undefined);
                    }}
                  >
                    <X size={14} /> Reset
                  </Button>
                )}
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3">
                    <Settings2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1" side="bottom" align="end">
                  {[
                    { key: 'title', label: 'Title' },
                    { key: 'presenter', label: 'Presenter' },
                    { key: 'date', label: 'Scheduled Date' },
                    { key: 'mode', label: 'Mode' },
                    { key: 'type', label: 'Type' },
                    { key: 'priority', label: 'Priority' }
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
                        priority: true
                      })
                    }
                  >
                    Show all
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

          {/* Floating bulk bar */}
          {selected.length > 0 && (tab === 'pending' || tab === 'rejected') && (
            <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white border shadow-lg rounded-lg px-4 py-1 text-xs dark:bg-muted">
              <span className="font-semibold">{selected.length} selected</span>
              <Separator orientation="vertical" className="h-5 mx-2" />
              <div className="flex gap-1">
                {tab === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={() => openConfirmBulk('approve')}>
                      <CheckCircle size={14} className="text-green-500" /> <span className="hidden sm:inline ml-1">Approve</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={() => openConfirmBulk('reject')}>
                      <XCircle size={14} className="text-red-500" /> <span className="hidden sm:inline ml-1">Reject</span>
                    </Button>
                  </>
                )}
                {tab === 'rejected' && (
                  <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={() => openConfirmBulk('retrieve')}>
                    <CircleArrowLeft size={14} className="text-blue-500" /> <span className="hidden sm:inline ml-1">Retrieve</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={() => setConfirmBulkDelete(true)}>
                  <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={handleBulkPrint}>
                  <Printer size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-auto px-2" onClick={() => setSelected([])}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading defense requests...</p>
              </div>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsContent value="pending" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Card className="border-none shadow-none p-1 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 flex flex-col min-h-0">
                      <TableDefenseRequests
                        paged={pagedRequests.pending}
                        columns={columns}
                        selected={selected}
                        toggleSelectOne={toggleSelectOne}
                        headerChecked={headerChecked}
                        toggleSelectAll={toggleSelectAll}
                        toggleSort={toggleSort}
                        sortDir={sortDir}
                        onPriorityChange={onPriorityChange}
                        tabType="pending"
                        onRowApprove={id => openConfirmSingle(id,'approve')}
                        onRowReject={id => openConfirmSingle(id,'reject')}
                        onViewDetails={id => router.visit(`/coordinator/defense-requests/${id}/details`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rejected" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Card className="border-none shadow-none p-1 flex-1 flex flex-col min-h-0">
                  <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0">
                      <TableDefenseRequests
                        paged={pagedRequests.rejected}
                        columns={columns}
                        selected={selected}
                        toggleSelectOne={toggleSelectOne}
                        headerChecked={headerChecked}
                        toggleSelectAll={toggleSelectAll}
                        toggleSort={toggleSort}
                        sortDir={sortDir}
                        onPriorityChange={onPriorityChange}
                        tabType="rejected"
                        onRowRetrieve={id => openConfirmSingle(id,'retrieve')}
                        onViewDetails={id => router.visit(`/coordinator/defense-requests/${id}/details`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approved" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Card className="border-none shadow-none p-1 flex-1 flex flex-col min-h-0">
                  <CardContent className="ps-0 pe-0 flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0">
                      <TableDefenseRequests
                        paged={pagedRequests.approved}
                        columns={{ ...columns, progress: true }}
                        selected={selected}
                        toggleSelectOne={toggleSelectOne}
                        headerChecked={headerChecked}
                        toggleSelectAll={toggleSelectAll}
                        toggleSort={toggleSort}
                        sortDir={sortDir}
                        onPriorityChange={onPriorityChange}
                        tabType="approved"
                        onViewDetails={id => router.visit(`/coordinator/defense-requests/${id}/details`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
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