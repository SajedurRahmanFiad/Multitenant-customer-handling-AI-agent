import React from 'react';
import { MetricCardData, TimePeriod } from '../../types/overview';
import {
  MessageSquare,
  MessagesSquare,
  Bot,
  UserCheck,
  Zap,
  AlertCircle,
  Coins,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';


interface PerformanceCardsProps {
  metrics: MetricCardData[];
  selectedPeriod: TimePeriod;
  onSelectPeriod: (period: TimePeriod) => void;
  onOpenUnanswered: () => void;
}


const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  total_conversations: MessageSquare,
  messages_handled: MessagesSquare,
  ai_resolved: Bot,
  human_handovers: UserCheck,
  avg_first_response: Zap,
  unanswered: AlertCircle,
  estimated_cost: Coins,
  csat: Smile,
};

export const PerformanceCards: React.FC<PerformanceCardsProps> = ({
  metrics,
  selectedPeriod,
  onSelectPeriod,
  onOpenUnanswered,
}) => {
  const { formatForActiveTenant, activeTenantCurrency } = useCurrency();

  return (
    <div className="space-y-4">
      {/* Section Header & Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Key Performance Metrics
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Real-time business performance and resolution efficiency
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          {(
            [
              { id: '24h', label: 'Last 24 Hours' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectPeriod(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedPeriod === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((card) => {
          const Icon = METRIC_ICONS[card.id] || MessageSquare;
          const isUrgent = card.urgent && card.numericValue > 0;
          const isCostCard = card.id === 'estimated_cost';
          const cardLabel = isCostCard ? `Estimated AI cost (${activeTenantCurrency.code})` : card.label;
          const cardDisplayValue = isCostCard ? formatForActiveTenant(card.numericValue) : card.value;

          return (
            <div
              key={card.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 bg-white ${
                isUrgent
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 leading-tight">
                    {cardLabel}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
                    {cardDisplayValue}
                  </span>
                  {card.unit && !isCostCard && (
                    <span className="text-xs text-slate-500 font-semibold font-mono">
                      {card.unit}
                    </span>
                  )}
                </div>
              </div>


              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="line-clamp-1 text-slate-500" title={card.explanation}>
                  {card.explanation}
                </span>

                {card.id === 'unanswered' && isUrgent ? (
                  <button
                    type="button"
                    onClick={onOpenUnanswered}
                    className="shrink-0 font-semibold text-amber-700 hover:text-amber-800 ml-2 underline"
                  >
                    Review Now
                  </button>
                ) : card.changePercent !== undefined && card.changePercent !== 0 ? (
                  <span
                    className={`shrink-0 inline-flex items-center font-mono font-medium ml-2 ${
                      card.changePercent > 0
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {card.changePercent > 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(card.changePercent)}%
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
