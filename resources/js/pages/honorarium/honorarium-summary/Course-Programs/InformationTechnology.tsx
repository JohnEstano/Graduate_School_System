import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';

// Breadcrumbs for this specific department page
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Honorarium',
    href: '/honorarium',
  },
  {
    title: 'Honorarium Search',
    href: '/honorarium-search',
  },
  {
    title: 'Information Technology',
    href: '/honorarium/Information',
  },
];

const InformationTechnologyPage: React.FC = () => {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Information Technology" />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Honorarium Records for Information Technology
        </h1>
        <p className="mt-2 text-gray-600">
          This page will display the honorarium details for the IT department.
        </p>
        {/* You would add the specific content for this page here */}
      </div>
    </AppLayout>
  );
};

export default InformationTechnologyPage;
