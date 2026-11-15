import React from 'react';
import { IntegrationsHealthLog } from '../../types/channels';
import { Activity, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

export const IntegrationsHealthView: React.FC<{logs:IntegrationsHealthLog[];onShowToast:(message:string)=>void}> = ({logs}) => {
  const active=logs.filter(log=>log.status==='active').length;
  return <div className="space-y-5">
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Activity className="h-5 w-5"/></div><div><h2 className="text-base font-bold text-slate-900">Integration health activity</h2><p className="mt-1 text-xs text-slate-500">Recent health events recorded by the backend. No synthetic uptime or diagnostic results are shown.</p></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] uppercase tracking-wide text-slate-500">Recorded events</p><p className="mt-1 text-2xl font-bold text-slate-900">{logs.length}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] uppercase tracking-wide text-slate-500">Active alerts</p><p className="mt-1 text-2xl font-bold text-slate-900">{active}</p></div></div>
    </section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-900">Health log</h3></div>{logs.length===0?<p className="p-8 text-center text-xs text-slate-500">No integration health events have been recorded.</p>:<ul className="divide-y divide-slate-100">{logs.map(log=><li key={log.id} className="flex items-start gap-3 px-5 py-4"><span className={`mt-0.5 rounded-lg p-2 ${log.status==='active'?'bg-amber-50 text-amber-700':log.status==='resolved'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{log.status==='active'?<AlertTriangle className="h-4 w-4"/>:log.status==='resolved'?<CheckCircle2 className="h-4 w-4"/>:<Clock3 className="h-4 w-4"/>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-slate-900">{log.service}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] capitalize text-slate-600">{log.type.replaceAll('_',' ')}</span></div><p className="mt-1 text-xs text-slate-600">{log.message}</p><time className="mt-1 block text-[10px] text-slate-400">{log.timestamp}</time></div></li>)}</ul>}</section>
  </div>;
};
