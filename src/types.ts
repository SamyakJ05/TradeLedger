export type TradeSide = 'LONG' | 'SHORT';

export type InstrumentType = 'Stock' | 'Options' | 'Futures' | 'Crypto' | 'Forex';

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

export type PeriodType = 'week' | 'month' | 'year' | 'all';

export interface TradeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  symbol: string; // e.g. NVDA, SPY, AAPL
  strategy: string; // e.g. Breakout, VWAP Bounce, Gap & Go
  side: TradeSide;
  instrument: InstrumentType;
  amount: number; // Total amount / position size / capital deployed (₹)
  pnl: number; // Profit or Loss (₹)
  roi: number; // Percentage return ((pnl / amount) * 100)
  outcome: TradeOutcome;
  screenshotUrl?: string; // base64 or blob URL of the chart/execution screenshot
  notes?: string;
  rating?: number; // 1 - 5 stars
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StrategyStat {
  strategy: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number; // percentage (0 - 100)
  totalPnl: number;
  totalAmount: number;
  avgPnl: number;
  avgRoi: number;
  profitFactor: number;
}

export interface DailyPnlPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. Mon, Sep 15
  pnl: number;
  cumulativePnl: number;
  amount: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
}

export interface CalculatedPeriodMetrics {
  periodType: PeriodType;
  periodKey: string; // e.g., "2026-W38", "2026-09", "2026", "all"
  periodTitle: string; // Human-friendly label e.g., "This Week (Sep 14 - Sep 20)", "September 2026", "2026"
  dateRange: {
    start: string;
    end: string;
  };
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage
  totalAmountTraded: number; // Total capital deployed
  totalPnl: number; // Net Profit / Loss
  totalRoi: number; // Overall percentage return
  grossProfit: number;
  grossLoss: number;
  profitFactor: number; // grossProfit / Math.abs(grossLoss)
  avgTradePnl: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  largestWin: number;
  largestLoss: number;
  strategies: StrategyStat[];
  dailyBreakdown: DailyPnlPoint[];
}

export interface LedgerFilterState {
  searchQuery: string;
  strategy: string;
  outcome: 'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN';
  instrument: string;
  side: string;
  hasScreenshot: boolean | null;
  startDate: string;
  endDate: string;
  sortBy: 'date-desc' | 'date-asc' | 'pnl-desc' | 'pnl-asc' | 'amount-desc';
}
