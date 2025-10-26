import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Filter, Check, CheckCircle, CircleX, Info, ArrowUp, ArrowDown, ArrowUpDown, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
	AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
	AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import Details from './details';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UIC_PROGRAMS } from '@/constants/programs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';

export type CompreExamApplicationSummary = {
	id: number;
	first_name: string;
	middle_name: string | null;
	last_name: string;
	email: string | null;
	school_id: string | null;
	program: string | null;
	submitted_at: string | null;
	application_status: 'pending' | 'approved' | 'rejected';
	remarks?: string | null;
};

type Columns = { student: boolean; program: boolean; date: boolean; status: boolean; actions: boolean };

type Props = {
	paged: CompreExamApplicationSummary[];
	columns: Columns;
	tabType?: 'pending' | 'approved' | 'rejected';
	showStatusFilter?: boolean;
	programOptions?: string[];
	onApprove?: (id: number) => Promise<void> | void;
	onReject?: (id: number, reason: string) => Promise<void> | void;
	onApproveMany?: (ids: number[]) => Promise<void> | void;
	onRejectMany?: (ids: number[], reason: string) => Promise<void> | void;
	loading?: boolean;
	// Extra filters controlled by parent (optional)
	schoolYearOptions?: string[];
	schoolYearValue?: string;
	onSchoolYearChange?: (v: string) => void;
	fromDate?: Date | null;
	toDate?: Date | null;
	onFromDateChange?: (d: Date | null) => void;
	onToDateChange?: (d: Date | null) => void;
	hasRemarks?: 'all'|'yes'|'no';
	onHasRemarksChange?: (v: 'all'|'yes'|'no') => void;
	sortDir?: 'asc'|'desc';
	onSortDirChange?: (dir: 'asc'|'desc') => void;
	onResetFilters?: () => void;
};

export default function TableDeanCompreExam({
	paged, columns, tabType, showStatusFilter, programOptions,
	onApprove, onReject, onApproveMany, onRejectMany, loading,
	schoolYearOptions, schoolYearValue, onSchoolYearChange,
	fromDate, toDate, onFromDateChange, onToDateChange,
	hasRemarks, onHasRemarksChange, sortDir, onSortDirChange, onResetFilters,
}: Props) {
	const [selected, setSelected] = useState<number[]>([]);
	const [selectedRow, setSelectedRow] = useState<CompreExamApplicationSummary | null>(null);

	const [approveId, setApproveId] = useState<number | null>(null);
	const [rejectId, setRejectId] = useState<number | null>(null);
	const [rejectReason, setRejectReason] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const [approveManyOpen, setApproveManyOpen] = useState(false);
	const [rejectManyOpen, setRejectManyOpen] = useState(false);
	const [rejectManyReason, setRejectManyReason] = useState('');

	const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
	const [programFilter, setProgramFilter] = useState<string>('all');
	const [programOpen, setProgramOpen] = useState(false);
	const [showAllPrograms, setShowAllPrograms] = useState(false);
	const [sort, setSort] = useState<{ by: 'date' | null; dir: 'asc' | 'desc' }>({ by: 'date', dir: 'desc' });

	const { programsAvailable, programsAll } = useMemo(() => {
		const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
		const keepFirst = (names: (string | null | undefined)[]) => {
			const map = new Map<string, string>();
			for (const n of names) {
				if (!n) continue;
				const v = normalize(n);
				const key = v.toLowerCase();
				if (!map.has(key)) map.set(key, v);
			}
			return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
		};
		const fromApplicants = keepFirst(paged.map(p => p.program));
		const fromOptions = keepFirst(programOptions ?? []);
		const fromCanonical = keepFirst(UIC_PROGRAMS);
		const all = keepFirst([...fromApplicants, ...fromOptions, ...fromCanonical]);
		return { programsAvailable: fromApplicants, programsAll: all };
	}, [paged, programOptions]);

	const programs = showAllPrograms ? programsAll : programsAvailable;

	const sorted = useMemo(() => {
		const out = [...paged];
		if (sort.by === 'date') {
			out.sort((a, b) => {
				const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : -Infinity;
				const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : -Infinity;
				return sort.dir === 'asc' ? aTime - bTime : bTime - aTime;
			});
		}
		return out;
	}, [paged, sort]);

	const filtered = useMemo(() => {
		return sorted.filter(r => {
			const statusOk = statusFilter === 'all' || r.application_status === statusFilter;
			const progOk = programFilter === 'all' || (r.program || '') === programFilter;
			return statusOk && progOk;
		});
	}, [sorted, statusFilter, programFilter]);

	useEffect(() => {
		setSelected(prev => prev.filter(id => filtered.some(r => r.id === id)));
	}, [filtered]);

	const headerChecked = selected.length > 0 && selected.length === filtered.length;
	const toggleSelectAll = () => setSelected(headerChecked ? [] : filtered.map(p => p.id));
	const toggleSelectOne = (id: number) =>
		setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

	const statusBadge = (s?: string | null) => {
		const v = String(s || 'pending').toLowerCase();
		const cls =
			v === 'approved'
				? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
				: v === 'rejected'
				? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
				: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
		return <Badge className={`rounded-full ${cls}`} variant="outline">{v[0].toUpperCase() + v.slice(1)}</Badge>;
	};

	const statusLabel = statusFilter === 'all' ? 'All' : statusFilter[0].toUpperCase() + statusFilter.slice(1);
	const shouldShowStatusFilter = showStatusFilter ?? !tabType;

	const toggleDateSort = () =>
		setSort(prev => (prev.by === 'date' ? { by: 'date', dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by: 'date', dir: 'desc' }));
	const DateSortIcon = sort.by === 'date' ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

	async function callApprove(id: number) {
		if (!onApprove) return;
		setSubmitting(true);
		try { await onApprove(id); } finally { setSubmitting(false); setApproveId(null); }
	}
	async function callReject(id: number) {
		if (!onReject || !rejectReason.trim()) return;
		setSubmitting(true);
		try { await onReject(id, rejectReason.trim()); }
		finally { setSubmitting(false); setRejectId(null); setRejectReason(''); }
	}
	async function callApproveMany(ids: number[]) {
		if (!onApproveMany) return;
		setSubmitting(true);
		try { await onApproveMany(ids); setSelected([]); }
		finally { setSubmitting(false); setApproveManyOpen(false); }
	}
	async function callRejectMany(ids: number[], reason: string) {
		if (!onRejectMany || !reason.trim()) return;
		setSubmitting(true);
		try { await onRejectMany(ids, reason.trim()); setSelected([]); }
		finally { setSubmitting(false); setRejectManyOpen(false); setRejectManyReason(''); }
	}

	return (
		<div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
					<div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/20 dark:bg-muted/10">
						<div className="flex items-center gap-2 flex-wrap">
					<Popover open={programOpen} onOpenChange={setProgramOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" size="sm" className="h-8">
								<GraduationCap className="mr-2 h-4 w-4" />
								Program: {programFilter === 'all' ? 'All' : programFilter}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-0 w-80" align="start">
							<Command shouldFilter={true}>
								<CommandInput placeholder="Search program…" />
								<CommandEmpty>No program found.</CommandEmpty>
								<CommandList className="max-h-64 overflow-y-auto">
									<CommandGroup heading="Scope">
										<CommandItem
											value={showAllPrograms ? 'available-only' : 'all-programs'}
											onSelect={() => setShowAllPrograms(v => !v)}
										>
											{showAllPrograms ? 'Show only current applicants' : 'Show all programs'}
										</CommandItem>
									</CommandGroup>
									<CommandGroup heading="Programs">
										<CommandItem
											value="all"
											onSelect={() => { setProgramFilter('all'); setProgramOpen(false); }}
										>
											All programs {programFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
										</CommandItem>
										{programs.map((p) => (
											<CommandItem
												key={p}
												value={p}
												onSelect={() => { setProgramFilter(p); setProgramOpen(false); }}
											>
												{p} {programFilter === p && <Check className="ml-auto h-4 w-4" />}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

							{/* Extra filters inline (optional) */}
							{schoolYearOptions && onSchoolYearChange && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">SY</span>
									<Select value={schoolYearValue ?? 'all'} onValueChange={onSchoolYearChange}>
										<SelectTrigger className="h-8 w-[140px]">
											<SelectValue placeholder="All" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											{schoolYearOptions.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
										</SelectContent>
									</Select>
								</div>
							)}

							{onFromDateChange && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">From</span>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm" className="h-8 w-[150px] justify-start">
												<CalendarIcon className="mr-2 h-4 w-4" />
												{fromDate ? format(fromDate, 'MMM dd, yyyy') : <span className="text-muted-foreground">Pick a date</span>}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Calendar mode="single" selected={fromDate ?? undefined} onSelect={(d)=>onFromDateChange(d ?? null)} initialFocus />
										</PopoverContent>
									</Popover>
								</div>
							)}

							{onToDateChange && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">To</span>
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" size="sm" className="h-8 w-[150px] justify-start">
												<CalendarIcon className="mr-2 h-4 w-4" />
												{toDate ? format(toDate, 'MMM dd, yyyy') : <span className="text-muted-foreground">Pick a date</span>}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Calendar mode="single" selected={toDate ?? undefined} onSelect={(d)=>onToDateChange(d ?? null)} initialFocus />
										</PopoverContent>
									</Popover>
								</div>
							)}

							{onHasRemarksChange && (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground">Remarks</span>
									<Select value={hasRemarks ?? 'all'} onValueChange={(v)=>onHasRemarksChange(v as any)}>
										<SelectTrigger className="h-8 w-[150px]">
											<SelectValue placeholder="All" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="yes">With remarks</SelectItem>
											<SelectItem value="no">No remarks</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{onSortDirChange && (
								<div className="flex items-center gap-1">
									<span className="text-xs text-muted-foreground mr-1">Sort</span>
									<Button type="button" size="sm" variant={sortDir==='desc'?'default':'ghost'} className="h-8" onClick={()=>onSortDirChange('desc')}>Newest</Button>
									<Button type="button" size="sm" variant={sortDir==='asc'?'default':'ghost'} className="h-8" onClick={()=>onSortDirChange('asc')}>Oldest</Button>
									{onResetFilters && (
										<Button type="button" size="sm" variant="outline" className="h-8" onClick={onResetFilters}>Reset</Button>
									)}
								</div>
							)}
				</div>

				{shouldShowStatusFilter && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8">
								<Filter className="mr-2 h-4 w-4" /> Status: {statusLabel}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							{(['all','pending','approved','rejected'] as const).map((s) => (
								<DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="flex items-center justify-between">
									{s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)} {statusFilter === s && <Check className="h-4 w-4" />}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			<Table className="min-w-[900px] text-sm dark:text-muted-foreground">
				<TableHeader>
					<TableRow className="dark:bg-muted/40">
						<TableHead className="w-[4%] py-2 dark:bg-muted/30 dark:text-muted-foreground">
							<input type="checkbox" checked={headerChecked} onChange={toggleSelectAll} aria-label="Select all" />
						</TableHead>
						{columns.student && <TableHead className="w-[28%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Student</TableHead>}
						{columns.program && <TableHead className="w-[22%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Program</TableHead>}
						{columns.date && (
							<TableHead className="w-[16%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground"
								aria-sort={sort.by === 'date' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
								<button type="button" onClick={toggleDateSort}
									className="inline-flex items-center gap-1 justify-center w-full hover:text-rose-600">
									<span>Applied</span>
									<DateSortIcon className="h-3.5 w-3.5 opacity-80" />
								</button>
							</TableHead>
						)}
						{columns.status && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Status</TableHead>}
						{columns.actions && <TableHead className="w-[16%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>}
					</TableRow>
				</TableHeader>

				<TableBody>
					{filtered.map((r) => (
						<TableRow key={r.id} className="hover:bg-muted/50 dark:hover:bg-muted/70">
							<TableCell className="px-2 py-2">
								<input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelectOne(r.id)} aria-label="Select row" />
							</TableCell>

							{columns.student && (
								<TableCell className="px-2 py-2 font-semibold truncate leading-tight dark:text-foreground" style={{ maxWidth: '260px' }}>
									<div className="truncate" title={`${r.last_name}, ${r.first_name}`}>
										{r.last_name}, {r.first_name} {r.middle_name ? `${r.middle_name[0]}.` : ''}
									</div>
									<div className="text-xs font-normal text-muted-foreground mt-1 truncate">
										{r.email || '—'} {r.school_id ? `• ${r.school_id}` : ''}
									</div>
								</TableCell>
							)}

							{columns.program && (
								<TableCell className="px-2 py-2">
									<span className="truncate block">{r.program || '—'}</span>
								</TableCell>
							)}

							{columns.date && (
								<TableCell className="px-1 py-2 text-center whitespace-nowrap">
									{r.submitted_at ? format(new Date(r.submitted_at), 'MMM dd, yyyy') : '—'}
								</TableCell>
							)}

							{columns.status && (
								<TableCell className="px-1 py-2 text-center">{statusBadge(r.application_status)}</TableCell>
							)}

							{columns.actions && (
								<TableCell className="px-1 py-2 text-center">
									<div className="flex gap-1 justify-center">
										<Dialog>
											<DialogTrigger asChild>
												<Button size="sm" variant="outline" onClick={() => setSelectedRow(r)} title="Details" className="dark:bg-muted/30">
													<Info />
												</Button>
											</DialogTrigger>
											<DialogContent className="max-h-[90vh]" aria-describedby={undefined}>
													{selectedRow && <Details application={selectedRow} />}
												
											</DialogContent>
										</Dialog>

										{tabType === 'pending' && (
											<>
												<Button size="sm" variant="outline" title="Reject"
													onClick={() => { setRejectId(r.id); setRejectReason(''); }}
													className="text-rose-500 hover:text-rose-500" disabled={submitting || loading}>
													<CircleX size={16} />
												</Button>

												<AlertDialog open={approveId === r.id} onOpenChange={(open) => !open && setApproveId(null)}>
													<AlertDialogTrigger asChild>
														<Button size="sm" variant="outline" title="Approve"
															onClick={() => setApproveId(r.id)}
															className="text-green-500 hover:text-green-500" disabled={submitting || loading}>
															<CheckCircle size={16} />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Approve this application?</AlertDialogTitle>
															<AlertDialogDescription>This will finalize the decision as approved.</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
															<AlertDialogAction disabled={submitting} onClick={() => callApprove(r.id)}>
																{submitting ? 'Approving…' : 'Approve'}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>

												<Dialog open={rejectId === r.id} onOpenChange={(open) => !open && setRejectId(null)}>
													<DialogContent className="max-w-md" aria-describedby={undefined}>
														<div className="space-y-2">
															<h3 className="text-base font-semibold">Reject this application</h3>
															<p className="text-sm text-muted-foreground">Provide a reason visible to the student.</p>
															<Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection" rows={4} />
															<div className="flex justify-end gap-2 pt-2">
																<Button variant="outline" onClick={() => setRejectId(null)} disabled={submitting}>Cancel</Button>
																<Button variant="destructive" onClick={() => callReject(r.id)} disabled={submitting || rejectReason.trim().length < 3}>
																	{submitting ? 'Rejecting…' : 'Confirm Reject'}
																</Button>
															</div>
														</div>
													</DialogContent>
												</Dialog>
											</>
										)}
									</div>
								</TableCell>
							)}
						</TableRow>
					))}
					{filtered.length === 0 && (
						<TableRow>
							<TableCell colSpan={Object.values(columns).filter(Boolean).length + 1} className="text-center py-16">
								<div className="text-muted-foreground">{loading ? 'Loading…' : 'No records found.'}</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<div
				role="region"
				aria-label="Bulk actions"
				aria-hidden={!(tabType === 'pending' && selected.length > 0)}
				className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200 ease-out
					${tabType === 'pending' && selected.length > 0 ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-3 scale-95 pointer-events-none'}`}>
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
					<span className="text-sm text-muted-foreground">{selected.length} selected</span>
					<Button size="sm" variant="outline" onClick={() => setApproveManyOpen(true)} disabled={submitting || loading} className="gap-1">
						<CheckCircle className="h-4 w-4" /> Approve
					</Button>
					<Button size="sm" variant="destructive" onClick={() => setRejectManyOpen(true)} disabled={submitting || loading} className="gap-1">
						<CircleX className="h-4 w-4" /> Reject
					</Button>
					<Button size="sm" variant="ghost" onClick={() => setSelected([])} disabled={submitting || loading} className="gap-1">
						<X className="h-4 w-4" /> Clear
					</Button>
				</div>
			</div>

			<AlertDialog open={approveManyOpen} onOpenChange={setApproveManyOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Approve {selected.length} selected application(s)?</AlertDialogTitle>
						<AlertDialogDescription>This will finalize them as approved.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={submitting} onClick={() => callApproveMany(selected)}>
							{submitting ? 'Approving…' : 'Approve selected'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={rejectManyOpen} onOpenChange={setRejectManyOpen}>
				<DialogContent className="max-w-md" aria-describedby={undefined}>
					<div className="space-y-2">
						<h3 className="text-base font-semibold">Reject {selected.length} selected application(s)</h3>
						<p className="text-sm text-muted-foreground">Provide a reason visible to the student.</p>
						<Textarea value={rejectManyReason} onChange={(e) => setRejectManyReason(e.target.value)} placeholder="Reason for rejection" rows={4} />
						<div className="flex justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setRejectManyOpen(false)} disabled={submitting}>Cancel</Button>
							<Button variant="destructive" onClick={() => callRejectMany(selected, rejectManyReason)} disabled={submitting || rejectManyReason.trim().length < 3}>
								{submitting ? 'Rejecting…' : 'Confirm Reject'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

