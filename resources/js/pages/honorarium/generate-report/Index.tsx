import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Honorarium',
        href: '/honorarium',
    },
    {
        title: 'Generate Report',
        href: '/generate-report',
    },
];



export default function Index() {


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Report" />

            <div className="flex-row justify-between mt-5 ml-10">
                <h1 className='text-xl font-extrabold tracking-tight '>Admin User</h1>
                <p className='text-6'>Administrative Assistant</p>
            </div>



        </AppLayout>
    );
}
