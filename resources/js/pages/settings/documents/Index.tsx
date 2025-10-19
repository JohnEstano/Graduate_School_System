import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BreadcrumbItem = { title:string; href:string };
type Template = { id:number; name:string; code:string; version:number; };

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Document Templates', href: '/settings/documents' },
];

const templateOptions = [
  { label: 'Endorsement Form (Proposal)', value: 'Endorsement Form (Proposal)' },
  { label: 'Endorsement Form (Prefinal)', value: 'Endorsement Form (Prefinal)' },
  { label: 'Endorsement (Final)', value: 'Endorsement (Final)' },
];

export default function DocumentTemplatesIndex() {
  const [list,setList]=useState<Template[]>([]);
  const [file,setFile]=useState<File|null>(null);
  const [form,setForm]=useState({name:''});
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/document-templates', {
      headers: {
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
      },
      credentials: 'include'
    });
    if(r.ok) setList(await r.json());
  }

  useEffect(() => {
    fetch('/sanctum/csrf-cookie').then(load);
  }, []);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!file) return;
    setBusy(true);
    const fd=new FormData();
    fd.append('name',form.name);
    fd.append('file',file);
    const r=await fetch('/api/document-templates', {
      method:'POST',
      body:fd,
      headers: {
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
      },
      credentials: 'include'
    });
    setBusy(false);
    if(r.ok){ setForm({name:''}); setFile(null); load(); }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Document Templates" />
      <SettingsLayout>
        <div className="space-y-10">
          <div className="space-y-6">
            <HeadingSmall title="Upload template" description="Add a new PDF template to map fields & signatures." />
            <form onSubmit={submit} className="mt-2 grid gap-3 max-w-sm">
              <Select
                value={form.name}
                onValueChange={value => setForm(f => ({ ...f, name: value }))}
              >
                <SelectTrigger className="border rounded px-2 py-1">
                  <SelectValue placeholder="Select template name" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="file" accept="application/pdf"
                onChange={e=>setFile(e.target.files?.[0]||null)} />
              <Button disabled={!file||!form.name||busy} type="submit">
                {busy?'Uploading...':'Upload'}
              </Button>
            </form>
          </div>

            <div className="space-y-4">
              <HeadingSmall title="Existing templates" description="Manage and edit mapped fields." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2">Code</th>
                      <th className="p-2">Version</th>
                      <th className="p-2">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(t=>(
                      <tr key={t.id} className="border-t">
                        <td className="p-2">{t.name}</td>
                        <td className="p-2">{t.code}</td>
                        <td className="p-2 text-center">{t.version}</td>
                        <td className="p-2">
                          <a href={`/settings/documents/${t.id}/edit`} target="_blank" rel="noopener noreferrer">Fields</a>
                        </td>
                      </tr>
                    ))}
                    {!list.length && <tr><td className="p-4" colSpan={4}>No templates.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}