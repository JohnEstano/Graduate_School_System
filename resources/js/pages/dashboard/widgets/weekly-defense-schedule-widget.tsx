import { startOfWeek, parseISO, isSameDay, format, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";
import { GraduationCap, Calendar as CalendarIcon, ChevronRight, Clock, Video, MapPin, Users, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

function timeLabel(hhmm?: string) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(n=>parseInt(n,10));
  const d = new Date(2020,0,1,h,m,0);
  return format(d,'h:mm a');
}

export default function WeeklyDefenseSchedulesWidget(props: Props) {
  const {
    approvedDefenses,
    loading = false,
    referenceDate,
    studentId,
    userRole,
    canManage
  } = props;

  // Use selected date instead of selected day
  const [selectedDate, setSelectedDate] = useState<Date>(referenceDate);

  // Fetch events for the entire month to show dots
  const [monthEvents, setMonthEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  useEffect(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const qs = `?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`;
    setEventsLoading(true);
    
    const controller = new AbortController();
    
    fetch('/api/calendar/events'+qs, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((items: any[]) => {
        const events = Array.isArray(items) ? items : [];
        const filtered = events.filter(i => i.origin === 'event');
        setMonthEvents(filtered);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('❌ Error fetching events:', err);
        }
        setMonthEvents([]);
      })
      .finally(()=> setEventsLoading(false));
      
    return () => controller.abort();
  }, [selectedDate]);

  // Debug: Log the input defenses (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Approved Defenses Input:', approvedDefenses);
    }
  }, [approvedDefenses]);

  // Get days with events for calendar dots
  const daysWithEvents = useMemo(() => {
    const datesSet = new Set<string>();
    
    // Add defense dates
    approvedDefenses.forEach(d => {
      const isApproved = d.status === 'Approved' || 
                        d.workflow_state === 'scheduled' || 
                        d.workflow_state === 'completed';
      const defenseDate = d.date_of_defense || d.scheduled_date;
      if (isApproved && defenseDate) {
        try {
          const dateObj = defenseDate.includes('T') || defenseDate.includes(' ') 
            ? parseISO(defenseDate.replace(' ', 'T'))
            : parseISO(defenseDate);
          datesSet.add(format(dateObj, 'yyyy-MM-dd'));
        } catch {}
      }
    });
    
    // Add event dates
    monthEvents.forEach(ev => {
      try {
        const startStr = ev.start.replace(' ', 'T');
        const starts = parseISO(startStr);
        datesSet.add(format(starts, 'yyyy-MM-dd'));
      } catch {}
    });
    
    return Array.from(datesSet);
  }, [approvedDefenses, monthEvents]);

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

    const eventRows = monthEvents
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

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Combined Schedule for', format(selectedDate, 'yyyy-MM-dd'), ':', {
        defenseCount: defenseRows.length,
        eventCount: eventRows.length,
        total: sorted.length,
        items: sorted
      });
    }

    return sorted;
  }, [approvedDefenses, monthEvents, selectedDate, studentId]);

  const overallLoading = loading || eventsLoading;

  const canSeeRaw = canManage || MANAGE_ROLES.includes(userRole || '');

  return (
    <div className="w-full border rounded-xl bg-white dark:bg-zinc-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Schedule List */}
      <div className="flex-1 p-5 border-r border-gray-200 dark:border-zinc-800">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
          {/* First Row: Title with Icon and Chevron */}
          <a
            href="/schedules"
            className="flex items-center justify-between mb-2 group cursor-pointer select-none"
            style={{ textDecoration: 'none' }}
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Schedules
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="p-2 rounded-full bg-rose-500 dark:bg-rose-600 group-hover:bg-rose-600 dark:group-hover:bg-rose-500 transition-colors">
                <CalendarIcon className="size-5 text-white transition-colors" />
              </div>
              <ChevronRight className="size-5 text-gray-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
          </a>

          {/* Second Row: Date and Navigation */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {format(selectedDate, 'MMMM d, yyyy')}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {overallLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
            </div>
          ) : combined.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No schedules for this day
            </div>
          ) : (
            combined.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div
                  className="w-1 h-full rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                      {item.title}
                    </h4>
                    {item.kind === 'defense' && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        Defense
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {item.start && (
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>
                          {timeLabel(item.start)}
                          {item.end && ` - ${timeLabel(item.end)}`}
                        </span>
                      </div>
                    )}
                    
                    {item.kind === 'defense' && item.raw && (
                      <>
                        {item.raw.defense_mode && (
                          <div className="flex items-center gap-1">
                            {item.raw.defense_mode === 'Online' ? (
                              <Video className="size-3" />
                            ) : (
                              <MapPin className="size-3" />
                            )}
                            <span>{item.raw.defense_mode}</span>
                          </div>
                        )}
                        {item.raw.defense_venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            <span className="truncate">{item.raw.defense_venue}</span>
                          </div>
                        )}
                        {item.raw.program && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="size-3" />
                            <span className="truncate">{item.raw.program}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="w-full lg:w-[380px] p-5 bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border-0 w-full h-full flex flex-col"
          classNames={{
            months: "flex flex-col h-full",
            month: "flex flex-col flex-1",
            caption: "flex justify-center pt-1 relative items-center mb-4",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse flex-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-full w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center aspect-square",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          modifiers={{
            hasEvent: (date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              return daysWithEvents.includes(dateStr);
            }
          }}
          modifiersClassNames={{
            hasEvent: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-rose-500'
          }}
        />
      </div>
    </div>
  );
}