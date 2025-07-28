'use client';

import { useState, useMemo, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Clock,
    CheckCircle,
    Trash2,
    Search,
    CirclePlus,
    Settings2,
    BadgeInfo,
    CircleX,
} from 'lucide-react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import TableDefenseRequests from './table-defense-requests';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {toast, Toaster} from 'sonner';

export type DefenseRequestSummary = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    program: string;
    thesis_title: string;
    date_of_defense: string;
    mode_defense: string;
    status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
    priority: 'Low' | 'Medium' | 'High'; 
};

export default function ShowAllRequests({
    defenseRequests: initialRequests,
}: {
    defenseRequests: DefenseRequestSummary[];
}) {
    const [defenseRequests, setDefenseRequests] = useState(initialRequests);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<number[]>([]);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [selectedRequest, setSelectedRequest] = useState<DefenseRequestSummary | null>(null);
    const [columns, setColumns] = useState<Record<string, boolean>>({
        title: true,
        presenter: true,
        date: true,
        mode: true,
        status: true,
        priority: true,
    });
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'status' | 'priority' | 'bulk-status' | 'bulk-priority' | null;
        id?: number;
        value?: string;
    }>({ open: false, type: null });

    const perPage = 10;

    useEffect(() => {
        setDefenseRequests(initialRequests);
    }, [initialRequests]);

    const filtered = useMemo(() => {
        let result = defenseRequests;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter((r) =>
                `${r.first_name} ${r.last_name} ${r.thesis_title}`
                    .toLowerCase()
                    .includes(q)
            );
        }
        if (statusFilter.length) {
            result = result.filter((r) =>
                statusFilter.includes(r.status || 'Pending')
            );
        }
        if (priorityFilter.length) {
            result = result.filter(
                (r) =>
                    r.priority &&
                    priorityFilter.includes(r.priority)
            );
        }
        return result;
    }, [search, statusFilter, priorityFilter, defenseRequests]);

    const sorted = useMemo(() => {
        if (!sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const ta = new Date(a.date_of_defense).getTime();
            const tb = new Date(b.date_of_defense).getTime();
            return sortDir === 'asc' ? ta - tb : tb - ta;
        });
    }, [filtered, sortDir]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paged = useMemo(() => {
        const start = (page - 1) * perPage;
        return sorted.slice(start, start + perPage);
    }, [sorted, page]);

    const headerChecked =
        selected.length === paged.length
            ? true
            : selected.length > 0
            ? 'indeterminate'
            : false;

    const toggleSelectAll = () =>
        setSelected((s) =>
            s.length === paged.length ? [] : paged.map((r) => r.id)
        );
    const toggleSelectOne = (id: number) =>
        setSelected((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
        );
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

   
    const onStatusChange = async (id: number, status: string) => {
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
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    request.id === id ? { ...request, status } : request
                ) as DefenseRequestSummary[]
            );
            toast.success('Status updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update status', { position: 'bottom-right' });
        }
    };

    const onPriorityChange = async (id: number, priority: string) => {
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
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    request.id === id ? { ...request, priority } : request
                ) as DefenseRequestSummary[]
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
        if (res.ok) {
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    selected.includes(request.id) ? { ...request, status } : request
                ) as DefenseRequestSummary[]
            );
            setSelected([]);
            toast.success('Status updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update status', { position: 'bottom-right' });
        }
    };

    const bulkUpdatePriority = async (priority: string) => {
        const res = await fetch('/defense-requests/bulk-priority', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({ ids: selected, priority }),
        });
        if (res.ok) {
            setDefenseRequests((requests) =>
                requests.map((request) =>
                    selected.includes(request.id) ? { ...request, priority } : request
                ) as DefenseRequestSummary[]
            );
            setSelected([]);
            toast.success('Bulk priority updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update priority', { position: 'bottom-right' });
        }
    };

    const handleStatusChange = (id: number, status: string) => {
        setConfirmDialog({ open: true, type: 'status', id, value: status });
    };
    const handlePriorityChange = (id: number, priority: string) => {
        setConfirmDialog({ open: true, type: 'priority', id, value: priority });
    };
    const handleBulkStatus = (status: string) => {
        setConfirmDialog({ open: true, type: 'bulk-status', value: status });
    };

    return (
        <div className="h-screen p-2 flex flex-col gap-2">
            <Toaster position="top-right" richColors  />
            <Card className="flex-1 flex flex-col rounded-lg p-2">
                <div className="flex flex-wrap items-center justify-between px-2 pt-2">
                    <div className="flex flex-1 justify-between items-center flex-wrap gap-2 px-2 pt-2">
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search…"
                                    startIcon={Search}
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.currentTarget.value);
                                        setPage(1);
                                    }}
                                    className="pl-8 h-8 text-sm w-[200px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3"
                                        >
                                            <CirclePlus /> Status
                                            {statusFilter.length > 0
                                                ? `: ${statusFilter.join(', ')}`
                                                : ''}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                        {['Pending', 'In progress', 'Approved', 'Rejected', 'Needs-info'].map(
                                            (s) => (
                                                <div
                                                    key={s}
                                                    onClick={() =>
                                                        setStatusFilter((fs) =>
                                                            fs.includes(s) ? fs.filter((x) => x !== s) : [...fs, s]
                                                        )
                                                    }
                                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                                >
                                                    <Checkbox checked={statusFilter.includes(s)} />
                                                    <span className="text-sm">{s.replace('-', ' ')}</span>
                                                </div>
                                            )
                                        )}
                                        <Separator className="my-2" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => setStatusFilter([])}
                                        >
                                            Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                                {/* Priority Filter */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3"
                                        >
                                            <CirclePlus /> Priority
                                            {priorityFilter.length > 0
                                                ? `: ${priorityFilter.join(', ')}`
                                                : ''}
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
                                            Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        {/* Column Visibility */}
                        <div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="rounded-md border-dashed text-xs h-8 px-3"
                                    >
                                        <Settings2 /> View
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" side="bottom" align="end">
                                    {[
                                        { key: 'title', label: 'Title' },
                                        { key: 'presenter', label: 'Presenter' },
                                        { key: 'date', label: 'Scheduled Date' },
                                        { key: 'mode', label: 'Mode' },
                                        { key: 'status', label: 'Status' },
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
                                                status: true,
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
                </div>
                <CardContent className="flex-1 overflow-auto">
                    <Separator className='mb-2' />
                    <div className="flex gap-1 pb-2 flex-wrap text-xs">
                        <Button
                            variant="outline"
                            className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1"
                            onClick={() => {
                                if (selected.length === 0) return;
                                handleBulkStatus('In progress');
                            }}
                        >
                        <Clock size={12} /> Mark as In Progress
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1"
                            onClick={() => {
                                if (selected.length === 0) return;
                                handleBulkStatus('Approved');
                            }}
                        >
                            <CheckCircle size={12} className='text-green-500' /> Mark as Approved
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1"
                            onClick={() => {
                                if (selected.length === 0) return;
                                handleBulkStatus('Needs-info');
                            }}
                        >
                            <BadgeInfo size={12}  className='text-blue-500'/> Mark as Needs Info
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1"
                            onClick={() => {
                                if (selected.length === 0) return;
                                handleBulkStatus('Rejected');
                            }}
                        >
                            <CircleX size={12}  className='text-red-500'/> Mark as Rejected
                        </Button>
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                        </Button>
                    </div>
                    <TableDefenseRequests
                        paged={paged}
                        columns={columns}
                        selected={selected}
                        toggleSelectOne={toggleSelectOne}
                        headerChecked={headerChecked === 'indeterminate' ? false : headerChecked}
                        toggleSelectAll={toggleSelectAll}
                        toggleSort={toggleSort}
                        sortDir={sortDir}
                        setSelectedRequest={(r) => setSelectedRequest(r)}
                        setSelectedIndex={setSelectedIndex}
                        sorted={sorted}
                        selectedRequest={selectedRequest}
                        selectedIndex={selectedIndex}
                        onStatusChange={handleStatusChange}
                        onPriorityChange={handlePriorityChange}
                    />
                </CardContent>
                <CardFooter className="flex justify-between items-center text-sm px-2 pt-3 pb-2">
                    <div>
                        {filtered.length} request
                        {filtered.length !== 1 && 's'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Prev
                        </Button>
                        <span>
                            Page {page} / {totalPages}
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(c => ({ ...c, open }))}>
              <DialogContent>
                <div className="space-y-4">
                  <div className="text-lg font-semibold">
                    {confirmDialog.type === 'status' && `Change status to "${confirmDialog.value}"?`}
                    {confirmDialog.type === 'priority' && `Change priority to "${confirmDialog.value}"?`}
                    {confirmDialog.type === 'bulk-status' && `Update status to "${confirmDialog.value}" for all selected?`}
                    {confirmDialog.type === 'bulk-priority' && `Update priority to "${confirmDialog.value}" for all selected?`}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => setConfirmDialog({ open: false, type: null })}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      onClick={async () => {
                        setConfirmDialog({ open: false, type: null });
                        if (confirmDialog.type === 'status' && confirmDialog.id && confirmDialog.value)
                          await onStatusChange(confirmDialog.id, confirmDialog.value);
                        if (confirmDialog.type === 'priority' && confirmDialog.id && confirmDialog.value)
                          await onPriorityChange(confirmDialog.id, confirmDialog.value);
                        if (confirmDialog.type === 'bulk-status' && confirmDialog.value)
                          await bulkUpdateStatus(confirmDialog.value);
                        if (confirmDialog.type === 'bulk-priority' && confirmDialog.value)
                          await bulkUpdatePriority(confirmDialog.value);
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
        </div>
    );
}
