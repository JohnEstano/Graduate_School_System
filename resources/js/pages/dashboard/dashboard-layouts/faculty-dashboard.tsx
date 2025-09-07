import { usePage, Link } from '@inertiajs/react';
import { CircleEllipsis, Ellipsis } from 'lucide-react';

type PageProps = {
    auth: { user: { id: number; name: string; role: string } | null };
};

export default function FacultyDashboard() {
    const { auth: { user } } = usePage<PageProps>().props;

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pb-5 pl-7">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">{user?.name ?? 'Faculty User'}</h1>
                <p className="text-sm text-gray-400">Faculty</p>
            </div>
            {/* Quick Actions Section */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Link href="/messaging" className="group relative flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-white/50 p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-pink-600">Messages</p>
                        <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-300">Open inbox & compose</p>
                    </div>
                    <span className="text-pink-500 transition group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/faculty/class-list" className="group relative flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-white/50 p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-pink-600">Class List</p>
                        <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-300">View your loads</p>
                    </div>
                    <span className="text-pink-500 transition group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/legacy/faculty/class-list" className="group relative flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-white/50 p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-pink-600">Refresh Data</p>
                        <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-300">Sync latest period</p>
                    </div>
                    <span className="text-pink-500 transition group-hover:translate-x-1">↻</span>
                </Link>
                <Link href="/profile" className="group relative flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-white/50 p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-pink-600">Profile</p>
                        <p className="mt-1 text-[13px] text-gray-600 dark:text-gray-300">View & update info</p>
                    </div>
                    <span className="text-pink-500 transition group-hover:translate-x-1">→</span>
                </Link>
            </div>
            <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">My Course Loads</h3>
                        <Ellipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Pending Grades Entry</h3>
                        <CircleEllipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Upcoming Seminars</h3>
                        <CircleEllipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Advisory Notices</h3>
                        <CircleEllipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex min-h-[100vh] justify-between overflow-hidden rounded-xl border p-5 md:col-span-2">
                    <div className="flex grid-cols-2 flex-col gap-2">
                        <h3 className="text-[14px] font-medium">Recent Teaching Activities</h3>
                    </div>
                    <p className="text-[13px] text-pink-500">View All</p>
                </div>
            </div>
        </div>
    );
}
