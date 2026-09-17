import { CalculatedPeriodMetrics } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Calendar, TrendingUp, TrendingDown, Target, Award, ArrowRight } from 'lucide-react';

interface PeriodSummaryCardsProps {
  weekMetrics: CalculatedPeriodMetrics;
  monthMetrics: CalculatedPeriodMetrics;
  yearMetrics: CalculatedPeriodMetrics;
  selectedPeriodType: string;
  onSelectPeriodType: (type: 'week' | 'month' | 'year' | 'all') => void;
}

export function PeriodSummaryCards({
  weekMetrics,
  monthMetrics,
  yearMetrics,
  selectedPeriodType,
  onSelectPeriodType,
}: PeriodSummaryCardsProps) {
  const cards = [
    {
      id: 'week' as const,
      label: 'This Week',
      sublabel: weekMetrics.periodTitle,
      metrics: weekMetrics,
      icon: Calendar,
      accentColor: 'indigo',
    },
    {
      id: 'month' as const,
      label: 'This Month',
      sublabel: monthMetrics.periodTitle,
      metrics: monthMetrics,
      icon: Target,
      accentColor: 'sky',
    },
    {
      id: 'year' as const,
      label: 'This Year',
      sublabel: yearMetrics.periodTitle,
      metrics: yearMetrics,
      icon: Award,
      accentColor: 'emerald',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const isSelected = selectedPeriodType === card.id;
        const m = card.metrics;
        const isProfitable = m.totalPnl >= 0;

        return (
          <div
            key={card.id}
            id={`summary-card-${card.id}`}
            onClick={() => onSelectPeriodType(card.id)}
            className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-200 group ${
              isSelected
                ? 'bg-slate-900/90 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xl shadow-slate-950/50'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
            }`}
          >
            {/* Top row: title badge & period range */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                {isSelected && (
                  <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active View
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 truncate max-w-[140px]" title={card.sublabel}>
                {card.sublabel}
              </span>
            </div>

            {/* Main P&L calculation */}
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                  <span>Net Profit / Loss</span>
                </div>
                <div
                  className={`text-2xl font-bold font-mono tracking-tight flex items-center gap-1.5 ${
                    isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isProfitable ? (
                    <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                  )}
                  {formatCurrency(m.totalPnl)}
                </div>
              </div>

              {/* ROI percentage badge */}
              <div
                className={`text-right px-2.5 py-1 rounded-xl font-mono text-xs font-semibold ${
                  isProfitable ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}
              >
                {formatPercent(m.totalRoi)}
                <div className="text-[10px] text-slate-500 font-sans font-normal">ROI</div>
              </div>
            </div>

            {/* Secondary metrics grid: Amount Traded, Win Rate, Trades */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <div className="text-[11px] text-slate-500">Amount Traded</div>
                <div className="font-mono font-medium text-slate-200 mt-0.5 truncate" title={formatCurrency(m.totalAmountTraded)}>
                  {formatCurrency(m.totalAmountTraded)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500">Win Rate</div>
                <div className="font-mono font-medium text-slate-200 mt-0.5">
                  {m.winRate.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500">Trades (W/L)</div>
                <div className="font-mono font-medium text-slate-200 mt-0.5">
                  <span className="text-emerald-400">{m.winningTrades}W</span> /{' '}
                  <span className="text-rose-400">{m.losingTrades}L</span>
                </div>
              </div>
            </div>

            {/* Profit factor & view details link */}
            <div className="mt-3 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Profit Factor: <strong className="text-slate-200 font-mono">{m.profitFactor > 0 ? m.profitFactor.toFixed(2) : '—'}</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 transition-colors">
                <span>Detailed Calculation</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
