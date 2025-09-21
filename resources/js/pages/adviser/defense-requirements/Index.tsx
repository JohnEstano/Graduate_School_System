import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import ShowAllDefenseRequirements from './show-all-defense-requirements';
import ShowAllDefenseRequests from './show-all-defense-requests'; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
    defenseRequests,
}: {
    defenseRequirements: any[];
    defenseRequests: any[];
}) {
    // Filter requests by workflow state
    const pendingRequests = (defenseRequests || []).filter(
        (r:any) => ['submitted','adviser-review'].includes(r.workflow_state)
    );
    const approvedRequests = (defenseRequests || []).filter(
        (r:any) => r.workflow_state === 'adviser-approved'
    );
    const disapprovedRequests = (defenseRequests || []).filter(
        (r:any) => r.workflow_state === 'adviser-rejected'
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Defense Requirements" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="mb-4 dark:bg-muted dark:text-muted-foreground">
                        <TabsTrigger value="pending">Defense Requirements sent by your students</TabsTrigger>
                        <TabsTrigger value="approved">Approved Defense Requirements</TabsTrigger>
                        <TabsTrigger value="disapproved">Disapproved Requirements</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="flex-1">
                        <ShowAllDefenseRequests 
                            defenseRequests={pendingRequests} 
                            showActions={true}
                            title="Defense Requirements sent by your students"
                            description="Review and approve/reject defense requests from your advisees"
                        />
                    </TabsContent>
                    <TabsContent value="approved" className="flex-1">
                        <ShowAllDefenseRequests 
                            defenseRequests={approvedRequests} 
                            showActions={false}
                            title="Approved Defense Requirements"
                            description="Defense requests you have approved and forwarded to coordinator"
                        />
                    </TabsContent>
                    <TabsContent value="disapproved" className="flex-1">
                        <ShowAllDefenseRequests 
                            defenseRequests={disapprovedRequests} 
                            showActions={false}
                            title="Disapproved Requirements"
                            description="Defense requests you have rejected"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
