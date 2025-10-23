import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';
import { Plus } from 'lucide-react';

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
  'signature.adviser', 'signature.coordinator', 'signature.dean', 'today.date',
  'coordinator.full_name', 'adviser.full_name', 'dean.full_name'
];

interface Props { templateId: number; template: any; }

export default function TemplateEditorPage({ templateId, template }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Document Templates', href: '/settings/documents' },
    { title: template?.name || 'Edit', href: `/settings/documents/${templateId}/edit` },
  ];

  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Real-time field position state
  const [currentFieldPosition, setCurrentFieldPosition] = useState<{
    x: number; y: number; width: number; height: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const meta = await fetch(`/api/document-templates/${templateId}`).then(r => r.json());
      
      // Validate and correct field types on load
      const validatedFields = (meta.fields || []).map((field: Field) => {
        // Ensure signature fields have correct type
        if (field.key.includes('signature.') && field.type !== 'signature') {
          console.warn(`Correcting field ${field.key} type from ${field.type} to signature`);
          return { ...field, type: 'signature' as const };
        }
        return field;
      });
      setFields(validatedFields);
      
      const url = `/storage/${meta.file_path}`.replace('/storage/storage', '/storage');
      console.log('PDF URL:', url);
      console.log('Loaded fields:', validatedFields);
      
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const canv: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const vp = pg.getViewport({ scale: 1.0 });
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

  function add() {
    const newField: Field = {
      id: crypto.randomUUID(), 
      key: KEYS[0], 
      page: selectedPage,
      x: 40, y: 40,
      width: 200,
      height: 30,
      type: "text",
      font_size: 11
    };
    setFields(f => [...f, newField]);
    setSelectedField(newField);
    setCurrentFieldPosition({ x: 40, y: 40, width: 200, height: 30 });
  }

  async function save() {
    setSaving(true);
    
    // Validate and preserve field types before saving
    const validatedFields = fields.map(field => {
      // Ensure signature fields remain as signature type
      if (field.key.includes('signature.') && field.type !== 'signature') {
        console.warn(`Field ${field.key} should be signature type, correcting...`);
        return { ...field, type: 'signature' as const };
      }
      return field;
    });
    
    await fetch(`/api/document-templates/${templateId}/fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
      },
      body: JSON.stringify({
        fields: validatedFields,
        fields_meta: {
          canvas_width: pdfPages[0]?.width,
          canvas_height: pdfPages[0]?.height,
        }
      })
    });
    setSaving(false);
    
    // Update local state to match validated fields
    setFields(validatedFields);
  }

  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    setSelectedPage(field.page);
    setCurrentFieldPosition({ 
      x: field.x, 
      y: field.y, 
      width: field.width, 
      height: field.height 
    });
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    setFields(fs => fs.map(x => x.id === fieldId ? { ...x, ...updates } : x));
    if (selectedField?.id === fieldId) {
      const updatedField = { ...selectedField, ...updates };
      setSelectedField(updatedField);
      if (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) {
        setCurrentFieldPosition({ 
          x: updates.x ?? updatedField.x, 
          y: updates.y ?? updatedField.y, 
          width: updates.width ?? updatedField.width, 
          height: updates.height ?? updatedField.height 
        });
      }
    }
  };

  // Real-time drag handler
  const handleDrag = (fieldId: string, data: { x: number; y: number }) => {
    setCurrentFieldPosition(prev => prev ? { ...prev, x: data.x, y: data.y } : null);
  };

  // Real-time resize handler
  const handleResize = (fieldId: string, ref: HTMLElement, position: { x: number; y: number }) => {
    setCurrentFieldPosition({ 
      x: position.x, 
      y: position.y, 
      width: ref.offsetWidth, 
      height: ref.offsetHeight 
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <Head title={`Edit Template – ${template?.name || ''}`} />
      <div className="flex h-full">
        {/* Sidebar: all controls and info - Fully scrollable */}
        <div className="w-80 bg-white border-r flex flex-col overflow-hidden">
          <div className="p-6 border-b">
            <div className="font-bold text-lg mb-1">Field mapping: {template?.name}</div>
            <div className="text-xs text-neutral-500 mb-4">
              Place dynamic text and signatures onto the PDF pages.
            </div>
            <div className="flex gap-2 mb-2">
              <Button onClick={add}><Plus size={16} /> Create Map</Button>
              <Button onClick={save} disabled={saving} variant="destructive">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Selected Field Editor */}
            {selectedField && (
              <div className="border rounded p-4 bg-blue-50 border-blue-300">
                <div className="font-semibold mb-3 text-sm text-blue-900">Edit Selected Field</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Type</label>
                    <select
                      className="w-full border px-2 py-1 text-xs bg-white rounded"
                      value={selectedField.type}
                      onChange={e => handleFieldUpdate(selectedField.id, { type: e.target.value as any })}
                    >
                      <option value="text">Text</option>
                      <option value="multiline">Multiline</option>
                      <option value="signature">Signature</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Width</label>
                      <input
                        type="number"
                        className="w-full border px-2 py-1 text-xs bg-white rounded"
                        value={Math.round(selectedField.width)}
                        onChange={e => handleFieldUpdate(selectedField.id, { width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Height</label>
                      <input
                        type="number"
                        className="w-full border px-2 py-1 text-xs bg-white rounded"
                        value={Math.round(selectedField.height)}
                        onChange={e => handleFieldUpdate(selectedField.id, { height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  {selectedField.type === 'text' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Font Size</label>
                      <input
                        type="number"
                        className="w-full border px-2 py-1 text-xs bg-white rounded"
                        value={selectedField.font_size || 11}
                        onChange={e => handleFieldUpdate(selectedField.id, { font_size: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Fields List - Takes remaining space */}
            <div className="border rounded p-3 bg-white flex-1">
              <div className="font-semibold mb-2 text-sm">Fields on Page {selectedPage}</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fields.filter(f => f.page === selectedPage).map(f => (
                  <div 
                    key={f.id} 
                    className={`border rounded p-2 cursor-pointer transition-colors ${
                      selectedField?.id === f.id ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleFieldSelect(f)}
                  >
                    <select
                      className="w-full border px-2 py-1 mb-1 text-xs bg-white rounded"
                      value={f.key}
                      onChange={e => handleFieldUpdate(f.id, { key: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {KEYS.map(k => <option key={k}>{k}</option>)}
                    </select>
                    <div className="flex justify-between items-center text-xs">
                      <span className="capitalize text-gray-600">{f.type}</span>
                      <div className="flex gap-1">
                        <span className="text-gray-500 font-mono">
                          {Math.round(f.x)},{Math.round(f.y)}
                        </span>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFields(fs => fs.filter(x => x.id !== f.id));
                            if (selectedField?.id === f.id) {
                              setSelectedField(null);
                              setCurrentFieldPosition(null);
                            }
                          }}
                        >×</button>
                      </div>
                    </div>
                  </div>
                ))}
                {!fields.filter(f => f.page === selectedPage).length && (
                  <p className="italic text-gray-500 text-center py-4">No fields on this page.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Document Preview - All Pages */}
        <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
          {/* Minimal position overlay - top right corner */}
          {(selectedField && currentFieldPosition) && (
            <div className="fixed top-4 right-4 z-50 bg-black/90 text-white text-xs font-mono px-3 py-2 rounded shadow-lg">
              <div>X: {Math.round(currentFieldPosition.x)} Y: {Math.round(currentFieldPosition.y)}</div>
              <div>W: {Math.round(currentFieldPosition.width)} H: {Math.round(currentFieldPosition.height)}</div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-col items-center space-y-8">
              {loading && (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-gray-600">Loading PDF pages...</p>
                </div>
              )}
              
              {pdfPages.map((canvas, index) => {
                const pageNumber = index + 1;
                const isActivePage = selectedPage === pageNumber;
                
                return (
                  <div 
                    key={index} 
                    className={`relative transition-all duration-200 ${
                      isActivePage ? 'ring-2 ring-blue-500 ring-offset-2' : 'ring-1 ring-gray-200'
                    }`}
                    style={{
                      width: canvas?.width,
                      height: canvas?.height,
                      boxShadow: '0 2px 16px #0001',
                      background: '#fff',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                    onClick={() => setSelectedPage(pageNumber)}
                  >
                    {/* Page Header */}
                    <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Page {pageNumber}
                    </div>
                    
                    {canvas && (
                      <>
                        <canvas
                          width={canvas.width}
                          height={canvas.height}
                          ref={el => {
                            if (el && canvas) {
                              const ctx = el.getContext('2d');
                              ctx?.drawImage(canvas, 0, 0);
                            }
                          }}
                          style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 0,
                            width: '100%',
                            height: '100%'
                          }}
                        />
                        
                        {/* Render fields for this page */}
                        {fields.filter(f => f.page === pageNumber).map(f => (
                          <Rnd 
                            key={f.id}
                            bounds="parent"
                            size={{ width: f.width, height: f.height }}
                            position={{ x: f.x, y: f.y }}
                            onDrag={(e, d) => {
                              handleDrag(f.id, d);
                            }}
                            onResize={(e, direction, ref, delta, position) => {
                              handleResize(f.id, ref, position);
                            }}
                            onDragStop={(e, d) => {
                              handleFieldUpdate(f.id, { x: d.x, y: d.y });
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                              handleFieldUpdate(f.id, {
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                x: position.x,
                                y: position.y
                              });
                            }}
                            onMouseDown={() => handleFieldSelect(f)}
                            className={`absolute text-[10px] flex items-center justify-center border cursor-move ${
                              f.type === 'signature'
                                ? 'border-green-600 bg-green-200/30'
                                : f.type === 'multiline'
                                  ? 'border-purple-600 bg-purple-200/30'
                                  : 'border-blue-600 bg-blue-200/30'
                            } ${
                              selectedField?.id === f.id 
                                ? 'ring-2 ring-yellow-400 ring-offset-1 z-20' 
                                : 'z-10'
                            }`}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center px-1">
                              <span className={`font-bold ${
                                f.type === 'signature' ? 'text-green-700' :
                                f.type === 'multiline' ? 'text-purple-700' : 'text-blue-700'
                              }`}>
                                {f.type.charAt(0).toUpperCase() + f.type.slice(1)}
                              </span>
                              <span className="text-[10px] text-neutral-700 break-all text-center">
                                {f.key.split('.').pop()}
                              </span>
                              {f.type === 'signature' && (
                                <span className="text-xs text-green-700">Sign here</span>
                              )}
                              {f.type === 'multiline' && (
                                <div className="text-xs text-purple-700 opacity-70 leading-tight">
                                  Line 1<br />Line 2<br />Line 3
                                </div>
                              )}
                            </div>
                          </Rnd>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}