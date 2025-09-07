import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

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

  const [semesterId, setSemesterId] = useState<string|undefined>(undefined);

  const load = () => {
    setLoading(true);
    setError(null);
    const url = '/legacy/academic-records' + (semesterId ? `?semester_id=${semesterId}` : '');
    fetch(url, { headers: { 'Accept': 'application/json' }})
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        setData(json.data as ParsedData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (semesterId) load(); }, [semesterId]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Academic Records (Legacy)</h1>
        <button onClick={load} className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50" disabled={loading}>Reload</button>
      </div>

      {loading && <div className="p-4 border rounded animate-pulse">Loading academic records...</div>}
      {error && (
        <div className="p-4 border rounded bg-red-50 text-red-700">
          Failed to load: {error} — try logging out/in if session expired.
        </div>
      )}
      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded bg-white">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Student</h2>
              <p className="text-sm"><span className="font-semibold">Number:</span> {data.student.student_number || '—'}</p>
              <p className="text-sm"><span className="font-semibold">Name:</span> {data.student.name || '—'}</p>
              <p className="text-sm"><span className="font-semibold">Program:</span> {data.student.program || '—'}</p>
              {data.gwa && <p className="mt-2 text-sm"><span className="font-semibold">GWA:</span> {data.gwa}</p>}
            </div>
            <div className="p-4 border rounded bg-white md:col-span-2">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Semesters</h2>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
                {data.semesters.map(s => {
                  const active = (semesterId ?? data.current_semester_id) === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSemesterId(s.id)}
                      className={`px-2 py-1 text-xs rounded border transition ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >{s.label}</button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Click a semester to reload real grades.</p>
            </div>
          </div>

          <div className="p-4 border rounded bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Courses</h2>
              <span className="text-xs text-gray-500">{data.records.length} rows</span>
            </div>
            {data.records.length === 0 && (
              <div className="text-sm text-gray-500">No records returned for this semester.</div>
            )}
            {data.records.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 border text-left">Code</th>
                      <th className="px-2 py-1 border text-left">Title</th>
                      <th className="px-2 py-1 border">Units</th>
                      <th className="px-2 py-1 border">Type</th>
                      <th className="px-2 py-1 border">Prelim</th>
                      <th className="px-2 py-1 border">Midterm</th>
                      <th className="px-2 py-1 border">Finals</th>
                      <th className="px-2 py-1 border">Average</th>
                      <th className="px-2 py-1 border">Units Earned</th>
                      <th className="px-2 py-1 border">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r,i) => {
                      const avg = r.average || r.average_var || '';
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-1 border">{r.code}</td>
                          <td className="px-2 py-1 border">{r.title}</td>
                          <td className="px-2 py-1 border text-center">{r.units}</td>
                          <td className="px-2 py-1 border text-center">{r.course_type}</td>
                          <td className="px-2 py-1 border text-center">{r.prelim}</td>
                          <td className="px-2 py-1 border text-center">{r.midterm}</td>
                          <td className="px-2 py-1 border text-center">{r.finals}</td>
                          <td className="px-2 py-1 border text-center">{avg}{avg && r.units_earned !== null ? ` / ${r.units_earned}` : ''}</td>
                          <td className="px-2 py-1 border text-center">{r.units_earned}</td>
                          <td className="px-2 py-1 border text-center">{r.section}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicRecordsDashboard;
