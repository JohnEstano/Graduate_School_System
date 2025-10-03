import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Users, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday } from 'date-fns';

interface ScheduledDefense {
    id: number;
    student_name: string;
    school_id: string;
    program: string;
    thesis_title: string;
    defense_type: string;
    scheduled_date: string;
    scheduled_time: string;
    defense_mode: string;
    defense_venue: string;
    panels_list: Array<{role: string; name: string}>;
    workflow_state: string;
    scheduling_notes?: string;
}

interface Props {
    scheduledDefenses: ScheduledDefense[];
    user: any;
}

export default function DefenseScheduleCalendar({ scheduledDefenses, user }: Props) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProgram, setFilterProgram] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [selectedDefense, setSelectedDefense] = useState<ScheduledDefense | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    // Get unique programs and defense types for filters
    const programs = useMemo(() => {
        const uniquePrograms = [...new Set(scheduledDefenses.map(d => d.program))];
        return uniquePrograms.sort();
    }, [scheduledDefenses]);

    const defenseTypes = useMemo(() => {
        const uniqueTypes = [...new Set(scheduledDefenses.map(d => d.defense_type))];
        return uniqueTypes.sort();
    }, [scheduledDefenses]);

    // Filter defenses based on search and filters
    const filteredDefenses = useMemo(() => {
        return scheduledDefenses.filter(defense => {
            const matchesSearch = searchQuery === '' || 
                defense.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                defense.thesis_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                defense.school_id.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesProgram = filterProgram === 'all' || defense.program === filterProgram;
            const matchesType = filterType === 'all' || defense.defense_type === filterType;
            
            return matchesSearch && matchesProgram && matchesType;
        });
    }, [scheduledDefenses, searchQuery, filterProgram, filterType]);

    // Get week dates for week view
    const weekDates = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end: endOfWeek(selectedDate, { weekStartsOn: 0 }) });
    }, [selectedDate]);

    // Group defenses by date for calendar view
    const defensesByDate = useMemo(() => {
        const grouped: Record<string, ScheduledDefense[]> = {};
        filteredDefenses.forEach(defense => {
            const dateKey = defense.scheduled_date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(defense);
        });
        
        // Sort defenses by time within each date
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
        });
        
        return grouped;
    }, [filteredDefenses]);

    // Get defenses for a specific date
    const getDefensesForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return defensesByDate[dateKey] || [];
    };

    const openDefenseDetails = (defense: ScheduledDefense) => {
        setSelectedDefense(defense);
        setDetailsDialogOpen(true);
    };

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getModeIcon = (mode: string) => {
        return mode === 'online' ? '💻' : '🏛️';
    };

    // Check for time conflicts
    const getConflictsForDate = (date: Date) => {
        const defenses = getDefensesForDate(date);
        const conflicts: ScheduledDefense[] = [];
        
        defenses.forEach((defense, i) => {
            defenses.slice(i + 1).forEach(otherDefense => {
                if (defense.scheduled_time === otherDefense.scheduled_time) {
                    // Check for panel conflicts
                    const defensePanels = defense.panels_list.map(p => p.name);
                    const otherPanels = otherDefense.panels_list.map(p => p.name);
                    const hasConflict = defensePanels.some(panel => otherPanels.includes(panel)) ||
                                       defense.defense_venue === otherDefense.defense_venue;
                    
                    if (hasConflict && !conflicts.includes(defense)) {
                        conflicts.push(defense);
                    }
                    if (hasConflict && !conflicts.includes(otherDefense)) {
                        conflicts.push(otherDefense);
                    }
                }
            });
        });
        
        return conflicts;
    };

    return (
        <AppLayout>
            <Head title="Defense Schedule" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Defense Schedule</h1>
                            <p className="text-gray-600">Manage and view all scheduled thesis defenses</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <Select value={viewMode} onValueChange={(value: 'week' | 'day') => setViewMode(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">Week View</SelectItem>
                                    <SelectItem value="day">Day View</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Filters & Search</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Input
                                        placeholder="Search student, thesis title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                
                                <Select value={filterProgram} onValueChange={setFilterProgram}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Programs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        {programs.map(program => (
                                            <SelectItem key={program} value={program}>{program}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {defenseTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Total: {filteredDefenses.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calendar Navigation */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedDate(subDays(selectedDate, viewMode === 'week' ? 7 : 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedDate(new Date())}
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? 7 : 1))}
                            >
                                Next
                            </Button>
                        </div>
                        
                        <h2 className="text-xl font-semibold">
                            {viewMode === 'week' 
                                ? `Week of ${format(weekDates[0], 'MMM d')} - ${format(weekDates[6], 'MMM d, yyyy')}`
                                : format(selectedDate, 'EEEE, MMMM d, yyyy')
                            }
                        </h2>
                    </div>

                    {/* Calendar Grid */}
                    {viewMode === 'week' ? (
                        <div className="grid grid-cols-7 gap-1 bg-white rounded-lg border overflow-hidden">
                            {weekDates.map(date => {
                                const defenses = getDefensesForDate(date);
                                const conflicts = getConflictsForDate(date);
                                
                                return (
                                    <div key={date.toISOString()} className="min-h-[200px] border-r border-b">
                                        {/* Day header */}
                                        <div className={`p-2 text-center border-b ${isToday(date) ? 'bg-blue-50 text-blue-700 font-semibold' : 'bg-gray-50'}`}>
                                            <div className="text-sm font-medium">{format(date, 'EEE')}</div>
                                            <div className={`text-lg ${isToday(date) ? 'font-bold' : ''}`}>{format(date, 'd')}</div>
                                        </div>
                                        
                                        {/* Defenses for this day */}
                                        <div className="p-1 space-y-1">
                                            {defenses.map(defense => {
                                                const hasConflict = conflicts.includes(defense);
                                                
                                                return (
                                                    <div
                                                        key={defense.id}
                                                        className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity
                                                            ${hasConflict ? 'bg-red-100 border border-red-300' : 'bg-blue-100 border border-blue-200'}
                                                        `}
                                                        onClick={() => openDefenseDetails(defense)}
                                                    >
                                                        {hasConflict && (
                                                            <div className="flex items-center gap-1 text-red-600 mb-1">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                <span className="text-xs font-semibold">CONFLICT</span>
                                                            </div>
                                                        )}
                                                        <div className="font-medium truncate">{defense.student_name}</div>
                                                        <div className="text-gray-600">{defense.scheduled_time}</div>
                                                        <div className="flex items-center gap-1">
                                                            <span>{getModeIcon(defense.defense_mode)}</span>
                                                            <span className="truncate">{defense.defense_venue}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Day View */
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                </CardTitle>
                                <CardDescription>
                                    {getDefensesForDate(selectedDate).length} defense(s) scheduled
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {getDefensesForDate(selectedDate).length === 0 ? (
                                        <p className="text-center py-8 text-gray-500">No defenses scheduled for this day</p>
                                    ) : (
                                        getDefensesForDate(selectedDate).map(defense => {
                                            const conflicts = getConflictsForDate(selectedDate);
                                            const hasConflict = conflicts.includes(defense);
                                            
                                            return (
                                                <Card key={defense.id} className={hasConflict ? 'border-red-300 bg-red-50' : ''}>
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                {hasConflict && (
                                                                    <div className="flex items-center gap-2 text-red-600 mb-2">
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                        <span className="text-sm font-semibold">SCHEDULING CONFLICT</span>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="font-semibold text-lg">{defense.student_name}</h3>
                                                                    <Badge className={getStatusColor(defense.workflow_state)}>
                                                                        {defense.workflow_state.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p><strong>ID:</strong> {defense.school_id}</p>
                                                                        <p><strong>Program:</strong> {defense.program}</p>
                                                                        <p><strong>Type:</strong> {defense.defense_type}</p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <Clock className="h-4 w-4" />
                                                                            <span>{defense.scheduled_time}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="h-4 w-4" />
                                                                            <span>{defense.defense_venue}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span>{getModeIcon(defense.defense_mode)}</span>
                                                                            <span>{defense.defense_mode}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="mt-3">
                                                                    <p className="font-medium text-sm">Thesis Title:</p>
                                                                    <p className="text-sm text-gray-700">{defense.thesis_title}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDefenseDetails(defense)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Details
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Defense Details Dialog */}
                    <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Defense Details</DialogTitle>
                                <DialogDescription>
                                    Complete information for {selectedDefense?.student_name}'s defense
                                </DialogDescription>
                            </DialogHeader>
                            
                            {selectedDefense && (
                                <div className="space-y-6">
                                    {/* Student Info */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-medium">Student Information</p>
                                            <p>Name: {selectedDefense.student_name}</p>
                                            <p>ID: {selectedDefense.school_id}</p>
                                            <p>Program: {selectedDefense.program}</p>
                                            <p>Defense Type: {selectedDefense.defense_type}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium">Schedule Information</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{format(parseISO(selectedDefense.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{selectedDefense.scheduled_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4" />
                                                <span>{selectedDefense.defense_venue}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span>{getModeIcon(selectedDefense.defense_mode)}</span>
                                                <span>{selectedDefense.defense_mode}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Thesis Title */}
                                    <div>
                                        <p className="font-medium mb-2">Thesis Title</p>
                                        <p className="text-sm bg-gray-50 p-3 rounded">{selectedDefense.thesis_title}</p>
                                    </div>
                                    
                                    {/* Panel Members */}
                                    {selectedDefense.panels_list.length > 0 && (
                                        <div>
                                            <p className="font-medium mb-2 flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Panel Members
                                            </p>
                                            <div className="space-y-1">
                                                {selectedDefense.panels_list.map((panel, index) => (
                                                    <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                        <span className="font-medium">{panel.role}:</span>
                                                        <span>{panel.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Scheduling Notes */}
                                    {selectedDefense.scheduling_notes && (
                                        <div>
                                            <p className="font-medium mb-2">Scheduling Notes</p>
                                            <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                                                {selectedDefense.scheduling_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AppLayout>
    );
}
