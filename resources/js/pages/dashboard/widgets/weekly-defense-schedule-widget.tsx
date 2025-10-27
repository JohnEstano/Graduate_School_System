import { startOfWeek, parseISO, isSameDay, format } from "date-fns";
import { GraduationCap, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DefenseRequest = {
  id: number;
  thesis_title: string;
  status: string;
  workflow_state?: string;
  date_of_defense?: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  scheduled_time?: string;
  scheduled_end_time?: string;
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

export default function WeeklyDefenseSchedulesWidget(props: Props) {
  const {
    weekDays,
    selectedDay,
    setSelectedDay,
    approvedDefenses,
    loading = false,
    referenceDate,
    studentId,
    userRole,
    canManage
  } = props;

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
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((items: any[]) => {
        console.log('📅 Weekly Events Response:', items);
        const events = Array.isArray(items) ? items : [];
        const filtered = events.filter(i => i.origin === 'event');
        console.log('📅 Filtered Events:', filtered);
        setWeekEvents(filtered);
      })
      .catch((err) => {
        console.error('❌ Error fetching events:', err);
        setWeekEvents([]);
      })
      .finally(()=> setEventsLoading(false));
  }, [referenceDate]);

  const selectedDate = getDateOfWeek(selectedDay, referenceDate);

  // Debug: Log the input defenses
  useEffect(() => {
    console.log('🎯 Approved Defenses Input:', approvedDefenses);
  }, [approvedDefenses]);

  // --- Combine defenses + events for selected day ---
  const combined = useMemo(() => {
    const defenseRows = approvedDefenses
      .filter(d => {
        // Check both status and workflow_state
        const isApproved = d.status === 'Approved' || 
                          d.workflow_state === 'scheduled' || 
                          d.workflow_state === 'completed';
        // Get date from either field
        const defenseDate = d.date_of_defense || d.scheduled_date;
        return isApproved && defenseDate;
      })
      .filter(d => {
        const defenseDate = d.date_of_defense || d.scheduled_date;
        if (!defenseDate) return false;
        try {
          // Handle both ISO and simple date formats
          const dateObj = defenseDate.includes('T') || defenseDate.includes(' ') 
            ? parseISO(defenseDate.replace(' ', 'T'))
            : parseISO(defenseDate);
          return isSameDay(dateObj, selectedDate);
        } catch {
          return false;
        }
      })
      .map(d => {
        // Get time from either field (prioritize specific fields)
        const startTime = d.start_time || d.scheduled_time;
        const endTime = d.end_time || d.scheduled_end_time;
        
        // Extract HH:mm from time strings (handle both 'HH:mm' and 'HH:mm:ss' formats)
        const extractTime = (timeStr: string | undefined) => {
          if (!timeStr) return null;
          // Remove seconds if present
          const parts = timeStr.split(':');
          return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr.substring(0, 5);
        };
        
        return {
          id: 'def-'+d.id,
          kind: 'defense' as const,
          title: d.thesis_title || 'Defense',
          start: extractTime(startTime),
          end: extractTime(endTime),
          color: '#059669',
          raw: d,
          owner: studentId && d.submitted_by === studentId
        };
      });

    const eventRows = weekEvents
      .filter(ev => {
        try {
          // Handle both 'YYYY-MM-DD HH:mm:ss' and ISO formats
          const startStr = ev.start.replace(' ', 'T');
          const starts = parseISO(startStr);
          return isSameDay(starts, selectedDate);
        } catch {
          return false;
        }
      })
      .map(ev => {
        try {
          // Parse date-time, handle both formats
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
        } catch {
          // If parsing fails, skip this event
          return null;
        }
      })
      .filter((ev): ev is NonNullable<typeof ev> => ev !== null);

    // Sort by start time (nulls/all-day first), then title
    const sorted = [...defenseRows, ...eventRows].sort((a,b) => {
      if (a.start === b.start) return a.title.localeCompare(b.title);
      if (a.start === null) return -1;
      if (b.start === null) return 1;
      return a.start.localeCompare(b.start);
    });

    console.log('📊 Combined Schedule for', format(selectedDate, 'yyyy-MM-dd'), ':', {
      defenseCount: defenseRows.length,
      eventCount: eventRows.length,
      total: sorted.length,
      items: sorted
    });

    return sorted;
  }, [approvedDefenses, weekEvents, selectedDate, studentId]);

  const overallLoading = loading || eventsLoading;

  const canSeeRaw = canManage || MANAGE_ROLES.includes(userRole || '');

  return (
    <div className="w-full md:w-[580px] border rounded-xl p-5 bg-white dark:bg-zinc-900 flex flex-col min-h-[340px]">
      <a
        href="/schedules"
        className="flex items-center justify-between mb-2 group cursor-pointer select-none"
        style={{ textDecoration: 'none' }}
      >
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            This Week&apos;s Schedules
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-500 p-2">
            <CalendarIcon className="size-6 text-white" />
          </span>
          <ChevronRight className="size-6 text-gray-400 transition-transform transition-colors duration-200 group-hover:text-rose-500 group-hover:translate-x-1" />
        </div>
      </a>

      {/* Add space between header and tabs */}
      <div className="h-2" />

      <div className="flex flex-nowrap gap-2 mb-3 justify-between">
        {weekDays.map(day => (
          <button
            key={day.value}
            className={cn(
              "flex-1 px-2.5 py-1 rounded-full text-xs font-semibold  cursor-pointer whitespace-nowrap text-center",
              selectedDay === day.value
                ? "bg-rose-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
            )}
            onClick={() => setSelectedDay(day.value)}
            disabled={overallLoading}
            style={{ minWidth: 0 }}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {overallLoading ? (
          <div>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-2 bg-gray-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : combined.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-xs text-muted-foreground text-center">
              No schedules.
            </span>
          </div>
        ) : (
          <>
            {combined.slice(0, 6).map(item => {
              const isDefense = item.kind === 'defense';
              const start = item.start ? timeLabel(item.start) : (item.start === null ? 'All Day' : '');
              const end = item.end ? timeLabel(item.end) : '';
              const timeStr = start && end ? `${start} – ${end}` : start;
              
              return (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-sm transition-shadow"
                >
                  <div className={cn(
                    "flex-shrink-0 rounded-full p-2",
                    isDefense 
                      ? "bg-emerald-50 dark:bg-emerald-900/20" 
                      : "bg-blue-50 dark:bg-blue-900/20"
                  )}>
                    {isDefense
                      ? <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                      : <CalendarIcon className="size-4 text-blue-600 dark:text-blue-400" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.owner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            You
                          </span>
                        )}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          isDefense
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        )}>
                          {isDefense ? 'Defense' : 'Event'}
                        </span>
                      </div>
                    </div>
                    
                    {timeStr && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {timeStr}
                      </p>
                    )}
                    
                    {isDefense && canSeeRaw && item.raw.defense_type && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {item.raw.defense_type}{item.raw.defense_mode ? ` • ${item.raw.defense_mode}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {combined.length > 6 && (
              <div className="text-center pt-2">
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  +{combined.length - 6} more schedule{combined.length - 6 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}