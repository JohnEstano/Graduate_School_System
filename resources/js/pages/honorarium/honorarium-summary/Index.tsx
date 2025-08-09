import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useMemo, type FormEvent } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Calendar,
  Book,
  Eye,
  Download,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/search-input';
import IndividualRecordModal from './honorarium-modals/record-modal';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Honorarium', href: '/honorarium' },
  { title: 'Honorarium Summary', href: '/honorarium-summary' },
];

const initialRecords = [
    // Doctorate Programs
    { name: 'Doctor in Business Management', program: 'DBM', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor in Business Management Specialized in Information Systems', program: 'DBM-IS', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Applied Linguistics', program: 'PHDED-AL', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Educational Leadership', program: 'PHDED-EL', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Counseling', program: 'PHDED-C', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Filipino', program: 'PHDED-FIL', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Information Technology Integration', program: 'PHDED-ITI', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Mathematics', program: 'PHDED-MATH', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Education, Major in: Physical Education', program: 'PHDED-PE', category: 'Doctorate', dateEdited: '2025-08-08' },
    { name: 'Doctor of Philosophy in Pharmacy', program: 'PHD-PHARM', category: 'Doctorate', dateEdited: '2025-08-08' },

    // Masters Programs
    { name: 'Master of Arts in Educational Management', program: 'MAEM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Elementary Education', program: 'MAEE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: English', program: 'MAED-ENG', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Filipino', program: 'MAED-FIL', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Information Technology Integration', program: 'MAED-ITI', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Mathematics', program: 'MAED-MATH', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Music Education', program: 'MAED-ME', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Physical Education', program: 'MAED-PE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Education, Major in: Sociology', program: 'MAED-SOC', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Religious Education', program: 'MARE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Values Education', program: 'MAVE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Teaching Chemistry', program: 'MATCHEM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Teaching Physics', program: 'MATPHY', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Engineering Education, Major in: Civil Engineering', program: 'MEE-CE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Engineering Education, Major in: Electronics and Communications Engineering', program: 'MEE-ECE', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Information System', program: 'MIS', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Information Technology', program: 'MIT', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Science in Medical Technology, Major in: Biomedical Science', program: 'MSMT-BS', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Science in Medical Technology, Major in: Laboratory Leadership and Management', program: 'MSMT-LLM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Science in Medical Technology, Major in: Medical Laboratory Science Education and Management', program: 'MSMT-MLSEM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Science in Medical Technology, Major in: Community Health', program: 'MSMT-CH', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Science in Pharmacy', program: 'MSPHARM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master of Arts in Counseling', program: 'MAC', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Pastoral Ministry (Non-Thesis), Specialized in: Family Ministry and Counseling', program: 'MPM-FMC', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Pastoral Ministry (Non-Thesis), Specialized in: Pastoral Management', program: 'MPM-PM', category: 'Masters', dateEdited: '2025-08-08' },
    { name: 'Master in Pastoral Ministry (Non-Thesis), Specialized in: Retreat Giving and Spirituality', program: 'MPM-RGS', category: 'Masters', dateEdited: '2025-08-08' },
];

export type ProgramRecord = typeof initialRecords[0];

const programCategories = ['Doctorate', 'Masters'];

export default function Index() {
    const [allRecords, setAllRecords] = useState(initialRecords);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [isYearPopoverOpen, setYearPopoverOpen] = useState(false);
    const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ProgramRecord | null>(null);

    const filteredRecords = useMemo(() => {
        return allRecords.filter((record) => {
            const matchYear = selectedYear ? record.dateEdited.startsWith(selectedYear) : true;
            const matchCategory = selectedCategory ? record.category === selectedCategory : true;
            const matchSearch = searchQuery ? record.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            return matchYear && matchCategory && matchSearch;
        });
    }, [allRecords, selectedYear, selectedCategory, searchQuery]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, filteredRecords, itemsPerPage]);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleViewRecordsClick = (record: ProgramRecord) => {
        setSelectedRecord(record);
        setShowRecordModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Honorarium Summary" />
            <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                    <SearchInput
                        placeholder="Search by Program Name..."
                        className="w-full md:w-1/3"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                        <Popover open={isYearPopoverOpen} onOpenChange={setYearPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {selectedYear ?? 'All Years'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            {['2023', '2024', '2025'].map((year) => (
                                                <CommandItem key={year} onSelect={() => { setSelectedYear(year); setYearPopoverOpen(false); }}>
                                                    <Check className={cn('mr-2 h-4 w-4', selectedYear === year ? 'opacity-100' : 'opacity-0')} />
                                                    {year}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandItem onSelect={() => { setSelectedYear(null); setYearPopoverOpen(false); }} className="text-red-500">
                                            Clear Filter
                                        </CommandItem>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                                    <Book className="mr-2 h-4 w-4" />
                                    {selectedCategory ?? 'All Programs'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter category..." />
                                    <CommandList>
                                        <CommandEmpty>No category found.</CommandEmpty>
                                        <CommandGroup>
                                            {programCategories.map((category) => (
                                                <CommandItem key={category} onSelect={() => { setSelectedCategory(category); setCategoryPopoverOpen(false); }}>
                                                    <Check className={cn('mr-2 h-4 w-4', selectedCategory === category ? 'opacity-100' : 'opacity-0')} />
                                                    {category}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandItem onSelect={() => { setSelectedCategory(null); setCategoryPopoverOpen(false); }} className="text-red-500">
                                            Clear Filter
                                        </CommandItem>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
                    <Table className="min-w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%] px-1 py-2">Program</TableHead>
                                <TableHead className="w-[20%] px-1 py-2 text-center">Date Edited</TableHead>
                                <TableHead className="w-[20%] text-center px-1 py-2">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRecords.length > 0 ? (
                                paginatedRecords.map((record, index) => (
                                    <TableRow key={index} className="hover:bg-muted/50">
                                        <TableCell className="flex items-center space-x-4 px-1 py-2">
                                            <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                                <AvatarFallback>{record.program.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{record.name}</div>
                                                <div className="text-sm text-muted-foreground">{record.program}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-1 py-2 text-center">{record.dateEdited}</TableCell>
                                        <TableCell className="px-1 py-2">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Button variant="outline" size="sm" className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1" onClick={() => handleViewRecordsClick(record)}>
                                                    <Eye className="w-4 h-4" />
                                                    <span className="hidden sm:inline-block">View Records</span>
                                                </Button>
                                                <Button variant="outline" size="icon" className="rounded-md h-auto p-2">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
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
                {totalPages > 1 && (
                    <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-muted-foreground">
                        <span>Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="w-4 h-4" /></Button>
                    </div>
                )}
            </div>
            <IndividualRecordModal
                show={showRecordModal}
                onClose={() => setShowRecordModal(false)}
                record={selectedRecord}
            />
        </AppLayout>
    );
}