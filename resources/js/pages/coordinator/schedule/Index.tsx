import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, isSameMonth, isSameDay, isToday, parseISO
} from "date-fns";
// UI components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
// Icons
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, GraduationCap, Trash2, Printer, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { createPortal } from 'react-dom';

const pad2 = (n:number)=> n.toString().padStart(2,'0');

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Schedules', href: '/schedule' },
];

type DefenseEvent = {
  id: number;
  thesis_title: string;
  date_of_defense: string;
  start_time?: string;
  end_time?: string;
  defense_type?: string;
  defense_mode?: string;
  defense_venue?: string;
  program?: string;
  student_name?: string;
};

type CalendarEntry = {
  id: string;
  title: string;
  date: string;
  start?: string;
  end?: string;
  raw: DefenseEvent;
  defense?: boolean;
  color?: string;
  description?: string;
  __layout?: { top: number; height: number; leftPct: number; widthPct: number };
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 9 }, (_, i) => CURRENT_YEAR - 4 + i);

const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const MINUTE_STEP = 30;
const MINUTES_IN_DAY_RANGE = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const SLOT_HEIGHT = 44;

const EVENT_BASE =
  "bg-zinc-100 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-300 dark:ring-zinc-700/40 shadow-sm transition-colors";
const EVENT_BASE_SOLID =
  "bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-400 dark:ring-zinc-700/40 shadow-sm transition-colors";

function buildTimeSlots() {
  const slots: { label: string; minutes: number; isHour: boolean }[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    for (let m = 0; m < 60; m += MINUTE_STEP) {
      const minutes = (h - DAY_START_HOUR) * 60 + m;
      const label = format(new Date(2020,1,1,h,m,0),'h:mm a');
      slots.push({ label, minutes, isHour: m === 0 });
    }
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function timeToOffsetMinutes(t?: string) {
  if (!t) return 0;
  const [hh, mm] = t.split(':').map(v => parseInt(v,10));
  return (hh - DAY_START_HOUR) * 60 + mm;
}

function formatTime(t?: string) {
  if (!t) return '';
  const [hh, mm] = t.split(':');
  const d = new Date(2020,0,1, Number(hh||0), Number(mm||0), 0);
  return format(d,'h:mm a');
}

function computeOverlaps(dayEvents: CalendarEntry[]): CalendarEntry[] {
  if (!dayEvents.length) return dayEvents;
  const sorted = [...dayEvents].sort((a,b) =>
    (a.start || '').localeCompare(b.start || '') ||
    (a.end || '').localeCompare(b.end || '')
  );
  type Active = { ev: CalendarEntry; start: number; end: number; col: number };
  let active: Active[] = [];
  let maxCol = 0;
  const flush = () => {
    if (!active.length) return;
    const cols = maxCol + 1;
    active.forEach(a => {
      const widthPct = 100 / cols;
      a.ev.__layout = {
        leftPct: a.col * widthPct,
        widthPct: widthPct - 1.5,
        top: 0,
        height: 0
      };
    });
    active = [];
    maxCol = 0;
  };
  for (const ev of sorted) {
    const start = timeToOffsetMinutes(ev.start);
    const endRaw = ev.end ? timeToOffsetMinutes(ev.end) : (start + 30);
    const end = Math.max(start + 5, endRaw);
    active = active.filter(a => a.end > start);
    const used = new Set(active.map(a => a.col));
    let col = 0;
    while (used.has(col)) col++;
    active.push({ ev, start, end, col });
    maxCol = Math.max(maxCol, col);
  }
  flush();
  return sorted;
}

function getTextColor(bg?: string) {
  if (!bg) return '#064e3b';
  const c = bg.replace('#','');
  if (c.length !== 6) return '#064e3b';
  const r = parseInt(c.slice(0,2),16)/255;
  const g = parseInt(c.slice(2,4),16)/255;
  const b = parseInt(c.slice(4,6),16)/255;
  const lum = 0.2126*Math.pow(r,2.2)+0.7152*Math.pow(g,2.2)+0.0722*Math.pow(b,2.2);
  return lum > 0.55 ? '#1f2937' : '#ffffff';
}
function hexToRgb(hex: string) {
  const m = hex.replace('#','').match(/^([0-9a-fA-F]{6})$/);
  if (!m) return { r: 37, g: 99, b: 235 };
  const h = m[1];
  return {
    r: parseInt(h.slice(0,2),16),
    g: parseInt(h.slice(2,4),16),
    b: parseInt(h.slice(4,6),16)
  };
}
function getTheme(ev: CalendarEntry) {
  const base = (ev.defense ? '#059669' : (ev.color || '#2563eb')).toLowerCase();
  function shade(hex:string, amt:number) {
    const c = hex.replace('#','');
    const num = parseInt(c,16);
    let r = (num >> 16) + amt;
    let g = (num >> 8 & 0x00FF) + amt;
    let b = (num & 0x0000FF) + amt;
    r = Math.max(0, Math.min(255,r));
    g = Math.max(0, Math.min(255,g));
    b = Math.max(0, Math.min(255,b));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  const border = shade(base, -30);
  const { r, g, b } = hexToRgb(base);
  const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
  const text = luminance > 0.55 ? '#1f2937' : '#ffffff';
  const subText = luminance > 0.55 ? '#111827' : 'rgba(255,255,255,0.85)';
  return { base, border, text, subText };
}

const GLASS_HEADER = "backdrop-blur supports-[backdrop-filter]:bg-white/85 bg-white/70 dark:bg-zinc-900/75 shadow-sm";
const TOOLBAR_STICKY_TOP = 0;
const TOOLBAR_HEIGHT = 52;
const VIEW_HEADER_OFFSET = TOOLBAR_STICKY_TOP + TOOLBAR_HEIGHT;

function getCsrf() {
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return meta?.content || '';
}

export default function SchedulePage({ canManage, userRole }: { canManage: boolean; userRole: string }) {
  const [rawEvents, setRawEvents] = useState<DefenseEvent[]>([]);
  const [events, setEvents] = useState<CalendarEntry[]>([]);
  const [extraEvents, setExtraEvents] = useState<CalendarEntry[]>([]);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDate, setAddDate] = useState(format(new Date(),'yyyy-MM-dd'));
  const [addStart, setAddStart] = useState("08:00");
  const [addEnd, setAddEnd] = useState("09:00");
  const [addAllDay, setAddAllDay] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addColor, setAddColor] = useState<string>("#10b981");
  const colorChoices = ["#10b981","#0ea5e9","#6366f1","#f59e0b","#ef4444","#d946ef","#14b8a6","#6d28d9"];
  const [search] = useState(""); // reserved for future filtering UI

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(()=> setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const weekGridRef = useRef<HTMLDivElement | null>(null);
  const dayGridRef = useRef<HTMLDivElement | null>(null);
  const [weekCursor, setWeekCursor] = useState<{v:boolean; y:number}>({v:false, y:0});
  const [dayCursor, setDayCursor] = useState<{v:boolean; y:number}>({v:false, y:0});

  const handleWeekMove = (e: React.MouseEvent) => {
    if (!weekGridRef.current) return;
    const rect = weekGridRef.current.getBoundingClientRect();
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);
    setWeekCursor({v:true,y});
  };
  const handleWeekLeave = () => setWeekCursor({v:false,y:0});
  const handleDayMove = (e: React.MouseEvent) => {
    if (!dayGridRef.current) return;
    const rect = dayGridRef.current.getBoundingClientRect();
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height);
    setDayCursor({v:true,y});
  };
  const handleDayLeave = () => setDayCursor({v:false,y:0});

  // Defense requests
  useEffect(() => {
    setLoading(true);
    fetch('/defense-requests/calendar')
      .then(r => r.json())
      .then((data: DefenseEvent[]) => setRawEvents(data || []))
      .finally(()=> setLoading(false));
  }, []);

  // Non-defense events for month range
  useEffect(() => {
    const rangeStart = startOfMonth(monthCursor);
    const rangeEnd = endOfMonth(monthCursor);
    const qs = `?from=${encodeURIComponent(rangeStart.toISOString())}&to=${encodeURIComponent(rangeEnd.toISOString())}`;
    fetch('/api/calendar/events'+qs)
      .then(r => r.json())
      .then((items:any[]) => {
        const toDate = (s:string) => new Date(s.replace(' ','T'));
        const mapped: CalendarEntry[] = items
          .filter(it => it.origin === 'event')
          .map(it => {
            const sDate = toDate(it.start);
            const eDate = it.end ? toDate(it.end) : null;
            return {
              id: it.id,
              title: it.title || 'Event',
              date: format(sDate,'yyyy-MM-dd'),
              start: format(sDate,'HH:mm'),
              end: eDate ? format(eDate,'HH:mm') : undefined,
              raw: {
                id: Number((it.id||'').replace('ev-','')) || 0,
                thesis_title: it.title,
                date_of_defense: format(sDate,'yyyy-MM-dd'),
                start_time: format(sDate,'HH:mm'),
                end_time: eDate ? format(eDate,'HH:mm') : undefined,
                defense_type: undefined,
                defense_mode: undefined,
                defense_venue: undefined,
                program: undefined,
                student_name: undefined,
              },
              color: it.color || '#2563eb',
              defense: false,
              description: (it.description ?? it.desc ?? it.details ?? it.detail ?? it.note ?? it.notes ?? "") as string
            } as CalendarEntry;
          });
        setExtraEvents(mapped);
      })
      .catch(()=>{/* ignore */});
  }, [monthCursor]);

  // Merge events
  useEffect(() => {
    const defenseEntries = rawEvents.map(d => ({
      id: 'def-'+d.id,
      title: d.thesis_title || 'Thesis Defense',
      date: d.date_of_defense,
      start: d.start_time ? d.start_time.slice(0,5) : undefined,
      end: d.end_time ? d.end_time.slice(0,5) : undefined,
      raw: d,
      defense: true
    })) as CalendarEntry[];
    setEvents([...defenseEntries, ...extraEvents]);
  }, [rawEvents, extraEvents]);

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.raw.student_name || '').toLowerCase().includes(q) ||
      (e.raw.program || '').toLowerCase().includes(q) ||
      (e.raw.defense_type || '').toLowerCase().includes(q)
    );
  }, [events, search]);

  const monthWeeks = useMemo(() => {
    const s = startOfWeek(startOfMonth(monthCursor), { weekStartsOn:0 });
    const e = endOfWeek(endOfMonth(monthCursor), { weekStartsOn:0 });
    const rows: Date[][] = [];
    let d = s;
    while (d <= e) {
      const row: Date[] = [];
      for (let i=0;i<7;i++) { row.push(d); d = addDays(d,1); }
      rows.push(row);
    }
    return rows;
  }, [monthCursor]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    filtered.forEach(ev => {
      (map[ev.date] ||= []).push(ev);
    });
    Object.values(map).forEach(list =>
      list.sort((a,b)=> (a.start||'23:59:59').localeCompare(b.start||'23:59:59'))
    );
    return map;
  }, [filtered]);

  const selectedDateStr = selectedDate ? format(selectedDate,'yyyy-MM-dd') : '';
  const dayEvents = useMemo(
    () => (selectedDateStr ? (eventsByDate[selectedDateStr] || []) : []),
    [eventsByDate, selectedDateStr]
  );

  const weekDays = useMemo(() => {
    const base = selectedDate || new Date();
    const s = startOfWeek(base, { weekStartsOn:0 });
    return Array.from({ length:7 }, (_,i)=> addDays(s,i));
  }, [selectedDate]);

  const weekMap = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    weekDays.forEach(d => {
      const k = format(d,'yyyy-MM-dd');
      map[k] = (eventsByDate[k] || []).map(e => ({...e}));
      computeOverlaps(map[k]);
    });
    return map;
  }, [weekDays, eventsByDate]);

  const goPrev = () => {
    if (view === 'month') setMonthCursor(addDays(startOfMonth(monthCursor), -1));
    else if (view === 'week') setSelectedDate(d => addDays(d || new Date(), -7));
    else setSelectedDate(d => addDays(d || new Date(), -1));
  };
  const goNext = () => {
    if (view === 'month') setMonthCursor(addDays(endOfMonth(monthCursor), 1));
    else if (view === 'week') setSelectedDate(d => addDays(d || new Date(), 7));
    else setSelectedDate(d => addDays(d || new Date(), 1));
  };
  const goToday = () => {
    const t = new Date();
    setMonthCursor(t);
    setSelectedDate(t);
  };

  useEffect(() => {
    if (view === 'month' && selectedDate && !isSameMonth(selectedDate, monthCursor)) {
      setSelectedDate(monthCursor);
    }
  }, [view, monthCursor, selectedDate]);

  function truncate(s: string, n=28) {
    return s.length > n ? s.slice(0,n)+'…' : s;
  }

  const renderMonth = () => {
    const weeks = monthWeeks;
    const cellMinHeight = 120;
    return (
      <div className="w-full border border-t-0 bg-white flex flex-col rounded-b-md rounded-t-none">
        <div
          className={cn("grid border-b sticky z-40", GLASS_HEADER)}
          style={{ gridTemplateColumns: "repeat(7, 1fr)", top: VIEW_HEADER_OFFSET }}
        >
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
            <div key={d} className="h-12 border-r last:border-r-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map(week =>
            week.map(day => {
              const key = format(day,'yyyy-MM-dd');
              const list = eventsByDate[key] || [];
              const outMonth = !isSameMonth(day, monthCursor);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              return (
                <div
                  key={key}
                  onClick={() => { setSelectedDate(day); setView('day'); }}
                  className={cn(
                    "relative p-1 border-r border-b last:[&:nth-last-child(-n+7)]:border-b-0 cursor-pointer overflow-hidden transition-colors focus:outline-none focus-visible:outline-none",
                    outMonth ? "bg-muted/20 text-muted-foreground" : "bg-white",
                    "hover:bg-accent/40"
                  )}
                  style={{ minHeight: cellMinHeight }}
                >
                  <div className="flex items-start justify-between mb-0.5">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold select-none",
                        today && "bg-primary text-white shadow",
                        !today && selected && "bg-primary/80 text-white",
                        !today && !selected && "text-muted-foreground"
                      )}
                    >
                      {format(day,'d')}
                    </span>
                    {list.length > 3 && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        +{list.length-3}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {list.slice(0,3).map(ev => (
                      <div
                        key={ev.id}
                        className={cn(
                          "px-1 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1",
                          ev.defense ? EVENT_BASE_SOLID : EVENT_BASE // <-- use neutral ring, not emerald
                        )}
                        style={
                          !ev.defense
                            ? { backgroundColor: ev.color || '#6ee7b7', color: getTextColor(ev.color) }
                            : undefined
                        }
                        title={ev.title}
                      >
                        {ev.defense && <GraduationCap className="h-3 w-3" />}
                        {truncate(ev.title, 26)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const TIME_COL_WIDTH = 90;
    const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT;
    let weekCursorTime: string | null = null;
    if (weekCursor.v) {
      const minutesOffset = Math.min(
        MINUTES_IN_DAY_RANGE,
        Math.max(0, (weekCursor.y / totalHeight) * MINUTES_IN_DAY_RANGE)
      );
      const absMinutes = Math.round(minutesOffset);
      const hour24 = DAY_START_HOUR + Math.floor(absMinutes / 60);
      const minute = absMinutes % 60;
      const hour12 = ((hour24 + 11) % 12) + 1;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      weekCursorTime = `${hour12}:${pad2(minute)} ${ampm}`;
    }
    return (
      <div className="w-full border border-t-0 bg-white flex flex-col overflow-visible rounded-b-md rounded-t-none">
        <div
          className={cn("grid border-b sticky z-40", GLASS_HEADER)}
          style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`, top: VIEW_HEADER_OFFSET }}
        >
          <div className="h-12 border-r flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            TIME
          </div>
          {weekDays.map(d => {
            const selected = selectedDate && isSameDay(d, selectedDate);
            const today = isToday(d);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "h-12 border-r flex flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  selected && !today && "bg-primary/5",
                  today && "text-primary font-semibold"
                )}
              >
                <span className="uppercase tracking-wide text-[10px]">{format(d,'EEE')}</span>
                <span
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold",
                    today && "bg-primary text-white shadow",
                    !today && selected && "bg-primary/80 text-white"
                  )}
                >
                  {format(d,'d')}
                </span>
              </div>
            );
          })}
        </div>
        <div
          ref={weekGridRef}
          className="relative"
          style={{ minHeight: totalHeight }}
          onMouseMove={handleWeekMove}
          onMouseLeave={handleWeekLeave}
        >
          <div className="absolute left-0 top-0 bottom-0 border-r bg-white z-20" style={{ width: TIME_COL_WIDTH }}>
            {TIME_SLOTS.map(slot => (
              <div key={slot.minutes} className="relative flex items-center justify-end pr-3" style={{ height: SLOT_HEIGHT }}>
                <span className={cn("select-none text-[10px]", slot.isHour ? "font-semibold text-muted-foreground" : "text-muted-foreground/50")}>
                  {slot.label.replace(':00','')}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 right-0 grid" style={{ left: TIME_COL_WIDTH, gridTemplateColumns: "repeat(7, 1fr)" }}>
            {weekDays.map(d => {
              const dateKey = format(d,'yyyy-MM-dd');
              const list = weekMap[dateKey] || [];
              return (
                <div key={'week-col-'+dateKey} className={cn("relative border-r", isToday(d) && "bg-primary/5")}>
                  {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) =>
                    i % 2 === 1 ? (
                      <div key={'stripe-'+i} className="absolute inset-x-0 bg-muted/15" style={{ top: i * 2 * SLOT_HEIGHT, height: SLOT_HEIGHT * 2 }} />
                    ) : null
                  )}
                  {TIME_SLOTS.map((slot,i) => (
                    <div
                      key={slot.minutes}
                      className={cn("absolute left-0 right-0 border-b", slot.isHour ? "border-muted-foreground/40" : "border-muted/40")}
                      style={{ top: i * SLOT_HEIGHT }}
                    />
                  ))}
                  {list.map(ev => {
                    const startMin = Math.max(0, timeToOffsetMinutes(ev.start));
                    const endMin = Math.min(
                      MINUTES_IN_DAY_RANGE,
                      ev.end ? timeToOffsetMinutes(ev.end) : startMin + 60
                    );
                    const topPct = (startMin / MINUTES_IN_DAY_RANGE) * 100;
                    const duration = Math.max(5, (endMin - startMin));
                    const heightPct = (duration / MINUTES_IN_DAY_RANGE) * 100;
                    const l = ev.__layout;
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          "absolute rounded-md text-[11px] flex flex-col overflow-hidden cursor-pointer",
                          ev.defense ? EVENT_BASE : EVENT_BASE, // <-- use neutral ring for all
                          "hover:ring-2 ring-primary/40"
                        )}
                        style={{
                          top: `calc(${topPct}% )`,
                          height: `calc(${heightPct}% )`,
                          left: `calc(${(l?.leftPct ?? 0)}% + 4px)`,
                          width: `calc(${(l?.widthPct ?? 100)}% - 8px)`,
                          backgroundColor: ev.defense ? undefined : (ev.color || '#34d399'),
                          color: ev.defense ? undefined : getTextColor(ev.color)
                        }}
                        title={ev.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canManage && !ev.defense) {
                            setEditEvent(ev);
                          } else {
                            setSelectedDate(parseISO(ev.date));
                            setDetailEvent(ev);
                            setView('day');
                          }
                        }}
                      >
                        <div className="px-1 pt-1 flex items-start gap-1">
                          {ev.defense && <GraduationCap className="h-3.5 w-3.5 shrink-0 text-emerald-900/80" />}
                          <span className="font-semibold leading-tight truncate">
                            {truncate(ev.title, 56)}
                          </span>
                        </div>
                        <div className="px-1 pb-1 font-medium">
                          {ev.start && formatTime(ev.start)}
                          {ev.end && ' – ' + formatTime(ev.end)}
                        </div>
                        {ev.raw.student_name && ev.defense && (
                          <div className="px-1 pb-1 truncate text-emerald-950/90 text-[10px]">
                            {truncate(ev.raw.student_name, 40)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {weekCursor.v && (
              <>
                <div className="pointer-events-none absolute left-0 right-0 h-px bg-black/60 z-40" style={{ top: weekCursor.y }} />
                {weekCursorTime && (
                  <div
                    className="pointer-events-none absolute z-50 -translate-y-1/2 px-1.5 py-0.5 bg-black text-white rounded text-[10px] font-medium shadow"
                    style={{ top: weekCursor.y, left: 4 }}
                  >
                    {weekCursorTime}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDay = () => {
    const d = selectedDate || new Date();
    const key = format(d,'yyyy-MM-dd');
    const list = computeOverlaps((eventsByDate[key] || []).map(e => ({...e})));
    const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT;
    let dayCursorTime: string | null = null;
    if (dayCursor.v) {
      const minutesOffset = Math.min(
        MINUTES_IN_DAY_RANGE,
        Math.max(0, (dayCursor.y / totalHeight) * MINUTES_IN_DAY_RANGE)
      );
      const absMinutes = Math.round(minutesOffset);
      const hour24 = DAY_START_HOUR + Math.floor(absMinutes / 60);
      const minute = absMinutes % 60;
      const hour12 = ((hour24 + 11) % 12) + 1;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      dayCursorTime = `${hour12}:${pad2(minute)} ${ampm}`;
    }
    return (
      <div className="w-full border border-t-0 bg-white flex flex-col rounded-b-md rounded-t-none">
        <div className={cn("sticky flex items-center justify-between px-6 py-4 border-b z-40", GLASS_HEADER)} style={{ top: VIEW_HEADER_OFFSET }}>
          <div className="flex items-end gap-4">
            <div className="flex flex-col leading-none">
              <span className="text-4xl font-bold tracking-tight">
                {format(d,'d')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{format(d,'MMMM')}</span>
              <span className="text-sm text-muted-foreground">{format(d,'EEEE, yyyy')}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[11px] px-3 py-1">
            Approved Defenses
          </Badge>
        </div>
        <div
          ref={dayGridRef}
          className="relative"
          onMouseMove={handleDayMove}
          onMouseLeave={handleDayLeave}
        >
          <div className="relative" style={{ minHeight: totalHeight }}>
            <div className="absolute left-0 top-0 bottom-0 w-[90px] border-r bg-white z-20">
              {TIME_SLOTS.map(slot => (
                <div key={slot.minutes} className="relative flex items-center justify-end pr-3" style={{ height: SLOT_HEIGHT }}>
                  <span className={cn("text-[11px] select-none", slot.isHour ? "font-semibold text-muted-foreground" : "text-muted-foreground/50")}>
                    {slot.label.replace(':00','')}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute left-[90px] right-0 top-0 bottom-0">
              {Array.from({length: DAY_END_HOUR - DAY_START_HOUR}, (_,i)=> (
                i % 2 === 1 ? (
                  <div key={'stripe-'+i} className="absolute inset-x-0 bg-muted/15" style={{ top: i * 2 * SLOT_HEIGHT, height: SLOT_HEIGHT * 2 }} />
                ) : null
              ))}
              {TIME_SLOTS.map((slot,i) => (
                <div
                  key={slot.minutes}
                  className={cn("absolute left-0 right-0 border-b", slot.isHour ? "border-muted-foreground/40" : "border-muted/40")}
                  style={{ top: i * SLOT_HEIGHT }}
                />
              ))}
              {list.map(ev => {
                const startMin = Math.max(0, timeToOffsetMinutes(ev.start));
                const endMin = Math.min(
                  MINUTES_IN_DAY_RANGE,
                  ev.end ? timeToOffsetMinutes(ev.end) : startMin + 60
                );
                const topPct = (startMin / MINUTES_IN_DAY_RANGE) * 100;
                const duration = Math.max(5, (endMin - startMin));
                const heightPct = (duration / MINUTES_IN_DAY_RANGE) * 100;
                const l = ev.__layout;
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "absolute rounded-md p-2 text-[11px] flex flex-col overflow-hidden cursor-pointer",
                      ev.defense ? EVENT_BASE_SOLID : EVENT_BASE, // <-- use neutral ring for all
                      "hover:ring-2 ring-primary/40"
                    )}
                    style={{
                      top: `calc(${topPct}% )`,
                      height: `calc(${heightPct}% )`,
                      left: `calc(${(l?.leftPct ?? 0)}% )`,
                      width: `calc(${(l?.widthPct ?? 100)}% )`,
                      backgroundColor: ev.defense ? undefined : (ev.color || '#34d399'),
                      color: ev.defense ? undefined : getTextColor(ev.color)
                    }}
                    title={ev.title}
                    onClick={(e)=> {
                      e.stopPropagation();
                      if (canManage && !ev.defense) {
                        setEditEvent(ev);
                      } else {
                        setDetailEvent(ev);
                      }
                    }}
                  >
                    <div className="flex items-start gap-1">
                      {ev.defense && <GraduationCap className="h-4 w-4 shrink-0" />}
                      <div className="font-semibold leading-tight truncate text-[12px]">
                        {truncate(ev.title, 80)}
                      </div>
                    </div>
                    <div className="text-[11px] font-medium mt-0.5">
                      {ev.start && formatTime(ev.start)}
                      {ev.end && ' – ' + formatTime(ev.end)}
                      {ev.raw.student_name && ev.defense && ' • '+ev.raw.student_name}
                    </div>
                    {ev.defense && ev.raw.student_name && (
                      <div className="text-[10px] truncate">
                        {ev.raw.student_name} {ev.raw.program && <span className="opacity-70">({ev.raw.program})</span>}
                      </div>
                    )}
                    {ev.defense && ev.raw.defense_type && (
                      <div className="text-[10px] mt-0.5 uppercase tracking-wide">
                        {ev.raw.defense_type}
                      </div>
                    )}
                  </div>
                );
              })}
              {dayCursor.v && (
                <>
                  <div className="pointer-events-none absolute left-0 right-0 h-px bg-black/60 z-40" style={{ top: dayCursor.y }} />
                  {dayCursorTime && (
                    <div
                      className="pointer-events-none absolute z-50 -translate-y-1/2 px-1.5 py-0.5 bg-black text-white rounded text-[10px] font-medium shadow"
                      style={{ top: dayCursor.y, left: 4 }}
                    >
                      {dayCursorTime}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEntry | null>(null);
  const [detailEvent, setDetailEvent] = useState<CalendarEntry | null>(null);
  const [detailClosing, setDetailClosing] = useState(false);
  const [detailAnimating, setDetailAnimating] = useState(false);
  const isEditing = !!editEvent;

  const closeDetail = () => {
    if (!detailEvent || detailClosing) return;
    setDetailClosing(true);
    setTimeout(() => {
      setDetailEvent(null);
      setDetailClosing(false);
    }, 180);
  };

  useEffect(() => {
    if (detailEvent) {
      setDetailClosing(false);
      setDetailAnimating(true);
      const id = requestAnimationFrame(() => setDetailAnimating(false));
      return () => cancelAnimationFrame(id);
    }
  }, [detailEvent]);

  // Outside click / ESC close for detail panel
  useEffect(() => {
    if (!detailEvent) return;
    const handleClick = (e: MouseEvent) => {
      if (sidePanelRef.current && !sidePanelRef.current.contains(e.target as Node)) {
        closeDetail();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [detailEvent]);

  const DetailPanel = detailEvent && view === 'day'
    ? createPortal(
        <div
          ref={sidePanelRef}
            className={cn(
              "fixed right-4 w-[400px] max-h-[82vh] flex flex-col rounded-lg overflow-hidden shadow-lg border z-[2500]",
              "transition-all duration-200 ease-out will-change-transform will-change-opacity origin-top",
              (detailAnimating || detailClosing)
                ? "opacity-0 translate-y-2 scale-[0.97]"
                : "opacity-100 translate-y-0 scale-100"
            )}
            style={{ top: TOOLBAR_STICKY_TOP + TOOLBAR_HEIGHT + 14 }}
        >
          {(() => {
            const ev = detailEvent;
            const t = getTheme(ev);
            const dateStr = format(parseISO(ev.date), 'PPP');
            const timeStr =
              (ev.start ? format(parseISO('2020-01-01T'+ev.start),'h:mm a') : '') +
              (ev.end ? ' – '+format(parseISO('2020-01-01T'+ev.end),'h:mm a') : (ev.start ? '' : ''));
            const desc = (ev.description && ev.description.trim()) || '—';
            return (
              <>
                <div
                  className="px-4 py-3 flex items-start gap-3"
                  style={{ background: t.base, borderBottom: `1px solid ${t.border}`, color: t.text }}
                >
                  <div className="mt-0.5 shrink-0">
                    {ev.defense
                      ? <GraduationCap className="h-5 w-5" style={{ color: t.text }} />
                      : <CalendarIcon className="h-5 w-5" style={{ color: t.text }} />}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-sm leading-snug pr-6" style={{ color: t.text }} title={ev.title}>
                      {ev.title}
                    </h2>
                    <div className="text-[11px] font-medium mt-0.5" style={{ color: t.subText }}>
                      {dateStr}{timeStr && ' • '+timeStr}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 -m-1" onClick={closeDetail}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {ev.defense ? 'Defense Details' : 'Event Details'}
                      </div>
                      <dl className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
                        <dt className="font-medium text-muted-foreground">Date</dt>
                        <dd className="col-span-2">{dateStr}</dd>

                        <dt className="font-medium text-muted-foreground">Time</dt>
                        <dd className="col-span-2">{timeStr || '—'}</dd>

                        {ev.defense && (
                          <>
                            <dt className="font-medium text-muted-foreground">Student</dt>
                            <dd className="col-span-2">{ev.raw.student_name || '—'}</dd>

                            <dt className="font-medium text-muted-foreground">Program</dt>
                            <dd className="col-span-2">{ev.raw.program || '—'}</dd>

                            <dt className="font-medium text-muted-foreground">Type</dt>
                            <dd className="col-span-2 uppercase">{ev.raw.defense_type || '—'}</dd>

                            <dt className="font-medium text-muted-foreground">Mode</dt>
                            <dd className="col-span-2">{ev.raw.defense_mode || '—'}</dd>

                            <dt className="font-medium text-muted-foreground">Venue</dt>
                            <dd className="col-span-2">{ev.raw.defense_venue || '—'}</dd>
                          </>
                        )}

                        <dt className="font-medium text-muted-foreground">Description</dt>
                        <dd className="col-span-2 whitespace-pre-wrap">{desc}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>,
        document.body
      )
    : null;

  useEffect(() => {
    if (editEvent) {
      setShowAdd(true);
      setAddTitle(editEvent.title);
      setAddDate(editEvent.date);
      setAddAllDay(false);
      setAddStart(editEvent.start ? editEvent.start.slice(0,5) : "08:00");
      setAddEnd(editEvent.end ? editEvent.end.slice(0,5) : (editEvent.start ? editEvent.start.slice(0,5) : "09:00"));
      setAddDesc(editEvent.description || "");
      setAddColor(editEvent.color || "#10b981");
    }
  }, [editEvent]);

  useEffect(() => {
    if (!showAdd && !editEvent) {
      setAddTitle("");
      setAddDesc("");
      setAddAllDay(false);
      setAddStart("08:00");
      setAddEnd("09:00");
      setAddColor("#10b981");
    }
    if (!showAdd && editEvent) setEditEvent(null);
  }, [showAdd, editEvent]);

  const handlePrint = () => {
    try {
      const sorted = [...filtered].slice().sort((a,b)=>
        a.date === b.date
          ? (a.start||'23:59').localeCompare(b.start||'23:59')
          : a.date.localeCompare(b.date)
      );
      const esc = (s:string)=> (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const rows = sorted.map(ev => {
        const dateStr = format(parseISO(ev.date),'MMM d, yyyy');
        const timeStr =
          (ev.start ? format(parseISO('2020-01-01T'+ev.start),'h:mm a') : '') +
          (ev.end ? ' – '+format(parseISO('2020-01-01T'+ev.end),'h:mm a') : '');
        return `<tr>
          <td>${esc(dateStr)}</td>
          <td>${esc(timeStr)}</td>
          <td>${esc(ev.title)}</td>
          <td>${esc(ev.raw.student_name||'—')}</td>
          <td>${esc(ev.raw.program||'—')}</td>
          <td>${esc(ev.raw.defense_type||'—')}</td>
          <td>${esc(ev.raw.defense_venue || ev.raw.defense_mode || '—')}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="7" style="text-align:center;padding:16px;color:#666;">No scheduled defenses.</td></tr>`;
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Schedules Print</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing:border-box; font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif; }
  body { margin:24px; color:#111; }
  h1 { margin:0 0 16px; font-size:20px; }
  table { border-collapse:collapse; width:100%; font-size:12px; }
  thead th { background:#f1f5f9; text-align:left; padding:6px 8px; font-weight:600; border:1px solid #dbe1e6; }
  td { padding:6px 8px; border:1px solid #e2e8f0; vertical-align:top; }
  tbody tr:nth-child(even) { background:#fafafa; }
  @media print { body { margin:8px 16px; } }
</style>
</head>
<body>
<h1>Schedules (${sorted.length})</h1>
<table>
  <thead>
    <tr>
      <th>Date</th><th>Time</th><th>Title</th><th>Student</th><th>Program</th><th>Type</th><th>Venue / Mode</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),120);});</script>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (!w) {
        alert('Pop-up blocked. Allow pop-ups to print.');
        URL.revokeObjectURL(url);
        return;
      }
      setTimeout(()=> URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error('Print failed', e);
      alert('Print failed.');
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Schedules" />
      <div className="flex flex-col gap-0 bg-white dark:bg-zinc-900 min-h-screen">
        {/* Skeleton Loader */}
        {loading ? (
          <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
            {/* Top short row */}
            <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
            {/* Main rows */}
            <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
            <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
            {/* Big rectangle for calendar/content */}
            <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md rounded-b-none px-3 py-2 sticky z-50",
                "shadow-sm"
              )}
              style={{ top: TOOLBAR_STICKY_TOP }}
            >
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={goPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={goNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToday}>Today</Button>
              </div>
              <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden h-8">
                {([
                  { key: 'day', label: 'Day', icon: <CalendarDays className="mr-1 h-4 w-4" /> },
                  { key: 'week', label: 'Week', icon: <CalendarRange className="mr-1 h-4 w-4" /> },
                  { key: 'month', label: 'Month', icon: <Calendar className="mr-1 h-4 w-4" /> },
                ] as const).map(v => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={()=> setView(v.key)}
                    className={cn(
                      "px-3 text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none flex items-center cursor-pointer",
                      view === v.key
                        ? "bg-primary text-white"
                        : "bg-white dark:bg-zinc-900 hover:bg-muted/60 dark:hover:bg-zinc-800 text-muted-foreground"
                    )}
                  >
                    {v.icon}
                    {v.label}
                  </button>
                ))}
              </div>
              {view === 'month' && (
                <>
                  <Select
                    value={String(monthCursor.getMonth())}
                    onValueChange={val => {
                      const d = new Date(monthCursor);
                      d.setMonth(Number(val));
                      setMonthCursor(d);
                    }}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue>{MONTHS[monthCursor.getMonth()]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m,i)=>(
                        <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(monthCursor.getFullYear())}
                    onValueChange={val => {
                      const d = new Date(monthCursor);
                      d.setFullYear(Number(val));
                      setMonthCursor(d);
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue>{monthCursor.getFullYear()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {canManage && (
                <div className="flex items-center gap-2 ml-auto">
                  <Button type="button" size="icon" variant="outline" onClick={handlePrint} title="Print schedules">
                    <Printer className="h-4 w-4 hover:cursor-printer" />
                  </Button>
                  <Dialog open={showAdd} onOpenChange={o => { setShowAdd(o); if (!o) setAddError(null); }}>
                    <DialogTrigger asChild>
                      <Button className="hover:cursor-pointer" size="sm">{isEditing ? 'Edit Event' : 'Add Event'}</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-semibold">
                          {isEditing ? 'Edit Event' : 'Create Event'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-1">
                        {addError && (
                          <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                            {addError}
                          </div>
                        )}
                        <div className="grid gap-1">
                          <Label className="text-xs">Title</Label>
                          <Textarea
                            rows={2}
                            value={addTitle}
                            onChange={e=> setAddTitle(e.target.value)}
                            placeholder="Event title"
                            className="text-xs resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 grid gap-1">
                            <Label className="text-xs">Date</Label>
                            <input
                              type="date"
                              value={addDate}
                              onChange={e=> setAddDate(e.target.value)}
                              className="h-8 text-xs border rounded-md px-2"
                            />
                          </div>
                          <div className="grid gap-1 w-28">
                            <Label className="text-xs">All Day</Label>
                            <div className="h-8 px-2 flex items-center gap-2 border rounded-md">
                              <Checkbox checked={addAllDay} onCheckedChange={v=> setAddAllDay(!!v)} />
                              <span className="text-[11px]">Yes</span>
                            </div>
                          </div>
                        </div>
                        {!addAllDay && (
                          <div className="flex gap-3">
                            <div className="grid gap-1 flex-1">
                              <Label className="text-xs">Start</Label>
                              <input
                                type="time"
                                step={300}
                                value={addStart}
                                onChange={e=> setAddStart(e.target.value)}
                                className="h-8 text-xs border rounded-md px-2"
                              />
                            </div>
                            <div className="grid gap-1 flex-1">
                              <Label className="text-xs">End</Label>
                              <input
                                type="time"
                                step={300}
                                value={addEnd}
                                onChange={e=> setAddEnd(e.target.value)}
                                className="h-8 text-xs border rounded-md px-2"
                              />
                            </div>
                          </div>
                        )}
                        <div className="grid gap-1">
                          <Label className="text-xs">Description (optional)</Label>
                          <Textarea
                            value={addDesc}
                            onChange={e=> setAddDesc(e.target.value)}
                            rows={3}
                            className="text-xs resize-none"
                            placeholder="Short description..."
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Color</Label>
                          <div className="flex flex-wrap gap-2">
                            {colorChoices.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={()=> setAddColor(c)}
                                className={cn(
                                  "w-6 h-6 rounded-full ring-2 transition",
                                  addColor === c ? "ring-black scale-110" : "ring-transparent hover:ring-gray-400"
                                )}
                                style={{ backgroundColor: c }}
                                aria-label={`Choose ${c}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        {isEditing && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={async ()=>{
                              if(!editEvent) return;
                              if(!confirm('Delete this event?')) return;
                              setAdding(true);
                              try {
                                const csrf = getCsrf();
                                const resp = await fetch(`/api/calendar/events/${editEvent.raw.id}`, {
                                  method:'DELETE',
                                  headers:{'Accept':'application/json','X-CSRF-TOKEN': csrf}
                                });
                                if(!resp.ok) throw new Error('Delete failed');
                                setExtraEvents(prev => prev.filter(p => p.raw.id !== editEvent.raw.id));
                                setShowAdd(false);
                                setEditEvent(null);
                              } catch(e:any){
                                setAddError(e.message||'Delete failed');
                              } finally {
                                setAdding(false);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={()=> setShowAdd(false)} disabled={adding}>Cancel</Button>
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!addTitle.trim()) { setAddError("Title required."); return; }
                            if (!addDate) { setAddError("Date required."); return; }
                            if (!addAllDay && addEnd <= addStart) {
                              setAddError("End must be after start.");
                              return;
                            }
                            setAddError(null);
                            setAdding(true);
                            try {
                              const csrf = getCsrf();
                              const payload:any = {
                                title: addTitle.trim(),
                                description: addDesc.trim() || null,
                                start: addAllDay ? `${addDate} 00:00:00` : `${addDate} ${addStart}:00`,
                                end: addAllDay ? `${addDate} 23:59:59` : `${addDate} ${addEnd}:00`,
                                allDay: addAllDay,
                                color: addColor
                              };
                              let resp: Response;
                              if (isEditing && editEvent) {
                                resp = await fetch(`/api/calendar/events/${editEvent.raw.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN': csrf },
                                  body: JSON.stringify(payload)
                                });
                              } else {
                                resp = await fetch('/api/calendar/events', {
                                  method: 'POST',
                                  headers: { 'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN': csrf },
                                  body: JSON.stringify(payload)
                                });
                              }
                              if (!resp.ok) {
                                const j = await resp.json().catch(()=> ({}));
                                throw new Error(j.message || j.error || 'Save failed');
                              }
                              const j = await resp.json().catch(()=> ({}));
                              const eventId = j.event_id || (editEvent && editEvent.raw.id);
                              const s = addAllDay ? "00:00" : addStart;
                              const e = addAllDay ? "23:59" : addEnd;
                              setExtraEvents(prev => {
                                const others = prev.filter(p => p.raw.id !== eventId);
                                const newEntry: CalendarEntry = {
                                  id: 'ev-'+eventId,
                                  title: addTitle.trim(),
                                  date: addDate,
                                  start: s,
                                  end: e,
                                  raw: {
                                    id: eventId,
                                    thesis_title: addTitle.trim(),
                                    date_of_defense: addDate,
                                    start_time: s,
                                    end_time: e,
                                    defense_type: undefined,
                                    defense_mode: undefined,
                                    defense_venue: undefined,
                                    program: undefined,
                                    student_name: undefined,
                                  },
                                  color: addColor,
                                  defense: false,
                                  description: addDesc.trim()
                                };
                                return [...others, newEntry];
                              });
                              setShowAdd(false);
                              setEditEvent(null);
                            } catch(err:any) {
                              setAddError(err.message || 'Error');
                            } finally {
                              setAdding(false);
                            }
                          }}
                          disabled={adding}
                        >
                          {adding ? 'Saving...' : 'Save Event'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            {view === 'month' && renderMonth()}
            {view === 'week' && renderWeek()}
            {view === 'day' && renderDay()}
            {DetailPanel}
            {false && (
              <div className="border rounded-md overflow-hidden bg-white hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs font-semibold">Scheduled Defenses (Filtered)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Program</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Venue / Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                          No scheduled defenses.
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered
                      .slice()
                      .sort((a,b)=> a.date === b.date
                        ? (a.start||'23:59').localeCompare(b.start||'23:59')
                        : a.date.localeCompare(b.date))
                      .map(ev => (
                      <TableRow
                        key={ev.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => {
                          setSelectedDate(parseISO(ev.date));
                          setView('day');
                        }}
                      >
                        <TableCell className="text-[11px]">
                          {format(parseISO(ev.date),'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">
                          {ev.start && format(parseISO('2020-01-01T'+ev.start),'h:mm a')}
                          {ev.end && ' – '+format(parseISO('2020-01-01T'+ev.end),'h:mm a')}
                        </TableCell>
                        <TableCell className="text-[11px] truncate max-w-[240px]" title={ev.title}>
                          {ev.title}
                        </TableCell>
                        <TableCell className="text-[11px] truncate max-w-[160px]" title={ev.raw.student_name}>
                          {ev.raw.student_name || '—'}
                        </TableCell>
                        <TableCell className="text-[11px]">{ev.raw.program || '—'}</TableCell>
                        <TableCell className="text-[11px]">{ev.raw.defense_type || '—'}</TableCell>
                        <TableCell className="text-[11px]">
                          {ev.raw.defense_venue || ev.raw.defense_mode || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}