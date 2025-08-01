import { usePage } from '@inertiajs/react';
import { CircleEllipsis, Ellipsis, EllipsisVertical } from 'lucide-react';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
};

export default function AssistantDashboard() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">{user?.name ?? 'Guest'}</h1>
                <p className="text-sm text-gray-400">{user?.role ?? 'Student'}</p>
            </div>

            <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Pending Applications:</h3>
                        <Ellipsis className="size-4 text-zinc-700" />
                    </div>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Pending Defense Requests:</h3>
                        <EllipsisVertical className="size-4 text-zinc-700" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Pending Payment Confirmations:</h3>
                        <CircleEllipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                    <div className="flex items-start justify-between">
                        <h3 className="text-[13px] font-medium">Application Deadline:</h3>
                        <CircleEllipsis className="size-4 text-zinc-700" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="border-sidebar-border/70 flex-cols dark:border-sidebar-border relative flex min-h-[100vh] grid-cols-2 gap-2 overflow-hidden rounded-xl border p-5 md:col-span-1">
                    <h3 className="text-[14px] font-medium">Quick Actions</h3>
                </div>

                <div className="border-sidebar-border/70 flex-cols dark:border-sidebar-border relative flex min-h-[100vh] grid-cols-2 justify-between gap-2 overflow-hidden rounded-xl border p-5 md:col-span-2">
                    <h3 className="text-[14px] font-medium">Recent Exam Applications</h3>
                    <p className="text-[13px] text-pink-500">View All</p>
                </div>
            </div>
        </div>
    );
}
