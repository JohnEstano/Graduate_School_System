import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';
import ShowStudents from './show-students';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Students', href: '/adviser/students-list' },
];

export default function AdviserStudentsListPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Students" />
            <ShowStudents />
        </AppLayout>
    );
}