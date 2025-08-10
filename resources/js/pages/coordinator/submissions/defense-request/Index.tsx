import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import ShowAllRequests, { type DefenseRequestSummary } from './show-all-requests';
import ShowAllHonorarium from './show-all-honorarium';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Box, CalendarFold } from 'lucide-react';

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

export const programAbbr: Record<string, string> = {
  "Master of Arts in Education major in English": "MAEd-Eng",
  "Master of Arts in Education major in Sociology": "MAEd-Soc",
  "Master of Arts in Education major in Mathematics": "MAEd-Math",
  "Master of Arts in Education major in Physical Education": "MAEd-PE",
  "Master of Arts in Educational Management": "MAEM",
  "Master of Arts in Elementary Education": "MAElemEd",
  "Master of Arts in Teaching College Chemistry": "MATCChem",
  "Master of Arts in Teaching College Physics": "MATCPhys",
  "Master of Arts in Engineering Education with majors in Civil Engineering": "MAEngEd-CE",
  "Master of Arts in Engineering Education with majors in Electronics Communications Engineering": "MAEngEd-ECE",
  "Master of Arts in Values Education": "MAVE",
  "Master in Business Administration": "MBA",
  "Master of Information Technology": "MIT",
  "Master in Information Systems": "MIS",
  "Master of Science in Pharmacy": "MSPharm",
  "Master of Science in Medical Technology/ Medical Laboratory Science": "MSMedTech",
  "Master of Arts in Education major in Filipino": "MAEd-Fil",
  "Master of Arts in Education major in Music Education": "MAEd-Music",
  "Master of Arts in Education major in Information Technology Integration": "MAEd-IT",
  "Doctor in Business Management": "DBM",
  "Doctor of Philosophy in Education major in Applied Linguistics": "PhD-Ed-Ling",
  "Doctor of Philosophy in Education major in Educational Leadership": "PhD-Ed-Lead",
  "Doctor of Philosophy in Education major in Filipino": "PhD-Ed-Fil",
  "Doctor of Philosophy in Education major in Mathematics": "PhD-Ed-Math",
  "Doctor of Philosophy in Education major in Counseling": "PhD-Ed-Counsel",
  "Doctor of Philosophy in Education major in  Information Technology Integration": "PhD-Ed-IT",
  "Doctor of Philosophy in Education major in Physical Education": "PhD-Ed-PE",
  "DOCTOR OF PHILOSOPHY IN PHARMACY": "PhD-Pharm",
  "Master in Counseling": "MCounsel",
};

export function getProgramAbbr(program: string) {
  return programAbbr[program] || program;
}

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
            <div className="flex-1 flex flex-col gap-4 px-2 pt-4 w-full max-w-full min-h-[90vh]">
                <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full max-w-full">
                    <TabsContent value="requests" className="flex-1 flex flex-col w-full max-w-full">
                        <div className="flex-1 flex flex-col w-full max-w-full overflow-auto min-h-0">
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
                    <TabsContent value="honorarium" className="flex-1 flex flex-col w-full max-w-full">
                        <div className='flex-1 w-full max-w-full overflow-auto min-h-0'>
                            <ShowAllHonorarium defenseRequests={defenseRequests} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
