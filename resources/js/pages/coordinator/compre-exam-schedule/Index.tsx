import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Check,
  Clock,
  FilePlus2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Toaster, toast } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* ======================= Types ======================= */

type Offering = {
  id: number;
  program: string;
  school_year: string;
  subject_code: string | null;
  subject_name: string;
  exam_date: string | null;
  start_time: string | null;
  end_time: string | null;
  proctor?: string | null;
  venue?: string | null;        // added back
  is_active: boolean;
};

type PageProps = {
  programs: string[];
  currentProgram?: string | null;
  schoolYears?: string[]; // optional; page will generate if absent
};

/* ======================= Preset subjects per program (IT-focused) ======================= */
const SUBJECT_PRESETS: Record<string, { code?: string; name: string }[]> = {
  // --- Master in Information Systems (MIS) ---
  'Master in Information Systems': [
    { code: 'MIS 001',  name: 'Organization, Management, Administration of IS (Core)' },
    { code: 'MIS 002',  name: 'IT Project and Change Management (Core)' },
    { code: 'MIS 003',  name: 'Advanced Accounting/Finance/Economics/ Business Systems (Core)' },
    { code: 'MIS 005',  name: 'Policy and Strategy (Core)' },
    { code: 'MISS 001', name: 'IS Strategy and Governance (Specialization)' },
    { code: 'MISS 002', name: 'Data Mining (Specialization)' },
    { code: 'MISS 003', name: 'IT-Enabled Business (Specialization)' },
    { code: 'MISS 004', name: 'IS Management and Operations (Specialization)' },
    { code: 'MISS 005', name: 'Total Quality Management (Specialization)' },
    { code: 'MISS 006', name: 'Service System Engineering (Specialization)' },
  ],

  // --- Master in Information Technology (MIT) ---
  'Master in Information Technology': [
    { code: 'MIT 001',  name: 'Advanced Operating System and Networking (Foundation)' },
    { code: 'MIT 002',  name: 'Advanced Database Systems (Foundation)' },
    { code: 'MIT 003',  name: 'Advanced Systems Design and Implementation (Foundation)' },
    { code: 'MIT 004',  name: 'Technology and Project Management (Foundation)' },
    { code: 'MITS 001', name: 'Machine Learning (Specialization)' },
    { code: 'MITS 002', name: 'Data Mining (Specialization)' },
    { code: 'MITS 003', name: 'Computer Vision (Specialization)' },
    { code: 'MITS 004', name: 'Cybersecurity Emerging Technologies (Specialization)' },
    { code: 'MITS 005', name: 'Internet of Things (Specialization)' },
    { code: 'MITS 006', name: 'Mobile Programming (Specialization)' },
  ],

  // --- MA in Education (Information Technology Integration) ---
  'Master of Arts in Education major in Information Technology Integration': [
    { code: 'EDUC 201',    name: 'Philosophical & Psychological Foundations of Education (Foundation)' },
    { code: 'EDUC 202A',   name: 'Research Methods 1 (Foundation)' },
    { code: 'MAEDITI 002', name: 'Learning Theories and Models for Technology in Education (Major)' },
    { code: 'EDUC 202B',   name: 'Research Methods 2 (Foundation)' },
    { code: 'MAEDITI 001', name: 'Assessment and Evaluation Using Technology (Major)' },
    { code: 'MAEDITI 007', name: 'Teaching Information Technology (Cognate)' },
    { code: 'MAEDITI 003', name: 'Information Technology Trends and Directions (Major)' },
    { code: 'MAEDITI 005', name: 'Human Computer Interaction (Cognate)' },
    { code: 'MAEDITI 008', name: 'Data Analytics (Cognate)' },
  ],

    'Doctor in Business Management with specialization in Information Systems': [
    // --- Pre-Requisites ---
    { code: 'Pre-Requisite 1', name: 'Principles of Management or Information System Fundamentals' },
    { code: 'Pre-Requisite 2', name: 'Accounting and Financial Management or Programming with Object Structures' },

    // --- Year 1 ---
    { code: 'DBM 602',   name: 'Quantitative Research (Foundation)' },
    { code: 'DBM 604',   name: 'Qualitative Research (Foundation)' },
    { code: 'DBMIS 601', name: 'Knowledge Management (Major)' },
    { code: 'DBMIS 603', name: 'Technopreneurship and IT Innovational Management (Major)' },
    { code: 'DBM 601',   name: 'Good Governance and Corporate Social Responsibility (Foundation)' },
    { code: 'DBM 603',   name: 'Advanced Leadership Theory and Practices (Foundation)' },

    // --- Year 2 ---
    { code: 'DBM 608',   name: 'Advanced Financial Management (Major)' },
    { code: 'DBMIS 604', name: 'IS Project and Change Management (Major)' },
    { code: 'DBMIS 606', name: 'Advanced Management Information System (Major)' },
    { code: 'DBMIS 609', name: 'Managing Networks and Distributed System (Specialization)' },
    { code: 'DBMIS 610', name: 'Business Analytics and Data Mining (Specialization)' },
    ],

    'Doctor of Philosophy in Education major in Information Technology Integration': [
    { code: 'PHDITI 601', name: 'Applied Philosophy of Education (Foundation)' },
    { code: 'PHDITI 602', name: 'Applications of Quantitative Research in Education (Foundation)' },
    { code: 'PHDITI 603', name: 'Qualitative Research in Information Technology Integration (Required)' },
    { code: 'PHDITI 604', name: 'Application of Learning Analytics in Instructional Designs (Major)' },
    { code: 'PHDITI 605', name: 'Digital Citizenship (Major)' },
    { code: 'PHDITI 606', name: 'Applications of Artificial Intelligence in Education (Major)' },
    { code: 'PHDITI 607', name: 'Comparative Strategic Management for Educational Leadership (Required)' },
    { code: 'PHDITI 608', name: 'Advanced Educational Statistics with Computer Applications (Required)' },
    { code: 'PHDITI 609', name: 'Applications of Mixed Methods Research and Other Designs in Education (Foundation)' },
    { code: 'PHDITI 610', name: 'Applied Emerging Technologies in Education (Major)' },
    { code: 'PHDITI 611', name: 'Competitive Strategies in Technology Acquisition, Management, and Evaluation (Major)' },
    ],
};

/* ======================= Page ======================= */

export default function CoordinatorCompreExamScheduleIndex() {
  const { props } = usePage<PageProps>();

  // Use only coordinator's programs from server
  const programs = useMemo(
    () => (Array.isArray(props.programs) ? props.programs.filter(Boolean) : []),
    [props.programs]
  );
  // Display list includes an "All" option for filtering
  const displayPrograms = useMemo(() => ['All', ...programs], [programs]);

  const defaultSY = getDefaultSY();
  const syOptions = props.schoolYears?.length ? props.schoolYears : getSYOptions(4, defaultSY);

  // Search state must come before any effect that uses `dq`
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

  // URL-driven search (match Compre Payments behavior)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qs = params.get('q');
    if (qs) setQ(qs);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (dq) params.set('q', dq);
    else params.delete('q');
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [dq]);

  // --- filters
  const programOptions = useMemo(() => programs, [programs]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  // const [q, setQ] = useState('');
  // const dq = useDeferredValue(q);

  // keep program BEFORE any effects that reference it
  const [program, setProgram] = useState<string>('All');

  // ensure current program is valid if list changes
  useEffect(() => {
    // keep current selection valid; allow 'All'
    if (!['All', ...programOptions].includes(program)) {
      setProgram('All');
    }
  }, [programOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const [schoolYear, setSchoolYear] = useState<string>(
    syOptions.includes(defaultSY) ? defaultSY : (syOptions[0] || defaultSY)
  );

  // --- data
  const [rows, setRows] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(false);

  // helper to reset non-program filters
  function resetFilters() {
    // Program -> All, SY -> current default, Status -> All, Search -> empty
    setProgram('All');
    setSchoolYear(defaultSY);
    setStatusFilter('all');
    setQ('');
  }

  // --- dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [form, setForm] = useState<Partial<Offering>>({
    program: '',
    school_year: '',
    subject_code: '',
    subject_name: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    proctor: '',
    venue: '',                    // added
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // --- delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Offering | null>(null);

  /* ------------------ Load offerings (JSON API) ------------------ */
  useEffect(() => {
    if (!schoolYear) { setRows([]); return; }
    setLoading(true);
    const url =
      (window as any).route?.('api.exam-subject-offerings.index') ||
      '/api/exam-subject-offerings';

    async function fetchFor(prog: string): Promise<Offering[]> {
      const qs = new URLSearchParams({ program: prog, school_year: schoolYear, _ts: String(Date.now()) }).toString();
      try {
        const r = await fetch(`${url}?${qs}`, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        try { return await r.json(); } catch { return []; }
      } catch {
        return [];
      }
    }

    (async () => {
      let lists: Offering[] = [];
      if (program === 'All') {
        // fetch for each actual program and merge
        const uniqueProgs = Array.from(new Set(programOptions)).filter(Boolean);
        const chunks = await Promise.all(uniqueProgs.map(p => fetchFor(p)));
        lists = chunks.flat();
      } else {
        lists = await fetchFor(program);
      }
      setRows(Array.isArray(lists) ? normalizeRows(dedupeById(lists)) : []);
      setLoading(false);
    })();
  }, [program, schoolYear, programOptions]);

  // ------------------ Derivations ------------------

  const filtered = useMemo(() => {
    const s = (dq || '').toLowerCase().trim();
    let list = rows;
    if (statusFilter === 'active') list = list.filter(r => !!r.is_active);
    if (statusFilter === 'inactive') list = list.filter(r => !r.is_active);
  // Removed scheduleTab filter (All/Scheduled/Unscheduled)
    if (!s) return sortRows(list);
    return sortRows(
      list.filter(r =>
        [
          r.subject_code || '',
          r.subject_name || '',
          r.program || '',
          r.school_year || '',
          r.exam_date || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(s),
      ),
    );
  }, [rows, dq, statusFilter]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => setPage(1), [dq, statusFilter, rows]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const kpis = useMemo(() => {
    const totalAll = rows.length;
    const active = rows.filter(r => r.is_active).length;
    const scheduled = rows.filter(r => !!r.exam_date).length;
    const unscheduled = totalAll - scheduled;
    return { totalAll, active, scheduled, unscheduled };
  }, [rows]);

  /* ------------------ Handlers ------------------ */

  function openCreate() {
    const presets = SUBJECT_PRESETS[program] ?? [];
    const first = presets[0];
    setEditing(null);
    setServerErrors({});
    setForm({
      program: program === 'All' ? (programOptions[0] || '') : (program || ''),
      school_year: schoolYear || '',
      subject_code: first?.code ?? '',
      subject_name: first?.name ?? '',
      exam_date: '',
      start_time: '',
      end_time: '',
      proctor: '',
      venue: '',                  // added
      is_active: true,
    });
    setOpen(true);
  }

  function openEdit(row: Offering) {
    setEditing(row);
    setServerErrors({});
    setForm({
        id: row.id,
        program: row.program,
        school_year: row.school_year,
        subject_code: row.subject_code || '',
        subject_name: row.subject_name || '',
        exam_date: row.exam_date || '',
        start_time: toHHmm(row.start_time),
        end_time: toHHmm(row.end_time),
    proctor: row.proctor || '',
        venue: row.venue || '',             // <-- add this
        is_active: !!row.is_active,
    });
    setOpen(true);
    }


  function closeDialog(force = false) {
    if (submitting && !force) return;
    setOpen(false);
    setEditing(null);
    setServerErrors({});
  }

  function onFormChange<K extends keyof Offering>(key: K, value: Offering[K] | string | boolean) {
    setForm(prev => ({ ...prev, [key]: value as any }));
  }

  async function save() {
    if (!isFormValid || submitting) return;
    setServerErrors({});

    const payload: any = {
      id: editing?.id,
      program: (form.program || program),
      school_year: (form.school_year || schoolYear),
      subject_code: emptyToNull(form.subject_code),
      subject_name: String(form.subject_name).trim(),
      exam_date: emptyToNull(form.exam_date),
      start_time: emptyToNull(toHHmm(form.start_time || '')),
      end_time: emptyToNull(toHHmm(form.end_time || '')),
      proctor: emptyToNull(form.proctor),
      venue: emptyToNull(form.venue),
      is_active: !!form.is_active,
    };

    setSubmitting(true);
    const id = editing?.id;
    const url = id
      ? (safeRoute('coordinator.compre-exam-schedule.offerings.update', { offering: id }) || `/coordinator/compre-exam-schedule/offerings/${id}`)
      : (safeRoute('coordinator.compre-exam-schedule.offerings.store') || '/coordinator/compre-exam-schedule/offerings');
    const method = id ? 'PUT' : 'POST';

    try {
      const r = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (r.ok) {
        const msg = editing ? 'Saved changes' : 'Posted schedule';
        const desc = `${payload.subject_name || ''} • ${payload.program} • ${payload.school_year}`;
        toast.success(msg, { description: desc });
        closeDialog();
        refresh();
        return;
      }

      let json: any = null;
      try { json = await r.json(); } catch { /* ignore */ }
      const status = r.status;
      if (status === 422 && json) {
        const errs: Record<string, string[]> = {};
        if (json.errors && typeof json.errors === 'object') {
          for (const [k, v] of Object.entries(json.errors)) {
            if (Array.isArray(v)) errs[k] = v.map(String);
            else if (typeof v === 'string') errs[k] = [v];
          }
        }
        setServerErrors(errs);
        const firstErr = Object.values(errs)[0]?.[0] || json.message || 'Validation error';
        toast.error('Cannot save schedule', { description: firstErr });
        return; // keep dialog open so inline errors show
      }

      const text = json?.message || (await safeText(r)) || `Request failed (${status})`;
      toast.error('Failed to save schedule', { description: text });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save schedule', { description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function openDelete(row: Offering) {
    setDeleteTarget(row);
    setDeleteOpen(true);
  }
  function closeDelete() {
    if (submitting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }
  async function doDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    const zig = (window as any).route;
    const url = zig
      ? zig('coordinator.compre-exam-schedule.offerings.destroy', { offering: deleteTarget.id })
      : `/coordinator/compre-exam-schedule/offerings/${deleteTarget.id}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': getCsrfToken(),
        },
        credentials: 'same-origin',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Optimistically update UI immediately
      setRows(prev => prev.filter(r => r.id !== deleteTarget.id));

      toast.success('Deleted schedule', {
        description: `${deleteTarget.subject_name} • ${deleteTarget.program} • ${deleteTarget.school_year}`,
      });

      closeDelete();
      // Re-sync with server to be safe (in case of cross-program effects)
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete schedule');
    } finally {
      setSubmitting(false);
    }
  }

  // Optional helper used elsewhere
  function remove(row: Offering) {
    if (!confirm(`Delete ${row.subject_code ? row.subject_code + ' — ' : ''}${row.subject_name}?`)) return;
    setSubmitting(true);
    const zig = (window as any).route;
    const url = zig
      ? zig('coordinator.compre-exam-schedule.offerings.destroy', { offering: row.id })
      : `/coordinator/compre-exam-schedule/offerings/${row.id}`;

    fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': getCsrfToken(),
      },
      credentials: 'same-origin',
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        // Optimistically update list
        setRows(prev => prev.filter(it => it.id !== row.id));
        toast.success('Deleted schedule', {
          description: `${row.subject_name} • ${row.program} • ${row.school_year}`,
        });
        refresh();
      })
      .catch((e) => {
        console.error(e);
        toast.error('Failed to delete schedule');
      })
      .finally(() => setSubmitting(false));
  }

  function refresh() {
    const url =
      (window as any).route?.('api.exam-subject-offerings.index') ||
      '/api/exam-subject-offerings';

    // Helper to fetch for a specific program value
    const fetchFor = async (prog: string): Promise<Offering[]> => {
      const qs = new URLSearchParams({ program: prog, school_year: schoolYear, _ts: String(Date.now()) }).toString();
      try {
        const r = await fetch(`${url}?${qs}`, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        try { return await r.json(); } catch { return []; }
      } catch {
        return [];
      }
    };

    (async () => {
      try {
        let lists: Offering[] = [];
        if (program === 'All') {
          const uniqueProgs = Array.from(new Set(programOptions)).filter(Boolean);
          const chunks = await Promise.all(uniqueProgs.map(p => fetchFor(p)));
          lists = chunks.flat();
        } else {
          lists = await fetchFor(program);
        }
        setRows(Array.isArray(lists) ? normalizeRows(dedupeById(lists)) : []);
      } finally {
        setSubmitting(false);
      }
    })();
  }

  // Suggestions based on selected program in form (fallback to page program)
  const subjectSuggestions = React.useMemo(() => {
    const effProg = String(form.program || (program === 'All' ? (programOptions[0] || '') : program));
    const key = effProg;
    return SUBJECT_PRESETS[key] || [];
  }, [form.program, program, programOptions]);

  // Effective context for validations
  const effectiveProgram = String(form.program || (program === 'All' ? (programOptions[0] || '') : program));
  const effectiveSY = String(form.school_year || schoolYear);
  const selectedExamYMD = String(form.exam_date || '');

  // Duplicate prevention: same program + school year + subject (matches backend unique index)
  const duplicateConflict = useMemo(() => {
    if (!effectiveProgram || !effectiveSY) return false;
    const subjCode = String(form.subject_code || '').trim().toLowerCase();
    const subjName = String(form.subject_name || '').trim().toLowerCase();
    if (!subjName && !subjCode) return false;
    return rows.some(r => {
      if (!r) return false;
      if (editing && r.id === editing.id) return false;
      const rCode = String(r.subject_code || '').trim().toLowerCase();
      const rName = String(r.subject_name || '').trim().toLowerCase();
      const sameSubject = (subjCode && rCode && subjCode === rCode) || (!subjCode && rName === subjName);
      return (
        r.program === effectiveProgram &&
        r.school_year === effectiveSY &&
        sameSubject
      );
    });
  }, [rows, editing, effectiveProgram, effectiveSY, form.subject_code, form.subject_name]);

  // Venue overlap prevention: same venue, same date, overlapping times (any subject)
  const venueConflict = useMemo(() => {
    const venue = String(form.venue || '').trim().toLowerCase();
    if (!venue || !selectedExamYMD) return false;
    const st = toHHmm(form.start_time || '');
    const et = toHHmm(form.end_time || '');
    if (!st || !et) return false;
    const aStart = hhmmToMinutes(st);
    const aEnd = hhmmToMinutes(et);
    if (!(aStart < aEnd)) return false; // invalid/empty time handled elsewhere
    return rows.some(r => {
      if (!r) return false;
      if (editing && r.id === editing.id) return false;
      const rVenue = String(r.venue || '').trim().toLowerCase();
      if (!rVenue || rVenue !== venue) return false;
      if (r.exam_date !== selectedExamYMD) return false;
      const bStart = hhmmToMinutes(toHHmm(r.start_time));
      const bEnd = hhmmToMinutes(toHHmm(r.end_time));
      return timesOverlap(aStart, aEnd, bStart, bEnd);
    });
  }, [rows, editing, form.venue, selectedExamYMD, form.start_time, form.end_time]);

  const isFormValid = useMemo(() => {
    const prog = String((form.program ?? '') || program).trim();
    const sy = String((form.school_year ?? '') || schoolYear).trim();
    const name = String(form.subject_name ?? '').trim();
    const proctorName = String(form.proctor ?? '').trim();
    const syOk = /^\d{4}-\d{4}$/.test(sy);
    // time ordering: if both provided, end must be after start
    const st = toHHmm(form.start_time || '');
    const et = toHHmm(form.end_time || '');
    const bothTimes = !!(st && et);
    const invalidTime = bothTimes && hhmmToMinutes(et)! <= hhmmToMinutes(st)!;
    // date must not be in the past (if provided)
    const invalidDate = (() => {
      const ymd = String(form.exam_date || '');
      if (!ymd) return false;
      const d = toDate(ymd);
      if (!d) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      return d < today;
    })();
    // Duplicate and venue conflicts block save
    return !!(prog && syOk && name && proctorName) && !invalidTime && !invalidDate && !duplicateConflict && !venueConflict;
    }, [form.program, form.school_year, form.subject_name, form.start_time, form.end_time, form.exam_date, form.proctor, program, schoolYear, duplicateConflict, venueConflict]);

  // Helper to apply a suggestion
  function applySuggestion(val: string) {
    // value is encoded as `${code ?? ''}|${name}`
    const [code, ...rest] = val.split('|');
    const name = rest.join('|');
    onFormChange('subject_code', code || '');
    onFormChange('subject_name', name);
  }

  // helper for Calendar <-> string
  function setExamDate(d?: Date) {
    onFormChange('exam_date', d ? toYMD(d) : '');
  }

  // subjects for currently selected program (in form if set, otherwise page program)
  const programSubjects = React.useMemo(() => {
    const effProg = String(form.program || (program === 'All' ? (programOptions[0] || '') : program));
    const key = effProg;
    return SUBJECT_PRESETS[key] || [];
  }, [form.program, program, programOptions]);

  // keep subject dropdown value in sync with current form values
  const selectedSubjectName = React.useMemo(() => form.subject_name || '', [form.subject_name]);

  // Ensure the current subject (when editing) appears in the list even if not in presets
  const subjectOptions = React.useMemo(() => {
    const list = [...programSubjects];
    if (selectedSubjectName && !list.some(s => s.name === selectedSubjectName)) {
      list.unshift({ name: selectedSubjectName, code: form.subject_code || undefined });
    }
    return list;
  }, [programSubjects, selectedSubjectName, form.subject_code]);
  
  function onSelectSubjectName(name: string) {
    const found = subjectOptions.find(s => s.name === name);
    onFormChange('subject_name', name);
    onFormChange('subject_code', found?.code ?? '');
  }

  // When dialog opens and subject is empty, auto-pick first preset for selected program
  useEffect(() => {
    if (!open) return;
    const key = String(form.program || program);
    const presets = SUBJECT_PRESETS[key] ?? [];
    if (!form.subject_name && presets.length) {
      setForm(f => ({ ...f, subject_name: presets[0].name, subject_code: presets[0].code ?? '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.program, program]);

  /* ------------------ UI ------------------ */
  // Derived UI state for time validation
  const startHHmm = toHHmm(form.start_time || '');
  const endHHmm = toHHmm(form.end_time || '');
  const timeOrderInvalid = !!(startHHmm && endHHmm) && hhmmToMinutes(endHHmm)! <= hhmmToMinutes(startHHmm)!;
  // Derived UI state for date validation
  const examDateInvalid = (() => {
    const ymd = String(form.exam_date || '');
    if (!ymd) return false;
    const d = toDate(ymd);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  })();

  // Note: duplicateConflict and venueConflict defined earlier above isFormValid

  return (
    <AppLayout>
      <Head title="Coordinator • Compre Exam Schedules" />
      <Toaster position="bottom-right" duration={5000} richColors closeButton />
      <div className="px-7 pt-5 pb-6">
  {/* Title + Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <CalendarDays className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                Comprehensive Exam Schedules
              </div>
              <div className="hidden md:block text-xs text-muted-foreground truncate">
                Post and manage exam schedules per program and school year.
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subject, code, program…"
              className="pl-8 h-9"
              aria-label="Search schedules"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          </div>

        </div>

        {/* Secondary toolbar: Program, SY, Status, Clear/Add */}
        <div className="mt-3 flex flex-wrap items-end gap-3 justify-between">
          {/* Left compact filters */}
          <div className="flex items-end gap-3">
            <div className="min-w-0 w-56">
              <Label className="text-xs text-muted-foreground">Program</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger
                  className="h-9 mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={program}
                >
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent className="max-h-72 w-[min(28rem,calc(100vw-2rem))]">
                  {displayPrograms.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="whitespace-normal break-words text-sm leading-snug py-2"
                      title={p}
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="text-xs text-muted-foreground">School Year</Label>
              <Select value={schoolYear} onValueChange={setSchoolYear}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="YYYY-YYYY" /></SelectTrigger>
                <SelectContent>
                  {syOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" className="h-9" onClick={resetFilters}>Clear</Button>
            <Button type="button" onClick={openCreate} className="h-9"><Plus className="h-4 w-4 mr-1" /> Add schedule</Button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white rounded-md border">
          <ScrollArea className="w-full">
            <Table className="text-sm">
              <TableHeader className="bg-zinc-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[14%]">Subject Code</TableHead>
                  <TableHead className="w-[28%]">Subject Name</TableHead>
                  <TableHead className="w-[14%]">Exam Date</TableHead>
                  <TableHead className="w-[12%]">Start</TableHead>
                  <TableHead className="w-[12%]">End</TableHead>
                  <TableHead className="w-[14%]">Proctor</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-zinc-500 py-6">Loading…</TableCell>
                  </TableRow>
                )}

                {!loading && pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-zinc-500 py-10 text-center">
                      No offerings found. Try a different filter or add one.
                    </TableCell>
                  </TableRow>
                )}

                {!loading && pageItems.map((r) => (
                  <TableRow key={r.id} className="hover:bg-zinc-50/60">
                    <TableCell className="font-mono">{r.subject_code || '—'}</TableCell>
                    <TableCell>
                      <span className="block whitespace-normal break-words">{r.subject_name}</span>
                    </TableCell>
                    <TableCell>{r.exam_date ? fmtDate(r.exam_date) : <span className="text-zinc-400">—</span>}</TableCell>
                    <TableCell>{r.start_time ? fmtTime(r.start_time) : <span className="text-zinc-400">—</span>}</TableCell>
                    <TableCell>{r.end_time ? fmtTime(r.end_time) : <span className="text-zinc-400">—</span>}</TableCell>
                    <TableCell>{r.proctor ? <span className="block whitespace-normal break-words">{r.proctor}</span> : <span className="text-zinc-400">TBA</span>}</TableCell>
                    <TableCell>
                      {r.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(r)} aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-rose-600"
                              onClick={() => openDelete(r)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Footer pagination (shadcn Pagination) */}
          <div className="px-3 py-2 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Showing {total} offering{total === 1 ? '' : 's'}</div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className="cursor-pointer"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page <= 1}
                  />
                </PaginationItem>
                <div className="text-xs text-muted-foreground px-2 self-center">Page {page} of {totalPages}</div>
                <PaginationItem>
                  <PaginationNext
                    className="cursor-pointer"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>

        {/* Create/Edit dialog */}
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
          <DialogContent
            className="sm:max-w-xl w-[min(96vw,720px)] overflow-x-hidden"
            onOpenAutoFocus={(e) => e.preventDefault()} // avoid unexpected auto-focus shifting
            onCloseAutoFocus={(e) => e.preventDefault()} // avoid focus restore loop to a removed trigger
          >
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit offering' : 'Add offering'}</DialogTitle>
              {/* Provide an accessible description to satisfy Radix a11y warning */}
              <DialogDescription className="sr-only">
                {editing
                  ? 'Update the comprehensive exam offering details and save your changes.'
                  : 'Fill out the comprehensive exam offering details and post the schedule.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Program */}
              <div className="sm:col-span-2 min-w-0">
                <Label className="text-xs text-muted-foreground">Program</Label>
                <Select
                  value={String(form.program || program)}
                  onValueChange={(v) => {
                    onFormChange('program', v);
                    // reset subject when program changes
                    onFormChange('subject_name', '');
                    onFormChange('subject_code', '');
                  }}
                >
                  <SelectTrigger
                    className="h-9 mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap"
                    title={String(form.program || program)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 w-[min(28rem,calc(100vw-2rem))]">
                    {programs.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="whitespace-normal break-words text-sm leading-snug py-2"
                        title={p}
                      >
                        {p}
                      </SelectItem>
                    ))}
                   </SelectContent>
                 </Select>
              </div>

              {/* School Year */}
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">School Year</Label>
                <Select
                  value={String(form.school_year || schoolYear)}
                  onValueChange={(v) => onFormChange('school_year', v)}
                >
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {syOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Name dropdown (auto-fills code) */}
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Subject Name</Label>
                <Select
                  value={selectedSubjectName}
                  onValueChange={onSelectSubjectName}
                  disabled={subjectOptions.length === 0}
                >
                  <SelectTrigger className="h-9 mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    <SelectValue placeholder={subjectOptions.length ? 'Select subject' : 'No subjects'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 w-[min(28rem,calc(100vw-2rem))]">
                    {subjectOptions.map((s, i) => (
                      <SelectItem
                        key={`${s.name}-${i}`}
                        value={s.name}
                        className="whitespace-normal break-words text-sm leading-snug py-2"
                        title={s.name}
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Code (auto-filled, but editable) */}
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Subject Code</Label>
                <Input
                  className="mt-1 h-9"
                  value={form.subject_code || ''}
                  onChange={(e) => onFormChange('subject_code', e.target.value)}
                  placeholder="Auto-filled"
                  readOnly
                />
              </div>

              {/* Exam Date (keep clickable) */}
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Exam Date</Label>
                <Popover modal={false} open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`mt-1 h-9 w-full justify-start ${examDateInvalid ? 'border-rose-300 focus-visible:ring-rose-500' : ''}`}
                      aria-invalid={examDateInvalid}
                    >
                      {form.exam_date ? fmtDate(form.exam_date) : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 z-50 pointer-events-auto" align="start" side="bottom">
                    <Calendar
                      mode="single"
                      selected={form.exam_date ? toDate(form.exam_date) : undefined}
                      onSelect={(d) => {
                        onFormChange('exam_date', d ? toYMD(d) : '');
                        setDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {examDateInvalid && (
                  <p className="mt-1 text-xs text-rose-600">Exam date cannot be in the past.</p>
                )}
              </div>

              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Start Time</Label>
                <Input
                  type="time"
                  className={`mt-1 h-9 ${timeOrderInvalid ? 'border-rose-300 focus-visible:ring-rose-500' : ''}`}
                  aria-invalid={timeOrderInvalid}
                  value={toHHmm(form.start_time || '')}
                  onChange={(e) => onFormChange('start_time', e.target.value)}
                />
              </div>

              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">End Time</Label>
                <Input
                  type="time"
                  className={`mt-1 h-9 ${(timeOrderInvalid || duplicateConflict) ? 'border-rose-300 focus-visible:ring-rose-500' : ''}`}
                  aria-invalid={timeOrderInvalid || duplicateConflict}
                  value={toHHmm(form.end_time || '')}
                  onChange={(e) => onFormChange('end_time', e.target.value)}
                />
                {timeOrderInvalid && (
                  <p className="mt-1 text-xs text-rose-600">End time must be after start time.</p>
                )}
                {!timeOrderInvalid && duplicateConflict && (
                  <p className="mt-1 text-xs text-rose-600">A schedule for this subject already exists on the selected date/time.</p>
                )}
                {serverErrors.start_time && serverErrors.start_time.map((m, i) => (
                  <p key={`st-${i}`} className="mt-1 text-xs text-rose-600">{m}</p>
                ))}
                {serverErrors.end_time && serverErrors.end_time.map((m, i) => (
                  <p key={`et-${i}`} className="mt-1 text-xs text-rose-600">{m}</p>
                ))}
              </div>

              {/* Proctor (required) */}
              <div className="sm:col-span-2 min-w-0">
                  <Label className="text-xs text-muted-foreground">Proctor</Label>
                  <Input
                    className={`mt-1 h-9 ${!String(form.proctor || '').trim() ? 'border-rose-300 focus-visible:ring-rose-500' : ''}`}
                    aria-invalid={!String(form.proctor || '').trim()}
                    required
                    value={form.proctor || ''}
                    onChange={(e) => onFormChange('proctor', e.target.value)}
                    placeholder="e.g., Prof. Jane Doe"
                  />
                  {!String(form.proctor || '').trim() && (
                    <p className="mt-1 text-xs text-rose-600">Proctor is required.</p>
                  )}
                  {serverErrors.proctor && serverErrors.proctor.map((m, i) => (
                    <p key={`proctor-${i}`} className="mt-1 text-xs text-rose-600">{m}</p>
                  ))}
              </div>

            <div className="sm:col-span-2 min-w-0">
                <Label className="text-xs text-muted-foreground">Venue (optional)</Label>
                <Input
                  className={`mt-1 h-9 ${venueConflict ? 'border-rose-300 focus-visible:ring-rose-500' : ''}`}
                  aria-invalid={venueConflict}
                  value={form.venue || ''}
                  onChange={(e) => onFormChange('venue', e.target.value)}
                  placeholder="e.g., Room 204, Lab A"
                />
                {venueConflict && (
                  <p className="mt-1 text-xs text-rose-600">This venue is already booked at the selected date/time.</p>
                )}
                {serverErrors.venue && serverErrors.venue.map((m, i) => (
                  <p key={`venue-${i}`} className="mt-1 text-xs text-rose-600">{m}</p>
                ))}
              </div>
            </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <Switch id="active" checked={!!form.is_active} onCheckedChange={(v) => onFormChange('is_active', v)} />
                <Label htmlFor="active" className="text-sm">Active</Label>
              </div>

              {/* Venue (optional) */}
             

            {/* Footer */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" onClick={save} disabled={submitting || !isFormValid} className="pointer-events-auto">
                {editing ? 'Save changes' : 'Post schedule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={(o) => (o ? setDeleteOpen(true) : closeDelete())}>
          <AlertDialogContent className="border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-rose-800 dark:text-rose-200">Delete offering?</AlertDialogTitle>
              <AlertDialogDescription className="text-rose-700 dark:text-rose-300">
                {deleteTarget ? (
                  <>
                    This action cannot be undone. This will permanently delete
                    the schedule for{' '}
                    <strong className="text-rose-900 dark:text-rose-100">
                      {deleteTarget.subject_code ? `${deleteTarget.subject_code} — ` : ''}{deleteTarget.subject_name}
                    </strong>
                    {' '}in <strong className="text-rose-900 dark:text-rose-100">{deleteTarget.program}</strong> • <strong className="text-rose-900 dark:text-rose-100">{deleteTarget.school_year}</strong>.
                  </>
                ) : 'This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={submitting}
                onClick={closeDelete}
                className="bg-white text-rose-700 hover:bg-rose-100 border-rose-300"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-rose-600 hover:bg-rose-700 text-white shadow"
                onClick={doDelete}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

/* ======================= Small Components ======================= */

function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* ======================= Helpers ======================= */

function getDefaultSY(): string {
  const now = new Date();
  const y = now.getFullYear();
  // Academic year typically starts mid-year (June). Adjust if school uses different cutoff.
  const from = now.getMonth() >= 5 ? y : y - 1;
  return `${from}-${from + 1}`;
}

function getSYOptions(nYears: number, anchorSY = getDefaultSY()): string[] {
  // produce nYears options around the anchor (current first, then neighbors)
  const [fromStr] = anchorSY.split('-');
  const from = Number(fromStr) || new Date().getFullYear();
  const out: string[] = [];
  for (let i = 0; i < nYears; i++) {
    const f = from - i;
    out.push(`${f}-${f + 1}`);
  }
  return out;
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function fmtTime(t?: string | null) {
  if (!t) return '';
  const [hh, mm] = toHHmm(t).split(':');
  const h = Number(hh);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr12 = ((h + 11) % 12) + 1;
  return `${hr12}:${mm} ${ampm}`;
}

function toHHmm(t?: string | null) {
  if (!t) return '';
  const parts = t.split(':');
  return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : t;
}

// Convert HH:mm to total minutes since 00:00; returns 0 for invalid but Inputs enforce valid time
function hhmmToMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return 0;
  const h = Math.max(0, Math.min(23, Number(m[1])));
  const min = Math.max(0, Math.min(59, Number(m[2])));
  return h * 60 + min;
}

// Interval overlap helper (strict overlap when ranges intersect)
function timesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  // Treat invalid intervals as non-overlapping
  if (!(aStart < aEnd) || !(bStart < bEnd)) return false;
  return aStart < bEnd && bStart < aEnd;
}

function emptyToNull(s?: string | null) {
  const v = (s ?? '').toString().trim();
  return v === '' ? null : v;
}

// Remove duplicate offerings by id while preserving order
function dedupeById(list: Offering[]): Offering[] {
  const seen = new Set<number>();
  const out: Offering[] = [];
  for (const item of list) {
    // Guard against nullish entries and ensure numeric ids per type
    if (!item || typeof item.id !== 'number') continue;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function normalizeRows(list: Offering[]): Offering[] {
  return list.map(r => ({
    ...r,
    start_time: toHHmm(r.start_time),
    end_time: toHHmm(r.end_time),
    is_active: !!r.is_active,
  }));
}

function sortRows(list: Offering[]): Offering[] {
  return [...list].sort((a, b) => {
    const an = (a.subject_name || '').toLowerCase();
    const bn = (b.subject_name || '').toLowerCase();
    if (an !== bn) return an.localeCompare(bn);
    return (a.subject_code || '').localeCompare(b.subject_code || '');
  });
}

function toDate(ymd: string): Date | undefined {
  const [y, m, d] = ymd.split('-').map((n) => Number(n));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCsrfToken(): string {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content || '';
}
async function safeText(r: Response) {
  try { return await r.text(); } catch { return ''; }
}
function safeRoute(name: string, params?: Record<string, any>): string | null {
  try {
    const Ziggy = (window as any).Ziggy;
    const routeFn = (window as any).route;
    if (!routeFn || !Ziggy?.routes || !Ziggy.routes[name]) return null;
    return routeFn(name, params);
  } catch {
    return null;
  }
}
