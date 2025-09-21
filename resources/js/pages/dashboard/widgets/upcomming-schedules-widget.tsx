import React from 'react';

type DefenseRequest = {
    id: number;
    thesis_title: string;
    date_of_defense: string;
    status?: string;
};

type Props = {
    loading: boolean;
    todayEvents: DefenseRequest[];
    studentDefense?: DefenseRequest; 
};

function isThisWeek(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
}

const UpcomingSchedulesWidget: React.FC<Props> = ({ loading, todayEvents, studentDefense }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border aspect-video rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
        <h3 className="text-[13px] font-medium mb-2">Upcoming Schedules</h3>
        {loading ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
        ) : (
            <>
                {/* Student's own approved defense for this week */}
                {studentDefense &&
                    studentDefense.status?.toLowerCase() === 'approved' &&
                    isThisWeek(studentDefense.date_of_defense) && (
                        <div className="mb-2 p-2 rounded bg-green-50 dark:bg-green-900/30 flex items-center gap-2">
                            <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                Your defense: {studentDefense.thesis_title}
                            </span>
                            <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                                {new Date(studentDefense.date_of_defense).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )
                }
                {todayEvents.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No events scheduled for today or soon.</span>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {todayEvents.map(ev => (
                            <li key={ev.id} className="flex justify-between items-center text-xs">
                                <span className="truncate max-w-[110px]">{ev.thesis_title}</span>
                                <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    {new Date(ev.date_of_defense).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </>
        )}
    </div>
);

export default UpcomingSchedulesWidget;