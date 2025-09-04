import React from 'react';

type DefenseRequest = {
    id: number;
    thesis_title: string;
    date_of_defense: string;
};

type Props = {
    loading: boolean;
    todayEvents: DefenseRequest[];
};

const UpcomingSchedulesWidget: React.FC<Props> = ({ loading, todayEvents }) => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border aspect-video rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
        <h3 className="text-[13px] font-medium mb-2">Upcoming Schedules</h3>
        {loading ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
        ) : todayEvents.length === 0 ? (
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
    </div>
);

export default UpcomingSchedulesWidget;