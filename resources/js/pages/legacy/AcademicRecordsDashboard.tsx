import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Printer } from "lucide-react";

interface SemesterOption { id: string; label: string; selected: boolean }
interface RecordRow { code: string|null; title: string|null; units: number|string|null; course_type: string|null; prelim: string|null; midterm: string|null; finals: string|null; average: string|number|null; average_var: string|number|null; units_earned: number|string|null; section: string|null; current_balance: number|string|null; rating_show: any }
interface ParsedData {
  student: { student_number: string | null; name: string | null; program: string | null };
  semesters: SemesterOption[];
  current_semester_id: string | null;
  records: RecordRow[];
  gwa: string | null;
}

const AcademicRecordsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedData | null>(null);

  const [semesterId, setSemesterId] = useState<string | undefined>(undefined);

  // For select width
  const selectRef = useRef<HTMLDivElement>(null);
  const [selectWidth, setSelectWidth] = useState<number>(180);

  const load = () => {
    setLoading(true);
    setError(null);
    const url = '/legacy/academic-records' + (semesterId ? `?semester_id=${semesterId}` : '');
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        setData(json.data as ParsedData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (semesterId !== undefined) load(); }, [semesterId]);

  // Print handler for the table
  const handlePrint = () => {
    const table = document.getElementById('academic-records-table');
    if (!table) return;
    const printWindow = window.open('', '', 'width=900,height=600');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Print Academic Records</title>');
    printWindow.document.write('<style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:6px;text-align:center;}th{text-align:center;}body{font-family:sans-serif;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Dynamically set select width based on content
  useEffect(() => {
    if (selectRef.current && data?.semesters) {
      // Find the longest label
      const longest = data.semesters.reduce((a, b) => a.label.length > b.label.length ? a : b, { label: "" } as SemesterOption);
      // Create a temporary span to measure width
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.fontSize = '16px';
      span.style.fontWeight = '400';
      span.style.padding = '8px';
      span.innerText = longest.label || "Select semester";
      document.body.appendChild(span);
      setSelectWidth(span.offsetWidth + 40); // Add padding for icon
      document.body.removeChild(span);
    }
  }, [data?.semesters]);

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto bg-white dark:bg-background">
      {/* Skeleton Loader */}
      {loading ? (
        <div className="w-full min-h-[70vh] bg-zinc-100 dark:bg-zinc-900 flex flex-col gap-4 p-0 m-0">
          {/* Top short row */}
          <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 dark:bg-zinc-800 mt-8 mx-8" />
          {/* Main rows */}
          <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
          <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800 mx-8" />
          {/* Big rectangle for dashboard body */}
          <Skeleton className="h-[500px] w-full rounded bg-zinc-300 dark:bg-zinc-800 mt-4" />
        </div>
      ) : (
        <>
          {/* Top Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={load}
                className="px-3 py-2 rounded border flex items-center gap-2 disabled:opacity-50"
                disabled={loading}
                title="Reload"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded border flex items-center gap-2"
                title="Print Table"
                disabled={loading}
              >
                <Printer size={18} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="rounded-xl border mb-4 shadow-none">
              <CardContent className="bg-red-50 text-red-700">
                Failed to load: {error} — try logging out/in if session expired.
              </CardContent>
            </Card>
          )}

          {!loading && !error && data && (
            <>
              <Card className="rounded-xl border mb-4 shadow-none w-full">
                <CardHeader>
                  <CardTitle>Student Information & Semester</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500 mb-2">Student</h2>
                    <p className="text-sm"><span className="font-semibold">School ID:</span> {data.student.student_number || '—'}</p>
                    <p className="text-sm"><span className="font-semibold">Name:</span> {data.student.name || '—'}</p>
                    <p className="text-sm"><span className="font-semibold">Program:</span> {data.student.program || '—'}</p>
                    {data.gwa && <p className="mt-2 text-sm"><span className="font-semibold">GWA:</span> {data.gwa}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <h2 className="text-sm font-medium text-gray-500 mb-2">Semester</h2>
                    <div ref={selectRef} style={{ width: selectWidth }}>
                      <Select
                        value={semesterId ?? data.current_semester_id ?? ""}
                        onValueChange={val => setSemesterId(val)}
                      >
                        <SelectTrigger className="w-full bg-gray-100 border rounded" style={{ width: selectWidth }}>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {data.semesters.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select a semester to reload real grades.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border shadow-none w-full">
                <CardHeader>
                  <CardTitle>Courses</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <span className="text-lg font-semibold">Courses</span>
                    <span className="text-xs text-gray-500">{data.records.length} rows</span>
                  </div>
                  {data.records.length === 0 ? (
                    <div className="text-sm text-gray-500">No records returned for this semester.</div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <Table id="academic-records-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Units</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Prelim</TableHead>
                            <TableHead>Midterm</TableHead>
                            <TableHead>Finals</TableHead>
                            <TableHead>Average</TableHead>
                            <TableHead>Units Earned</TableHead>
                            <TableHead>Section</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.records.map((r, i) => {
                            const avg = r.average || r.average_var || '';
                            return (
                              <TableRow key={i} className="hover:bg-gray-50">
                                <TableCell>{r.code}</TableCell>
                                <TableCell>{r.title}</TableCell>
                                <TableCell className="text-center">{r.units}</TableCell>
                                <TableCell className="text-center">{r.course_type}</TableCell>
                                <TableCell className="text-center">{r.prelim}</TableCell>
                                <TableCell className="text-center">{r.midterm}</TableCell>
                                <TableCell className="text-center">{r.finals}</TableCell>
                                <TableCell className="text-center">
                                  {avg}{avg && r.units_earned !== null ? ` / ${r.units_earned}` : ''}
                                </TableCell>
                                <TableCell className="text-center">{r.units_earned}</TableCell>
                                <TableCell className="text-center">{r.section}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AcademicRecordsDashboard;

