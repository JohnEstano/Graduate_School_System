import { ChevronRight, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DefenseRequest } from '@/types';

function getPriorityBadge(priority?: string) {
    const value = (priority || '').trim();
    let className =
        "cursor-pointer rounded-full  px-2 py-1 border font-bold text-[10px] " +
        (value === 'High'
            ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900"
            : value === 'Low'
            ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900"
            : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900");

    return (
        <span className={className}>
            {value || 'Medium'}
        </span>
    );
}

type Props = {
    pendingRequests: DefenseRequest[];
    loading?: boolean;
};

const PendingDefenseRequestsWidget: React.FC<Props> = ({ pendingRequests, loading = false }) => {
    const showSkeleton = loading;

    // Remove extra filtering!
    // const filteredPendingRequests = pendingRequests.filter(req => req.status === 'Pending');
    const filteredPendingRequests = pendingRequests;

    return (
        <div className="flex-1 border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-5 bg-white dark:bg-zinc-900 flex flex-col transition min-h-[220px]">
            {showSkeleton ? (
                <div className="flex flex-col gap-3 h-full">
                    {/* Top Row Skeleton */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <Skeleton className="h-8 w-16 mb-2 bg-gray-100" />
                            <Skeleton className="h-4 w-32 bg-gray-100" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
                            <Skeleton className="h-6 w-6 rounded-full bg-gray-100" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full mb-2 bg-gray-100" />
                    {/* Table Skeleton */}
                    <div className="flex flex-col gap-2 mt-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-5 w-3/4 bg-gray-100" />
                                <Skeleton className="h-5 w-16 bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Top Row: Value, Description, Icons (Clickable & Hoverable) */}
                    <a
                        href="/defense-requests"
                        className="flex items-center justify-between mb-2 group cursor-pointer select-none"
                        style={{ textDecoration: 'none' }}
                    >
                        <div>
                            <div className="text-4xl font-bold text-primary-700 dark:text-primary-300">
                                {filteredPendingRequests.length}
                            </div>
                            <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                Pending Defense Requests
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-full bg-rose-500 p-2">
                                <GraduationCap className="size-6 text-white" />
                            </span>
                            <ChevronRight className="size-6 text-gray-400 transition-transform transition-colors duration-200 group-hover:text-rose-500 group-hover:translate-x-1" />
                        </div>
                    </a>
                    {/* Separator */}
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    {/* Preview Table (Not clickable) */}
                    <div className="overflow-x-auto">
                        {filteredPendingRequests.length === 0 ? (
                            <div className="text-center text-gray-400 py-6">
                                No pending defense requests.
                            </div>
                        ) : (
                            <table className="w-full text-xs table-fixed">
                                <thead>
                                    <tr className="text-gray-500 dark:text-gray-400">
                                        <th className="text-left py-1 pr-4 w-4/5">Thesis Title</th>
                                        <th className="text-center py-1 pl-4 w-1/5">Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPendingRequests.slice(0, 3).map(req => (
                                        <tr key={req.id}>
                                            <td className="truncate py-1 pr-4 w-4/5">{req.thesis_title}</td>
                                            <td className="py-1 pl-4 w-1/5 text-center">{getPriorityBadge(req.priority)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {filteredPendingRequests.length > 3 && (
                            <span className="text-xs text-primary-700 dark:text-primary-300 mt-2 inline-block">
                                +{filteredPendingRequests.length - 3} more
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PendingDefenseRequestsWidget;