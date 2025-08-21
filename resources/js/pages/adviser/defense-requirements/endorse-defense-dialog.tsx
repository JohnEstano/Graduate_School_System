'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import axios from 'axios';

type DefenseRequirement = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    school_id: string;
    program: string;
    thesis_title: string;
    defense_type: string;
    defense_adviser?: string;
    adviser?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    reference_no?: string;
    // ...other fields
};

type EndorsementForm = {
    date: string;
    chairperson: string;
    panelist1: string;
    panelist2: string;
    panelist3: string;
    panelist4: string;
    modeDefense: string;
};

type Props = {
    request: DefenseRequirement;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function EndorseDefenseDialog({ request, open, onOpenChange }: Props) {
    const [form, setForm] = useState({
        date: '',
        modeDefense: '',
        chairperson: '',
        advisersEndorsement: null,
        recEndorsement: null,
        proofOfPayment: null,
        referenceNo: null,
    });
    const [panelists, setPanelists] = useState<string[]>(['']);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [success, setSuccess] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handlePanelistChange(idx: number, value: string) {
        setPanelists(arr => arr.map((p, i) => (i === idx ? value : p)));
    }

    function addPanelist() {
        if (panelists.length < 4) setPanelists(arr => [...arr, '']);
    }

    async function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();

        if (
            !form.date ||
            !form.modeDefense ||
            !form.chairperson ||
            !panelists[0]
        ) {
            alert('Please fill out all required fields.');
            return;
        }

        const payload = {
            firstName: request.first_name,
            middleName: request.middle_name || '',
            lastName: request.last_name,
            schoolId: request.school_id,
            program: request.program,
            thesisTitle: request.thesis_title,
            date: form.date,
            modeDefense: form.modeDefense,
            defenseType: request.defense_type,
            defenseAdviser: request.defense_adviser || request.adviser || '',
            defenseChairperson: form.chairperson,
            defensePanelist1: panelists[0] || '',
            defensePanelist2: panelists[1] || '',
            defensePanelist3: panelists[2] || '',
            defensePanelist4: panelists[3] || '',
            recEndorsement: request.rec_endorsement || '',
            proofOfPayment: request.proof_of_payment || '',
            referenceNo: request.reference_no || '',
        };

        try {
            await axios.post('/defense-request', payload);
            setSuccess(true);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                alert('Failed to submit endorsement: ' + JSON.stringify(err.response.data));
            } else {
                alert('Failed to submit endorsement.');
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                    <DialogTitle>Endorse Defense Request</DialogTitle>
                    <DialogDescription>
                        Fill out the schedule and panel details for this defense.
                    </DialogDescription>
                </DialogHeader>
                {success ? (
                    <div className="flex flex-col items-center gap-6 py-12">
                        <Check size={48} className="text-green-500" />
                        <div className="text-lg font-semibold">Endorsement Submitted!</div>
                        <Button onClick={() => onOpenChange(false)}>Done</Button>
                    </div>
                ) : (
                    <form id="endorse-defense-form" onSubmit={handleSubmit}>
                        <div className="max-h-[60vh] overflow-auto space-y-4 py-4 px-2">
                            <div>
                                <Label className="mb-1 block text-sm">Date of Defense</Label>
                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full justify-between h-9 text-sm px-3"
                                        >
                                            {selectedDate
                                                ? format(selectedDate, 'PPP')
                                                : 'Select date'}
                                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent side="bottom" align="start" sideOffset={4} className="pointer-events-auto z-50 w-auto p-0">
                                        <div onClick={e => e.stopPropagation()}>
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={date => {
                                                    setSelectedDate(date || undefined);
                                                    setForm(f => ({
                                                        ...f,
                                                        date: date ? format(date, 'yyyy-MM-dd') : ''
                                                    }));
                                                    setDatePickerOpen(false);
                                                }}
                                                captionLayout="dropdown"
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label className="mb-1 block text-sm">Mode of Defense</Label>
                                <Select
                                    value={form.modeDefense}
                                    onValueChange={value => setForm(f => ({ ...f, modeDefense: value }))}
                                    required
                                    name="modeDefense"
                                >
                                    <SelectTrigger className="w-full h-9 text-sm px-3" aria-label="Mode of Defense">
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Face-to-face">Face-to-face</SelectItem>
                                        <SelectItem value="Online">Online</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-sm">Chairperson</Label>
                                <Input
                                    name="chairperson"
                                    value={form.chairperson}
                                    onChange={handleChange}
                                    required
                                    placeholder="Chairperson"
                                    className="h-9 text-sm px-3"
                                />
                            </div>
                            {/* Dynamic Panelists */}
                            <div>
                                <div className="flex items-center justify-between mb-1 w-full">
                                    <Label className="mb-1 block text-sm">Panelists</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={addPanelist}
                                        disabled={panelists.length >= 4}
                                        aria-label="Add Panelist"
                                    >
                                        <ChevronsUpDown className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {panelists.map((value, idx) => (
                                        <Input
                                            key={idx}
                                            name={`panelist${idx + 1}`}
                                            value={value}
                                            onChange={e => handlePanelistChange(idx, e.target.value)}
                                            required={idx < 2}
                                            placeholder={`Panelist ${idx + 1}${idx > 1 ? "" : ""}`}
                                            className="h-9 text-sm px-3"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                type="submit"
                                form="endorse-defense-form"
                                className="bg-rose-500 text-white h-9 text-sm px-6"
                            >
                                Submit Endorsement
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}