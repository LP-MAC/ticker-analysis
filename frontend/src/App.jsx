import React, { useEffect, useState, useCallback, useRef } from 'react';
import TickerList from './components/TickerList';
import ChartPanel from './components/ChartPanel';
import IndicatorsTable from './components/IndicatorsTable';
import CSPRecommendation from './components/CSPRecommendation';

function StrikesPanel({ ticker }) {
  if (!ticker) return null;
  const fmt = (v, d = 2) => (v != null ? Number(v).toFixed(d) : '—');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      {/* Support */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-green-700 font-bold text-sm">🟢 Support Strike</span>
          <span className="text-green-500 cursor-help text-xs" title="Highest put OI below current price. Acts as a psychological floor.">ⓘ</span>
        </div>
        <div className="font-mono text-2xl font-bold text-green-800 mb-1">
          {ticker.support_strike ? `$${fmt(ticker.support_strike)}` : '—'}
        </div>
        <div className="text-xs text-green-700 mb-2">
          Highest put OI below current price — acts as a psychological floor.
        </div>
        <div className="text-xs font-medium text-green-800 mb-2">
          💡 Sell your CSP at or just below this strike for higher probability.
        </div>
        {ticker.support_bid != null && (
          <div className="text-xs font-mono text-green-600">
            Bid / Ask: {fmt(ticker.support_bid)} / {fmt(ticker.support_ask)}
            <span className="ml-2 text-green-700 font-medium">
              Mid: {fmt((ticker.support_bid + ticker.support_ask) / 2)}
            </span>
          </div>
        )}
      </div>

      {/* Resistance */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-red-700 font-bold text-sm">🔴 Resistance Strike</span>
          <span className="text-red-400 cursor-help text-xs" title="Highest call OI above current price. Acts as a psychological ceiling.">ⓘ</span>
        </div>
        <div className="font-mono text-2xl font-bold text-red-800 mb-1">
          {ticker.resistance_strike ? `$${fmt(ticker.resistance_strike)}` : '—'}
        </div>
        <div className="text-xs text-red-700 mb-2">
          Highest call OI above current price — acts as a psychological ceiling.
        </div>
        <div className="text-xs font-medium text-red-800 mb-2">
          ⚠️ Upside may be capped near this level.
        </div>
        {ticker.resistance_bid != null && (
          <div className="text-xs font-mono text-red-600">
            Bid / Ask: {fmt(ticker.resistance_bid)} / {fmt(ticker.resistance_ask)}
            <span className="ml-2 text-red-700 font-medium">
              Mid: {fmt((ticker.resistance_bid + ticker.resistance_ask) / 2)}
            </span>
          </div>
        )}
      </div>

      {/* Range summary */}
      {ticker.support_strike && ticker.resistance_strike && (
        <div className="sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
          <span className="font-semibold text-gray-700">OI Range: </span>
          <span className="font-mono">${fmt(ticker.support_strike)}</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="font-mono">${fmt(ticker.resistance_strike)}</span>
          <span className="mx-3 text-gray-400">|</span>
          <span className="font-semibold text-gray-700">Width: </span>
          <span className="font-mono">${fmt(ticker.resistance_strike - ticker.support_strike)}</span>
          <span className="mx-3 text-gray-400">|</span>
          <span className="font-semibold text-gray-700">Current: </span>
          <span className="font-mono">${fmt(ticker.price)}</span>
          <span className="mx-2 text-gray-400">
            ({fmt(((ticker.price - ticker.support_strike) / (ticker.resistance_strike - ticker.support_strike)) * 100, 0)}% of range)
          </span>
        </div>
      )}
    </div>
  );
}

function App() {
  const [tickers, setTickers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [panelMode, setPanelMode] = useState('metrics');
  const abortControllerRef = useRef(null);

  const loadTickers = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    try {
      if (isRefresh) setRefreshing(true);
      const res = await fetch('/api/tickers', { signal: abortControllerRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setTickers(data);
      setError(null);
      setSelected(prev => prev ? (data.find(t => t.ticker === prev.ticker) ?? data[0]) : data[0]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickers();
    const interval = setInterval(() => loadTickers(true), 5 * 60 * 1000);
    return () => { clearInterval(interval); abortControllerRef.current?.abort(); };
  }, [loadTickers]);

  const handleSelect = (t) => { setSelected(t); setDrawerOpen(false); };

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
      Loading market data…
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={
        'flex flex-col bg-gray-50 border-r ' +
        'fixed inset-y-0 left-0 w-72 z-30 transform transition-transform ' +
        (drawerOpen ? 'translate-x-0' : '-translate-x-full') +
        ' md:relative md:translate-x-0 md:w-80'
      }>
        <div className="p-3 font-bold text-base border-b flex justify-between items-center gap-2">
          <span className="truncate">Silver / Miners CSP</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => loadTickers(true)} disabled={refreshing}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
              {refreshing ? '…' : 'Refresh'}
            </button>
            <button onClick={() => setDrawerOpen(false)} className="md:hidden p-1.5 text-gray-600 hover:bg-gray-200 rounded">✕</button>
          </div>
        </div>
        {error && (
          <div className="mx-3 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ {error} — Using cached data
          </div>
        )}
        <TickerList tickers={tickers} selected={selected} onSelect={handleSelect} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 p-2 border-b bg-white z-10 shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="p-2 text-gray-700 hover:bg-gray-100 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-sm">{selected?.ticker ?? 'Select ticker'}</span>
        </div>

        {/* Chart — fixed height */}
        <div className="shrink-0 h-[55vh] border-b">
          <ChartPanel ticker={selected} panelMode={panelMode} setPanelMode={setPanelMode} />
        </div>

        {/* Bottom panel — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3">
          {panelMode === 'metrics' && <IndicatorsTable ticker={selected} />}
          {panelMode === 'csp'     && <CSPRecommendation ticker={selected} />}
          {panelMode === 'strikes' && <StrikesPanel ticker={selected} />}
        </div>

      </div>
    </div>
  );
}

export default App;
