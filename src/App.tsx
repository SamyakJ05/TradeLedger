import { useState, useEffect, useMemo } from 'react';
import {
  CalculatedPeriodMetrics,
  PeriodType,
  TradeEntry,
} from './types';
import {
  calculateForAllTime,
  calculateForMonth,
  calculateForWeek,
  calculateForYear,
  getAvailableMonths,
  getAvailableYears,
  getIsoDate,
} from './utils/calculations';
import {
  clearAllTrades,
  deleteTrade,
  exportTradesToCsv,
  exportTradesToJson,
  loadAllTrades,
  saveTrade,
} from './utils/storage';
import { Header } from './components/Header';
import { PeriodSummaryCards } from './components/PeriodSummaryCards';
import { CalculationsView } from './components/CalculationsView';
import { TradeLedgerTable } from './components/TradeLedgerTable';
import { TradeFormModal } from './components/TradeFormModal';
import { ScreenshotLightbox } from './components/ScreenshotLightbox';
import { Calculator, ListOrdered, Sparkles, Plus } from 'lucide-react';

export default function App() {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Period navigation states
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>('week');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const currentDate = useMemo(() => new Date(), []);
  const defaultMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(defaultMonthKey);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTrade, setEditingTrade] = useState<TradeEntry | null>(null);
  const [lightboxData, setLightboxData] = useState<{ url: string; title?: string } | null>(null);

  // Active section tab: 'dashboard' (cards + calculations + ledger) or quick tabs
  const [viewMode, setViewMode] = useState<'all' | 'calculations' | 'ledger'>('all');

  // Load trades on mount
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const loaded = await loadAllTrades();
        setTrades(loaded);
      } catch (err) {
        console.error('Failed to load trades', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Compute available months & years from trades
  const availableMonths = useMemo(() => getAvailableMonths(trades), [trades]);
  const availableYears = useMemo(() => getAvailableYears(trades), [trades]);

  // Compute list of unique strategy names for auto-suggestions
  const uniqueStrategies = useMemo(() => {
    const list = trades.map((t) => t.strategy).filter(Boolean);
    return Array.from(new Set(list));
  }, [trades]);

  // Calculated metrics for Current Week, Current Month, and Current Year
  const currentWeekMetrics = useMemo(() => {
    return calculateForWeek(trades, new Date());
  }, [trades]);

  const currentMonthMetrics = useMemo(() => {
    const now = new Date();
    return calculateForMonth(trades, now.getFullYear(), now.getMonth());
  }, [trades]);

  const currentYearMetrics = useMemo(() => {
    return calculateForYear(trades, new Date().getFullYear());
  }, [trades]);

  // Metrics for the currently selected calculation period in CalculationsView
  const activeMetrics: CalculatedPeriodMetrics = useMemo(() => {
    if (selectedPeriodType === 'week') {
      const target = new Date();
      target.setDate(target.getDate() + weekOffset * 7);
      return calculateForWeek(trades, target);
    }
    if (selectedPeriodType === 'month') {
      const [y, m] = selectedMonthKey.split('-').map(Number);
      return calculateForMonth(trades, y, m - 1);
    }
    if (selectedPeriodType === 'year') {
      return calculateForYear(trades, selectedYear);
    }
    // all
    return calculateForAllTime(trades);
  }, [trades, selectedPeriodType, weekOffset, selectedMonthKey, selectedYear]);

  // Handlers
  const handleSaveTrade = async (trade: TradeEntry) => {
    await saveTrade(trade);
    setTrades((prev) => {
      const idx = prev.findIndex((t) => t.id === trade.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = trade;
        return copy.sort((a, b) => b.date.localeCompare(a.date));
      }
      return [trade, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const handleDeleteTrade = async (id: string) => {
    await deleteTrade(id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTrade = (trade: TradeEntry) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsFormOpen(true);
  };

  const handleClearAll = async () => {
    await clearAllTrades();
    setTrades([]);
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed: TradeEntry[] = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // validate minimally
          for (const item of parsed) {
            await saveTrade(item);
          }
          const loaded = await loadAllTrades();
          setTrades(loaded);
          alert(`Successfully imported ${parsed.length} trades!`);
        }
      } catch (err) {
        alert('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Header
        onOpenNewTradeModal={handleOpenNewTrade}
        onExportJson={() => exportTradesToJson(trades)}
        onExportCsv={() => exportTradesToCsv(trades)}
        onImportJson={handleImportJson}
        onClearAll={handleClearAll}
        weekPnl={currentWeekMetrics.totalPnl}
        monthPnl={currentMonthMetrics.totalPnl}
        yearPnl={currentYearMetrics.totalPnl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Section 1: Period Calculation Cards (Week, Month, Year side-by-side) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Automated Period Calculations
              </h2>
              <p className="text-xs text-slate-500">
                Live performance calculations comparing your weekly, monthly, and annual ledger totals.
              </p>
            </div>

            {/* Quick view switch */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                id="view-all-btn"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewMode === 'all'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full Overview
              </button>
              <button
                id="view-calculations-btn"
                onClick={() => setViewMode('calculations')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'calculations'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Calculations</span>
              </button>
              <button
                id="view-ledger-btn"
                onClick={() => setViewMode('ledger')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'ledger'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5 text-sky-400" />
                <span>Daily Ledger</span>
              </button>
            </div>
          </div>

          <PeriodSummaryCards
            weekMetrics={currentWeekMetrics}
            monthMetrics={currentMonthMetrics}
            yearMetrics={currentYearMetrics}
            selectedPeriodType={selectedPeriodType}
            onSelectPeriodType={(type) => {
              setSelectedPeriodType(type);
              if (viewMode === 'ledger') setViewMode('all');
            }}
          />
        </div>

        {/* Section 2: Detailed Calculations & Analytics */}
        {(viewMode === 'all' || viewMode === 'calculations') && (
          <CalculationsView
            metrics={activeMetrics}
            periodType={selectedPeriodType}
            onChangePeriodType={setSelectedPeriodType}
            availableMonths={availableMonths}
            availableYears={availableYears}
            selectedMonthKey={selectedMonthKey}
            onChangeMonth={setSelectedMonthKey}
            selectedYear={selectedYear}
            onChangeYear={setSelectedYear}
            weekOffset={weekOffset}
            onChangeWeekOffset={(delta) => setWeekOffset((prev) => prev + delta)}
          />
        )}

        {/* Section 3: Daily Trade Ledger Table with Screenshots & Notes */}
        {(viewMode === 'all' || viewMode === 'ledger') && (
          <TradeLedgerTable
            trades={trades}
            strategies={uniqueStrategies}
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
            onOpenScreenshot={(url, title) => setLightboxData({ url, title })}
            onAddNewTrade={handleOpenNewTrade}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Stock Trading Ledger & Performance Analytics</span>
          <span className="font-mono text-slate-600">
            {trades.length} Total Trades Stored & Calculated
          </span>
        </div>
      </footer>

      {/* Trade Input Modal (Add / Edit) */}
      <TradeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
        existingStrategies={uniqueStrategies}
      />

      {/* Screenshot Lightbox Modal */}
      <ScreenshotLightbox
        imageUrl={lightboxData?.url || null}
        title={lightboxData?.title}
        onClose={() => setLightboxData(null)}
      />
    </div>
  );
}
