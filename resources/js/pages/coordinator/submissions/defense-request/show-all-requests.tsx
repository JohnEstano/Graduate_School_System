'use client';

import { useState, useMemo } from 'react';

import { format } from 'date-fns';

import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Details from './details';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import {
    Clock,
    CheckCircle,
    PauseCircle,
    Trash2,
    MoreHorizontal,
    ChevronsUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    CirclePlus,
    Settings2,
    Info,
} from 'lucide-react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export type DefenseRequestSummary = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    program: string;
    thesis_title: string;
    date_of_defense: string;
    mode_defense: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Needs-info';
    priority?: 'Low' | 'Medium' | 'High';
};

export default function ShowAllRequests({
    defenseRequests,
}: {
    defenseRequests: DefenseRequestSummary[];
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<number[]>([]);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);


    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [columns, setColumns] = useState<Record<string, boolean>>({
        title: true,
        presenter: true,
        date: true,
        mode: true,
        status: true,
        priority: true,
    });

    const perPage = 10;

    const toggleColumn = (key: string) =>
        setColumns(c => ({ ...c, [key]: !c[key] }));


    const filtered = useMemo(() => {
        let result = defenseRequests;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                `${r.first_name} ${r.last_name} ${r.thesis_title}`
                    .toLowerCase()
                    .includes(q)
            );
        }

        if (statusFilter.length) {
            result = result.filter(r =>
                statusFilter.includes((r.status || 'pending').toLowerCase())
            );
        }

        if (priorityFilter.length) {
            result = result.filter(r =>
                r.priority && priorityFilter.includes(r.priority.toLowerCase())
            );
        }

        return result;
    }, [search, statusFilter, priorityFilter, defenseRequests]);

    const sorted = useMemo(() => {
        if (!sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const ta = new Date(a.date_of_defense).getTime();
            const tb = new Date(b.date_of_defense).getTime();
            return sortDir === 'asc' ? ta - tb : tb - ta;
        });
    }, [filtered, sortDir]);


    const totalPages = Math.ceil(filtered.length / perPage);
    const paged = useMemo(() => {
        const start = (page - 1) * perPage;
        return sorted.slice(start, start + perPage);
    }, [sorted, page]);


    const headerChecked =
        selected.length === paged.length
            ? true
            : selected.length > 0
                ? 'indeterminate'
                : false;

    const toggleSelectAll = () =>
        setSelected(s =>
            s.length === paged.length ? [] : paged.map(r => r.id)
        );

    const toggleSelectOne = (id: number) =>
        setSelected(s =>
            s.includes(id) ? s.filter(x => x !== id) : [...s, id]
        );

    const toggleSort = () =>
        setSortDir(d =>
            d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'
        );

    return (
        <div className="h-screen p-2 flex flex-col gap-2">

            <Tabs defaultValue="all">
                <TabsList className="inline-flex space-x-2">
                    <TabsTrigger value="all">Recent</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
            </Tabs>


            <Card className="flex-1 flex flex-col rounded-lg p-2">

                <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2">


                    <div className="flex flex-1 justify-between items-center flex-wrap gap-2 px-2 pt-2">

                        <div className="flex gap-2 items-center flex-wrap">

                            <div className="relative">
                                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search…"
                                    startIcon={Search}
                                    value={search}
                                    onChange={e => {
                                        setSearch(e.currentTarget.value);
                                        setPage(1);
                                    }}
                                    className="pl-8 h-8 text-sm w-[200px]"
                                />
                            </div>


                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3">
                                        <CirclePlus /> Status{statusFilter.length > 0 ? `: ${statusFilter.join(', ')}` : ''}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 p-1" side='bottom' align='start'>
                                    {['Pending', 'In progress', 'Approved', 'Rejected', 'Needs-info'].map(s => (
                                        <div
                                            key={s}
                                            onClick={() =>
                                                setStatusFilter(fs =>
                                                    fs.includes(s) ? fs.filter(x => x !== s) : [...fs, s]
                                                )
                                            }
                                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                        >
                                            <Checkbox checked={statusFilter.includes(s)} />
                                            <span className="text-sm">{s.replace('-', ' ')}</span>
                                        </div>
                                    ))}
                                    <Separator className="my-2" />
                                    <Button size="sm" variant="ghost" className="w-full" onClick={() => setStatusFilter([])}>
                                        Clear Filters
                                    </Button>
                                </PopoverContent>
                            </Popover>


                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3">
                                        <CirclePlus /> Priority{priorityFilter.length > 0 ? `: ${priorityFilter.join(', ')}` : ''}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 p-1" align='start' side='bottom'>
                                    {['low', 'medium', 'high'].map(p => (
                                        <div
                                            key={p}
                                            onClick={() =>
                                                setPriorityFilter(fp =>
                                                    fp.includes(p) ? fp.filter(x => x !== p) : [...fp, p]
                                                )
                                            }
                                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                        >
                                            <Checkbox checked={priorityFilter.includes(p)} />
                                            <span className="text-sm">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                                        </div>
                                    ))}
                                    <Separator className="my-2" />
                                    <Button size="sm" variant="ghost" className="w-full" onClick={() => setPriorityFilter([])}>
                                        Clear Filters
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>


                        <div className="flex items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="rounded-md border-dashed text-xs h-8 px-3">
                                        <Settings2 /> View
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" side="bottom" align="end" >
                                    {[
                                        { key: 'title', label: 'Title' },
                                        { key: 'presenter', label: 'Presenter' },
                                        { key: 'date', label: 'Scheduled Date' },
                                        { key: 'mode', label: 'Mode' },
                                        { key: 'status', label: 'Status' },
                                        { key: 'priority', label: 'Priority' },
                                    ].map(({ key, label }) => (
                                        <div
                                            key={key}
                                            onClick={() => toggleColumn(key)}
                                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                        >
                                            <Checkbox checked={columns[key]} />
                                            <span className="text-sm">{label}</span>
                                        </div>
                                    ))}
                                    <Separator className="my-2" />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() =>
                                            setColumns({
                                                title: true,
                                                presenter: true,
                                                date: true,
                                                mode: true,
                                                status: true,
                                                priority: true,
                                            })
                                        }
                                    >
                                        Show all
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                </div>

                <CardContent className="flex-1 overflow-auto">
                    <Separator />
                    <div className="flex gap-1 pt-2 flex-wrap text-xs pb-2">
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <Clock size={12} /> Mark as In Progress
                        </Button>
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <CheckCircle size={12} /> Mark as Accepted
                        </Button>
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <PauseCircle size={12} /> Mark as Pending
                        </Button>
                        <Button variant="outline" className="rounded-full px-3 py-2 h-auto text-xs flex items-center gap-1">
                            <Trash2 size={12} /> Delete
                        </Button>
                    </div>


                    <div className="rounded-lg overflow-hidden border border-border">
                        <Table className="w-full text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[5%] px-2 py-2">
                                        <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                                    </TableHead>
                                    {columns.title && <TableHead className="w-[30%] px-2 py-2">Title</TableHead>}
                                    {columns.presenter && <TableHead className="w-[20%] px-2 py-2">Presenter</TableHead>}
                                    {columns.date && (
                                        <TableHead className="w-[15%] text-center cursor-pointer px-2 py-2" onClick={toggleSort}>
                                            <div className="flex justify-center items-center gap-1">
                                                <span>Scheduled Date</span>
                                                {sortDir === 'asc' && <ArrowUp size={12} />}
                                                {sortDir === 'desc' && <ArrowDown size={12} />}
                                                {!sortDir && <ChevronsUpDown size={12} className="opacity-50" />}
                                            </div>
                                        </TableHead>
                                    )}
                                    {columns.mode && <TableHead className="w-[10%] text-center px-2 py-2">Mode</TableHead>}
                                    {columns.status && <TableHead className="w-[10%] text-center px-2 py-2">Status</TableHead>}
                                    {columns.priority && <TableHead className="w-[10%] text-center px-2 py-2">Priority</TableHead>}
                                    <TableHead className="w-[5%] text-center px-2 py-2" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.map((r, index) => (
                                    <TableRow key={r.id} className="hover:bg-muted/50">
                                        <TableCell className="px-2 py-2">
                                            <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelectOne(r.id)} />
                                        </TableCell>
                                        {columns.title && (
                                            <TableCell className="px-2 py-2 font-semibold truncate">{r.thesis_title}</TableCell>
                                        )}
                                        {columns.presenter && (
                                            <TableCell className="px-2 py-2 truncate">
                                                {r.first_name}{' '}
                                                {r.middle_name ? `${r.middle_name[0]}. ` : ''}
                                                {r.last_name}
                                            </TableCell>
                                        )}
                                        {columns.date && (
                                            <TableCell className="px-2 py-2 text-center whitespace-nowrap">
                                                {format(new Date(r.date_of_defense), 'MMM dd, yyyy')}
                                            </TableCell>
                                        )}
                                        {columns.mode && (
                                            <TableCell className="px-2 py-2 text-center capitalize">
                                                {r.mode_defense.replace('-', ' ')}
                                            </TableCell>
                                        )}
                                        {columns.status && (
                                            <TableCell className="px-2 py-2 text-center">
                                                <Badge
                                                    variant={
                                                        r.status === 'Approved'
                                                            ? 'default'
                                                            : r.status === 'Rejected'
                                                                ? 'destructive'
                                                                : r.status === 'Needs-info'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                    }
                                                    className="text-xs px-2 py-0.5"
                                                >
                                                    {(r.status || 'pending').replace('-', ' ')}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        {columns.priority && (
                                            <TableCell className="px-2 py-2 text-center">
                                                <Badge className="text-xs px-2 py-0.5">
                                                    {r.priority ?? 'High'}
                                                </Badge>
                                            </TableCell>
                                        )}
                                        <TableCell className="px-2 py-2 text-center">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedRequest(r);
                                                            setSelectedIndex(index); // New: track index of the selected item
                                                        }}
                                                    >
                                                        <Info />
                                                    </Button>
                                                </DialogTrigger>

                                                <DialogContent className="max-w-5xl min-w-260 w-full max-h-[90vh]">
                                                    <div className="max-h-[80vh] overflow-y-auto px-1">
                                                        {selectedRequest && (
                                                            <Details
                                                                request={selectedRequest}
                                                                onNavigate={(dir) => {
                                                                    const newIndex = dir === 'next' ? selectedIndex + 1 : selectedIndex - 1;
                                                                    if (newIndex >= 0 && newIndex < sorted.length) {
                                                                        setSelectedRequest(sorted[newIndex]);
                                                                        setSelectedIndex(newIndex);
                                                                    }
                                                                }}
                                                                disablePrev={selectedIndex === 0}
                                                                disableNext={selectedIndex === sorted.length - 1}
                                                            />
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>


                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>


                <CardFooter className="flex justify-between items-center text-sm px-2 pt-3 pb-2">
                    <div>{filtered.length} request{filtered.length !== 1 && 's'}</div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Prev
                        </Button>
                        <span>Page {page} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
