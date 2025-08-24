import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import ShowAllDefenseRequirements from './show-all-defense-requirements';
import ShowAllDefenseRequests from './show-all-defense-requests'; // <-- Import the new section

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'All Defense Requirements',
        href: '/all-defense-requirements',
    },
];

export default function Index({
    defenseRequirements,
    defenseRequests, // <-- Accept defenseRequests as a prop
}: {
    defenseRequirements: any[];
    defenseRequests: any[]; // <-- Add this prop
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Defense Requirements" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <ShowAllDefenseRequirements
                    defenseRequirements={defenseRequirements}
                    defenseRequests={defenseRequests}
                />
                <ShowAllDefenseRequests defenseRequests={defenseRequests} /> {/* <-- Add this section */}
            </div>
        </AppLayout>
    );
}
