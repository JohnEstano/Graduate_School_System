import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Local lightweight type (avoid depending on a missing or narrower global type)
type SimpleDefenseRequest = {
    id: number;
    thesis_title?: string;
    workflow_state?: string | null;
    created_at?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    school_id?: string | number | null;
};

type Props = {
    requests?: SimpleDefenseRequest[];
    loading?: boolean;
};

function needsActionState(wf?: string | null) {
    const v = (wf || '').toLowerCase();
    return v === 'submitted' || v === 'adviser-review';
}

const ImmediateActionDefenseRequestsWidget: React.FC<Props> = ({ requests = [], loading = false }) => {
    const actionable = requests
        .filter(r => needsActionState(r.workflow_state))
        .sort((a, b) => {
            const at = a.created_at ? Date.parse(a.created_at) : 0;
            const bt = b.created_at ? Date.parse(b.created_at) : 0;
            return at - bt; // oldest first
        });

    const top = actionable.slice(0, 5);

    return (
        <div className="flex-1 border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-5 bg-white dark:bg-zinc-900 flex flex-col transition min-h-[220px]">
            {loading ? (
                <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <Skeleton className="h-8 w-20 mb-2 bg-gray-100" />
                            <Skeleton className="h-4 w-32 bg-gray-100" />
                            <Skeleton className="h-3 w-40 mt-2 bg-gray-100" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
                            <Skeleton className="h-6 w-6 rounded-full bg-gray-100" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full bg-gray-100" />
                    <div className="flex flex-col gap-2 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-5 w-full bg-gray-100" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <a
                        href="/defense-requests"
                        className="flex items-center justify-between mb-2 group cursor-pointer select-none"
                        style={{ textDecoration: 'none' }}
                    >
                        <div>
                            <div className="text-4xl font-bold text-rose-500">
                                {actionable.length}
                            </div>
                            <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                Needs Your Review
                            </div>
                            <div className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">
                                Pending adviser action
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-500 p-2">
                                <FileText className="size-6 text-white" />
                            </span>
                            <ChevronRight className="size-6 text-gray-400 transition-transform transition-colors duration-200 group-hover:text-rose-500 group-hover:translate-x-1" />
                        </div>
                    </a>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <div className="overflow-x-auto">
                        {actionable.length === 0 ? (
                            <div className="text-center text-gray-400 py-6 text-xs">
                                No submissions awaiting your action.
                            </div>
                        ) : (
                            <table className="w-full text-xs table-fixed">
                                <thead>
                                    <tr className="text-gray-500 dark:text-gray-400">
                                        <th className="text-left py-1 pr-3 w-[55%]">Thesis Title</th>
                                        <th className="text-left py-1 pr-3 w-[25%]">Student</th>
                                        <th className="text-left py-1 w-[20%]">State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top.map(r => {
                                        const state = (r.workflow_state || 'submitted').replace(/-/g, ' ');
                                        const student =
                                            (r.first_name || r.last_name)
                                                ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim()
                                                : (r.school_id ?? '—');
                                        return (
                                            <tr key={r.id} className="align-top">
                                                <td className="truncate py-1 pr-3">{r.thesis_title || '—'}</td>
                                                <td className="truncate py-1 pr-3">{student}</td>
                                                <td className="py-1">
                                                    <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-semibold capitalize">
                                                        {state}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {actionable.length > 5 && (
                            <span className="text-xs text-rose-500 mt-2 inline-block">
                                +{actionable.length - 5} more
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImmediateActionDefenseRequestsWidget;