import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import ShowAllDefenseRequests from './show-all-defense-requests'; 

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'All Defense Requirements', href: '/all-defense-requirements' },
];

// Helper to map workflow_state to status label
function getStatus(workflow_state: string) {
    if (['adviser-approved'].includes(workflow_state)) return 'Approved';
    if (['adviser-rejected', 'coordinator-rejected'].includes(workflow_state)) return 'Rejected';
    // All others are considered Pending
    return 'Pending';
}

export default function Index({
    defenseRequirements,
    defenseRequests,
}: {
    defenseRequirements: any[];
    defenseRequests: any[];
}) {
    // Attach status for display
    const allRequests = (defenseRequests || []).map((r: any) => ({
        ...r,
        status: getStatus(r.workflow_state),
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Defense Requirements" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <ShowAllDefenseRequests 
                    defenseRequests={allRequests}
                    title="Defense Requirements"
                    description="Defense requirements submitted by your students. Review and manage their submissions here."
                />
            </div>
        </AppLayout>
    );
}
