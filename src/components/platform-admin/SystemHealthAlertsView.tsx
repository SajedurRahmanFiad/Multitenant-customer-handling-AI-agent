import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Activity,
  ShieldCheck,
  Server,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { SystemComponentHealth, SystemIncident } from '../../types/platformAdmin';

interface SystemHealthAlertsViewProps {
  components: SystemComponentHealth[];
  incidents: SystemIncident[];
}

export const SystemHealthAlertsView: React.FC<SystemHealthAlertsViewProps> = ({
  components,
  incidents,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'core' | 'storage' | 'external'>('all');

  const filteredComponents = components.filter(
    (c) => filterType === 'all' || c.type === filterType
  );

  return (
    <div className="space-y-6">
      {/* SLA Status Banner (Light Mode) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                All Core Services Operational
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                99.98% 90-Day SLA
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Automated health monitors polling webhook endpoints, socket hubs, and LLM orchestrators every 10 seconds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-semibold uppercase tracking-wider">Avg Latency</span>
            <span className="text-base font-bold text-slate-900">28ms</span>
          </div>
        </div>
      </div>

      {/* Component Matrix Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          {[
            { id: 'all', label: 'All Systems' },
            { id: 'core', label: 'Core Services' },
            { id: 'storage', label: 'Database & Caches' },
            { id: 'external', label: 'External APIs' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline-block">
          {filteredComponents.length} components monitored
        </span>
      </div>

      {/* Component Cards Grid (Light Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredComponents.map((comp) => (
          <div
            key={comp.name}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  comp.status === 'operational'
                    ? 'bg-emerald-500 shadow-xs'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {comp.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="capitalize">{comp.type}</span>
                  <span>•</span>
                  <span>Latency: {comp.latencyMs}ms</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-700">
                {comp.uptime90dPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block">90d uptime</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Log (Light Mode) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent System Incidents & Root Causes
            </h3>
            <p className="text-xs text-slate-500">
              Audit log of past outages, third-party degradation events, and automated failovers
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            {incidents.length} recorded
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-900">
                    {inc.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      inc.severity === 'p1_critical'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {inc.severity.toUpperCase().replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    RESOLVED
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {inc.startedAt}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {inc.summary}
              </p>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Affected:</span>
                {inc.affectedComponents.map((comp) => (
                  <span
                    key={comp}
                    className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
