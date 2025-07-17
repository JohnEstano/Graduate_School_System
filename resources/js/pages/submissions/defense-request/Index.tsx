import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import DefenseRequestForm from './defense-request-form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Defense Requests', href: '/defense-request' },
];

export default function DefenseRequestIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Defense Requests" />


            <div className="flex h-full pb-5 flex-1 flex-col pt-5 gap-4 rounded-xl pl-7 pr-7 overflow-auto">

                <div className="flex justify-between ">
                    <h1 className='text-xl font-extrabold tracking-tight'>Defense Request</h1>
                    <DefenseRequestForm />
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-1 h-screen">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
                        <div className="flex items-start justify-between">
                        
                        </div>
                    </div>

                   


                </div>

            </div>






        </AppLayout>
    );
}
