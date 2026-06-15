import React, { useEffect, useState, useCallback, useRef } from 'react';
import TickerList from './components/TickerList';
import ChartPanel from './components/ChartPanel';
import IndicatorsTable from './components/IndicatorsTable';
import CSPRecommendation from './components/CSPRecommendation';

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

      {/* Mobile backdrop */}
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

      {/* Main: 3-row layout — header | chart | panel */}
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

        {/* Chart area — fixed height */}
        <div className="shrink-0 h-[55vh] border-b">
          <ChartPanel ticker={selected} panelMode={panelMode} setPanelMode={setPanelMode} />
        </div>

        {/* Bottom panel — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3">
          {panelMode === 'metrics' && <IndicatorsTable ticker={selected} />}
          {panelMode === 'csp' && <CSPRecommendation ticker={selected} />}
        </div>

      </div>
    </div>
  );
}

export default App;
