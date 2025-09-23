import React,{useEffect,useState} from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';

type BreadcrumbItem = { title:string; href:string };
type Sig = { id:number; image_path:string; active:boolean; label:string; };

const breadcrumbs:BreadcrumbItem[] = [
  { title:'E‑Signatures', href:'/settings/signatures' },
];

export default function SignaturesIndex(){
  const [list,setList]=useState<Sig[]>([]);
  const [uploading,setUploading]=useState(false);

  async function load(){
    const r=await fetch('/api/signatures');
    if(r.ok) setList(await r.json());
  }
  useEffect(()=>{ load(); },[]);

  async function upload(e:React.ChangeEvent<HTMLInputElement>){
    if(!e.target.files?.[0]) return;
    setUploading(true);
    const fd=new FormData();
    fd.append('image',e.target.files[0]);
    await fetch('/api/signatures',{method:'POST',body:fd});
    setUploading(false);
    load();
  }

  async function activate(id:number){
    await fetch(`/api/signatures/${id}/activate`,{method:'PATCH'});
    load();
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="E‑Signatures" />
      <SettingsLayout>
        <div className="space-y-10">
          <div className="space-y-4">
            <HeadingSmall title="E‑Signatures" description="Upload and select your active signature image." />
            <div>
              <input type="file" accept="image/png" onChange={upload}/>
              {uploading && <span className="ml-2 text-sm">Uploading...</span>}
              <p className="text-xs text-neutral-500 mt-1">Upload transparent PNG (max 1MB).</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {list.map(s=>(
              <div key={s.id}
                className={`border rounded p-3 flex flex-col items-center gap-2 bg-white ${s.active?'ring-2 ring-green-500':''}`}>
                <img src={`/storage/${s.image_path}`} className="max-h-24 object-contain" />
                <Button
                  size="sm"
                  variant={s.active?'secondary':'default'}
                  onClick={()=>activate(s.id)}
                >
                  {s.active?'Active':'Set Active'}
                </Button>
              </div>
            ))}
            {!list.length && <p className="text-sm col-span-full">No signatures.</p>}
          </div>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}