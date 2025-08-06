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
    PlusCircle,
    MinusCircle,
    Edit,
    Check,
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// 👇 Import your new SearchInput component
import { SearchInput } from '@/components/ui/search-input';

// Modals
import AddProgramModal from './honorarium-modals/modal-add';
import RemoveProgramModal from './honorarium-modals/modal-remove';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Honorarium', href: '/honorarium' },
    { title: 'Honorarium Summary', href: '/honorarium-summary' },
];

const initialRecords = [
    { name: 'Master in Information Technology', program: 'MIT', recentlyUpdated: '2 hours ago', timeLastOpened: '12:09 PM', dateEdited: '2025-07-24' },
    { name: 'Master in Business Administration', program: 'MBA', recentlyUpdated: '1 day ago', timeLastOpened: '9:30 AM', dateEdited: '2025-07-23' },
    { name: 'Master of Computer Science', program: 'MCS', recentlyUpdated: '3 days ago', timeLastOpened: '3:45 PM', dateEdited: '2025-07-21' },
    { name: 'Master of Arts in Education', program: 'MAED', recentlyUpdated: '5 days ago', timeLastOpened: '11:00 AM', dateEdited: '2025-07-19' },
    // ... other records
];

export default function Index() {
    const [allRecords, setAllRecords] = useState(initialRecords);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const [isEditing, setIsEditing] = useState(false);
    const [isYearPopoverOpen, setYearPopoverOpen] = useState(false);
    const [isProgramPopoverOpen, setProgramPopoverOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [newProgramName, setNewProgramName] = useState('');
    const [newProgramAcronym, setNewProgramAcronym] = useState('');
    const [programToRemove, setProgramToRemove] = useState<string | null>(null);

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
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
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
                    <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit className="w-5 h-5 mr-0 sm:mr-2" />
                            <span className="hidden sm:inline text-sm font-medium">{isEditing ? 'Done' : 'Edit'}</span>
                        </Button>
                        {isEditing && (
                            <>
                                <Button variant="ghost" onClick={() => setShowAddModal(true)} className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300">
                                    <PlusCircle className="w-5 h-5 mr-0 sm:mr-2" />
                                    <span className="hidden sm:inline text-sm font-medium">Add</span>
                                </Button>
                                <Button variant="ghost" onClick={() => setShowRemoveModal(true)} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                                    <MinusCircle className="w-5 h-5 mr-0 sm:mr-2" />
                                    <span className="hidden sm:inline text-sm font-medium">Remove</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                    {/* 👇 Use the new component here */}
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
                        <Popover open={isProgramPopoverOpen} onOpenChange={setProgramPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                                    <Book className="mr-2 h-4 w-4" />
                                    {selectedProgram ?? 'All Programs'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Filter program..." />
                                    <CommandList>
                                        <CommandEmpty>No program found.</CommandEmpty>
                                        <CommandGroup>
                                            {uniquePrograms.map((program) => (
                                                <CommandItem key={program} onSelect={() => { setSelectedProgram(program); setProgramPopoverOpen(false); }}>
                                                    <Check className={cn('mr-2 h-4 w-4', selectedProgram === program ? 'opacity-100' : 'opacity-0')} />
                                                    {program}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandItem onSelect={() => { setSelectedProgram(null); setProgramPopoverOpen(false); }} className="text-red-500">
                                            Clear Filter
                                        </CommandItem>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-14 pr-4">Program</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead>Time Last Opened</TableHead>
                                <TableHead>Date Edited</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRecords.map((record, index) => (
                                <TableRow key={index}>
                                    <TableCell className="flex items-center space-x-3 py-3 pl-4">
                                        <img src={`https://placehold.co/40x40/EBF4FF/76A9FA?text=${record.program.charAt(0)}`} alt="avatar" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <div className="font-medium">{record.name}</div>
                                            <div className="text-sm text-muted-foreground">{record.program}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{record.recentlyUpdated}</TableCell>
                                    <TableCell>{record.timeLastOpened}</TableCell>
                                    <TableCell>{record.dateEdited}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center space-x-2">
                                            <Button variant="outline" size="sm" className="flex items-center">
                                                <Eye className="w-4 h-4 mr-1.5" />
                                                View Records
                                            </Button>
                                            <Button variant="outline" size="icon">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-muted-foreground">
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="w-4 h-4" /></Button>
                </div>
            </div>
            
            <AddProgramModal show={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddProgram} newProgramName={newProgramName} setNewProgramName={setNewProgramName} newProgramAcronym={newProgramAcronym} setNewProgramAcronym={setNewProgramAcronym} />
            <RemoveProgramModal show={showRemoveModal} onClose={() => setShowRemoveModal(false)} onSubmit={handleRemoveProgram} programToRemove={programToRemove} setProgramToRemove={setProgramToRemove} uniquePrograms={uniquePrograms} />
        </AppLayout>
    );
}