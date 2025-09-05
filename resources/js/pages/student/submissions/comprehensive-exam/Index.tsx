import AppLayout from '@/layouts/app-layout';
import AcademicRecordsDashboard from '@/pages/legacy/AcademicRecordsDashboard';
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
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <div className="space-y-8">
                    <div>
                        <h1 className="text-2xl font-semibold mb-2">Comprehensive Exam</h1>
                        <p className="text-sm text-muted-foreground">Review your academic records below before proceeding with exam submissions.</p>
                    </div>
                    <AcademicRecordsDashboard />
                </div>
            </div>
        </AppLayout>
    );
}
