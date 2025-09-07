import { startOfWeek, parseISO, isSameDay } from "date-fns";
import { GraduationCap } from "lucide-react"; 
import { Skeleton } from "@/components/ui/skeleton";

type DefenseRequest = {
    id: number;
    thesis_title: string;
    status: string;
    date_of_defense: string;
    first_name?: string;
    last_name?: string;
    submitted_by?: number; // Add this if available
};

type Props = {
    weekDays: { label: string; value: number }[];
    selectedDay: number;
    setSelectedDay: (day: number) => void;
    approvedDefenses: DefenseRequest[];
    loading?: boolean;
    referenceDate: Date;
    studentId?: number; // <-- Add this prop
};

function getDateOfWeek(dayOfWeek: number, refDate: Date) {
    const start = startOfWeek(refDate, { weekStartsOn: 0 });
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOfWeek);
}

export default function WeeklyDefenseSchedulesWidget({
    weekDays,
    selectedDay,
    setSelectedDay,
    approvedDefenses,
    loading = false,
    referenceDate,
    studentId,
}: Props) {
    const selectedDate = getDateOfWeek(selectedDay, referenceDate);

    const filteredDefenses = approvedDefenses
        .filter(ev => {
            if (ev.status !== 'Approved' || !ev.date_of_defense) return false;
            const evDate = parseISO(ev.date_of_defense);
            return isSameDay(evDate, selectedDate);
        });

    return (
        <div className="w-full md:w-[340px] border  rounded-xl p-5 bg-white dark:bg-zinc-900 flex flex-col">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                This Week’s Schedules
            </div>
            <div className="flex gap-1 mb-3 flex-wrap max-w-full">
                {weekDays
                    .filter(day => day.value !== 0) 
                    .map(day => (
                        <button
                            key={day.value}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition
                                ${selectedDay === day.value
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'}
                            `}
                            onClick={() => setSelectedDay(day.value)}
                            disabled={loading}
                        >
                            {day.label}
                        </button>
                    ))}
            </div>
            <div className="flex flex-col gap-2">
                {loading ? (
                    <div>
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-7 w-full mb-2 bg-gray-100" />
                        ))}
                    </div>
                ) : filteredDefenses.length === 0 ? (
                    <div className="flex items-center justify-center h-24">
                        <span className="text-xs text-muted-foreground text-center">
                            No events scheduled.
                        </span>
                    </div>
                ) : (
                    filteredDefenses.map(ev => (
                        <div
                            key={ev.id}
                            className={`flex items-center gap-2 px-2 py-2 rounded border bg-transparent max-w-full ${studentId && ev.submitted_by === studentId ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : ''}`}
                            style={{ minWidth: 0 }}
                        >
                            <GraduationCap className="text-rose-400 mr-2 flex-shrink-0" size={18} />
                            <span
                                className="text-xs font-bold truncate overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{ maxWidth: "180px" }}
                            >
                                Thesis title: <span className="text-muted-foreground">{ev.thesis_title}</span>
                                {studentId && ev.submitted_by === studentId && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold">You</span>
                                )}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}