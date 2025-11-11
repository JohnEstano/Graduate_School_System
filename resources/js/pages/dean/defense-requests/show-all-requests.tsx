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
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Link as LinkIcon,
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
  adviser?: string;
  coordinator_status?: 'Pending' | 'Approved' | 'Rejected' | null;
  dean_status?: 'Pending' | 'Approved' | 'Rejected' | null;
  aa_status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed' | null;
};

interface ShowAllRequestsProps {
  defenseRequests?: DefenseRequestSummary[];
  onStatusChange?: (id: number, newStatus: DefenseRequestSummary['status']) => void;
  withLayout?: boolean;
}

function PaginationBar({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex justify-between items-center gap-2 px-4 py-4 bg-background sticky bottom-0 z-10">
      <span className="text-sm font-medium">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button size="lg" variant="outline" disabled={page === 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="w-5 h-5" />
        </Button>
        <Button size="lg" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button size="lg" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button size="lg" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function ShowAllRequestsInner({ defenseRequests: initial, onStatusChange }: ShowAllRequestsProps) {
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

  const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>(() =>
    initial ? normalizeRequests(initial) : []
  );

  useEffect(() => {
    if (initial) setDefenseRequests(normalizeRequests(initial));
  }, [initial]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = useState(1);

  const [columns] = useState<Record<string, boolean>>({
    title: true,
    presenter: true,
    adviser: true,
    program: true,
    status: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch defense requests from dean endpoint
  const fetchDefenseRequests = useCallback(async () => {
    const toastId = toast.loading('Fetching defense requests...');
    setIsLoading(true);
    try {
      const response = await fetch('/dean/defense-requests/all-defense-requests');
      if (response.ok) {
        const data: DefenseRequestSummary[] = await response.json();
        setDefenseRequests(normalizeRequests(data));
        toast.success('Defense requests loaded!', { id: toastId });
      } else {
        toast.error('Failed to fetch defense requests', { id: toastId });
      }
    } catch {
      toast.error('Error fetching defense requests', { id: toastId });
    } finally {
      setIsLoading(false);
      setTimeout(() => toast.dismiss(toastId), 1000);
    }
  }, []);

  useEffect(() => {
    fetchDefenseRequests();
  }, [fetchDefenseRequests]);

  // Filtered and sorted requests
  const filtered = useMemo(() => {
    let result = defenseRequests;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (`${r.first_name} ${r.last_name} ${r.thesis_title}`).toLowerCase().includes(q)
      );
    }
    if (statusFilter.length) result = result.filter(r => statusFilter.includes(r.status));
    if (typeFilter.length) result = result.filter(r => typeFilter.includes(r.defense_type));
    if (dateRange?.from && dateRange?.to) {
      const start = startOfDay(dateRange.from);
      const end = endOfDay(dateRange.to);
      result = result.filter(r => {
        if (!r.date_of_defense) return true;
        const d = startOfDay(new Date(r.date_of_defense));
        return isWithinInterval(d, { start, end });
      });
    }
    return result;
  }, [search, statusFilter, typeFilter, defenseRequests, dateRange]);

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
  const toggleSort = () => setSortDir(d => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));

  const updateLocalStatus = (id: number, newStatus: DefenseRequestSummary['status']) => {
    setDefenseRequests(prev => prev.map(r => (r.id === id ? { ...r, status: newStatus } : r)));
    onStatusChange?.(id, newStatus);
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

  return (
    <>
      <Head title="Defense Requests - Dean" />
      <Toaster richColors position="bottom-right" />
      <div className="flex h-full flex-1 flex-col gap-2 overflow-auto rounded-xl pt-5 pr-3 pl-3 relative">

        {/* Header row */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden mb-2">
          <div className="flex flex-row dark:bg-zinc-900 items-center justify-between w-full p-3 border-b bg-white">
            <div className="flex dark:bg-zinc-900 items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900 border border-rose-500">
                <GraduationCap className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">
                  Defense Requests - Final Approval
                </span>
                <span className="block text-xs text-muted-foreground">
                  Review and approve defense requests with your signature. All defenses scheduled by coordinators appear here.
                </span>
              </div>
            </div>
          </div>
          {/* Search bar row with filters */}
          <div className="flex dark:bg-zinc-900 items-center justify-between gap-2 px-4 py-3 border-b bg-white">
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
              {/* Status filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1"
                  >
                    <CirclePlus className="h-4 w-4 mr-1" />
                    Status
                    {statusFilter.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted">
                        {statusFilter.length > 1 ? `${statusFilter.length} selected` : statusFilter[0]}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1" side="bottom" align="start">
                  {['Pending', 'Approved', 'Rejected'].map(s => (
                    <div
                      key={s}
                      onClick={() =>
                        setStatusFilter(fs => (fs.includes(s) ? fs.filter(x => x !== s) : [...fs, s]))
                      }
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox checked={statusFilter.includes(s)} />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setStatusFilter([])}>
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
              {(statusFilter.length > 0 || typeFilter.length > 0 || dateRange?.from || search.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => {
                    setStatusFilter([]);
                    setTypeFilter([]);
                    setDateRange(undefined);
                    setSearch('');
                  }}
                >
                  <X size={14} /> Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <TableDefenseRequests
            paged={paged}
            columns={columns}
            toggleSort={toggleSort}
            sortDir={sortDir}
            onPriorityChange={onPriorityChange}
            tabType={undefined}
            onViewDetails={(id: number) => router.visit(`/dean/defense-requests/${id}/details`)}
            hideActions={false}
            hideSelect={true}
          />
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}

export default function ShowAllRequests(props: ShowAllRequestsProps) {
  if (props.withLayout) {
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Defense Requests', href: '/dean/defense-requests' }
    ];
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ShowAllRequestsInner {...props} />
      </AppLayout>
    );
  }
  return <ShowAllRequestsInner {...props} />;
}
