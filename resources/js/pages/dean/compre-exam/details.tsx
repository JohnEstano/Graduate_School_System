import { Badge } from '@/components/ui/badge';
import { User2, GraduationCap, Mail, CalendarDays, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';

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

export default function Details({ application }: { application: CompreExamApplicationSummary }) {
	const statusCls =
		application.application_status === 'approved'
			? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
			: application.application_status === 'rejected'
			? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
			: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';

	type Elig = {
		gradesComplete: boolean | null;
		documentsComplete: boolean | null;
		noOutstandingBalance: boolean | null;
		loading: boolean;
	};

	const [elig, setElig] = useState<Elig>({
		gradesComplete: null,
		documentsComplete: null,
		noOutstandingBalance: null,
		loading: true,
	});

	async function fetchEligibility() {
		setElig((e) => ({ ...e, loading: true }));
		const candidates = [
			`/api/comprehensive-exam/eligibility?student=${encodeURIComponent(application.school_id || application.email || String(application.id))}`,
			`/api/dean/comprehensive-exam/${application.id}/eligibility`,
		];

		let data: any = null;
		for (const url of candidates) {
			try {
				const res = await fetch(url, { credentials: 'include' });
				if (res.ok) { data = await res.json(); break; }
			} catch { /* noop */ }
		}

		const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
		const toBool = (v: any): boolean | null =>
			typeof v === 'boolean' ? v : v === 1 || v === '1' ? true : v === 0 || v === '0' ? false : null;

		const gradesComplete = toBool(data?.gradesComplete ?? q?.get('grades'));
		const documentsComplete = toBool(data?.documentsComplete ?? q?.get('docs'));
		const noOutstandingBalance = toBool(data?.noOutstandingBalance ?? q?.get('bal'));

		setElig({ gradesComplete, documentsComplete, noOutstandingBalance, loading: false });
	}

	useEffect(() => { fetchEligibility(); }, [application.id, application.school_id, application.email]);

	const chip = (ok: boolean | null) => {
		const cls =
			ok === true
				? 'border-green-300 text-green-700 bg-green-50'
				: ok === false
				? 'border-rose-300 text-rose-700 bg-rose-50'
				: 'text-zinc-600';
		return (
			<Badge variant="outline" className={cls}>
				{ok === true ? 'OK' : ok === false ? 'Missing' : 'Unknown'}
			</Badge>
		);
	};

	return (
		<div className="max-w-md w-full text-sm mx-auto">
			<div className="rounded-lg border bg-white/60 dark:bg-background p-3">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<div className="flex items-center gap-2 text-[15px] font-medium">
							<User2 className="h-5 w-5 text-muted-foreground" />
							<span className="text-base md:text-[17px] font-semibold">
								{application.last_name}, {application.first_name} {application.middle_name ? `${application.middle_name[0]}.` : ''}
							</span>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<Mail className="h-3.5 w-3.5" />
								{application.email || '—'}
							</span>
							<span className="inline-flex items-center gap-1">ID: <span className="font-medium text-foreground">{application.school_id || '—'}</span></span>
						</div>
					</div>

					<div>
						<div className="flex items-start gap-2 text-[15px] min-w-0">
							<GraduationCap className="h-5 w-4 shrink-0 text-muted-foreground" />
							<span className="text-foreground leading-tight break-words whitespace-normal min-w-0">
								{application.program || '—'}
							</span>
						</div>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<Badge variant="outline" className={`rounded-full ${statusCls}`}>
								{application.application_status[0].toUpperCase() + application.application_status.slice(1)}
							</Badge>
							<Badge variant="outline" className="rounded-full inline-flex items-center gap-1">
								<CalendarDays className="h-3.5 w-3.5" />
								{application.submitted_at ? format(new Date(application.submitted_at), 'MMM dd, yyyy') : '—'}
							</Badge>
						</div>
					</div>
				</div>

				{/* <div className="mt-3">
					<div className="mb-1 flex items-center justify-between">
						<div className="text-xs text-muted-foreground">Eligibility</div>
						<button
							type="button"
							className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-60"
							onClick={fetchEligibility}
							disabled={elig.loading}
							title="Refresh eligibility"
						>
							<RefreshCcw className={`h-3.5 w-3.5 ${elig.loading ? 'animate-spin' : ''}`} /> Refresh
						</button>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between rounded border px-3 py-2">
							<span>Complete grades (registrar verified)</span>
							{chip(elig.gradesComplete)}
						</div>
						<div className="flex items-center justify-between rounded border px-3 py-2">
							<span>Complete documents submitted</span>
							{chip(elig.documentsComplete)}
						</div>
						<div className="flex items-center justify-between rounded border px-3 py-2">
							<span>No outstanding tuition balance</span>
							{chip(elig.noOutstandingBalance)}
						</div>
					</div>
				</div> */}

				{application.remarks && (
					<div className="mt-3">
						<div className="text-xs text-muted-foreground">Remarks</div>
						<div className="font-normal text-foreground">{application.remarks}</div>
					</div>
				)}
			</div>
		</div>
	);
}

