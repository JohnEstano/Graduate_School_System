// resources/js/Pages/student-records/Index.tsx

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import IndividualRecord from './individual-records';
import EditStudentModal from './edit-student-record';
import DeletePrompt from './delete-prompt';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye,
  SquarePen,
  Trash2,
  Calendar,
  Book,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/search-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>

            {/* Year Filter */}
            <Popover open={isYearPopoverOpen} onOpenChange={setYearPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {data.year ?? 'All Years'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search years..." />
                  <CommandList>
                    <CommandEmpty>No year found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setData('year', null);
                          setYearPopoverOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', data.year === null ? 'opacity-100' : 'opacity-0')} />
                        All Years
                      </CommandItem>

                      {generateYearRange(2020, 2025).map((year) => (
                        <CommandItem
                          key={year}
                          onSelect={() => {
                            setData('year', year);
                            setYearPopoverOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', data.year === year ? 'opacity-100' : 'opacity-0')} />
                          {year}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Program Filter */}
            <Popover open={isProgramPopoverOpen} onOpenChange={setProgramPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <Book className="mr-2 h-4 w-4" />
                  {data.program ?? 'All Programs'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter program..." />
                  <CommandList>
                    <CommandEmpty>No program found.</CommandEmpty>
                    <CommandGroup>
                      {programCategories.map((program) => (
                        <CommandItem
                          key={program}
                          onSelect={() => {
                            setData('program', program);
                            setProgramPopoverOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', data.program === program ? 'opacity-100' : 'opacity-0')} />
                          {program}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setData('program', null);
                        setProgramPopoverOpen(false);
                      }}
                      className="text-red-500"
                    >
                      Clear Filter
                    </CommandItem>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
          <Table className="min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] px-1 py-2">Student</TableHead>
                <TableHead className="w-[15%] px-1 py-2 text-center">Program</TableHead>
                <TableHead className="w-[15%] px-1 py-2 text-center">OR Number</TableHead>
                <TableHead className="w-[15%] px-1 py-2 text-center">Payment Date</TableHead>
                <TableHead className="w-[10%] px-1 py-2 text-center">Records</TableHead>
                <TableHead className="w-[15%] px-1 py-2 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.data.length > 0 ? (
                records.data.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
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
                    <TableCell className="px-1 py-2 text-center">{record.program}</TableCell>
                    <TableCell className="px-1 py-2 text-center">{record.or_number}</TableCell>
                    <TableCell className="px-1 py-2 text-center">{record.payment_date}</TableCell>
                    <TableCell className="px-1 py-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
                        onClick={() => openIndividualRecord(record)}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline-block">View</span>
                      </Button>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-md h-auto p-2"
                          onClick={() => openEditModal(record)}
                        >
                          <SquarePen className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-md h-auto p-2"
                          onClick={() => openDeletePrompt(record)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {records.last_page > 1 && (
          <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-muted-foreground">
            <span>Page {records.current_page} of {records.last_page}</span>
            <Button variant="outline" size="icon" disabled={records.current_page === 1}
              onClick={() => router.get(route('student-records.index', { ...data, page: 1 }))}>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={records.current_page === 1}
              onClick={() => router.get(route('student-records.index', { ...data, page: records.current_page - 1 }))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={records.current_page === records.last_page}
              onClick={() => router.get(route('student-records.index', { ...data, page: records.current_page + 1 }))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={records.current_page === records.last_page}
              onClick={() => router.get(route('student-records.index', { ...data, page: records.last_page }))}>
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Modals */}
        <Dialog open={showIndividualRecord} onOpenChange={setShowIndividualRecord}>
          <DialogContent className="max-w-3xl min-w-190 w-full max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Student Record</DialogTitle>
              <DialogDescription>
                Detailed information about the student.
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && <IndividualRecord record={selectedRecord} />}
          </DialogContent>
        </Dialog>

{isEditModalOpen && selectedRecord && (
  <EditStudentModal
    isOpen={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    record={selectedRecord}
  />
)}
        <DeletePrompt
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
