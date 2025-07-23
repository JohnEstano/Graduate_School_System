// resources/js/Pages/submissions/defense-request/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import DefenseRequestForm from './defense-request-form';
import DisplayRequest, { type DefenseRequestFull } from './display-requests';
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
    defenseRequest?: DefenseRequestFull | null;
    defenseRequests?: DefenseRequestSummary[];
};

export default function DefenseRequestIndex() {
    const { props } = usePage<PageProps>();
    const { auth, defenseRequest, defenseRequests } = props;
    const role = auth.user.role;

    const staffRoles = ['Administrative Assistant', 'Coordinator', 'Dean'];
    const isStaff = staffRoles.includes(role);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto px-7 pt-5 pb-5">
                {isStaff ? (
                    <ShowAllRequests defenseRequests={defenseRequests || []} />
                ) : (
                    <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                        {defenseRequest ? (
                            <DisplayRequest request={defenseRequest} />
                        ) : (
                            <div className="rounded-xl border border-gray-200 p-5">
                                <div className="flex h-full flex-1 flex-col items-center justify-center gap-5">
                                    <div className="flex flex-col items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-700">No defense request sent</h2>
                                        <p className="text-sm text-gray-500">If you're eligible to apply for a defense, submit your request here.</p>
                                    </div>
                                    <DefenseRequestForm />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
