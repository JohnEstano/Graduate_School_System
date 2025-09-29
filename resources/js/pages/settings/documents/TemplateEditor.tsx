import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';

// PDF.js imports for Vite/React
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set the worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type BreadcrumbItem = { title: string; href: string };

type Field = {
  id: string;
  key: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'multiline' | 'signature';
  font_size?: number;
};
const KEYS = [
  'student.full_name', 'student.program', 'request.thesis_title',
  'request.defense_type', 'schedule.date', 'schedule.time',
  'signature.adviser', 'signature.coordinator', 'signature.dean', 'today.date'
];

interface Props { templateId: number; template: any; }

export default function TemplateEditorPage({ templateId, template }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Document Templates', href: '/settings/documents' },
    { title: template?.name || 'Edit', href: `/settings/documents/${templateId}/edit` },
  ];

  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [fields, setFields] = useState<Field[]>(template?.fields || []);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const meta = await fetch(`/api/document-templates/${templateId}`).then(r => r.json());
      // PDF path fix: always use /storage/ for files stored via Laravel
      const url = `/storage/${meta.file_path}`.replace('/storage/storage', '/storage');
      console.log('PDF URL:', url);
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const canv: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const vp = pg.getViewport({ scale: 1.05 });
          const c = document.createElement('canvas');
          c.width = vp.width; c.height = vp.height;
          await pg.render({ canvasContext: c.getContext('2d')!, viewport: vp, canvas: c }).promise;
          canv.push(c);
        }
        setPdfPages(canv);
      } catch (err: any) {
        alert('PDF load error: ' + err.message);
        console.error('PDF load error:', err);
        setPdfPages([]);
      }
      setLoading(false);
    })();
  }, [templateId]);

  function add(type: Field['type']) {
    setFields(f => [...f, {
      id: crypto.randomUUID(), key: KEYS[0], page,
      x: 40, y: 40,
      width: type === 'signature' ? 180 : 200,
      height: type === 'signature' ? 60 : (type === 'multiline' ? 70 : 30),
      type, font_size: 11
    }]);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/document-templates/${templateId}/fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    setSaving(false);
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Template – ${template?.name || ''}`} />
      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall title={`Field mapping: ${template?.name}`} description="Place dynamic text and signatures onto the PDF pages." />

          <div className="flex gap-6">
            <div className="w-60 space-y-4">
              <div className="space-y-2">
                <Button className="w-full" onClick={() => add('text')}>Add Text</Button>
                <Button className="w-full" onClick={() => add('multiline')} variant="secondary">Add Multiline</Button>
                <Button className="w-full" onClick={() => add('signature')} variant="outline">Add Signature</Button>
                <Button className="w-full" onClick={save} disabled={saving} variant="destructive">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Page</label>
                <select value={page} onChange={e => setPage(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full">
                  {pdfPages.map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
              <div className="border rounded p-2 max-h-72 overflow-auto text-xs space-y-1 bg-white">
                {fields.filter(f => f.page === page).map(f => (
                  <div key={f.id} className="border rounded p-1 bg-gray-50">
                    <select
                      className="w-full border px-1 py-0.5 mb-1 text-[11px]"
                      value={f.key}
                      onChange={e => setFields(fs => fs.map(x => x.id === f.id ? { ...x, key: e.target.value } : x))}
                    >
                      {KEYS.map(k => <option key={k}>{k}</option>)}
                    </select>
                    <div className="flex justify-between">
                      <span>{f.type}</span>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => setFields(fs => fs.filter(x => x.id !== f.id))}
                      >×</button>
                    </div>
                  </div>
                ))}
                {!fields.filter(f => f.page === page).length && <p className="italic">No fields.</p>}
              </div>
              <p className="text-[10px] text-neutral-500">Drag & resize boxes. Signature boxes embed PNG signature images.</p>
            </div>

            <div className="relative flex-1 border p-2 overflow-auto max-h-[80vh] bg-neutral-50">
              {loading && <p className="text-sm">Loading PDF...</p>}
              {!loading && pdfPages[page - 1] && (
                <div style={{ position: 'relative', width: pdfPages[page - 1].width, height: pdfPages[page - 1].height }}>
                  <canvas
                    width={pdfPages[page - 1].width}
                    height={pdfPages[page - 1].height}
                    ref={el => {
                      if (el && pdfPages[page - 1]) {
                        const ctx = el.getContext('2d');
                        ctx?.drawImage(pdfPages[page - 1], 0, 0);
                      }
                    }}
                    style={{ position: 'absolute', left: 0, top: 0 }}
                  />
                  {/* Render fields on top as before */}
                  {fields.filter(f => f.page === page).map(f => (
                    <Rnd key={f.id}
                      bounds="parent"
                      size={{ width: f.width, height: f.height }}
                      position={{ x: f.x, y: f.y }}
                      onDragStop={(_, d) => setFields(fs => fs.map(x => x.id === f.id ? { ...x, x: d.x, y: d.y } : x))}
                      onResizeStop={(_, __, ref, ___, pos) => setFields(fs => fs.map(x => x.id === f.id ? {
                        ...x, width: ref.offsetWidth, height: ref.offsetHeight, x: pos.x, y: pos.y
                      } : x))}
                      className={`absolute text-[10px] flex items-center justify-center border ${
                        f.type === 'signature'
                          ? 'border-green-600 bg-green-200/30'
                          : 'border-blue-600 bg-blue-200/30'
                      }`}>
                      {f.type}
                    </Rnd>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}