import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameMonth,
    parseISO,
    isToday,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Schedules', href: '/schedules' },
];

type DefenseEvent = {
    id: number;
    thesis_title: string;
    date_of_defense: string;
};

export default function Index() {
    const [events, setEvents] = useState<DefenseEvent[]>([]);
    const [month, setMonth] = useState(new Date());

    useEffect(() => {
        fetch('/api/defense-requests/calendar')
            .then(res => res.json())
            .then(setEvents);
    }, []);

    const eventsByDate: Record<string, DefenseEvent[]> = {};
    events.forEach(ev => {
        const date = format(parseISO(ev.date_of_defense), "yyyy-MM-dd");
        if (!eventsByDate[date]) eventsByDate[date] = [];
        eventsByDate[date].push(ev);
    });

    
    function getCalendarMatrix(month: Date) {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
        const matrix = [];
        let day = start;
        while (day <= end) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                week.push(day);
                day = addDays(day, 1);
            }
            matrix.push(week);
        }
        return matrix;
    }

    const weeks = getCalendarMatrix(month);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedules" />
            <div className="w-full h-[calc(100vh-5rem)] p-4">
                <Card className="w-full h-full">
                    <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div />
                            <div className="flex gap-2">
                                <button
                                    className="rounded px-2 py-1 text-muted-foreground hover:bg-accent"
                                    onClick={() => setMonth(addDays(startOfMonth(month), -1))}
                                    aria-label="Previous month"
                                >{"<"}</button>
                                <span className="font-medium">{format(month, "MMMM yyyy")}</span>
                                <button
                                    className="rounded px-2 py-1 text-muted-foreground hover:bg-accent"
                                    onClick={() => setMonth(addDays(endOfMonth(month), 1))}
                                    aria-label="Next month"
                                >{">"}</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto grid grid-cols-7 gap-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                <div key={d} className="text-xs font-medium text-center text-muted-foreground pb-2">{d}</div>
                            ))}
                            {weeks.flat().map((day, idx) => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const isCurrentMonth = isSameMonth(day, month);
                                const isTodayDate = isToday(day);
                                const dayEvents = eventsByDate[dateStr] || [];
                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[90px] h-24 flex flex-col items-center border rounded-lg p-1 transition-colors
                                            ${isCurrentMonth ? "bg-background" : "bg-muted/50"}
                                            ${isTodayDate ? "border-2 border-primary" : ""}
                                        `}
                                    >
                                        <span className={`text-xs font-medium ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                                            {format(day, "d")}
                                        </span>
                                        <div className="flex flex-col gap-1 mt-1 w-full">
                                            {dayEvents.map(ev => (
                                                <span key={ev.id} className="flex items-center gap-1 w-full">
                                                    <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
                                                    <span
                                                        className="truncate text-xs text-muted-foreground max-w-[60px]"
                                                        title={ev.thesis_title}
                                                    >
                                                        {ev.thesis_title.length > 9
                                                            ? ev.thesis_title.slice(0, 9) + '…'
                                                            : ev.thesis_title}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
