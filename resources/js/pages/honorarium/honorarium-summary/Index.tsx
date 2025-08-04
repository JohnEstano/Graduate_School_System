import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useMemo, type FormEvent } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  Calendar,
  Book,
  Eye,
  Download,
  PlusCircle,
  MinusCircle,
  Edit,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Honorarium',
    href: '/honorarium',
  },
  {
    title: 'Honorarium Summary',
    href: '/honorarium-summary',
  },
];

// Moved initial data outside the component to initialize state
const initialRecords = [
  {
    name: 'Master in Information Technology',
    program: 'MIT',
    recentlyUpdated: '2 hours ago',
    timeLastOpened: '12:09 PM',
    dateEdited: '2025-07-24',
  },
  {
    name: 'Master in Business Administration',
    program: 'MBA',
    recentlyUpdated: '1 day ago',
    timeLastOpened: '9:30 AM',
    dateEdited: '2025-07-23',
  },
  {
    name: 'Master of Computer Science',
    program: 'MCS',
    recentlyUpdated: '3 days ago',
    timeLastOpened: '3:45 PM',
    dateEdited: '2025-07-21',
  },
  {
    name: 'Master of Arts in Education',
    program: 'MAED',
    recentlyUpdated: '5 days ago',
    timeLastOpened: '11:00 AM',
    dateEdited: '2025-07-19',
  },
  {
    name: 'Doctor of Philosophy in Management',
    program: 'PhDM',
    recentlyUpdated: '1 hour ago',
    timeLastOpened: '1:30 PM',
    dateEdited: '2025-07-24',
  },
  {
    name: 'Master of Science in Data Science',
    program: 'MSDS',
    recentlyUpdated: '6 hours ago',
    timeLastOpened: '8:15 AM',
    dateEdited: '2025-07-24',
  },
  {
    name: 'Master in Public Administration',
    program: 'MPA',
    recentlyUpdated: '2 days ago',
    timeLastOpened: '4:00 PM',
    dateEdited: '2025-07-22',
  },
  {
    name: 'Doctor of Education',
    program: 'EdD',
    recentlyUpdated: '4 days ago',
    timeLastOpened: '10:20 AM',
    dateEdited: '2025-07-20',
  },
  {
    name: 'Master of Science in Nursing',
    program: 'MSN',
    recentlyUpdated: '1 week ago',
    timeLastOpened: '2:55 PM',
    dateEdited: '2025-07-17',
  },
];

export default function Index() {
  const [allRecords, setAllRecords] = useState(initialRecords);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isEditing, setIsEditing] = useState(false);

  // State for new features
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramAcronym, setNewProgramAcronym] = useState('');
  const [programToRemove, setProgramToRemove] = useState<string | null>(null);

  // Dynamically get unique programs for filters and modals
  const uniquePrograms = useMemo(() => {
    return [...new Set(allRecords.map((record) => record.program))].sort();
  }, [allRecords]);

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

  const handleAddProgram = (e: FormEvent) => {
    e.preventDefault();
    const acronym = newProgramAcronym.trim().toUpperCase();
    if (uniquePrograms.includes(acronym)) {
      alert('A program with this acronym already exists.');
      return;
    }

    const newRecord = {
      name: newProgramName.trim(),
      program: acronym,
      recentlyUpdated: 'Just now',
      timeLastOpened: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateEdited: new Date().toISOString().split('T')[0],
    };
    setAllRecords((prev) => [...prev, newRecord]);
    setNewProgramName('');
    setNewProgramAcronym('');
    setShowAddModal(false);
  };

  const handleRemoveProgram = (e: FormEvent) => {
    e.preventDefault();
    if (!programToRemove) return;
    setAllRecords((prev) => prev.filter((record) => record.program !== programToRemove));
    if (selectedProgram === programToRemove) {
      setSelectedProgram(null);
    }
    setProgramToRemove(null);
    setShowRemoveModal(false);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Summary" />

      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">Honorarium Summary</h1>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              title="Edit Program"
            >
              <Edit className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">{isEditing ? 'Done' : 'Edit'}</span>
            </button>

            {isEditing && (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition p-2 rounded-md"
                  title="Add Program"
                  style={{
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  }}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Add</span>
                </button>
                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition p-2 rounded-md"
                  title="Remove Program"
                  style={{
                    backdropFilter: 'blur(5px)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  }}
                >
                  <MinusCircle className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Remove</span>
                </button>
              </>
            )}
          </div>
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

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
            {/* Date Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowProgramDropdown(false);
                }}
                className="border px-4 py-2 rounded-md w-32 text-left bg-white dark:bg-[#1a1a1a] dark:border-gray-600 dark:text-white flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">{selectedYear ?? 'All Years'}</span>
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
                  {uniquePrograms.map((program) => (
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
                <th className="pl-14 pr-4 py-3">Program</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Time Last Opened</th>
                <th className="px-4 py-3">Date Edited</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors duration-200">
                  <td className="px-4 py-3 flex items-center space-x-3">
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
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.recentlyUpdated}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.timeLastOpened}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{record.dateEdited}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="border text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] hover:border-gray-400 dark:border-gray-500 transition flex items-center" title="View Records">
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Records
                      </button>
                      <button className="border text-gray-600 dark:text-gray-300 p-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] hover:border-gray-400 dark:border-gray-500 transition" title="Download Record">
                        <Download className="w-4 h-4" />
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

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Program</h2>
            <form onSubmit={handleAddProgram}>
              <div className="mb-4">
                <label htmlFor="programName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program Name
                </label>
                <input
                  id="programName"
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="border pl-4 pr-4 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="programAcronym" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program Acronym
                </label>
                <input
                  id="programAcronym"
                  type="text"
                  value={newProgramAcronym}
                  onChange={(e) => setNewProgramAcronym(e.target.value)}
                  className="border pl-4 pr-4 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                  Add Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Program Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Remove Program</h2>
            <form onSubmit={handleRemoveProgram}>
              <div className="mb-6">
                <label htmlFor="programToRemove" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Program to Remove
                </label>
                <select
                  id="programToRemove"
                  value={programToRemove ?? ''}
                  onChange={(e) => setProgramToRemove(e.target.value)}
                  className="border pl-4 pr-4 py-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="" disabled>
                    Select a program...
                  </option>
                  {uniquePrograms.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowRemoveModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition">
                  Cancel
                </button>
                <button type="submit" disabled={!programToRemove} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800/50 disabled:cursor-not-allowed transition">
                  Remove
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}