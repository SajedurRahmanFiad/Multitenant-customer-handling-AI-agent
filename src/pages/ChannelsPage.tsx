import React, { useMemo } from 'react';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { MessengerConnection, WhatsAppConnection, WebhookDiagnosticEvent, BusinessIntegration, IntegrationsHealthLog } from '../types/channels';
import { MessengerConnectionView } from '../components/channels/MessengerConnectionView';
import { WhatsAppConnectionView } from '../components/channels/WhatsAppConnectionView';
import { WebhooksDiagnosticView } from '../components/channels/WebhooksDiagnosticView';
import { BusinessSystemsView } from '../components/channels/BusinessSystemsView';
import { IntegrationsHealthView } from '../components/channels/IntegrationsHealthView';
import { MetaBusinessConnect } from '../components/channels/MetaBusinessConnect';
import { MessageSquare, Phone, Activity, Layers, HeartPulse } from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';
import { useUrlQueryState } from '../hooks/useUrlQueryState';

type Tab = 'messenger' | 'whatsapp' | 'webhooks' | 'business_systems' | 'health';
const emptyMessenger: MessengerConnection = { pageName:'', pageId:'', category:'', instagramLinked:false, status:'disconnected', grantedPermissions:[], missingPermissions:[], subscribedFields:[], lastWebhookAt:null, lastReplyAt:null, tokenHealth:{status:'expired',daysRemaining:0,tokenType:'Page Access Token',lastRefreshed:'Never',expiresAt:null,maskedToken:''}, webhookErrors:[] };
const emptyWhatsapp: WhatsAppConnection = { wabaName:'', wabaId:'', businessManagerId:'', phoneNumber:'', phoneNumberId:'', displayName:'', verificationStatus:'unverified', hasGreenTick:false, status:'disconnected', qualityRating:'UNKNOWN', messagingTierLimit:null, current24hWindowSent:null, lastInboundAt:null, lastOutboundAt:null, maskedToken:null, tokenHealth:{status:'expired',type:'System User Permanent Token',lastRefreshed:'Never'}, templates:[], throughputLimit:null };

export const ChannelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useUrlQueryState<Tab>('tab','messenger',['messenger','whatsapp','webhooks','business_systems','health']);
  const messengerQ = useApiData<{connection:MessengerConnection|null}>('/channels/messenger');
  const whatsappQ = useApiData<{connection:WhatsAppConnection|null;templates:WhatsAppConnection['templates']}>('/channels/whatsapp');
  const webhooksQ = useApiData<{events:WebhookDiagnosticEvent[]}>('/channels/webhooks/events');
  const integrationsQ = useApiData<{integrations:BusinessIntegration[];healthLogs:IntegrationsHealthLog[]}>('/channels/integrations');
  const [notice, setNotice] = React.useState('');
  const run = async (fn:()=>Promise<unknown>, reload:()=>void, message='Saved') => { try { await fn(); reload(); setNotice(message); window.setTimeout(()=>setNotice(''),3000); } catch(e) { setNotice(e instanceof Error ? e.message : 'Request failed'); } };
  const messenger = messengerQ.data?.connection ?? emptyMessenger;
  const whatsapp = useMemo(()=> whatsappQ.data?.connection ? {...whatsappQ.data.connection,templates:whatsappQ.data.templates ?? whatsappQ.data.connection.templates} : emptyWhatsapp,[whatsappQ.data]);
  const events = webhooksQ.data?.events ?? [];
  const integrations = integrationsQ.data?.integrations ?? [];
  const logs = integrationsQ.data?.healthLogs ?? [];
  const connected = (s:string) => s === 'connected' ? 'connected' as const : 'disconnected' as const;
  const tabs = [
    {id:'messenger' as Tab,label:'Messenger',icon:MessageSquare,indicatorDot:connected(messenger.status),group:'MESSAGING CHANNELS'},
    {id:'whatsapp' as Tab,label:'WhatsApp Business',icon:Phone,indicatorDot:connected(whatsapp.status),group:'MESSAGING CHANNELS'},
    {id:'webhooks' as Tab,label:'Webhooks & Delivery',icon:Activity,count:events.length,group:'INFRASTRUCTURE'},
    {id:'business_systems' as Tab,label:'Business Systems',icon:Layers,badge:`${integrations.filter(i=>i.status==='connected').length} Active`,badgeVariant:'success' as const,group:'INFRASTRUCTURE'},
    {id:'health' as Tab,label:'Health & Fallback',icon:HeartPulse,group:'INFRASTRUCTURE'},
  ];
  return <div className="space-y-6">{notice && <div role="status" className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl">{notice}</div>}
    <div className="flex flex-col lg:flex-row gap-6 items-start"><SubPageNav tabs={tabs} activeTab={activeTab} onChangeTab={setActiveTab}/><div className="flex-1 min-w-0 w-full">
      {activeTab==='messenger' && <><MetaBusinessConnect channel="messenger" onConnected={messengerQ.reload} onNotice={setNotice}/><MessengerConnectionView connection={messenger} onUpdateConnection={v=>{
        if(v.status==='disconnected' && messengerQ.data?.connection) return run(()=>api.post('/channels/messenger/disconnect',{}),messengerQ.reload,'Messenger disconnected');
        const accessToken=(v as MessengerConnection & {accessToken?:string}).accessToken;
        return run(()=>api.put('/channels/messenger',{pageName:v.pageName,pageId:v.pageId,category:v.category,accessToken,status:v.status}),messengerQ.reload,'Messenger settings saved. Meta token validation is not configured.');
      }} onShowToast={setNotice}/></>}
      {activeTab==='whatsapp' && <><MetaBusinessConnect channel="whatsapp" onConnected={whatsappQ.reload} onNotice={setNotice}/><WhatsAppConnectionView connection={whatsapp} onUpdateConnection={v=>{
        if(v.status==='disconnected' && whatsappQ.data?.connection) return run(()=>api.post('/channels/whatsapp/disconnect',{}),whatsappQ.reload,'WhatsApp disconnected');
        const accessToken=(v as WhatsAppConnection & {accessToken?:string}).accessToken;
        return run(()=>api.put('/channels/whatsapp',{wabaName:v.wabaName,wabaId:v.wabaId,businessManagerId:v.businessManagerId,phoneNumber:v.phoneNumber,phoneNumberId:v.phoneNumberId,displayName:v.displayName,accessToken,status:v.status}),whatsappQ.reload,'WhatsApp settings saved. Meta token validation is not configured.');
      }} onShowToast={setNotice}/></>}
      {activeTab==='webhooks' && <WebhooksDiagnosticView events={events} onTriggerTestEvent={()=>webhooksQ.reload()} onShowToast={setNotice}/>}
      {activeTab==='business_systems' && <BusinessSystemsView integrations={integrations} onUpdateIntegration={i=>run(()=>api.put(`/channels/integrations/${i.id}`,{endpointUrl:i.endpointUrl,apiKey:(i as BusinessIntegration & {apiKey?:string}).apiKey || undefined,status:i.status,fallbackPolicy:i.fallbackPolicy,scopes:i.scopes}),integrationsQ.reload)} onShowToast={setNotice}/>}
      {activeTab==='health' && <IntegrationsHealthView logs={logs} onShowToast={setNotice}/>}
      {(messengerQ.error||whatsappQ.error||webhooksQ.error||integrationsQ.error) && <p role="alert" className="mt-4 text-xs text-rose-700">{messengerQ.error||whatsappQ.error||webhooksQ.error||integrationsQ.error}</p>}
    </div></div></div>;
};
