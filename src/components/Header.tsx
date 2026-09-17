import React, { useRef, useState } from 'react';
import {
  TrendingUp,
  Plus,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  MoreVertical,
  IndianRupee,
} from 'lucide-react';
import { CalculatedPeriodMetrics } from '../types';
import { formatCurrency } from '../utils/calculations';

interface HeaderProps {
  onOpenNewTradeModal: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: (file: File) => void;
  onClearAll: () => void;
  weekPnl: number;
  monthPnl: number;
  yearPnl: number;
}

export function Header({
  onOpenNewTradeModal,
  onExportJson,
  onExportCsv,
  onImportJson,
  onClearAll,
  weekPnl,
  monthPnl,
  yearPnl,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportJson(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & App Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Stock Trading Ledger
              </h1>
              <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Live Journal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Daily strategies, capital risk, P&L calculations & chart screenshots
            </p>
          </div>
        </div>

        {/* Quick Tickers & Actions */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Quick PnL Summary Strip */}
          <div className="hidden lg:flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-sans">Wk:</span>
              <span className={weekPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {formatCurrency(weekPnl)}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-sans">Mo:</span>
              <span className={monthPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {formatCurrency(monthPnl)}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-sans">Yr:</span>
              <span className={yearPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {formatCurrency(yearPnl)}
              </span>
            </div>
          </div>

          {/* New Trade Primary Action */}
          <button
            id="header-log-trade-btn"
            onClick={onOpenNewTradeModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Trade</span>
          </button>

          {/* Data Management dropdown */}
          <div className="relative">
            <button
              id="header-data-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
              title="Data & Export Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                id="header-data-dropdown"
                className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800/80">
                  Data & Backup
                </div>

                <button
                  onClick={onExportCsv}
                  className="w-full text-left px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export to CSV (Excel)</span>
                </button>

                <button
                  onClick={onExportJson}
                  className="w-full text-left px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Backup Ledger (JSON)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Restore from JSON</span>
                </button>

                <div className="border-t border-slate-800/80 my-1"></div>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all trade records? This cannot be undone.')) {
                      onClearAll();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Trades</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </header>
  );
}
