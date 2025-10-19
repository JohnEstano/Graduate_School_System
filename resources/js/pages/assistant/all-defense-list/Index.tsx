import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ShowAllRequests from './show-all-requests';
import type { DefenseRequestSummary } from './table-all-defense-list';

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/assistant/all-defense-list' },
];

export default function AssistantAllDefenseListPage() {
    const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/defense-requests', { headers: { Accept: 'application/json' } })
            .then(res => res.json())
            .then(data => {
                setDefenseRequests(Array.isArray(data) ? data : (data.defenseRequests || []));
                setLoading(false);
            });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />
            <div className="flex-1 flex flex-col gap-4 w-full min-h-[90vh]">
                <div className="flex flex-col w-full min-h-0 overflow-x-hidden">
                    {/* Skeleton loader copied from coordinator-dashboard */}
                    {loading ? (
                        <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
                            {/* Top short row */}
                            <div className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8 animate-pulse" />
                            {/* Main rows */}
                            <div className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8 animate-pulse" />
                            <div className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8 animate-pulse" />
                            {/* Big rectangle for dashboard body */}
                            <div className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4 animate-pulse" />
                        </div>
                    ) : (
                        <ShowAllRequests defenseRequests={defenseRequests} withLayout={false} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}