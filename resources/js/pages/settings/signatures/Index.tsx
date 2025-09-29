import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Signature, UploadCloud, Trash2 } from "lucide-react"; // <-- update import
import { toast } from 'sonner';

type BreadcrumbItem = { title: string; href: string };
type Sig = { id: number; image_path: string; active: boolean; label: string };

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'E‑Signatures', href: '/settings/signatures' },
];

export default function SignaturesIndex() {
  const [list, setList] = useState<Sig[]>([]);
  const [uploading, setUploading] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [tab, setTab] = useState<'draw' | 'upload'>('draw');
  const [loading, setLoading] = useState(false); // <-- add loading state
  const sigPad = useRef<SignatureCanvas>(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/signatures');
    if (r.ok) setList(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', e.target.files[0]);
    const res = await fetch('/api/signatures', { method: 'POST', body: fd });
    setUploading(false);
    if (res.ok) {
      toast.success('Signature uploaded!');
      load();
    } else {
      toast.error('Failed to upload signature.');
    }
  }

  async function saveDrawnSignature() {
    if (!sigPad.current) return;
    const canvas = sigPad.current.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    const natural_width = canvas.width;
    const natural_height = canvas.height;
    const label = "Drawn Signature";
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

    setUploading(true);
    const res = await fetch('/api/signatures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken || ''
      },
      body: JSON.stringify({
        image_base64: dataUrl,
        label,
        natural_width,
        natural_height
      }),
    });
    setUploading(false);

    if (res.ok) {
      setDrawingOpen(false);
      sigPad.current.clear();
      toast.success('Signature created!');
      load();
    } else {
      toast.error('Failed to save signature.');
    }
  }

  async function activate(id: number) {
    setLoading(true);
    const res = await fetch(`/api/signatures/${id}/activate`, { method: 'PATCH' });
    setLoading(false);
    if (res.ok) {
      toast.success('Signature activated!');
      load();
    } else {
      toast.error('Failed to activate signature.');
    }
  }


  function drawGuideLine() {
    if (sigPad.current) {
      const canvas = sigPad.current.getCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const margin = 40; // px from left/right
        const y = canvas.height - 80; // px from bottom
        ctx.save();
        ctx.strokeStyle = "#d1d5db"; // zinc-300
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(canvas.width - margin, y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Redraw guide line when dialog opens or after clear
  useEffect(() => {
    if (drawingOpen && sigPad.current) {
      sigPad.current.clear();
      drawGuideLine();
    }
  }, [drawingOpen]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="E‑Signatures" />
      <SettingsLayout>
        <div className="space-y-10">
          <div className="space-y-4">
            <HeadingSmall title="E‑Signatures" description="Upload or draw your signature image." />
            <div>
            
              <Button size="sm" onClick={() => setDrawingOpen(true)}>
                Draw Signature
              </Button>
              {uploading && <span className="ml-2 text-sm">Uploading...</span>}
            </div>
          </div>
          <p className="font-medium">
            Active Signature
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {list.map(s => (
              <div key={s.id}
                className={`border rounded p-3 flex flex-col items-center gap-2 bg-white ${s.active ? 'ring-2 ring-green-500' : ''}`}>
                <img src={`/storage/${s.image_path}`} className="max-h-24 object-contain" />
                <Button
                  size="sm"
                  variant={s.active ? 'secondary' : 'default'}
                  onClick={() => activate(s.id)}
                >
                  {s.active ? 'Active' : 'Set Active'}
                </Button>
              </div>
            ))}
            {!list.length && <p className="text-sm col-span-full">No signatures.</p>}
          </div>

          {/* Signature Drawing Dialog */}
          <Dialog open={drawingOpen} onOpenChange={setDrawingOpen}>
            <DialogContent className="max-w-[900px] w-full min-h-[520px] p-8 flex flex-col gap-6" style={{ position: 'relative' }}>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold mb-2">Create Your Signature</DialogTitle>
              </DialogHeader>
              <Tabs value={tab} onValueChange={v => setTab(v as 'draw' | 'upload')} className="w-full">
                <div className=" flex items-center justify-between w-full">
                  <TabsList className="flex gap-2">
                    <TabsTrigger value="draw" className="px-4 py-1 text-sm flex items-center gap-2">
                      <Signature className="w-4 h-4" /> Draw
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="px-4 py-1 text-sm flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" /> Upload
                    </TabsTrigger>
                  </TabsList>
                  {tab === 'draw' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="ml-4"
                      onClick={() => {
                        sigPad.current?.clear();
                        drawGuideLine();
                      }}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="w-full flex-1 flex items-center">
                  <TabsContent value="draw" className="w-full h-[320px] flex flex-col justify-center items-center px-6">
                    <div className="w-full flex flex-col gap-2 items-center">
                      <div className="flex justify-center w-full">
                        <SignatureCanvas
                          ref={sigPad}
                          penColor="black"
                          backgroundColor="rgba(0,0,0,0)" // transparent
                          canvasProps={{
                            width: 690,
                            height: 300,
                            className: 'border border-zinc-300 rounded bg-zinc-100 shadow-lg mx-auto',
                            style: { cursor: 'crosshair' }
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="upload" className="w-full h-[240px] flex flex-col justify-center items-center">
                    <div
                      className="w-full h-[180px] border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center bg-neutral-50 cursor-pointer transition hover:border-primary"
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) upload({ target: { files: e.dataTransfer.files } } as any);
                      }}
                      onDragOver={e => e.preventDefault()}
                    >
                      <UploadCloud className="w-8 h-8 mb-2 text-neutral-400" />
                      <span className="text-sm text-neutral-500 mb-2">Drag & drop PNG here, or click to select</span>
                      <input
                        id="signature-upload"
                        type="file"
                        accept="image/png"
                        onChange={upload}
                        className="hidden"
                        style={{ display: "none" }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById("signature-upload")?.click()}
                      >
                        Browse
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Upload transparent PNG (max 1MB).</p>
                  </TabsContent>
                </div>
              </Tabs>
              {/* Footer row: text + buttons */}
              <div className="flex items-center justify-between w-full mt-4 ">
                <span className="text-xs text-neutral-600">
                  I understand this is a legal representation of my signature. 
                </span>
                <div className="flex gap-2">
                  {tab === 'draw' && (
                    <Button size="sm" onClick={saveDrawnSignature} disabled={uploading}>
                      {uploading ? 'Saving...' : 'Save Signature'}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setDrawingOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
              {uploading && (
    <div
      className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50"
      style={{ borderRadius: 'inherit' }}
    >
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span className="text-sm text-primary">Saving signature...</span>
      </div>
    </div>
  )}
            </DialogContent>
          </Dialog>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}