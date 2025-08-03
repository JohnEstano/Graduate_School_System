import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import ShowAllRequests, { type DefenseRequestSummary } from './show-all-requests';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/defense-request' },
];

type PageProps = {
    auth: {
        user: {
            role: string;
            school_id: string;
        };
    };
    defenseRequests?: DefenseRequestSummary[];
};

export default function DefenseRequestIndex() {
    const { props } = usePage<PageProps>();
    const { auth, defenseRequests } = props;
    const role = auth.user.role;

    const isCoordinator = role === 'Coordinator';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 px-2 pt-5 pb-5">
                <div className="flex-1 overflow-auto">
                    {isCoordinator ? (
                        
                        <ShowAllRequests defenseRequests={defenseRequests || []} />
                    ) : (
                        <div className="rounded-xl border border-gray-200 ">
                            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                                <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
                                <p className="text-sm text-gray-500">This section is only accessible to Coordinators.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
