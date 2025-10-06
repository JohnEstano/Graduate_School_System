// resources/js/Pages/student-records/Index.tsx

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import IndividualRecord from './individual-records';
import EditStudentModal from './edit-student-record';
import DeletePrompt from './delete-prompt';
import {
  Eye,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/search-input';

interface StudentRecord {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  school_year: string | null;
  student_id: string | null;
  course_section: string | null;
  birthdate: string | null;
  academic_status: string | null;
  program: string;
  or_number: string;
  payment_date: string;
  payments?: {
    id: number;
    school_year: string;
    payment_date: string;
    defense_status: string;
    amount: string;
  }[];
}

interface PaginatedRecords {
  data: StudentRecord[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
}

interface IndexProps {
  records: PaginatedRecords;
  filters: {
    search?: string;
    year?: string;
    program?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Student Records', href: '/student-records' }];
const programCategories = ['MIT', 'MBA', 'MCS', 'MAED'];

export default function Index({ records, filters }: IndexProps) {
  const [showIndividualRecord, setShowIndividualRecord] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StudentRecord | null>(null);

  const { data, setData, get } = useForm({
    search: filters.search || '',
    year: filters.year || null,
    program: filters.program || null,
  });

  const [isYearPopoverOpen, setYearPopoverOpen] = useState(false);
  const [isProgramPopoverOpen, setProgramPopoverOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      get(route('student-records.index'), {
        preserveState: true,
        replace: true,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [data]);

  const openEditModal = (record: StudentRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const openDeletePrompt = (record: StudentRecord) => {
    setSelectedRecord(record);
    setShowDeletePrompt(true);
  };

  const handleDelete = () => {
    if (selectedRecord) {
      router.delete(route('student-records.destroy', selectedRecord.id), {
        onSuccess: () => {
          setShowDeletePrompt(false);
          setSelectedRecord(null);
        },
      });
    }
  };

  const openIndividualRecord = (record: StudentRecord) => {
    setSelectedRecord(record);
    setShowIndividualRecord(true);
  };

  const generateYearRange = (startYear = 2020, endYear = new Date().getFullYear()) => {
    const years = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year.toString());
    }
    return years;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Student Records" />
      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Student Records</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <SearchInput
            placeholder="Search Student Name or ID..."
            className="w-full md:w-1/3"
            value={data.search}
            onChange={(e) => setData('search', e.target.value)}
          />
        </div>

{/* Scrollable Table with Sticky Header */}
<div className="rounded-md border border-border bg-white dark:bg-[#121212] p-2 max-h-[75vh] overflow-y-auto">
  <Table className="min-w-full text-sm">
    <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10 shadow-sm">
      <TableRow>
        <TableHead className="w-[30%] px-1 py-2">Student Name</TableHead>
        <TableHead className="w-[25%] px-1 py-2 text-center">Program / Section</TableHead>
        <TableHead className="w-[15%] px-1 py-2 text-center">Academic Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {records.data.length > 0 ? (
        records.data.map((record) => (
          <TableRow
            key={record.id}
            className="hover:bg-muted/50 cursor-pointer"
            onClick={() => openIndividualRecord(record)}
          >
            <TableCell className="flex items-center space-x-4 px-1 py-2">
              <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <AvatarFallback>{record.first_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {record.first_name} {record.middle_name ? record.middle_name.charAt(0) + '.' : ''} {record.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{record.student_id}</div>
              </div>
            </TableCell>
            <TableCell className="px-1 py-2 text-center">
              {record.program} / {record.course_section || "-"}
            </TableCell>
            <TableCell className="px-1 py-2 text-center">
              {record.academic_status || "-"}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            No results found.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</div>


        {/* Individual Record Modal (same style as Show.tsx) */}
        {showIndividualRecord && selectedRecord && (
          <IndividualRecord
            record={selectedRecord as any}
            onClose={() => setShowIndividualRecord(false)}
          />
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedRecord && (
          <EditStudentModal
            isOpen={isEditModalOpen }
            onClose={() => setIsEditModalOpen(false)}
            record={selectedRecord}
          />
        )}

        {/* Delete Prompt */}
        <DeletePrompt
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
