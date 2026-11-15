import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Channel = 'messenger' | 'whatsapp';
type Asset = { id: string; name: string; category?: string; businessId?: string; phoneNumberId?: string; phoneNumber?: string; displayName?: string };
const keyFor=(asset:Asset)=>`${asset.id}:${asset.phoneNumberId??''}`;

export const MetaBusinessConnect: React.FC<{channel:Channel; onConnected:()=>void; onNotice:(message:string)=>void}> = ({channel,onConnected,onNotice}) => {
  const [assets,setAssets]=useState<Asset[]>([]); const [selected,setSelected]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search); const status=params.get('meta');
    if(status==='authorized' && params.get('tab')===channel){
      setLoading(true); api.get<{assets:Asset[]}>('/channels/meta/assets',{channel}).then(({assets:list})=>{setAssets(list); if(list.length===1)setSelected(keyFor(list[0])); if(!list.length)setError('No eligible assets were returned for this login configuration. Check the assets and permissions selected in Meta.');}).catch((e:unknown)=>setError(e instanceof Error?e.message:'Could not load Meta assets')).finally(()=>setLoading(false));
      params.delete('meta'); const url=`${window.location.pathname}?${params.toString()}${window.location.hash}`; window.history.replaceState({},'',url);
    } else if((status==='cancelled' || status==='error') && params.get('tab')===channel){
      if(status==='cancelled') onNotice('Meta login was cancelled.');
      else setError('Meta could not authorize this connection. Check the app configuration and try again.');
      params.delete('meta'); window.history.replaceState({},'',`${window.location.pathname}?${params.toString()}${window.location.hash}`);
    }
  },[channel,onNotice]);
  const begin=async()=>{setError('');setLoading(true);try{const {authorizationUrl}=await api.post<{authorizationUrl:string}>('/channels/meta/login',{channel}); window.location.assign(authorizationUrl);}catch(e){setError(e instanceof Error?e.message:'Could not start Meta login');setLoading(false);}};
  const connect=async()=>{const asset=assets.find(a=>keyFor(a)===selected);if(!asset)return;setError('');setLoading(true);try{await api.post('/channels/meta/connect',{channel,assetId:asset.id,phoneNumberId:asset.phoneNumberId,businessId:asset.businessId});setAssets([]);setSelected('');onConnected();onNotice(`${channel==='messenger'?'Facebook Page':'WhatsApp Business number'} connected.`);}catch(e){setError(e instanceof Error?e.message:'Could not connect selected asset');}finally{setLoading(false);}};
  return <section className="mb-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 space-y-3">
    <div><h3 className="text-sm font-bold text-slate-900">Connect with Facebook Login for Business</h3><p className="text-xs text-slate-600 mt-1">Authorize this workspace in Meta, then select one of the business assets granted to the login.</p></div>
    {assets.length===0?<button type="button" disabled={loading} onClick={begin} className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{loading?'Opening Meta…':'Continue with Facebook'}</button>:<div className="flex flex-col sm:flex-row gap-2">
      <select aria-label="Select Meta business asset" value={selected} onChange={e=>setSelected(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><option value="">Select {channel==='messenger'?'Facebook Page':'WhatsApp number'}</option>{assets.map(a=><option key={keyFor(a)} value={keyFor(a)}>{a.name}{a.phoneNumber?` · ${a.phoneNumber}`:''}{a.category?` · ${a.category}`:''}</option>)}</select>
      <button type="button" disabled={loading||!selected} onClick={connect} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{loading?'Connecting…':'Connect selected asset'}</button>
    </div>}
    {error&&<p role="alert" className="text-xs text-rose-700">{error}</p>}
  </section>;
};
