import AppLayout from '@/layouts/app-layout';
import AcademicRecordsDashboard from '@/pages/legacy/AcademicRecordsDashboard';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Academic Records', href: '/student/academic-records' },
];

export default function AcademicRecordsPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Academic Records" />
      <AcademicRecordsDashboard />
    </AppLayout>
  );
}