import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import IndividualRecord from './individual-records';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/search-input';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const { data, setData, get } = useForm({
    search: filters.search || '',
  });

  // Handle manual date input
  const handleStartDateChange = (value: string) => {
    setStartDateInput(value);
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) {
      setDateRange({ from: parsed, to: dateRange?.to });
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDateInput(value);
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) {
      setDateRange({ from: dateRange?.from, to: parsed });
    }
  };

  // Sync input fields when calendar changes
  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setStartDateInput(format(range.from, "yyyy-MM-dd"));
    } else {
      setStartDateInput("");
    }
    if (range?.to) {
      setEndDateInput(format(range.to, "yyyy-MM-dd"));
    } else {
      setEndDateInput("");
    }
  };

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

  // Filter students by date range based on defense date
  const filteredStudents = students.data.filter((student) => {
    if (dateRange?.from) {
      const defenseDate = student.defense_date ? new Date(student.defense_date) : null;
      if (!defenseDate) return false; // Exclude if no defense date
      
      const fromDate = dateRange.from;
      const toDate = dateRange.to || fromDate;
      
      return defenseDate >= fromDate && defenseDate <= toDate;
    }
    return true;
  });

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

        {/* Search and Date Filter */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchInput
            placeholder="Search Student Name or ID..."
            className="w-full sm:w-1/3"
            value={data.search}
            onChange={(e) => setData("search", e.target.value)}
          />

          {/* Date Range Filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                        {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  {/* Date Inputs */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDateInput}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="h-9 w-full"
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDateInput}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="h-9 w-full"
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or select from calendar</span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from || new Date()}
                    selected={dateRange}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={1}
                    className="rounded-md"
                  />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {dateRange?.from ? (
                      <div className="text-xs text-muted-foreground flex-1">
                        {dateRange.to ? (
                          <span className="font-medium">
                            {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                          </span>
                        ) : (
                          <span>{format(dateRange.from, "MMM dd, yyyy")}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No date selected</div>
                    )}
                    {dateRange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateRange(undefined);
                          setStartDateInput("");
                          setEndDateInput("");
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-md border border-border bg-white dark:bg-[#121212] p-2 max-h-[68vh] overflow-y-auto">
          <Table className="min-w-full text-sm">
            <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10 shadow-sm">
              <TableRow>
                  <TableHead className="w-[70%] px-4 py-2">Student Name</TableHead>
                  <TableHead className="w-[30%] px-4 py-2 text-center">Defense Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((record) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => openIndividualRecord(record)}
                  >
                      <TableCell className="flex items-center space-x-4 px-4 py-3">
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
                      <TableCell className="px-4 py-3 text-center">
                        {record.defense_date 
                          ? new Date(record.defense_date).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : "-"}
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
