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
    CircleX,
    X,
    Printer
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
import { SummaryCards } from './summary-cards';
import { Badge } from "@/components/ui/badge";
import PrintSelected from "./print-selected";

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
    last_status_updated_by?: string;
    last_status_updated_at?: string;
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
        return Array.isArray(sorted) ? sorted.slice(start, start + perPage) : [];
    }, [sorted, page]);

    function formatLocalDateTime(isoString?: string) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString();
    }

    const headerChecked =
        selected.length === paged.length;

    const toggleSelectAll = () =>
        setSelected((s) =>
            s.length === paged.length ? [] : paged.map((r: DefenseRequestSummary) => r.id)
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

   
    const onStatusChange = async (id: number, status: string): Promise<void> => {
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
           
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest((prev) => prev ? {
                    ...prev,
                    status: data.status,
                    last_status_updated_by: data.last_status_updated_by,
                    last_status_updated_at: data.last_status_updated_at,
                } : prev);
            }
            toast.success('Status updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update status', { position: 'bottom-right' });
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
         
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest((prev) => prev ? {
                    ...prev,
                    priority: data.priority,
                    last_status_updated_by: data.last_status_updated_by,
                    last_status_updated_at: data.last_status_updated_at,
                } : prev);
            }
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
        } catch (e) {
            console.warn('Bulk status raw response (parse error):', raw);
        }
        console.log('Bulk status response:', { raw, updated });
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
            toast.success('Status updated!', { position: 'bottom-right' });
            setTimeout(() => {
                console.log('DefenseRequests after bulk update:', defenseRequests);
            }, 100);
        } else {
            if (parsed && updated && updated.error) {
                errorMsg = updated.error;
            } else {
                errorMsg = 'Failed to update status';
            }
            toast.error(errorMsg, { position: 'bottom-right' });
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
            const updated = await res.json();
            setDefenseRequests((requests) =>
                requests.map((request) => {
                    if (Array.isArray(updated)) {
                        const found = updated.find((u: any) => u.id === request.id);
                        if (found) {
                            return {
                                ...request,
                                priority: found.priority,
                                last_status_updated_by: found.last_status_updated_by,
                                last_status_updated_at: found.last_status_updated_at,
                            };
                        }
                    }
                 
                    if (selected.includes(request.id)) {
                        return {
                            ...request,
                            priority: priority,
                            last_status_updated_by: updated?.last_status_updated_by ?? request.last_status_updated_by,
                            last_status_updated_at: updated?.last_status_updated_at ?? request.last_status_updated_at,
                        };
                    }
                    return request;
                }) as DefenseRequestSummary[]
            );
            setSelectedRequest((prev) => {
                if (prev && selected.includes(prev.id)) {
                    if (Array.isArray(updated)) {
                        const found = updated.find((u: any) => u.id === prev.id);
                        if (found) {
                            return {
                                ...prev,
                                priority: found.priority,
                                last_status_updated_by: found.last_status_updated_by,
                                last_status_updated_at: found.last_status_updated_at,
                            };
                        }
                    }
                 
                    return {
                        ...prev,
                        priority: priority,
                        last_status_updated_by: updated?.last_status_updated_by ?? prev.last_status_updated_by,
                        last_status_updated_at: updated?.last_status_updated_at ?? prev.last_status_updated_at,
                    };
                }
                return prev;
            });
            setSelected([]);
            toast.success('Bulk priority updated!', { position: 'bottom-right' });
        } else {
            toast.error('Failed to update priority', { position: 'bottom-right' });
        }
    };

    const handleStatusChange = async (id: number, status: string): Promise<void> => {
        setConfirmDialog({ open: true, type: 'status', id, value: status });
    };
    const handlePriorityChange = async (id: number, priority: string): Promise<void> => {
        setConfirmDialog({ open: true, type: 'priority', id, value: priority });
    };
    const handleBulkStatus = (status: string) => {
        setConfirmDialog({ open: true, type: 'bulk-status', value: status });
    };
    const handleBulkPrint = () => {
        const selectedRows = defenseRequests.filter(r => selected.includes(r.id));
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Graduate School Defense Requests</title>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background: #f5f5f5; }
                  </style>
                </head>
                <body>
                  <div id="print-root"></div>
                </body>
              </html>
            `);
            printWindow.document.close();

            // Render the PrintSelected component to HTML and inject
            import("react-dom/server").then(({ renderToStaticMarkup }) => {
              const html = renderToStaticMarkup(<PrintSelected rows={selectedRows} />);
              printWindow.document.getElementById("print-root")!.innerHTML = html;
              setTimeout(() => printWindow.print(), 500);
            });
          }
        };

    const total = defenseRequests.length;
    const pending = defenseRequests.filter(r => r.status === "Pending").length;
    const inProgress = defenseRequests.filter(r => r.status === "In progress").length;
    const approved = defenseRequests.filter(r => r.status === "Approved").length;
    const rejected = defenseRequests.filter(r => r.status === "Rejected").length;

    return (
        <div className="h-screen p-2 flex flex-col gap-2">
             <SummaryCards
              total={total}
              pending={pending}
              inProgress={inProgress}
              approved={approved}
              rejected={rejected}
            />
            <Toaster position="top-right" richColors  />
           
            <Card className="flex-1 flex flex-col shadow-md  rounded-lg p-2">
                <div className="flex flex-wrap items-center justify-between px-2 pt-2">
                    <div className="flex flex-1 justify-between items-center flex-wrap gap-2 px-2 pt-2">
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    startIcon={Search}
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.currentTarget.value);
                                        setPage(1);
                                    }}
                                    className="pl-8 h-8 text-sm w-[300px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                
                               
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-md border-dashed text-xs h-8 px-3 flex items-center gap-1"
                                        >
                                            <CirclePlus /> Status
                                            {statusFilter.length > 0 && (
                                              <Badge
                                                variant="secondary"
                                                className="ml-1 px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground"
                                              >
                                                {statusFilter.length > 1
                                                  ? `${statusFilter.length} selected`
                                                  : statusFilter[0]}
                                              </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-44 p-1" side="bottom" align="start">
                                        {['Pending', 'In progress', 'Approved', 'Rejected'].map(
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
                                          <X/>  Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>

                            
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
                                           <X/> Clear Filters
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                                {(statusFilter.length > 0 || priorityFilter.length > 0) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 flex items-center gap-1"
                                    onClick={() => {
                                        setStatusFilter([]);
                                        setPriorityFilter([]);
                                    }}
                                    aria-label="Reset all filters"
                                >
                                    <X className="w-4 h-4 rose-500" />
                                    Reset
                                </Button>
                                )}
                            </div>
                        </div>

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
                                handleBulkStatus('Rejected');
                            }}
                        >
                            <CircleX size={12}  className='text-red-500'/> Mark as Rejected
                        </Button>
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                        </Button>
                           <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1" onClick={handleBulkPrint}>
                            <Printer size={12} /> Print
                        </Button>
                    </div>
                    <TableDefenseRequests
                        paged={paged}
                        columns={columns}
                        selected={selected}
                        toggleSelectOne={toggleSelectOne}
                        headerChecked={headerChecked}
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
                        formatLocalDateTime={formatLocalDateTime}
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
              <DialogContent className="max-w-sm p-6">
                <div className="space-y-3">
                  <div className="font-bold text-lg">
                    {confirmDialog.type === 'status' && 'Confirm Status Update'}
                    {confirmDialog.type === 'priority' && 'Confirm Priority Update'}
                    {confirmDialog.type === 'bulk-status' && 'Confirm Bulk Status Update'}
                    {confirmDialog.type === 'bulk-priority' && 'Confirm Bulk Priority Update'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {confirmDialog.type === 'status' && (
                      <>Change status to <span className="font-semibold">{confirmDialog.value}</span> for this request?</>
                    )}
                    {confirmDialog.type === 'priority' && (
                      <>Change priority to <span className="font-semibold">{confirmDialog.value}</span> for this request?</>
                    )}
                    {confirmDialog.type === 'bulk-status' && (
                      <>Update status to <span className="font-semibold">{confirmDialog.value}</span> for <span className="font-semibold">{selected.length}</span> selected requests?</>
                    )}
                    {confirmDialog.type === 'bulk-priority' && (
                      <>Update priority to <span className="font-semibold">{confirmDialog.value}</span> for <span className="font-semibold">{selected.length}</span> selected requests?</>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: null })}>
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
