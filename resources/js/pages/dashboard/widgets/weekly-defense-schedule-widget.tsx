import { startOfWeek, parseISO, isSameDay, format } from "date-fns";
import { GraduationCap, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DefenseRequest = {
  id: number;
  thesis_title: string;
  status: string;
  date_of_defense: string;
  start_time?: string;
  end_time?: string;
  defense_type?: string;
  defense_mode?: string;
  defense_venue?: string;
  program?: string;
  first_name?: string;
  last_name?: string;
  submitted_by?: number;
};

type ApiEvent = {
  id: string;              // "ev-###"
  title: string;
  start: string;           // "YYYY-MM-DD HH:mm:SS"
  end?: string;
  allDay?: boolean;
  color?: string;
  origin: 'event';
  description?: string;
};

type WeekDayDef = { label: string; value: number };

type Props = {
  weekDays: WeekDayDef[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  approvedDefenses: DefenseRequest[];
  loading?: boolean;
  referenceDate: Date;
  studentId?: number;
  userRole?: string;
  canManage?: boolean;
};

// Manage roles (match backend usage)
const MANAGE_ROLES = ['Coordinator','Administrative Assistant','Dean'];

function getDateOfWeek(dayOfWeek: number, refDate: Date) {
  const start = startOfWeek(refDate, { weekStartsOn: 0 });
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOfWeek);
}

function timeLabel(hhmm?: string) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(n=>parseInt(n,10));
  const d = new Date(2020,0,1,h,m,0);
  return format(d,'h:mm a');
}

export default function WeeklyDefenseSchedulesWidget({
  weekDays,
  selectedDay,
  setSelectedDay,
  approvedDefenses,
  loading = false,
  referenceDate,
  studentId,
  userRole,
  canManage
}: Props) {

  // --- New: fetch general events for the whole week range ---
  const [weekEvents, setWeekEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  useEffect(() => {
    const start = startOfWeek(referenceDate, { weekStartsOn: 0 });
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const qs = `?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`;
    setEventsLoading(true);
    fetch('/api/calendar/events'+qs)
      .then(r => r.json())
      .then((items: any[]) => {
        setWeekEvents(items.filter(i => i.origin === 'event'));
      })
      .catch(()=>{})
      .finally(()=> setEventsLoading(false));
  }, [referenceDate]);

  const selectedDate = getDateOfWeek(selectedDay, referenceDate);

  // --- Combine defenses + events for selected day ---
  const combined = useMemo(() => {
    const defenseRows = approvedDefenses
      .filter(d => d.status === 'Approved' && d.date_of_defense)
      .filter(d => isSameDay(parseISO(d.date_of_defense), selectedDate))
      .map(d => ({
        id: 'def-'+d.id,
        kind: 'defense' as const,
        title: d.thesis_title || 'Defense',
        start: d.start_time || null,
        end: d.end_time || null,
        color: '#059669',
        raw: d,
        owner: studentId && d.submitted_by === studentId
      }));

    const eventRows = weekEvents
      .filter(ev => {
        const starts = parseISO(ev.start);
        return isSameDay(starts, selectedDate);
      })
      .map(ev => {
        const [datePart, timePart] = ev.start.split(' ');
        const endTimePart = ev.end ? ev.end.split(' ')[1] : undefined;
        return {
          id: ev.id,
            kind: 'event' as const,
            title: ev.title || 'Event',
            start: ev.allDay ? null : (timePart?.slice(0,5) || null),
            end: ev.allDay ? null : (endTimePart?.slice(0,5) || null),
            color: ev.color || '#2563eb',
            raw: ev,
            owner: false
        };
      });

    // Sort by start time (nulls/all-day first), then title
    const sorted = [...defenseRows, ...eventRows].sort((a,b) => {
      if (a.start === b.start) return a.title.localeCompare(b.title);
      if (a.start === null) return -1;
      if (b.start === null) return 1;
      return a.start.localeCompare(b.start);
    });

    return sorted;
  }, [approvedDefenses, weekEvents, selectedDate, studentId]);

  const overallLoading = loading || eventsLoading;

  const canSeeRaw = canManage || MANAGE_ROLES.includes(userRole || '');

  return (
    <div className="w-full md:w-[380px] border rounded-xl p-5 bg-white dark:bg-zinc-900 flex flex-col">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        This Week&apos;s Schedules
      </div>

      <div className="flex flex-nowrap gap-2 mb-3">
        {weekDays.map(day => (
          <button
            key={day.value}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap",
              selectedDay === day.value
                ? "bg-rose-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
            )}
            onClick={() => setSelectedDay(day.value)}
            disabled={overallLoading}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {overallLoading ? (
          <div>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-full mb-2 bg-gray-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : combined.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-xs text-muted-foreground text-center">
              No schedules.
            </span>
          </div>
        ) : (
          combined.map(item => {
            const isDefense = item.kind === 'defense';
            const start = item.start ? timeLabel(item.start) : (item.start === null ? 'All Day' : '');
            const end = item.end ? timeLabel(item.end) : '';
            const timeStr = start && end ? `${start} – ${end}` : start;
            const badge = isDefense ? 'Defense' : 'Event';
            return (
              <div
                key={item.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-2 rounded border max-w-full text-xs",
                  isDefense
                    ? "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-blue-500/50 bg-blue-50 dark:bg-blue-900/20"
                )}
                style={{ minWidth: 0 }}
                title={item.title}
              >
                {isDefense
                  ? <GraduationCap className={cn("flex-shrink-0", item.owner ? "text-emerald-600" : "text-emerald-500")} size={18} />
                  : <CalendarIcon className="text-blue-500 flex-shrink-0" size={18} />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold truncate max-w-[200px]">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-[1px] rounded-full text-[9px] font-bold tracking-wide shrink-0",
                        isDefense ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                      )}
                    >
                      {badge}
                    </span>
                    {item.owner && (
                      <span className="px-1 py-[1px] rounded-full text-[9px] font-semibold bg-rose-500 text-white shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  {timeStr && (
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                      {timeStr}
                    </div>
                  )}
                  {isDefense && canSeeRaw && item.raw.defense_type && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-500 truncate italic">
                      {item.raw.defense_type}{item.raw.defense_mode ? ` • ${item.raw.defense_mode}` : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}