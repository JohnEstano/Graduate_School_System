import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

interface ClassRow {
  number: number;
  course_code: string;
  course_title: string;
  type: string;
  size: string;
  load: string;
  section: string;
}

interface PeriodOption { id: string; label: string; short_label: string; selected: boolean }

export default function ClassListPage() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [shortPeriodLabel, setShortPeriodLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
  fetch('/legacy/faculty/class-list')
      .then(r => r.json())
      .then(json => {
        if (!active) return;
        if (json.error) setError(json.error);
    setRows(json.rows || []);
    setPeriods(json.periods || []);
    setSelectedPeriodId(json.selected_period_id || null);
    setShortPeriodLabel(json.short_period_label || null);
      })
      .catch(e => setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <AppLayout breadcrumbs={[{ title: 'Faculty Class List', href: '/faculty/class-list' }]}> 
      <Head title="Class List" />
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Instructor Class List</h1>
        {loading && <div className="text-sm text-gray-500">Loading class list...</div>}
        {!loading && periods.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Semester / Period</label>
              <select
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:bg-zinc-900 dark:border-zinc-700"
                value={selectedPeriodId || ''}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedPeriodId(pid);
                  setLoading(true);
                  fetch(`/legacy/faculty/class-list?period_id=${pid}`)
                    .then(r => r.json())
                    .then(j => {
                      setRows(j.rows || []);
                      setPeriods(j.periods || []);
                      setSelectedPeriodId(j.selected_period_id || pid);
                      setShortPeriodLabel(j.short_period_label || null);
                      if (j.error) setError(j.error); else setError(null);
                    })
                    .catch(err => setError(err.message))
                    .finally(() => setLoading(false));
                }}
              >
                <option value="" disabled>Select Period</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            {shortPeriodLabel && (
              <div className="rounded bg-pink-50 dark:bg-pink-950/30 px-3 py-2 text-sm font-medium text-pink-700 dark:text-pink-300">
                {shortPeriodLabel}
              </div>
            )}
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
  {!loading && !error && rows.length === 0 && (
          <div className="text-sm text-gray-500">No classes found.</div>
        )}
        {!loading && rows.length > 0 && (
          <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Course Code</th>
                  <th className="px-3 py-2 text-left font-medium">Course Title</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Size</th>
                  <th className="px-3 py-2 text-left font-medium">Load</th>
                  <th className="px-3 py-2 text-left font-medium">Section</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.number} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2">{r.number}</td>
                    <td className="px-3 py-2 font-mono">{r.course_code}</td>
                    <td className="px-3 py-2">{r.course_title}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.size}</td>
                    <td className="px-3 py-2">{r.load}</td>
                    <td className="px-3 py-2">{r.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
