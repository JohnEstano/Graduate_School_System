import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  Calendar,
  Book,
  Eye,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Honorarium',
    href: '/honorarium',
  },
  {
    title: 'Honorarium Submision',
    href: '/honorarium-submision',
  },
];

export default function Index() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const allRecords = [
    {
      name: 'Master in Information Technology',
      program: 'MIT',
      recentlyOpened: '2 hours ago',
      timeLastOpened: '12:09 PM',
      dateEdited: '2025-07-24',
    },
    {
      name: 'Master in Business Administration',
      program: 'MBA',
      recentlyOpened: '1 day ago',
      timeLastOpened: '9:30 AM',
      dateEdited: '2025-07-23',
    },
    {
      name: 'Master of Computer Science',
      program: 'MCS',
      recentlyOpened: '3 days ago',
      timeLastOpened: '3:45 PM',
      dateEdited: '2025-07-21',
    },
     {
      name: 'Master of Arts in Education',
      program: 'MAED',
      recentlyOpened: '5 days ago',
      timeLastOpened: '11:00 AM',
      dateEdited: '2025-07-19',
    },
    {
      name: 'Doctor of Philosophy in Management',
      program: 'PhDM',
      recentlyOpened: '1 hour ago',
      timeLastOpened: '1:30 PM',
      dateEdited: '2025-07-24',
    },
    {
      name: 'Master of Science in Data Science',
      program: 'MSDS',
      recentlyOpened: '6 hours ago',
      timeLastOpened: '8:15 AM',
      dateEdited: '2025-07-24',
    },
    {
      name: 'Master in Public Administration',
      program: 'MPA',
      recentlyOpened: '2 days ago',
      timeLastOpened: '4:00 PM',
      dateEdited: '2025-07-22',
    },
    {
      name: 'Doctor of Education',
      program: 'EdD',
      recentlyOpened: '4 days ago',
      timeLastOpened: '10:20 AM',
      dateEdited: '2025-07-20',
    },
    {
      name: 'Master of Science in Nursing',
      program: 'MSN',
      recentlyOpened: '1 week ago',
      timeLastOpened: '2:55 PM',
      dateEdited: '2025-07-17',
    },
  ];

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const matchYear = selectedYear ? record.dateEdited.startsWith(selectedYear) : true;
      const matchProgram = selectedProgram ? record.program === selectedProgram : true;
      const matchSearch = searchQuery ? record.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return matchYear && matchProgram && matchSearch;
    });
  }, [allRecords, selectedYear, selectedProgram, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredRecords, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Submision" />

      <div className="container mx-auto p-6 bg-gray-50 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className='text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100'>Honorarium Summary</h1>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Program Name..."
              className="border pl-10 pr-4 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
            {/* Date Filter */}
            <div className="relative flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowProgramDropdown(false);
                }}
                className="border px-4 py-2 rounded-md w-32 text-left bg-white dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">{selectedYear ?? 'All'}</span>
                </div>
              </button>
              {showYearDropdown && (
                <ul className="absolute bg-white dark:bg-[#2a2a2a] border dark:border-gray-600 mt-2 rounded-md shadow-lg z-10 w-40 top-full">
                  {['2023', '2024', '2025'].map((year) => (
                    <li
                      key={year}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] cursor-pointer dark:text-white"
                      onClick={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                      }}
                    >
                      {year}
                    </li>
                  ))}
                  <li
                    className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 cursor-pointer"
                    onClick={() => {
                      setSelectedYear(null);
                      setShowYearDropdown(false);
                    }}
                  >
                    All
                  </li>
                </ul>
              )}
            </div>

            {/* Program Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProgramDropdown(!showProgramDropdown);
                  setShowYearDropdown(false);
                }}
                className="border px-4 py-2 rounded-md w-40 text-left bg-white dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white flex items-center justify-between"
              >
                 <div className="flex items-center gap-2">
                    <Book className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm">{selectedProgram ?? 'All Programs'}</span>
                </div>
              </button>
              {showProgramDropdown && (
                <ul className="absolute bg-white dark:bg-[#2a2a2a] border dark:border-gray-600 mt-2 rounded-md shadow-lg z-10 w-48 top-full">
                  {['MIT', 'MBA', 'MCS', 'MAED', 'PhDM', 'MSDS', 'MPA', 'EdD', 'MSN'].map((program) => (
                    <li
                      key={program}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] cursor-pointer dark:text-white"
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowProgramDropdown(false);
                      }}
                    >
                      {program}
                    </li>
                  ))}
                  <li
                    className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 cursor-pointer"
                    onClick={() => {
                      setSelectedProgram(null);
                      setShowProgramDropdown(false);
                    }}
                  >
                    All
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white dark:bg-[#1a1a1a] shadow-md rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#2a2a2a]">
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <th className="p-4">Program</th>
                  <th className="p-4">Recently Opened</th>
                  <th className="p-4">Time Last Opened</th>
                  <th className="p-4">Date Edited</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors duration-200">
                    <td className="p-4 flex items-center space-x-3">
                      <img
                        src={`https://placehold.co/40x40/EBF4FF/76A9FA?text=${record.program.charAt(0)}`}
                        alt="avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">{record.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{record.program}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{record.recentlyOpened}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{record.timeLastOpened}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">{record.dateEdited}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                          <button className="border text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] hover:border-gray-400 dark:border-gray-500 transition flex items-center" title="View Records">
                            <Eye className="w-4 h-4 mr-1" />
                            View Records
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-md disabled:opacity-50">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-md disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-md">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-md">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
