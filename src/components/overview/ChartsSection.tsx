import React, { useState } from 'react';
import { ChartDataPoint, TimePeriod } from '../../types/overview';
import { MessageCircle, PhoneCall, Bot, UserCheck } from 'lucide-react';

interface ChartsSectionProps {
  chartData: ChartDataPoint[];
  selectedPeriod: TimePeriod;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ chartData }) => {
  const [activeChartTab, setActiveChartTab] = useState<'resolution' | 'channels'>('resolution');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Maximum value for scaling the SVG chart
  const maxConv = Math.max(...chartData.map((d) => d.totalConversations), 10);
  const maxMsgs = Math.max(...chartData.map((d) => d.messengerMsgs + d.whatsAppMsgs), 20);

  // Aggregates for channel breakdown
  const totalMessenger = chartData.reduce((acc, curr) => acc + curr.messengerMsgs, 0);
  const totalWhatsApp = chartData.reduce((acc, curr) => acc + curr.whatsAppMsgs, 0);
  const totalCombined = totalMessenger + totalWhatsApp || 1;
  const messengerPercent = Math.round((totalMessenger / totalCombined) * 100);
  const whatsAppPercent = 100 - messengerPercent;

  // Aggregates for resolution
  const totalAi = chartData.reduce((acc, curr) => acc + curr.aiHandled, 0);
  const totalHuman = chartData.reduce((acc, curr) => acc + curr.humanHandled, 0);
  const totalAllConv = totalAi + totalHuman || 1;
  const aiPercent = Math.round((totalAi / totalAllConv) * 100);
  const humanPercent = 100 - aiPercent;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary Chart: Conversations Over Time */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Conversations Over Time
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Trendline of inbound volume and resolution type
              </p>
            </div>

            {/* Toggle view: AI vs Human or Channel */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveChartTab('resolution')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeChartTab === 'resolution'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                AI vs Human Handled
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('channels')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeChartTab === 'channels'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Channel Volume
              </button>
            </div>
          </div>

          {/* Interactive Chart Visual */}
          <div className="relative h-56 w-full pt-4">
            <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pb-6">
              {chartData.map((item, idx) => {
                const isHovered = hoveredIdx === idx;
                const heightPercent =
                  activeChartTab === 'resolution'
                    ? (item.totalConversations / maxConv) * 100
                    : ((item.messengerMsgs + item.whatsAppMsgs) / maxMsgs) * 100;

                const primaryPercent =
                  activeChartTab === 'resolution'
                    ? (item.aiHandled / (item.totalConversations || 1)) * 100
                    : (item.messengerMsgs / ((item.messengerMsgs + item.whatsAppMsgs) || 1)) * 100;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[11px] font-mono py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none">
                        <div>{item.timeLabel}</div>
                        {activeChartTab === 'resolution' ? (
                          <div className="text-slate-300">
                            AI: {item.aiHandled} · Staff: {item.humanHandled}
                          </div>
                        ) : (
                          <div className="text-slate-300">
                            Messenger: {item.messengerMsgs} · WhatsApp: {item.whatsAppMsgs}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stacked Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      className="w-full max-w-[36px] rounded-t-lg overflow-hidden flex flex-col justify-end bg-slate-100 transition-all duration-200 group-hover:opacity-90"
                    >
                      {activeChartTab === 'resolution' ? (
                        <>
                          {/* Staff portion (top) */}
                          <div
                            style={{ height: `${100 - primaryPercent}%` }}
                            className="w-full bg-amber-400"
                          />
                          {/* AI portion (bottom) */}
                          <div
                            style={{ height: `${primaryPercent}%` }}
                            className="w-full bg-slate-900"
                          />
                        </>
                      ) : (
                        <>
                          {/* WhatsApp portion */}
                          <div
                            style={{ height: `${100 - primaryPercent}%` }}
                            className="w-full bg-emerald-500"
                          />
                          {/* Messenger portion */}
                          <div
                            style={{ height: `${primaryPercent}%` }}
                            className="w-full bg-blue-500"
                          />
                        </>
                      )}
                    </div>

                    {/* X-axis Label */}
                    <span className="absolute bottom-0 text-[10px] text-slate-400 font-medium">
                      {item.timeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          {activeChartTab === 'resolution' ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-900" />
                <span className="text-slate-600 font-medium">AI-Handled ({aiPercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span className="text-slate-600 font-medium">Human Handover ({humanPercent}%)</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-500" />
                <span className="text-slate-600 font-medium">Messenger ({messengerPercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-600 font-medium">WhatsApp ({whatsAppPercent}%)</span>
              </div>
            </div>
          )}

          <span className="text-slate-400 text-[11px]">Hover over bars to inspect details</span>
        </div>
      </div>

      {/* Right Column: AI vs Human Handled & Channel Breakdown Summary */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Resolution & Channel Split
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Operational efficiency across message touchpoints
          </p>

          {/* AI vs Human Split Card */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-slate-900" />
                AI Automated Resolution
              </span>
              <span className="font-mono">{aiPercent}%</span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${aiPercent}%` }} className="bg-slate-900 h-full" />
              <div style={{ width: `${humanPercent}%` }} className="bg-amber-400 h-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{totalAi.toLocaleString()} cases automated</span>
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <UserCheck className="w-3 h-3 text-amber-500" />
                {totalHuman.toLocaleString()} staff handoffs
              </span>
            </div>
          </div>

          <div className="my-5 border-t border-slate-100" />

          {/* Messenger vs WhatsApp Split */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800">
              Inbound Messages by Channel
            </div>

            {/* Messenger row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/50 border border-blue-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Messenger
                  </div>
                  <div className="text-[10px] text-slate-500">Facebook Page Chat</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold font-mono text-slate-900">
                  {totalMessenger.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {messengerPercent}%
                </div>
              </div>
            </div>

            {/* WhatsApp row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    WhatsApp
                  </div>
                  <div className="text-[10px] text-slate-500">Business Cloud API</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold font-mono text-slate-900">
                  {totalWhatsApp.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {whatsAppPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Auto-synchronized across both Meta Cloud and WhatsApp webhooks.
        </div>
      </div>
    </div>
  );
};
