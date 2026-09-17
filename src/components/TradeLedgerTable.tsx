import React, { useState, useMemo } from 'react';
import {
  TradeEntry,
  LedgerFilterState,
} from '../types';
import {
  formatCurrency,
  formatPercent,
} from '../utils/calculations';
import {
  Search,
  Filter,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ExternalLink,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';

interface TradeLedgerTableProps {
  trades: TradeEntry[];
  strategies: string[];
  onEditTrade: (trade: TradeEntry) => void;
  onDeleteTrade: (id: string) => void;
  onOpenScreenshot: (url: string, title?: string) => void;
  onAddNewTrade: () => void;
}

export function TradeLedgerTable({
  trades,
  strategies,
  onEditTrade,
  onDeleteTrade,
  onOpenScreenshot,
  onAddNewTrade,
}: TradeLedgerTableProps) {
  const [filters, setFilters] = useState<LedgerFilterState>({
    searchQuery: '',
    strategy: 'ALL',
    outcome: 'ALL',
    instrument: 'ALL',
    side: 'ALL',
    hasScreenshot: null,
    startDate: '',
    endDate: '',
    sortBy: 'date-desc',
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filter and Sort logic
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchSymbol = t.symbol.toLowerCase().includes(q);
        const matchStrategy = t.strategy.toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchSymbol && !matchStrategy && !matchNotes && !matchTags) return false;
      }

      // Strategy
      if (filters.strategy !== 'ALL' && t.strategy !== filters.strategy) {
        return false;
      }

      // Outcome
      if (filters.outcome !== 'ALL' && t.outcome !== filters.outcome) {
        return false;
      }

      // Screenshot filter
      if (filters.hasScreenshot === true && !t.screenshotUrl) return false;
      if (filters.hasScreenshot === false && t.screenshotUrl) return false;

      // Date range
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'date-desc') {
        const cmp = b.date.localeCompare(a.date);
        return cmp !== 0 ? cmp : (b.time || '').localeCompare(a.time || '');
      }
      if (filters.sortBy === 'date-asc') {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : (a.time || '').localeCompare(b.time || '');
      }
      if (filters.sortBy === 'pnl-desc') {
        return b.pnl - a.pnl;
      }
      if (filters.sortBy === 'pnl-asc') {
        return a.pnl - b.pnl;
      }
      if (filters.sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      return 0;
    });
  }, [trades, filters]);

  // Totals for filtered trades
  const filteredTotalPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
  const filteredTotalAmount = filteredTrades.reduce((acc, t) => acc + t.amount, 0);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      strategy: 'ALL',
      outcome: 'ALL',
      instrument: 'ALL',
      side: 'ALL',
      hasScreenshot: null,
      startDate: '',
      endDate: '',
      sortBy: 'date-desc',
    });
  };

  return (
    <div id="trade-ledger-table-container" className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Header & Filter Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Daily Trading Ledger</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {filteredTrades.length} {filteredTrades.length === 1 ? 'Trade' : 'Trades'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed chronological record of strategies, deployed amounts, P&L, and chart screenshots.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="toggle-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                showFilters
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button
              id="add-new-trade-ledger-btn"
              onClick={onAddNewTrade}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Trade</span>
            </button>
          </div>
        </div>

        {/* Search bar & quick filters */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              id="search-ledger-input"
              type="text"
              placeholder="Search ticker (e.g. NVDA), strategy, or notes..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              id="filter-strategy-select"
              value={filters.strategy}
              onChange={(e) => setFilters({ ...filters, strategy: e.target.value })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Strategies</option>
              {strategies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              id="filter-outcome-select"
              value={filters.outcome}
              onChange={(e) => setFilters({ ...filters, outcome: e.target.value as any })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Wins Only</option>
              <option value="LOSS">Losses Only</option>
              <option value="BREAKEVEN">Breakeven</option>
            </select>

            <select
              id="sort-trades-select"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="pnl-desc">Highest Profit</option>
              <option value="pnl-asc">Highest Loss</option>
              <option value="amount-desc">Largest Amount</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-400 mb-1">Has Screenshot</label>
              <select
                value={filters.hasScreenshot === null ? 'ALL' : filters.hasScreenshot ? 'YES' : 'NO'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters({
                    ...filters,
                    hasScreenshot: val === 'ALL' ? null : val === 'YES',
                  });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value="ALL">Any</option>
                <option value="YES">With Screenshot Only</option>
                <option value="NO">Without Screenshot</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 font-semibold">Date / Time</th>
              <th className="py-3 px-3 font-semibold">Symbol</th>
              <th className="py-3 px-3 font-semibold">Strategy</th>
              <th className="py-3 px-3 font-semibold text-right">Amount Traded</th>
              <th className="py-3 px-4 font-semibold text-right">Profit / Loss (ROI)</th>
              <th className="py-3 px-3 font-semibold text-center">Chart Screenshot</th>
              <th className="py-3 px-3 font-semibold text-center">Discipline</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTrades.map((trade) => {
              const isWin = trade.pnl > 0;
              const isLoss = trade.pnl < 0;
              const isExpanded = expandedRowId === trade.id;

              return (
                <React.Fragment key={trade.id}>
                  <tr
                    id={`trade-row-${trade.id}`}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      isExpanded ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    {/* Date / Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-200 font-medium">{trade.date}</div>
                      {trade.time && (
                        <div className="text-[11px] text-slate-500 font-mono">{trade.time}</div>
                      )}
                    </td>

                    {/* Symbol & Direction */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {trade.symbol}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            trade.side === 'LONG'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {trade.instrument}
                        </span>
                      </div>
                    </td>

                    {/* Strategy Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {trade.strategy}
                      </span>
                    </td>

                    {/* Amount Traded */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-slate-200 font-medium">
                      {formatCurrency(trade.amount)}
                    </td>

                    {/* Profit / Loss with ROI */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div
                        className={`font-mono font-bold text-sm ${
                          isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                        }`}
                      >
                        {trade.pnl >= 0 ? `+${formatCurrency(trade.pnl)}` : formatCurrency(trade.pnl)}
                      </div>
                      <div
                        className={`text-[11px] font-mono ${
                          isWin ? 'text-emerald-500/80' : isLoss ? 'text-rose-500/80' : 'text-slate-500'
                        }`}
                      >
                        {formatPercent(trade.roi)}
                      </div>
                    </td>

                    {/* Screenshot Preview Thumbnail */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {trade.screenshotUrl ? (
                        <div
                          onClick={() =>
                            onOpenScreenshot(
                              trade.screenshotUrl!,
                              `${trade.symbol} (${trade.strategy}) - ${trade.date}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:border-sky-500/50 hover:bg-slate-750 cursor-pointer group/thumb transition"
                          title="Click to view full resolution screenshot"
                        >
                          <img
                            src={trade.screenshotUrl}
                            alt="thumb"
                            className="w-6 h-6 object-cover rounded"
                          />
                          <span className="text-[11px] text-sky-400 font-medium flex items-center gap-0.5">
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic">No image</span>
                      )}
                    </td>

                    {/* Discipline Rating & Notes expansion indicator */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-0.5 text-amber-400">
                        {Array.from({ length: trade.rating || 4 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </td>

                    {/* Actions: Edit, Delete, Details */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {trade.notes && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRowId(isExpanded ? null : trade.id)
                            }
                            className={`p-1.5 rounded-lg text-xs transition ${
                              isExpanded
                                ? 'bg-slate-700 text-slate-200'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                            title="Toggle Notes"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}
                        <button
                          type="button"
                          id={`edit-trade-${trade.id}`}
                          onClick={() => onEditTrade(trade)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition"
                          title="Edit Trade"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-trade-${trade.id}`}
                          onClick={() => {
                            if (window.confirm(`Delete ${trade.symbol} trade from ${trade.date}?`)) {
                              onDeleteTrade(trade.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Trade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Notes & Tags Drawer */}
                  {isExpanded && trade.notes && (
                    <tr className="bg-slate-950/70 border-b border-slate-800/80">
                      <td colSpan={8} className="p-4 pl-12">
                        <div className="text-xs text-slate-300 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-400">Execution Review:</span>
                            <span className="text-slate-200 italic">{trade.notes}</span>
                          </div>
                          {trade.tags && trade.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="text-[11px] text-slate-500">Tags:</span>
                              {trade.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredTrades.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
                  {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">No trades recorded yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Your ledger is ready. Log your trades with strategies, amount in ₹, profit/loss, and chart screenshots.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="empty-ledger-log-btn"
                        onClick={onAddNewTrade}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Log First Trade</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm font-medium text-slate-400">No trades match your filter</p>
                      <button
                        onClick={resetFilters}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Summary Footer */}
          {filteredTrades.length > 0 && (
            <tfoot>
              <tr className="bg-slate-950 border-t border-slate-800 font-semibold text-xs">
                <td colSpan={3} className="py-3 px-4 text-slate-400">
                  Total for {filteredTrades.length} displayed {filteredTrades.length === 1 ? 'trade' : 'trades'}:
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-200">
                  {formatCurrency(filteredTotalAmount)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono text-sm ${
                    filteredTotalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {filteredTotalPnl >= 0
                    ? `+${formatCurrency(filteredTotalPnl)}`
                    : formatCurrency(filteredTotalPnl)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
