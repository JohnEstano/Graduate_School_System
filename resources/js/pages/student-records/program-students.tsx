import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import IndividualRecord from './individual-records';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/search-input';
import { useForm } from '@inertiajs/react';

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
  defense_date: string | null;
  defense_type: string | null;
  payments?: {
    id: number;
    defense_date?: string;
    defense_type?: string;
    defense_status: string;
    or_number?: string;
    payment_date: string;
    amount: string;
    panelists?: {
      name: string;
      role: string;
      amount: string;
    }[];
  }[];
}

interface ProgramRecord {
  id: number;
  name: string;
  program: string;
  category: string;
}

interface PaginatedRecords {
  data: StudentRecord[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
}

interface ProgramStudentsProps {
  program: ProgramRecord;
  students: PaginatedRecords;
  filters: {
    search?: string;
  };
}

export default function ProgramStudents({ program, students, filters }: ProgramStudentsProps) {
  const [showIndividualRecord, setShowIndividualRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StudentRecord | null>(null);

  const { data, setData, get } = useForm({
    search: filters.search || '',
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Student Records', href: '/student-records' },
    { title: program.name, href: `/student-records/program/${program.id}` }
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      get(route('student-records.program.show', program.id), {
        preserveState: true,
        replace: true,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [data]);

  const openIndividualRecord = (record: StudentRecord) => {
    setSelectedRecord(record);
    setShowIndividualRecord(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Students - ${program.name}`} />
      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {program.program} • {program.category}
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search Student Name or ID..."
            className="w-full md:w-1/3"
            value={data.search}
            onChange={(e) => setData('search', e.target.value)}
          />
        </div>

        {/* Students Table */}
        <div className="rounded-md border border-border bg-white dark:bg-[#121212] p-2 max-h-[68vh] overflow-y-auto">
          <Table className="min-w-full text-sm">
            <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10 shadow-sm">
              <TableRow>
                  <TableHead className="w-full px-4 py-2">Student Name</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {students.data.length > 0 ? (
                students.data.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openIndividualRecord(record)}
                  >
                      <TableCell className="flex items-center space-x-4 px-4 py-3 w-full">
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
                  </TableRow>
                ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={1} className="h-24 text-center">
                      No students found.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Individual Record Modal */}
        {showIndividualRecord && selectedRecord && (
          <IndividualRecord
            record={selectedRecord}
            onClose={() => setShowIndividualRecord(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}
