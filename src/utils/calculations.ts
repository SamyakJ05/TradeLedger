import { CalculatedPeriodMetrics, DailyPnlPoint, PeriodType, StrategyStat, TradeEntry } from '../types';

// Helper to format ISO date
export function getIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get ISO week number and year
export function getWeekDetails(d: Date): { year: number; week: number; start: string; end: string; label: string } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Day of week (0 is Sunday, convert to Monday = 1 ... Sunday = 7)
  const dayNum = date.getUTCDay() || 7;
  // Get Monday of current week
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  // Calculate Monday date of the week
  const monday = new Date(d);
  const diff = d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1);
  monday.setDate(diff);

  // Calculate Sunday date
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startStr = getIsoDate(monday);
  const endStr = getIsoDate(sunday);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = `Week ${weekNo} (${monthNames[monday.getMonth()]} ${monday.getDate()} - ${monthNames[sunday.getMonth()]} ${sunday.getDate()})`;

  return {
    year: date.getUTCFullYear(),
    week: weekNo,
    start: startStr,
    end: endStr,
    label,
  };
}

// Format currency in Indian Rupee (INR - ₹)
export function formatCurrency(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  return isNeg ? `-₹${formatted}` : `₹${formatted}`;
}

// Format compact currency in INR (e.g. ₹1.5L, ₹25k, ₹2.4 Cr)
export function formatCompactCurrency(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  let str = '';
  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    str = `₹${(abs / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh = 100,000
    str = `₹${(abs / 100000).toFixed(2)} L`;
  } else if (abs >= 1000) {
    str = `₹${(abs / 1000).toFixed(1)}k`;
  } else {
    str = `₹${abs.toFixed(0)}`;
  }
  return isNeg ? `-${str}` : str;
}

// Format percentage
export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

// Calculate comprehensive metrics for a given subset of trades
export function calculateMetrics(
  trades: TradeEntry[],
  periodType: PeriodType,
  periodKey: string,
  periodTitle: string,
  dateRange: { start: string; end: string }
): CalculatedPeriodMetrics {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      periodType,
      periodKey,
      periodTitle,
      dateRange,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalAmountTraded: 0,
      totalPnl: 0,
      totalRoi: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      avgTradePnl: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      strategies: [],
      dailyBreakdown: [],
    };
  }

  let totalPnl = 0;
  let totalAmountTraded = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;

  // Grouping structures
  const strategyMap: Record<string, {
    tradesCount: number;
    winCount: number;
    lossCount: number;
    breakevenCount: number;
    totalPnl: number;
    totalAmount: number;
    profits: number;
    losses: number;
  }> = {};

  const dailyMap: Record<string, {
    pnl: number;
    amount: number;
    tradesCount: number;
    winCount: number;
    lossCount: number;
  }> = {};

  trades.forEach((trade) => {
    const pnl = Number(trade.pnl) || 0;
    const amount = Number(trade.amount) || 0;

    totalPnl += pnl;
    totalAmountTraded += amount;

    if (pnl > 0) {
      winningTrades++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < 0) {
      losingTrades++;
      grossLoss += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl;
    } else {
      breakevenTrades++;
    }

    // Strategy accumulation
    const stratKey = trade.strategy?.trim() || 'Unspecified';
    if (!strategyMap[stratKey]) {
      strategyMap[stratKey] = {
        tradesCount: 0,
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
        totalPnl: 0,
        totalAmount: 0,
        profits: 0,
        losses: 0,
      };
    }
    strategyMap[stratKey].tradesCount += 1;
    strategyMap[stratKey].totalPnl += pnl;
    strategyMap[stratKey].totalAmount += amount;
    if (pnl > 0) {
      strategyMap[stratKey].winCount += 1;
      strategyMap[stratKey].profits += pnl;
    } else if (pnl < 0) {
      strategyMap[stratKey].lossCount += 1;
      strategyMap[stratKey].losses += Math.abs(pnl);
    } else {
      strategyMap[stratKey].breakevenCount += 1;
    }

    // Daily breakdown
    const dayKey = trade.date;
    if (!dailyMap[dayKey]) {
      dailyMap[dayKey] = {
        pnl: 0,
        amount: 0,
        tradesCount: 0,
        winCount: 0,
        lossCount: 0,
      };
    }
    dailyMap[dayKey].pnl += pnl;
    dailyMap[dayKey].amount += amount;
    dailyMap[dayKey].tradesCount += 1;
    if (pnl > 0) dailyMap[dayKey].winCount += 1;
    else if (pnl < 0) dailyMap[dayKey].lossCount += 1;
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalRoi = totalAmountTraded > 0 ? (totalPnl / totalAmountTraded) * 100 : 0;
  const avgTradePnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.99 : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 99.99 : 0;

  // Process strategy list sorted by PnL descending
  const strategies: StrategyStat[] = Object.entries(strategyMap).map(([strategy, stat]) => {
    const sWinRate = stat.tradesCount > 0 ? (stat.winCount / stat.tradesCount) * 100 : 0;
    const sAvgPnl = stat.tradesCount > 0 ? stat.totalPnl / stat.tradesCount : 0;
    const sAvgRoi = stat.totalAmount > 0 ? (stat.totalPnl / stat.totalAmount) * 100 : 0;
    const sPf = stat.losses > 0 ? stat.profits / stat.losses : stat.profits > 0 ? 99.99 : 0;

    return {
      strategy,
      tradesCount: stat.tradesCount,
      winCount: stat.winCount,
      lossCount: stat.lossCount,
      breakevenCount: stat.breakevenCount,
      winRate: sWinRate,
      totalPnl: stat.totalPnl,
      totalAmount: stat.totalAmount,
      avgPnl: sAvgPnl,
      avgRoi: sAvgRoi,
      profitFactor: sPf,
    };
  }).sort((a, b) => b.totalPnl - a.totalPnl);

  // Process daily list sorted by date ascending
  const sortedDays = Object.keys(dailyMap).sort();
  let cumulative = 0;
  const dailyBreakdown: DailyPnlPoint[] = sortedDays.map((dStr) => {
    const item = dailyMap[dStr];
    cumulative += item.pnl;
    const dObj = new Date(dStr + 'T12:00:00');
    const dayLabel = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

    return {
      date: dStr,
      dayLabel,
      pnl: item.pnl,
      cumulativePnl: cumulative,
      amount: item.amount,
      tradesCount: item.tradesCount,
      winCount: item.winCount,
      lossCount: item.lossCount,
    };
  });

  return {
    periodType,
    periodKey,
    periodTitle,
    dateRange,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    totalAmountTraded,
    totalPnl,
    totalRoi,
    grossProfit,
    grossLoss,
    profitFactor,
    avgTradePnl,
    avgWin,
    avgLoss,
    winLossRatio,
    largestWin,
    largestLoss,
    strategies,
    dailyBreakdown,
  };
}

// Filter and calculate for Week
export function calculateForWeek(trades: TradeEntry[], targetDate: Date = new Date()): CalculatedPeriodMetrics {
  const weekInfo = getWeekDetails(targetDate);
  const weekTrades = trades.filter((t) => t.date >= weekInfo.start && t.date <= weekInfo.end);
  const periodKey = `${weekInfo.year}-W${weekInfo.week.toString().padStart(2, '0')}`;

  return calculateMetrics(weekTrades, 'week', periodKey, weekInfo.label, {
    start: weekInfo.start,
    end: weekInfo.end,
  });
}

// Filter and calculate for Month
export function calculateForMonth(trades: TradeEntry[], year: number, monthIndex: number): CalculatedPeriodMetrics {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthPad = (monthIndex + 1).toString().padStart(2, '0');
  const periodKey = `${year}-${monthPad}`;
  const periodTitle = `${monthNames[monthIndex]} ${year}`;

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const start = `${year}-${monthPad}-01`;
  const end = `${year}-${monthPad}-${lastDay.toString().padStart(2, '0')}`;

  const monthTrades = trades.filter((t) => t.date.startsWith(periodKey));

  return calculateMetrics(monthTrades, 'month', periodKey, periodTitle, { start, end });
}

// Filter and calculate for Year
export function calculateForYear(trades: TradeEntry[], year: number): CalculatedPeriodMetrics {
  const periodKey = `${year}`;
  const periodTitle = `Year ${year}`;
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const yearTrades = trades.filter((t) => t.date.startsWith(`${year}-`));

  return calculateMetrics(yearTrades, 'year', periodKey, periodTitle, { start, end });
}

// Filter and calculate for All Time
export function calculateForAllTime(trades: TradeEntry[]): CalculatedPeriodMetrics {
  if (trades.length === 0) {
    const todayStr = getIsoDate(new Date());
    return calculateMetrics([], 'all', 'all', 'All Time', { start: todayStr, end: todayStr });
  }

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const start = sorted[0].date;
  const end = sorted[sorted.length - 1].date;

  return calculateMetrics(trades, 'all', 'all', 'All Time Record', { start, end });
}

// Helper to extract list of available months from trades + current date
export function getAvailableMonths(trades: TradeEntry[]): { year: number; month: number; label: string; key: string }[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const set = new Set<string>();

  const now = new Date();
  set.add(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);

  trades.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      set.add(t.date.substring(0, 7));
    }
  });

  const sorted = Array.from(set).sort().reverse();
  return sorted.map((key) => {
    const [y, m] = key.split('-').map(Number);
    return {
      year: y,
      month: m - 1,
      key,
      label: `${monthNames[m - 1]} ${y}`,
    };
  });
}

// Helper to extract list of available years
export function getAvailableYears(trades: TradeEntry[]): number[] {
  const set = new Set<number>();
  set.add(new Date().getFullYear());
  trades.forEach((t) => {
    if (t.date) {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!isNaN(y)) set.add(y);
    }
  });
  return Array.from(set).sort().reverse();
}

// Common preset strategies for instant selection
export const DEFAULT_STRATEGIES = [
  'Breakout',
  'VWAP Bounce',
  'Gap & Go',
  'Mean Reversion',
  'Flag Pattern',
  'Trend Following',
  'Pullback to EMA',
  'Opening Range Break',
  'Key Level Rejection',
  'Iron Condor',
  'Scalping',
  'Support & Resistance',
];
