import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import IndiviualRecord from './individual-record';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Honorarium',
    href: '/honorarium',
  },
  {
    title: 'Honorarium Search',
    href: '/honorarium-search',
  },
];






// --- TypeScript Type Definitions ---

interface SearchCourse {
  id: number;
  label: string;
}
  interface Button {
    id: number;
  label: string;
}



// --- Component Data ---

const ALL_BUTTONS: Button[] = [
    { id: 1, label: 'Information Technology' },
    { id: 2, label: 'Nursing' },
    { id: 3, label: 'MedTech' },
    { id: 4, label: 'Business' },
    { id: 5, label: 'Engineering' },
    { id: 6, label: 'Pharmacy' },
    { id: 7, label: 'Computer Science' },
    { id: 8, label: 'Music' },
    { id: 9, label: 'Education' },
];

// --- Component ---

// The main component, renamed to reflect its purpose in the application.
const HonorariumSearch: React.FC = () => {
    // State to hold the user's search query.
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Filter the buttons based on the search term.
    const filteredButtons = useMemo(() => {
        if (!searchTerm) {
            return ALL_BUTTONS;
        }
        return ALL_BUTTONS.filter((button: Button) =>
            button.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // Handler for the search input change event.
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Honorarium Submission" />

            <div className="max-w-4xl mx-auto">
    {/* Search Bar Section */}
    <div className="sticky top-0 z-10 bg-white mt-3 py-4 flex justify-center">
        {/* This new div with 'relative' is the container for the input and the icon */}
        <div className="relative">
            {/* This div positions the search icon inside the input field */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search departments..."
                // The key change here is adding left padding (pl-10) to make room for the icon
                className="w-96 pl-10 pr-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
        </div>
    </div>

                {/* Flex container for button alignment and wrapping */}
                {/* FIX: Corrected typo from 'f' to 'flex flex-wrap' for proper layout. */}
                <div className="flex flex-wrap justify-center gap-4 py-6">
                    {filteredButtons.length > 0 ? (
                        filteredButtons.map((button: Button) => (
                            <button
                                key={button.id}
                                className="flex items-center justify-center w-48 h-20 p-3 bg-blue-600 text-white text-center font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                            >
                                {button.label}
                            </button>
                        ))
                    ) : (
                        <p className="text-gray-500">No departments found.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}


export default HonorariumSearch;
