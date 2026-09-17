import React, { useState } from 'react';
import {
  CalculatedPeriodMetrics,
  DailyPnlPoint,
  PeriodType,
  StrategyStat,
} from '../types';
import {
  formatCurrency,
  formatPercent,
  formatCompactCurrency,
} from '../utils/calculations';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface CalculationsViewProps {
  metrics: CalculatedPeriodMetrics;
  periodType: PeriodType;
  onChangePeriodType: (type: PeriodType) => void;
  availableMonths: { year: number; month: number; label: string; key: string }[];
  availableYears: number[];
  selectedMonthKey: string;
  onChangeMonth: (key: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  weekOffset: number;
  onChangeWeekOffset: (delta: number) => void;
}

export function CalculationsView({
  metrics,
  periodType,
  onChangePeriodType,
  availableMonths,
  availableYears,
  selectedMonthKey,
  onChangeMonth,
  selectedYear,
  onChangeYear,
  weekOffset,
  onChangeWeekOffset,
}: CalculationsViewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DailyPnlPoint | null>(null);

  const isProfitable = metrics.totalPnl >= 0;

  return (
    <div id="calculations-view-container" className="space-y-6">
      {/* Period Selection & Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Period Type Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            id="tab-period-week"
            onClick={() => onChangePeriodType('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodType === 'week'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Weekly
          </button>
          <button
            id="tab-period-month"
            onClick={() => onChangePeriodType('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodType === 'month'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            id="tab-period-year"
            onClick={() => onChangePeriodType('year')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodType === 'year'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Yearly
          </button>
          <button
            id="tab-period-all"
            onClick={() => onChangePeriodType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodType === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All-Time
          </button>
        </div>

        {/* Dynamic Period Granularity Selector */}
        <div className="flex items-center space-x-2">
          {periodType === 'week' && (
            <div className="flex items-center space-x-2">
              <button
                id="prev-week-btn"
                onClick={() => onChangeWeekOffset(-1)}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-slate-200">
                {metrics.periodTitle}
              </div>
              <button
                id="next-week-btn"
                onClick={() => onChangeWeekOffset(1)}
                disabled={weekOffset >= 0}
                className={`p-1.5 rounded-lg border transition ${
                  weekOffset >= 0
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => onChangeWeekOffset(-weekOffset)}
                  className="text-[11px] text-emerald-400 hover:underline px-1"
                >
                  Current Week
                </button>
              )}
            </div>
          )}

          {periodType === 'month' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Select Month:</span>
              <select
                id="select-month-dropdown"
                value={selectedMonthKey}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'year' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Select Year:</span>
              <select
                id="select-year-dropdown"
                value={selectedYear}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'all' && (
            <div className="text-xs text-slate-400">
              Cumulative historical records ({metrics.totalTrades} total trades)
            </div>
          )}
        </div>
      </div>

      {/* Main Calculated Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net P&L */}
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Net Profit / Loss</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {isProfitable ? 'PROFITABLE' : 'DRAWDOWN'}
            </span>
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(metrics.totalPnl)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Avg / Trade:</span>
            <span
              className={`font-mono ${
                metrics.avgTradePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(metrics.avgTradePnl)}
            </span>
          </div>
        </div>

        {/* Capital Amount Deployed & ROI */}
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Amount Traded</span>
            <span className="text-[10px] text-slate-500 font-mono">CAPITAL</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {formatCurrency(metrics.totalAmountTraded)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Calculated Return:</span>
            <span
              className={`font-mono font-semibold ${
                metrics.totalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(metrics.totalRoi)}
            </span>
          </div>
        </div>

        {/* Win Rate & Trades Breakdown */}
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Win Rate</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {metrics.totalTrades} Trades
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight flex items-baseline gap-2">
            <span>{metrics.winRate.toFixed(1)}%</span>
            <div className="w-12 bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${metrics.winRate}%` }}
              ></div>
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${100 - metrics.winRate}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Wins / Losses:</span>
            <span className="font-mono">
              <strong className="text-emerald-400">{metrics.winningTrades}W</strong> -{' '}
              <strong className="text-rose-400">{metrics.losingTrades}L</strong>
              {metrics.breakevenTrades > 0 && (
                <span className="text-slate-400"> ({metrics.breakevenTrades}BE)</span>
              )}
            </span>
          </div>
        </div>

        {/* Profit Factor & Risk/Reward */}
        <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Profit Factor</span>
            <span className="text-[10px] text-slate-400 font-mono">GROSS P/L</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {metrics.profitFactor > 0 ? metrics.profitFactor.toFixed(2) : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Win/Loss Ratio:</span>
            <span className="font-mono text-slate-300">
              {metrics.winLossRatio > 0 ? `${metrics.winLossRatio.toFixed(2)} : 1` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Calculation Breakdown (Gross Profit, Gross Loss, Avg Win, Avg Loss, Largest Win, Largest Loss) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="text-slate-500 text-[11px]">Gross Profits</div>
          <div className="text-emerald-400 font-mono font-semibold text-sm mt-0.5">
            +{formatCurrency(metrics.grossProfit)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg Win: <span className="text-slate-300 font-mono">+{formatCurrency(metrics.avgWin)}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="text-slate-500 text-[11px]">Gross Losses</div>
          <div className="text-rose-400 font-mono font-semibold text-sm mt-0.5">
            -{formatCurrency(metrics.grossLoss)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg Loss: <span className="text-slate-300 font-mono">-{formatCurrency(metrics.avgLoss)}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="text-slate-500 text-[11px]">Largest Winning Trade</div>
          <div className="text-emerald-400 font-mono font-semibold text-sm mt-0.5">
            +{formatCurrency(metrics.largestWin)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Best Single Setup</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50">
          <div className="text-slate-500 text-[11px]">Largest Loss Trade</div>
          <div className="text-rose-400 font-mono font-semibold text-sm mt-0.5">
            {metrics.largestLoss < 0 ? formatCurrency(metrics.largestLoss) : '$0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Risk Boundary</div>
        </div>
      </div>

      {/* Cumulative Equity Curve / Daily Timeline Chart */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Cumulative Equity Curve & Daily P&L for {metrics.periodTitle}
            </h3>
            <p className="text-xs text-slate-400">
              Track how your trading capital progressed across each trading session.
            </p>
          </div>

          {hoveredPoint && (
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-3">
              <span className="text-slate-300 font-medium">{hoveredPoint.dayLabel}:</span>
              <span className={`font-mono font-bold ${hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredPoint.pnl >= 0 ? `+${formatCurrency(hoveredPoint.pnl)}` : formatCurrency(hoveredPoint.pnl)}
              </span>
              <span className="text-slate-400 text-[11px]">
                (Cum: {formatCurrency(hoveredPoint.cumulativePnl)})
              </span>
            </div>
          )}
        </div>

        {/* SVG Equity Chart */}
        {metrics.dailyBreakdown.length > 0 ? (
          <div className="relative pt-2">
            <EquitySvgChart
              data={metrics.dailyBreakdown}
              onHover={setHoveredPoint}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No trades logged in {metrics.periodTitle}. Click "+ Log Trade" above to add entries.
          </div>
        )}
      </div>

      {/* Strategy Performance Breakdown - Crucial for user prompt */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Strategy Performance & Profitability Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Calculated analytics per strategy used during {metrics.periodTitle}.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {metrics.strategies.length} {metrics.strategies.length === 1 ? 'Strategy' : 'Strategies'} Active
          </span>
        </div>

        {metrics.strategies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Strategy</th>
                  <th className="pb-3 font-semibold text-center">Trades (W/L)</th>
                  <th className="pb-3 font-semibold text-center">Win Rate</th>
                  <th className="pb-3 font-semibold text-right">Amount Traded</th>
                  <th className="pb-3 font-semibold text-right">Net P&L</th>
                  <th className="pb-3 font-semibold text-right">Avg ROI</th>
                  <th className="pb-3 font-semibold text-right">Profit Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.strategies.map((strat) => {
                  const stratProfitable = strat.totalPnl >= 0;
                  return (
                    <tr
                      key={strat.strategy}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          <span>{strat.strategy}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono">
                        <span className="text-slate-300 font-semibold">{strat.tradesCount}</span>{' '}
                        <span className="text-[11px] text-slate-500">
                          (<span className="text-emerald-400">{strat.winCount}W</span>/
                          <span className="text-rose-400">{strat.lossCount}L</span>)
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${strat.winRate}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-slate-200 font-medium w-10 text-right">
                            {strat.winRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300">
                        {formatCurrency(strat.totalAmount)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        <span
                          className={
                            stratProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {formatCurrency(strat.totalPnl)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-medium">
                        <span
                          className={
                            strat.avgRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {formatPercent(strat.avgRoi)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300">
                        {strat.profitFactor > 0 ? strat.profitFactor.toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No strategy data recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
}

// Custom interactive SVG Equity Curve chart
function EquitySvgChart({
  data,
  onHover,
}: {
  data: DailyPnlPoint[];
  onHover: (point: DailyPnlPoint | null) => void;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Values calculation
  const cumulativeValues = data.map((d) => d.cumulativePnl);
  const minVal = Math.min(0, ...cumulativeValues);
  const maxVal = Math.max(0, ...cumulativeValues);
  const range = maxVal - minVal || 100;

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const getX = (index: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const zeroY = getY(0);

  // Generate line path
  const points = data.map((d, i) => `${getX(i)},${getY(d.cumulativePnl)}`).join(' ');

  // Area path
  const areaPath = `
    M ${getX(0)},${zeroY}
    L ${data.map((d, i) => `${getX(i)},${getY(d.cumulativePnl)}`).join(' L ')}
    L ${getX(data.length - 1)},${zeroY}
    Z
  `;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        onMouseLeave={() => {
          setHoverIndex(null);
          onHover(null);
        }}
      >
        <defs>
          <linearGradient id="equityGradientProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="equityGradientLoss" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[maxVal, (maxVal + minVal) / 2, 0, minVal].map((val, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke={val === 0 ? '#475569' : '#1e293b'}
              strokeWidth={val === 0 ? '1.5' : '1'}
              strokeDasharray={val === 0 ? 'none' : '4 4'}
            />
            <text
              x={padding.left - 8}
              y={getY(val) + 4}
              textAnchor="end"
              className="text-[10px] font-mono fill-slate-500"
            >
              {formatCompactCurrency(val)}
            </text>
          </g>
        ))}

        {/* Shaded Area */}
        <path
          d={areaPath}
          fill={data[data.length - 1].cumulativePnl >= 0 ? 'url(#equityGradientProfit)' : 'url(#equityGradientLoss)'}
        />

        {/* Main Line */}
        <polyline
          fill="none"
          stroke={data[data.length - 1].cumulativePnl >= 0 ? '#10b981' : '#f43f5e'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points and hover interaction */}
        {data.map((point, i) => {
          const cx = getX(i);
          const cy = getY(point.cumulativePnl);
          const isSelected = hoverIndex === i;

          return (
            <g
              key={point.date}
              className="cursor-pointer"
              onMouseEnter={() => {
                setHoverIndex(i);
                onHover(point);
              }}
            >
              {/* Invisible wide hit area */}
              <rect
                x={cx - 15}
                y={padding.top}
                width={30}
                height={chartHeight}
                fill="transparent"
              />

              {isSelected && (
                <line
                  x1={cx}
                  y1={padding.top}
                  x2={cx}
                  y2={padding.top + chartHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}

              <circle
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : 4}
                className={
                  point.pnl >= 0
                    ? 'fill-emerald-400 stroke-slate-900'
                    : 'fill-rose-400 stroke-slate-900'
                }
                strokeWidth="2"
              />

              {/* X-axis date labels */}
              {(data.length <= 8 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-400"
                >
                  {point.dayLabel.split(',')[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
