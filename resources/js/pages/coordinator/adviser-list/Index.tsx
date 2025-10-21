import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';
import ShowAdvisers from './show-advisers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Adviser List', href: '/coordinator/adviser-list' },
];

export default function CoordinatorAdviserListPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adviser List" />
            <div className='pb-5'>
                <ShowAdvisers />
            </div>

        </AppLayout>
    );
}