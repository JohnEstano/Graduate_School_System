import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
    Select,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup
} from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Schedules', href: '/schedule' },
];

const STATUS_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
];

export default function SchedulePage() {
    const [events, setEvents] = useState<any[]>([]);
    const [month, setMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showCard, setShowCard] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/defense-requests/calendar')
            .then(res => res.json())
            .then(setEvents);
    }, []);

    const filteredEvents = useMemo(() => {
        let list = events;
        if (statusFilter !== "all") {
            list = list.filter(ev => (ev.status || "Approved") === statusFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(ev =>
                ev.thesis_title.toLowerCase().includes(q)
            );
        }
        return list;
    }, [events, statusFilter, search]);

    const eventsByDate: Record<string, any[]> = useMemo(() => {
        const map: Record<string, any[]> = {};
        filteredEvents.forEach(ev => {
            const date = format(parseISO(ev.date_of_defense), "yyyy-MM-dd");
            if (!map[date]) map[date] = [];
            map[date].push(ev);
        });
        return map;
    }, [filteredEvents]);

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

    const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const filteredEventsForCard = useMemo(() => {
        let list = selectedDateStr ? (events.filter(ev => format(parseISO(ev.date_of_defense), "yyyy-MM-dd") === selectedDateStr) || []) : [];
        if (statusFilter !== "all") {
            list = list.filter(ev => (ev.status || "Approved") === statusFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(ev =>
                ev.thesis_title.toLowerCase().includes(q)
            );
        }
        return list;
    }, [selectedDateStr, events, statusFilter, search]);

    function getEventsForDay(day: Date) {
        const dateStr = format(day, "yyyy-MM-dd");
        return eventsByDate[dateStr] || [];
    }

    useEffect(() => {
        if (!selectedDate || !isSameMonth(selectedDate, month)) {
            const today = new Date();
            if (isSameMonth(today, month)) setSelectedDate(today);
            else setSelectedDate(null);
        }
    }, [month]);

    function getDotColor(status: string) {
        if (status === "Approved") return "bg-green-500";
        if (status === "Pending") return "bg-yellow-500";
        if (status === "Rejected") return "bg-red-500";
        return "bg-gray-400";
    }

    function truncateTitle(title: string) {
        return title.length > 8 ? title.slice(0, 8) + "…" : title;
    }


    const gridWidth = "calc(100%)";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedules" />
            <div className="relative w-full bg-white flex flex-col overflow-hidden">
                {/* Controls and stuff*/}
                <div
                    className="flex items-center gap-2"
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        margin: 0,
                    }}
                >
                    <div className="flex items-center pl-2 gap-2 min-w-[220px]">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Previous month"
                            className="h-7 w-7 p-0"
                            onClick={() => setMonth(addDays(startOfMonth(month), -1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-base min-w-[120px] text-center">{format(month, "MMMM yyyy")}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Next month"
                            className="h-7 w-7 p-0"
                            onClick={() => setMonth(addDays(endOfMonth(month), 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 flex items-center ">
                        <div className="w-36">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full rounded-none h-8 text-sm">
                                    <SelectValue placeholder="Filter status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel className='text-xs text-muted-foreground'>
                                          Filter Status:  
                                        </SelectLabel>
                                        {STATUS_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-sm font-regular">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>

                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            placeholder="Search..."
                            startIcon={Search}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-100 h-8 rounded-none text-sm"
                            style={{ maxWidth: 180, minWidth: 120 }}
                        />
                    </div>
                </div>
                {/* Calendar Grid with sticky headers and scrollable area */}
                <div className="flex flex-col  items-center justify-start w-full overflow-hidden">
                    <div className="w-full flex justify-center p-0 items-start">
                        <div
                            className="border-t border-l text-xs bg-white flex flex-col"
                            style={{
                                width: gridWidth,
                                minWidth: 0,
                                maxWidth: "100%",

                                boxShadow: "0 1px 3px 0 rgba(0,0,0,0.03)"
                            }}
                        >
                            {/* The scrollable part of the calendard*/}
                            <div
                                className="overflow-y-auto"
                                style={{
                                    height: 424,
                                    minHeight: 200,
                                }}
                            >
                                <div className="grid grid-cols-7 sticky top-0 z-20 bg-white">
                                    {"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",").map(d => (
                                        <div
                                            key={d}
                                            className="text-[11px] font-semibold text-center py-1 border-b border-r bg-gray-50"
                                            style={{
                                                position: "sticky",
                                                top: 0,
                                                zIndex: 10,
                                                background: "#f9fafb"
                                            }}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                {/* Calendar grid cells */}
                                <div className="grid grid-cols-7">
                                    {weeks.flat().map((day, idx) => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const isCurrentMonth = isSameMonth(day, month);
                                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                                        const isTodayDate = isToday(day);
                                        const eventsForDay = getEventsForDay(day);
                                        return (
                                            <div
                                                key={dateStr + idx}
                                                className={cn(
                                                    "h-25 w-full border-b border-r flex flex-col items-start justify-start p-1 cursor-pointer transition-all overflow-hidden", // Lowered from h-20 to h-16
                                                    isCurrentMonth ? "bg-white" : "bg-gray-100 text-gray-400",
                                                    isSelected && "ring-2 ring-primary-500 z-10",
                                                    isTodayDate && "border-2 border-rose-400"
                                                )}
                                                onClick={() => { setSelectedDate(day); setShowCard(true); }}
                                            >
                                                <span className="text-[11px] font-semibold mb-0.5 select-none">{format(day, "d")}</span>
                                                <div className="flex flex-col gap-0.5 w-full">
                                                    {eventsForDay.length > 0 && (
                                                        <div className="flex flex-col gap-0.5 w-full">
                                                            {eventsForDay.slice(0, 2).map(ev => (
                                                                <div key={ev.id} className="flex items-center gap-1 w-full">
                                                                    <span className={cn("w-2 h-2 rounded-full", getDotColor(ev.status || "Approved"))} />
                                                                    <span className="truncate text-[11px] font-medium" title={ev.thesis_title}>
                                                                        {truncateTitle(ev.thesis_title)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {eventsForDay.length > 2 && (
                                                                <span className="text-[10px] text-gray-500 ml-3">+{eventsForDay.length - 2} more</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Floating collapsible card */}
                <div
                    ref={cardRef}
                    className={cn(
                        "fixed right-4 z-50 w-[320px] max-w-full bg-white border shadow-lg transition-transform duration-300",
                        showCard ? "translate-x-0" : "translate-x-[110%]",
                        "rounded-md"
                    )}
                    style={{ minHeight: 120, maxHeight: "70vh", top: "130px" }}
                >
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                        <span className="font-semibold text-sm">
                            {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                        </span>
                        <Button size="sm" variant="ghost" className="text-xs px-2 py-1" onClick={() => setShowCard(false)}>
                            Close
                        </Button>
                    </div>
                    <div className="p-2 overflow-y-auto" style={{ maxHeight: "calc(70vh - 40px)" }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Thesis Title</TableHead>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEventsForCard.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground text-xs">
                                            No defense requests scheduled.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredEventsForCard.map(ev => (
                                    <TableRow key={ev.id}>
                                        <TableCell className="max-w-[120px] truncate text-xs" title={ev.thesis_title}>
                                            {ev.thesis_title}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(parseISO(ev.date_of_defense), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant={
                                                (ev.status || "Approved") === "Approved" ? "default"
                                                    : (ev.status || "Approved") === "Pending" ? "secondary"
                                                        : (ev.status || "Approved") === "Rejected" ? "destructive"
                                                            : "outline"
                                            }>
                                                {ev.status || "Approved"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}