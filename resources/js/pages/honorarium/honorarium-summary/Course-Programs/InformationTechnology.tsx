import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';

interface DepartmentPageProps {
    departmentName: string;
    departmentSlug: string;
}

// The component name itself is a valid JS variable (PascalCase, no hyphen)
const InformationTechnologyPage: React.FC<DepartmentPageProps> = ({ departmentName, departmentSlug }) => {
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Honorarium', href: '/honorarium' },
        { title: 'Honorarium Search', href: '/honorarium-search' },
        {
            title: departmentName,
            href: `/honorarium/${departmentSlug}`,
            isActive: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${departmentName} Honorarium`} />
            <div className="bg-white shadow-sm rounded-lg p-6 mt-4">
                <h1 className="text-3xl font-bold text-gray-800">
                    {departmentName}
                </h1>
            </div>
        </AppLayout>
    );
};

// The default export is the valid component name
export default InformationTechnologyPage;
