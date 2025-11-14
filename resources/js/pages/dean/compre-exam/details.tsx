import { Badge } from '@/components/ui/badge';
import { User2, GraduationCap, Mail, CalendarDays, RefreshCcw, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

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
		<div className="max-w-2xl w-full mx-auto">
			{/* Student Header Card */}
			<div className="rounded-lg border bg-gradient-to-br from-white to-slate-50/50 dark:from-background dark:to-slate-900/50 p-5 shadow-sm">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 border border-rose-200">
							<User2 className="h-6 w-6 text-rose-600" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-foreground">
								{application.last_name}, {application.first_name} {application.middle_name ? `${application.middle_name[0]}.` : ''}
							</h3>
							<p className="text-sm text-muted-foreground">Comprehensive Exam Applicant</p>
						</div>
					</div>
					<Badge variant="outline" className={`rounded-full ${statusCls}`}>
						{application.application_status[0].toUpperCase() + application.application_status.slice(1)}
					</Badge>
				</div>

				<Separator className="my-4" />

				{/* Info Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-3">
						<div className="flex items-start gap-2">
							<Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
							<div className="flex-1 min-w-0">
								<div className="text-xs text-muted-foreground">Email</div>
								<div className="text-sm font-medium truncate">{application.email || '—'}</div>
							</div>
						</div>
					<div className="flex items-start gap-2">
						<CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
						<div className="flex-1">
							<div className="text-xs text-muted-foreground">Student ID</div>
							<div className="text-sm font-medium">{application.school_id || '—'}</div>
						</div>
					</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-start gap-2">
							<GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
							<div className="flex-1 min-w-0">
								<div className="text-xs text-muted-foreground">Program</div>
								<div className="text-sm font-medium break-words">{application.program || '—'}</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
							<div className="flex-1">
								<div className="text-xs text-muted-foreground">Submitted</div>
								<div className="text-sm font-medium">
									{application.submitted_at ? format(new Date(application.submitted_at), 'MMMM dd, yyyy • hh:mm a') : '—'}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Remarks Section */}
			{application.remarks && (
				<div className="mt-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4">
					<div className="flex items-start gap-2">
						<FileText className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
						<div className="flex-1">
							<div className="text-xs font-medium text-amber-900 dark:text-amber-300 mb-1">Decision Remarks</div>
							<div className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{application.remarks}</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

