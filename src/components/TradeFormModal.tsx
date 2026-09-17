import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, ArrowUpRight, ArrowDownRight, Percent, IndianRupee, Calendar, Clock, Tag, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { InstrumentType, TradeEntry, TradeOutcome, TradeSide } from '../types';
import { DEFAULT_STRATEGIES } from '../utils/calculations';
import { compressScreenshot } from '../utils/storage';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: TradeEntry) => void;
  initialTrade?: TradeEntry | null;
  existingStrategies?: string[];
}

export function TradeFormModal({
  isOpen,
  onClose,
  onSave,
  initialTrade,
  existingStrategies = [],
}: TradeFormModalProps) {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('');
  const [customStrategy, setCustomStrategy] = useState<string>('');
  const [side, setSide] = useState<TradeSide>('LONG');
  const [instrument, setInstrument] = useState<InstrumentType>('Stock');
  const [amountStr, setAmountStr] = useState<string>('');
  const [pnlStr, setPnlStr] = useState<string>('');
  const [pnlSign, setPnlSign] = useState<'+' | '-'>('+');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(4);
  const [tagsStr, setTagsStr] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine default strategies with user-created strategies
  const strategyOptions = Array.from(
    new Set([...DEFAULT_STRATEGIES, ...existingStrategies.filter(Boolean)])
  );

  // Initialize or reset form state
  useEffect(() => {
    if (initialTrade) {
      setDate(initialTrade.date);
      setTime(initialTrade.time || '');
      setSymbol(initialTrade.symbol);
      if (DEFAULT_STRATEGIES.includes(initialTrade.strategy)) {
        setStrategy(initialTrade.strategy);
        setCustomStrategy('');
      } else {
        setStrategy('CUSTOM');
        setCustomStrategy(initialTrade.strategy);
      }
      setSide(initialTrade.side);
      setInstrument(initialTrade.instrument);
      setAmountStr(initialTrade.amount.toString());
      const pnlVal = initialTrade.pnl;
      setPnlSign(pnlVal < 0 ? '-' : '+');
      setPnlStr(Math.abs(pnlVal).toString());
      setScreenshotUrl(initialTrade.screenshotUrl || '');
      setNotes(initialTrade.notes || '');
      setRating(initialTrade.rating || 4);
      setTagsStr((initialTrade.tags || []).join(', '));
    } else {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
      setSymbol('');
      setStrategy('Breakout');
      setCustomStrategy('');
      setSide('LONG');
      setInstrument('Stock');
      setAmountStr('');
      setPnlStr('');
      setPnlSign('+');
      setScreenshotUrl('');
      setNotes('');
      setRating(4);
      setTagsStr('');
    }
  }, [initialTrade, isOpen]);

  // Support clipboard pasting of screenshots (Ctrl+V) directly into modal!
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setIsCompressing(true);
            try {
              const compressed = await compressScreenshot(file);
              setScreenshotUrl(compressed);
            } catch (err) {
              console.error('Failed to paste image', err);
            } finally {
              setIsCompressing(false);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Live calculations for ROI and Outcome
  const amountNum = parseFloat(amountStr) || 0;
  const rawPnl = parseFloat(pnlStr) || 0;
  const pnlNum = pnlSign === '-' ? -Math.abs(rawPnl) : Math.abs(rawPnl);
  const liveRoi = amountNum > 0 ? (pnlNum / amountNum) * 100 : 0;
  const outcome: TradeOutcome = pnlNum > 0 ? 'WIN' : pnlNum < 0 ? 'LOSS' : 'BREAKEVEN';

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCompressing(true);
    try {
      const compressed = await compressScreenshot(file);
      setScreenshotUrl(compressed);
    } catch (err) {
      console.error('Error processing screenshot', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim()) {
      alert('Please enter a ticker symbol (e.g. NVDA, SPY)');
      return;
    }

    if (amountNum <= 0) {
      alert('Please enter a valid amount / position capital');
      return;
    }

    const finalStrategy = strategy === 'CUSTOM' ? customStrategy.trim() || 'Custom' : strategy;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newTrade: TradeEntry = {
      id: initialTrade ? initialTrade.id : `trade-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: date || new Date().toISOString().split('T')[0],
      time: time || undefined,
      symbol: symbol.toUpperCase().trim(),
      strategy: finalStrategy,
      side,
      instrument,
      amount: amountNum,
      pnl: pnlNum,
      roi: liveRoi,
      outcome,
      screenshotUrl: screenshotUrl || undefined,
      notes: notes.trim() || undefined,
      rating,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: initialTrade ? initialTrade.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    // Confetti celebration if positive win
    if (pnlNum > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#3b82f6'],
        });
      } catch {
        // silent
      }
    }

    onSave(newTrade);
    onClose();
  };

  return (
    <div
      id="trade-form-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="trade-form-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl ${outcome === 'WIN' ? 'bg-emerald-500/10 text-emerald-400' : outcome === 'LOSS' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {initialTrade ? 'Edit Trade Entry' : 'Log Daily Trade'}
              </h2>
              <p className="text-xs text-slate-400">
                Input your strategy, deployed amount, profit/loss, and chart screenshot.
              </p>
            </div>
          </div>
          <button
            id="close-trade-form-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top Row: Date, Time, Symbol */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date
              </label>
              <input
                id="trade-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time (optional)
              </label>
              <input
                id="trade-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Symbol / Ticker
              </label>
              <input
                id="trade-symbol-input"
                type="text"
                placeholder="e.g. RELIANCE, NIFTY, TATASTEEL, INFY"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold tracking-wider text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
              />
            </div>
          </div>

          {/* Strategy Section */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Trading Strategy Used
              </label>
              <span className="text-[11px] text-slate-400">Essential for strategy calculation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  id="trade-strategy-select"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {strategyOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Strategy...</option>
                </select>
              </div>

              {strategy === 'CUSTOM' ? (
                <div>
                  <input
                    id="trade-custom-strategy-input"
                    type="text"
                    placeholder="Enter strategy name..."
                    value={customStrategy}
                    onChange={(e) => setCustomStrategy(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-800 border border-indigo-500/50 rounded-xl text-sm text-indigo-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
                  {['Breakout', 'VWAP Bounce', 'Gap & Go', 'Mean Reversion'].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setStrategy(quick)}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${strategy === quick ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'}`}
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Position Type: Side & Instrument */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Position Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="trade-side-long-btn"
                  onClick={() => setSide('LONG')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${side === 'LONG' ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-400 shadow-sm' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  LONG
                </button>
                <button
                  type="button"
                  id="trade-side-short-btn"
                  onClick={() => setSide('SHORT')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition ${side === 'SHORT' ? 'bg-rose-500/15 border-rose-500/80 text-rose-400 shadow-sm' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  SHORT
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Instrument</label>
              <select
                id="trade-instrument-select"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Stock">Stock / Equities</option>
                <option value="Options">Options Contract</option>
                <option value="Futures">Futures</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
              </select>
            </div>
          </div>

          {/* Core Financial Numbers: Amount & Profit/Loss */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount Traded */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    Amount / Position Size (₹)
                  </span>
                  <span className="text-[11px] text-slate-400">Total Capital</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">₹</span>
                  <input
                    id="trade-amount-input"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="25000"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Profit / Loss */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Profit / Loss (₹)</span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${outcome === 'WIN' ? 'text-emerald-400 bg-emerald-500/10' : outcome === 'LOSS' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400'}`}>
                    {outcome}
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
                    <button
                      type="button"
                      id="pnl-sign-plus"
                      onClick={() => setPnlSign('+')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${pnlSign === '+' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      id="pnl-sign-minus"
                      onClick={() => setPnlSign('-')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${pnlSign === '-' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      -
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">₹</span>
                    <input
                      id="trade-pnl-input"
                      type="number"
                      step="any"
                      placeholder="1500"
                      value={pnlStr}
                      onChange={(e) => setPnlStr(e.target.value)}
                      required
                      className={`w-full pl-8 pr-3 py-2 bg-slate-800 border rounded-xl text-sm font-mono font-semibold placeholder-slate-500 focus:outline-none ${pnlSign === '+' ? 'border-slate-700 text-emerald-400 focus:border-emerald-500' : 'border-slate-700 text-rose-400 focus:border-rose-500'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Calculation Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-slate-500" />
                <span>Calculated Return (ROI):</span>
                <span className={`font-mono font-bold ${liveRoi > 0 ? 'text-emerald-400' : liveRoi < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {liveRoi > 0 ? `+${liveRoi.toFixed(2)}%` : `${liveRoi.toFixed(2)}%`}
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Net P&L: <span className={`font-mono font-bold ${pnlNum > 0 ? 'text-emerald-400' : pnlNum < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {pnlNum >= 0 ? `+₹${Math.abs(pnlNum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-₹${Math.abs(pnlNum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          </div>

          {/* Screenshot Upload Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                Chart / Execution Screenshot
              </label>
              <span className="text-[11px] text-sky-400/90 font-mono">
                Tip: Press Ctrl+V to paste screenshot directly!
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {screenshotUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
                <img
                  src={screenshotUrl}
                  alt="Trade execution chart"
                  className="w-full max-h-48 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    id="remove-screenshot-btn"
                    onClick={() => setScreenshotUrl('')}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                id="screenshot-dropzone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition ${dragActive ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600'}`}
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {isCompressing ? 'Processing screenshot...' : 'Click to browse or drag and drop chart image'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports PNG, JPG, WebP. Or copy screenshot and paste (Ctrl+V) anywhere.
                </p>
              </div>
            )}
          </div>

          {/* Notes & Execution Rating */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Trade Review & Execution Notes
              </label>
              <textarea
                id="trade-notes-input"
                rows={2}
                placeholder="Why did you take this trade? Did you adhere to your stop loss and risk rules? Key takeaways..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  id="trade-tags-input"
                  type="text"
                  placeholder="e.g. A+ Setup, Followed Rules, FOMO"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Execution Discipline Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-mono">{rating}/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="cancel-trade-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-trade-btn"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              {initialTrade ? 'Update Trade Record' : 'Save to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
