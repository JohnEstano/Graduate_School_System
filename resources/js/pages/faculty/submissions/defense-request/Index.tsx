import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type DefenseRequest = {
  id:number;
  thesis_title:string;
  first_name:string;
  last_name:string;
  status:string;
  workflow_state:string;
  adviser_user_id?:number|null;
  assigned_to_user_id?:number|null;
  defense_adviser?:string;
};

type PageProps = { defenseRequests: DefenseRequest[]; auth:{user:{id:number;role:string;name:string}} };

export default function FacultyDefenseRequestIndex(){
  const { defenseRequests = [], auth:{user} } = usePage<PageProps>().props;
  const [processingId,setProcessingId] = useState<number|null>(null);

  async function act(id:number, decision:'approve'|'reject'){
    setProcessingId(id);
    try {
      const res = await fetch(`/defense-requests/${id}/adviser-decision`, {
        method:'POST',
        headers:{'X-Requested-With':'XMLHttpRequest','Content-Type':'application/json','X-CSRF-TOKEN':(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''},
        body: JSON.stringify({decision})
      });
      if(!res.ok){ console.error('Decision failed'); }
      else { window.location.reload(); }
    } finally { setProcessingId(null); }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Defense Requests Assigned To Me</h1>
      <div className="border rounded divide-y">
        {defenseRequests.length === 0 && <div className="p-4 text-sm text-gray-500">No assigned defense requests.</div>}
        {defenseRequests.map(r=>{
          const canAct = r.workflow_state === 'adviser-review' && (r.adviser_user_id === user.id || r.assigned_to_user_id === user.id);
          return (
            <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div>
                <p className="text-sm font-medium">{r.thesis_title}</p>
                <p className="text-xs text-gray-500">Student: {r.first_name} {r.last_name}</p>
                <p className="text-xs text-gray-500">Status: {r.status} • Workflow: {r.workflow_state}</p>
              </div>
              <div className="flex gap-2">
                {canAct && (
                  <>
                    <Button size="sm" disabled={processingId===r.id} onClick={()=>act(r.id,'approve')}>Approve</Button>
                    <Button size="sm" variant="destructive" disabled={processingId===r.id} onClick={()=>act(r.id,'reject')}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
