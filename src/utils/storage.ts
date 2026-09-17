import { TradeEntry } from '../types';

const DB_NAME = 'StockTradingLedgerDB';
const DB_VERSION = 1;
const STORE_NAME = 'trades';
const LOCAL_STORAGE_CACHE_KEY = 'stock_ledger_cache_v1';

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('strategy', 'strategy', { unique: false });
        store.createIndex('outcome', 'outcome', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clean ledger initialization without sample data
export function getInitialSeedTrades(): TradeEntry[] {
  return [];
}

// Load all trades (returns clean trades array without sample data)
export async function loadAllTrades(): Promise<TradeEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results: TradeEntry[] = request.result || [];
        // Filter out any legacy sample data (ids starting with 'trade-seed-')
        const realTrades = results.filter((t) => !t.id.startsWith('trade-seed-'));
        if (realTrades.length !== results.length) {
          saveAllTrades(realTrades).catch(console.error);
        }

        // Sort by date descending then time descending
        realTrades.sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0) return dateCmp;
          return (b.time || '').localeCompare(a.time || '');
        });
        resolve(realTrades);
      };

      request.onerror = () => {
        console.error('Error fetching trades from IndexedDB', request.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to LocalStorage', err);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realTrades = parsed.filter((t: TradeEntry) => !t.id.startsWith('trade-seed-'));
          return realTrades;
        }
      }
    } catch {
      // ignore
    }
    return [];
  }
}

// Save single trade
export async function saveTrade(trade: TradeEntry): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(trade);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Update lightweight cache in localStorage without large image strings if possible
    syncCache();
  } catch (err) {
    console.error('Failed to save trade to IndexedDB', err);
    fallbackSave(trade);
  }
}

// Save list of trades (e.g. on import or bulk update)
export async function saveAllTrades(trades: TradeEntry[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      trades.forEach((t) => store.put(t));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    syncCache();
  } catch (err) {
    console.error('Failed to bulk save trades', err);
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error('LocalStorage also failed', e);
    }
  }
}

// Delete a trade
export async function deleteTrade(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    syncCache();
  } catch (err) {
    console.error('Failed to delete trade', err);
  }
}

// Reset data to empty ledger
export async function resetToSeedData(): Promise<TradeEntry[]> {
  await clearAllTrades();
  return [];
}

export async function clearAllTrades(): Promise<void> {
  await saveAllTrades([]);
}

// Helper to update localStorage backup
async function syncCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const items: TradeEntry[] = request.result || [];
      try {
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(items));
      } catch {
        // LocalStorage quota might be exceeded if images are present
        const stripped = items.map((item) => ({
          ...item,
          screenshotUrl: item.screenshotUrl?.startsWith('data:') ? undefined : item.screenshotUrl,
        }));
        try {
          localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(stripped));
        } catch {
          // silent fallback
        }
      }
    };
  } catch {
    // ignore
  }
}

function fallbackSave(trade: TradeEntry) {
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    const list: TradeEntry[] = existing ? JSON.parse(existing) : [];
    const idx = list.findIndex((t) => t.id === trade.id);
    if (idx >= 0) {
      list[idx] = trade;
    } else {
      list.push(trade);
    }
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Fallback save failed', e);
  }
}

// Helper to compress uploaded images for smooth rendering
export async function compressScreenshot(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with 85% quality to save space while keeping charts ultra sharp
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Export trades as downloadable JSON file
export function exportTradesToJson(trades: TradeEntry[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trades, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `trading_ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Export trades as CSV for Excel / Google Sheets
export function exportTradesToCsv(trades: TradeEntry[]) {
  const headers = ['Date', 'Time', 'Symbol', 'Strategy', 'Side', 'Instrument', 'Amount', 'PnL', 'ROI_Pct', 'Outcome', 'Notes'];
  const rows = trades.map((t) => [
    t.date,
    t.time || '',
    t.symbol,
    `"${(t.strategy || '').replace(/"/g, '""')}"`,
    t.side,
    t.instrument,
    t.amount,
    t.pnl,
    t.roi.toFixed(2) + '%',
    t.outcome,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `trading_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
