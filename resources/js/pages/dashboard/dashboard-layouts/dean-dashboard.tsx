import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Search } from 'lucide-react';
import QuickActionsWidget from '../widgets/quick-actions-widget';
import { Skeleton } from "@/components/ui/skeleton";
import { Card} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, CalendarDays, ClipboardList, BadgeDollarSign } from 'lucide-react';
import WeeklyDefenseSchedulesWidget from '../widgets/weekly-defense-schedule-widget';
import DefenseCountLineChart from '../widgets/visual-charts/defense-count';
import { DefenseTypeDistribution } from '../widgets/visual-charts/defense-type-distribution';
import { DefenseModeBreakdown } from '../widgets/visual-charts/defense-mode-breakdown';
import { OverallProgramActivity } from '../widgets/visual-charts/overall-program-activity';
import { CoordinatorPerformance } from '../widgets/visual-charts/coordinator-performance';
import StaffDataTable from '../widgets/staff-data-table';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProgramAbbreviation } from "@/utils/program-abbreviations";

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
};

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

// Helper: Get unique panelists from defense requests
function getPanelistStats(defenseRequests: any[]) {
    const panelistSet = new Set<string>();
    let assignedCount = 0;

    defenseRequests.forEach((req: any) => {
        if (Array.isArray(req.panelists)) {
            req.panelists.forEach((p: any) => {
                if (p?.id) {
                    panelistSet.add(p.id);
                    assignedCount++;
                }
            });
        }
    });

    return {
        totalPanelists: panelistSet.size,
        assignedPanelists: assignedCount,
    };
}

// Helper: Count today's scheduled defenses
function getTodaysSchedules(defenseRequests: any[]) {
    const today = new Date();
    return defenseRequests.filter((dr: any) => {
        if (!dr.scheduled_date) return false;
        const eventDate = new Date(dr.scheduled_date);
        return (
            eventDate.getFullYear() === today.getFullYear() &&
            eventDate.getMonth() === today.getMonth() &&
            eventDate.getDate() === today.getDate()
        );
    }).length;
}

export default function DeanDashboard() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    const [allRequests, setAllRequests] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [panelistsCount, setPanelistsCount] = useState<number>(0);
    const [advisersCount, setAdvisersCount] = useState<number>(0);
    const [assignedProgramsCount, setAssignedProgramsCount] = useState<number>(0);
    const [pendingHonorariumsCount, setPendingHonorariumsCount] = useState<number>(0);
    const [coordinators, setCoordinators] = useState<any[]>([]);
    const [assistants, setAssistants] = useState<any[]>([]);
    const [staffSearchQuery, setStaffSearchQuery] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('all');

    // Get all unique programs from coordinators
    const allPrograms = React.useMemo(() => {
        const programSet = new Set<string>();
        coordinators.forEach(staff => {
            if (staff.programs) {
                staff.programs.forEach((program: string) => programSet.add(program));
            }
        });
        return Array.from(programSet).sort();
    }, [coordinators]);

    // Calculate total unique programs count from all students
    const totalProgramsCount = React.useMemo(() => {
        return allPrograms.length;
    }, [allPrograms]);

    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
    const [tab, setTab] = useState("overview");

    const weekDays = [
        { label: 'Sun', value: 0 },
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 3 },
        { label: 'Thu', value: 4 },
        { label: 'Fri', value: 5 },
        { label: 'Sat', value: 6 },
    ];

    useEffect(() => {
        // Fetch all defense requests (not just assigned to user)
        fetch('/defense-requests', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                const requests = Array.isArray(data)
                    ? data
                    : (data.defenseRequests ?? []);
                setAllRequests(requests);

                const pending = requests.filter(
                    (r: any) => (r.normalized_status || r.status) === 'Pending'
                );
                setPendingRequests(pending);
            })
            .catch(() => {
                setAllRequests([]);
                setPendingRequests([]);
            })
            .finally(() => setLoading(false));

        // Fetch all panelists in the database
        fetch('/api/panelists', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setPanelistsCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setPanelistsCount(0));

        // Fetch all advisers in the database
        fetch('/api/advisers', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setAdvisersCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setAdvisersCount(0));

        // Fetch all programs in the database
        fetch('/api/programs', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setAssignedProgramsCount(Array.isArray(data) ? data.length : 0);
            })
            .catch(() => setAssignedProgramsCount(0));

        // Fetch pending honorariums count
        fetch('/api/dean/pending-honorariums', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : { pending_count: 0 })
            .then((data) => setPendingHonorariumsCount(data.pending_count ?? 0))
            .catch(() => setPendingHonorariumsCount(0));

        // Fetch all coordinators
        fetch('/api/coordinators', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setCoordinators(Array.isArray(data) ? data : []);
            })
            .catch(() => setCoordinators([]));

        // Fetch all assistants
        fetch('/api/assistants', {
            headers: { 'Accept': 'application/json' }
        })
            .then(res => res.ok ? res.json() : [])
            .then((data) => {
                setAssistants(Array.isArray(data) ? data : []);
            })
            .catch(() => setAssistants([]));
    }, []);

    const todaysSchedules = getTodaysSchedules(allRequests);

    // Metric cards (overall, not just assigned to user)
    const metrics = [
        {
            title: "Today's Defense Schedules",
            value: todaysSchedules,
            description: "Defenses scheduled for today",
            icon: <CalendarDays className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Pending Honorariums",
            value: pendingHonorariumsCount,
            description: "Honorariums not yet processed",
            icon: <BadgeDollarSign className="size-5 text-rose-400" />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Programs",
            value: totalProgramsCount,
            description: "Total number of all programs",
            icon: <ClipboardList className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Advisers",
            value: advisersCount,
            description: "Total advisers",
            icon: <Users className="size-5 text-rose-400" />,
            iconTheme: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300",
        },
        {
            title: "Panelists",
            value: (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {panelistsCount}
                </span>
            ),
            description: "Total panelists",
            icon: <Users className="size-5 text-violet-500" />,
            iconTheme: "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
        },
        {
            title: "Coordinators",
            value: coordinators.length,
            description: "Total coordinators",
            icon: <Users className="size-5 text-blue-500" />,
            iconTheme: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto bg-white dark:bg-background">
            {loading ? (
                <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                    <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
                    <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
                    <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
                </div>
            ) : (
                <>
                    {/* Header - Mobile Responsive */}
                    <div className="mb-4 md:mb-7 mt-2 md:mt-3 pt-2 md:pt-3 px-4 md:px-7">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 relative overflow-hidden">
                            <div className="flex flex-col">
                                <span className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 md:mb-2 relative z-10">
                                    {isDaytime() ? (
                                        <Sun className="mr-1 size-3 md:size-4 text-rose-500" />
                                    ) : (
                                        <Moon className="mr-1 size-3 md:size-4 text-rose-500" />
                                    )}
                                    {getFormattedDate()}
                                </span>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white relative z-10">
                                    Hi, {user?.name}!
                                </h1>
                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 relative z-10">
                                    {user?.role ?? 'Dean'}
                                </span>
                            </div>
                            {/* Quick Actions - Hidden on mobile, shown on md+ */}
                            <div className="hidden md:flex items-center">
                                <div className="h-12 w-px mx-4 bg-gray-300 dark:bg-gray-700 opacity-60" />
                                <div className="mr-8">
                                    <QuickActionsWidget userRole={user?.role} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs - Mobile Responsive */}
                    <div className="w-full px-4 md:px-7">
                        <Tabs value={tab} onValueChange={setTab} className="">
                            <TabsList className="mb-2 ">
                                <TabsTrigger value="overview" className="flex-1 ">Overview</TabsTrigger>
                                <TabsTrigger value="analytics" className="flex-1 ">Analytics</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="w-full">
                                {/* Metric Cards - Mobile Optimized */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-0 mb-4 md:mb-6">
                                    {metrics.map((metric, idx) => (
                                        <Card
                                            key={idx}
                                            className="col-span-1 rounded-lg md:rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between p-0 min-h-0 h-auto transition hover:shadow-md"
                                            style={{ minWidth: 0 }}
                                        >
                                            <div className="flex items-center justify-between px-4 md:px-5 pt-3 md:pt-4 pb-0">
                                                <div className="text-xs md:text-sm font-extrabold text-gray-800 dark:text-zinc-100 leading-tight">
                                                    {metric.title}
                                                </div>
                                                <div className={`rounded-full p-1 md:p-1.5 flex items-center justify-center flex-shrink-0 ${metric.iconTheme}`}>
                                                    {React.cloneElement(metric.icon, { className: "size-3 md:size-4 font-extrabold " + (metric.iconTheme?.split(" ").find(c => c.startsWith("text-")) ?? "") })}
                                                </div>
                                            </div>
                                            <div className="flex flex-col px-4 md:px-5 pb-3 md:pb-4 pt-1 md:pt-2">
                                                <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-none">
                                                    {metric.value}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                                    {metric.description}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Widgets Body - Reduced Spacing */}
                                <div className="flex flex-col gap-4 bg-gray-100 dark:bg-muted rounded-lg md:rounded-xl mt-2 mb-2 px-3 md:px-4 py-3 md:py-4 w-full">
                                    <WeeklyDefenseSchedulesWidget
                                        weekDays={weekDays}
                                        selectedDay={selectedDay}
                                        setSelectedDay={setSelectedDay}
                                        approvedDefenses={allRequests}
                                        referenceDate={new Date()}
                                        loading={loading}
                                    />
                                    
                                    {/* Graduate School Staff Widget - Full Width */}
                                    <Card className="rounded-lg md:rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm w-full">
                                        <div className="px-4 pt-3 pb-2">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Graduate School Staff
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                Contact coordinators and administrative assistants
                                            </p>
                                        </div>

                                        <Tabs defaultValue="coordinators" className="w-full">
                                            <div className="flex items-center justify-between px-4 mb-3 gap-4">
                                                <TabsList className="w-fit">
                                                    <TabsTrigger value="coordinators" className="text-sm">
                                                        Coordinators
                                                        <span className="ml-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                            ({coordinators.length})
                                                        </span>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="assistants" className="text-sm">
                                                        Assistants
                                                        <span className="ml-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                            ({assistants.length})
                                                        </span>
                                                    </TabsTrigger>
                                                </TabsList>

                                                <div className="flex items-center gap-2">
                                                    {allPrograms.length > 0 && (
                                                        <Select 
                                                            value={selectedProgram} 
                                                            onValueChange={setSelectedProgram}
                                                        >
                                                            <SelectTrigger className="w-[240px] h-8 text-sm">
                                                                <SelectValue placeholder="All Programs" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Programs</SelectItem>
                                                                {allPrograms.map((program) => (
                                                                    <SelectItem key={program} value={program}>
                                                                        {getProgramAbbreviation(program)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    
                                                    <div className="relative w-72">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            placeholder="Search by name or email..."
                                                            value={staffSearchQuery}
                                                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                                                            className="pl-9 h-8 text-sm"
                                                            startIcon={Search}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <TabsContent value="coordinators" className="mt-0">
                                                <StaffDataTable 
                                                    data={coordinators} 
                                                    type="coordinators"
                                                    searchQuery={staffSearchQuery}
                                                    onSearchChange={setStaffSearchQuery}
                                                    selectedProgram={selectedProgram}
                                                    onProgramChange={setSelectedProgram}
                                                    allPrograms={allPrograms}
                                                />
                                            </TabsContent>

                                            <TabsContent value="assistants" className="mt-0">
                                                <StaffDataTable 
                                                    data={assistants} 
                                                    type="assistants"
                                                    searchQuery={staffSearchQuery}
                                                    onSearchChange={setStaffSearchQuery}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Analytics Tab - Mobile Responsive */}
                            <TabsContent value="analytics" className="w-full">
                                <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-6">
                                    {/* Row 1: Defense Count */}
                                    <div className="w-full">
                                        <DefenseCountLineChart />
                                    </div>
                                    
                                    {/* Row 2: Defense Type + Mode */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                        <DefenseTypeDistribution />
                                        <DefenseModeBreakdown />
                                    </div>
                                    
                                    {/* Row 3: Overall Program Activity + Coordinator Performance */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                        <OverallProgramActivity />
                                        <CoordinatorPerformance />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    );
}