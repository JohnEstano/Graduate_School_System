import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import ShowAllRequests, { type DefenseRequestSummary } from './show-all-requests';
import ShowAllHonorarium from './show-all-honorarium';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { Box} from 'lucide-react';

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
    const { auth, defenseRequests: initialRequests } = props;
    const role = auth.user.role;
    const isCoordinator = role === 'Coordinator';
    const [tab, setTab] = useState("requests");

   
    const [defenseRequests, setDefenseRequests] = useState<DefenseRequestSummary[]>(initialRequests || []);

    
    const handleStatusChange = (
        id: number,
        newStatus: DefenseRequestSummary["status"]
    ) => {
        setDefenseRequests((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, status: newStatus } : r
            )
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 px-2 pt-4">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className="">
                        <TabsTrigger value="requests"><Box />Requests</TabsTrigger>
                        <TabsTrigger value="honorarium">Honorariums</TabsTrigger>
                    </TabsList>
                    <TabsContent value="requests">
                        <div className="flex-1">
                            {isCoordinator ? (
                                <ShowAllRequests
                                    defenseRequests={defenseRequests}
                                    onStatusChange={handleStatusChange}
                                />
                            ) : (
                                <div className="rounded-xl border border-gray-200 ">
                                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                                        <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
                                        <p className="text-sm text-gray-500">This section is only accessible to Coordinators.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="honorarium">
                        <div className='flex-1'>
                            <ShowAllHonorarium defenseRequests={defenseRequests} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
