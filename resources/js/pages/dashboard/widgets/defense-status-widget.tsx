// Simple widget: shows ONLY the most recent/active submission (1 record), neutral styling.
import React from 'react';
import { GraduationCap, Hourglass, Check, X, ChevronRight, Users, Calendar } from 'lucide-react';

type RawDefenseRequest = {
    id: number;
    thesis_title: string;
    status?: string;
    normalized_status?: string;
    workflow_state?: string | null;
    created_at?: string | null;
};

type Props = {
    recentRequests?: RawDefenseRequest[];
    loading?: boolean;
};

const TERMINAL = new Set(['cancelled','adviser-rejected','coordinator-rejected','completed']);

type WorkflowInfo = { label: string; icon: React.ReactNode };

const WF_MAP: Record<string, WorkflowInfo> = {
    'submitted': { label: 'Submitted', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'adviser-review': { label: 'Under Adviser Review', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'adviser-approved': { label: 'Approved by Adviser', icon: <Check className="h-4 w-4 text-gray-500" /> },
    'coordinator-review': { label: 'Coordinator Review', icon: <Hourglass className="h-4 w-4 text-gray-500" /> },
    'coordinator-approved': { label: 'Coordinator Approved', icon: <Check className="h-4 w-4 text-gray-500" /> },
    'panels-assigned': { label: 'Panels Assigned', icon: <Users className="h-4 w-4 text-gray-500" /> },
    'scheduled': { label: 'Defense Scheduled', icon: <Calendar className="h-4 w-4 text-gray-500" /> },
    'completed': { label: 'Defense Completed', icon: <GraduationCap className="h-4 w-4 text-gray-500" /> },
    'adviser-rejected': { label: 'Rejected (Adviser)', icon: <X className="h-4 w-4 text-gray-500" /> },
    'coordinator-rejected': { label: 'Rejected (Coordinator)', icon: <X className="h-4 w-4 text-gray-500" /> },
    'cancelled': { label: 'Cancelled', icon: <X className="h-4 w-4 text-gray-500" /> },
};

function resolveWorkflowLabel(r: RawDefenseRequest): WorkflowInfo {
    const wf = (r.workflow_state || '').toLowerCase();
    if (wf && WF_MAP[wf]) return WF_MAP[wf];

    const status = (r.normalized_status || r.status || '').toLowerCase();
    if (status.includes('reject')) return { label: 'Rejected', icon: <X className="h-4 w-4 text-gray-500" /> };
    if (status.includes('approve')) return { label: 'Approved', icon: <Check className="h-4 w-4 text-gray-500" /> };
    if (status === 'cancelled') return { label: 'Cancelled', icon: <X className="h-4 w-4 text-gray-500" /> };
    return { label: 'Submitted', icon: <Hourglass className="h-4 w-4 text-gray-500" /> };
}

const DefenseStatusWidget: React.FC<Props> = ({ recentRequests = [], loading = false }) => {
    const sorted = [...recentRequests].sort((a,b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
    });

    const active = sorted.find(r => !TERMINAL.has((r.workflow_state || '').toLowerCase())) || sorted[0];
    const list = active ? [active] : [];

    return (
        <div className="flex-1 border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-5 bg-white dark:bg-zinc-900 flex flex-col min-h-[180px]">
            <a
                href="/defense-requirements"
                className="group flex items-center justify-between mb-4 focus:outline-none focus:ring-2 focus:ring-rose-400/50 rounded-md"
            >
                <span className="flex flex-col">
                    <span className="text-base md:text-lg font-semibold leading-tight text-gray-800 dark:text-gray-100">
                        Defense Submissions
                    </span>
                    <span className="mt-0.5 text-[10px] leading-snug text-gray-500 dark:text-gray-400 font-normal">
                        Showing your most recent active submission status
                    </span>
                </span>
                <div className="flex items-center gap-3">
                    <span className="hidden md:inline-block px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        {recentRequests.length} total
                    </span>
                    <div className="h-12 w-12 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
                        <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <ChevronRight className="h-6 w-6 text-rose-400 transition-all duration-200 group-hover:text-rose-500 group-hover:translate-x-1" />
                </div>
            </a>

            <div className="flex-1">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 pb-2">Thesis Title</th>
                            <th className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 pb-2 w-40">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr className="animate-pulse">
                                <td className="py-2">
                                    <div className="h-3 w-48 rounded bg-gray-100 dark:bg-zinc-800" />
                                </td>
                                <td className="py-2">
                                    <div className="h-3 w-28 rounded bg-gray-100 dark:bg-zinc-800" />
                                </td>
                            </tr>
                        )}

                        {!loading && list.length === 0 && (
                            <tr>
                                <td className="py-3 italic text-[12px] text-gray-400 dark:text-gray-500">None</td>
                                <td className="py-3 flex items-center gap-1 text-[12px] text-gray-500">
                                    <Hourglass className="h-4 w-4" /> No Submission
                                </td>
                            </tr>
                        )}

                        {!loading && list.map(r => {
                            const { label, icon } = resolveWorkflowLabel(r);
                            return (
                                <tr
                                    key={r.id}
                                    onClick={()=>{ window.location.href='/defense-requirements'; }}
                                    className="cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition"
                                >
                                    <td className="py-2 pr-3">
                                        <span
                                            title={r.thesis_title}
                                            className="text-[12px] font-medium line-clamp-1 text-gray-700 dark:text-gray-200"
                                        >
                                            {r.thesis_title || <span className="italic text-gray-400">Untitled</span>}
                                        </span>
                                        {r.created_at && (
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2">
                                        <div className="flex items-center gap-1 text-[12px] font-medium text-gray-600 dark:text-gray-300">
                                            {icon}
                                            {label}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DefenseStatusWidget;