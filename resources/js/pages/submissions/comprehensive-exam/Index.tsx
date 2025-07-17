import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Comprehensive Exams',
        href: '/comprehensive-exam',
    },
];



export default function Index() {


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comprehensive Exam" />




            <div className="flex h-full flex-1 flex-col pt-5 gap-4 rounded-xl pl-7 pr-7 overflow-auto">


                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">

                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
