import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
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
    title: 'Honorarium Submision',
    href: '/honorarium-submision',
  },
];

export default function Index() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  
  // 👇 Show/hide the detailed view
  const [showIndividualRecord, setShowIndividualRecord] = useState(false);

  const allRecords = [
    {
      name: 'Troy Wendell G. Peralta',
      studentNo: '230000001926',
      program: 'MIT',
      orNumber: '2023-QL739201',
      date: '2025-05-12',
    },
    {
      name: 'Aira Mae D. Cruz',
      studentNo: '230000001845',
      program: 'MBA',
      orNumber: '2024-BH712312',
      date: '2025-04-01',
    },
    {
      name: 'Juan Dela Cruz',
      studentNo: '230000001755',
      program: 'MIT',
      orNumber: '2024-HH500921',
      date: '2025-05-12',
    },
  ];

  const records = allRecords.filter((record) => {
    const matchYear = selectedYear ? record.date.startsWith(selectedYear) : true;
    const matchProgram = selectedProgram ? record.program === selectedProgram : true;
    return matchYear && matchProgram;
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Submision" />

      <div className="flex justify-between mt-5 ml-10">
        <h1 className='text-xl font-extrabold tracking-tight'>Honorarium Summary</h1>
      </div>

      {/* Show only when Eye is clicked */}
      {showIndividualRecord && (
        <div className="fixed inset-0 bg-black/80  z-50 flex justify-center items-center">
          <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl w-full relative">
            <IndiviualRecord />
            <div className="text-right mt-4">
              <button
                onClick={() => setShowIndividualRecord(false)}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search Student"
            className="border px-3 py-2 rounded w-1/3"
          />

          {/* Filters */}
          <div className="relative flex items-center space-x-4">
            {/* Date Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowYearDropdown(!showYearDropdown);
                  setShowProgramDropdown(false);
                }}
                className="border px-4 py-2 rounded"
              >
                {selectedYear ?? 'Date'}
              </button>
              {showYearDropdown && (
                <ul className="absolute bg-white border mt-2 rounded shadow z-10 w-40">
                  {['2023', '2024', '2025'].map((year) => (
                    <li
                      key={year}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                      }}
                    >
                      {year}
                    </li>
                  ))}
                  <li
                    className="px-4 py-2 text-red-500 hover:bg-red-100 cursor-pointer"
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
                className="border px-4 py-2 rounded"
              >
                {selectedProgram ?? 'Program'}
              </button>
              {showProgramDropdown && (
                <ul className="absolute bg-white border mt-2 rounded shadow z-10 w-48">
                  {['MIT', 'MBA', 'MCS', 'MAED'].map((program) => (
                    <li
                      key={program}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowProgramDropdown(false);
                      }}
                    >
                      {program}
                    </li>
                  ))}
                  <li
                    className="px-4 py-2 text-red-500 hover:bg-red-100 cursor-pointer"
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-2">Student Name</th>
              <th className="p-2">Program</th>
              <th className="p-2">OR Number</th>
              <th className="p-2">Payment Date</th>
              <th className="p-2">Records</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-2 flex items-center space-x-2">
                  <img
                    src="/images/avatar-placeholder.png"
                    alt="avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-gray-500">{record.studentNo}</div>
                  </div>
                </td>
                <td className="p-2">{record.program}</td>
                <td className="p-2">{record.orNumber}</td>
                <td className="p-2">{record.date}</td>
                <td className="p-2">
                  <button
                    className="text-gray-600 hover:text-black p-1"
                    onClick={() => setShowIndividualRecord(true)} // 👈 Open the modal
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
                <td className="p-2">
                  <button className="border px-3 py-1 rounded hover:bg-gray-100">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-end items-center space-x-2 text-sm">
          <span>Pages 1 of 10</span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
