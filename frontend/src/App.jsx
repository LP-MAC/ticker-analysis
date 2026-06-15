import React, { useEffect, useState, useCallback, useRef } from 'react';
import TickerList from './components/TickerList';
import ChartPanel from './components/ChartPanel';
import IndicatorsTable from './components/IndicatorsTable';
import CSPRecommendation from './components/CSPRecommendation';
import InterpretationGuide from './components/InterpretationGuide';

function App() {
  const [tickers, setTickers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadTickers = useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (isRefresh) setRefreshing(true);
      const res = await fetch('/api/tickers', {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setTickers(data);
      setError(null);
      setSelected(prev =>
        prev ? (data.find(t => t.ticker === prev.ticker) ?? data[0]) : data[0]
      );
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load tickers', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickers();
    const interval = setInterval(() => loadTickers(true), 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      abortControllerRef.current?.abort();
    };
  }, [loadTickers]);

  const handleRefresh = () => loadTickers(true);

  const handleSelect = (t) => {
    setSelected(t);
    setDrawerOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Loading market data…
      </div>
    );
  }

  return (
    <div className="flex h-screen relative overflow-hidden bg-white">

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          'flex flex-col bg-gray-50 border-r ' +
          'fixed inset-y-0 left-0 w-72 z-30 transform transition-transform ' +
          (drawerOpen ? 'translate-x-0' : '-translate-x-full') +
          ' md:relative md:translate-x-0 md:w-80'
        }
      >
        <div className="p-3 md:p-4 font-bold text-base md:text-lg border-b flex justify-between items-center gap-2">
          <span className="truncate">Silver / Miners CSP</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {refreshing ? '…' : 'Refresh'}
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="md:hidden p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-3 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ {error} — Using cached data
          </div>
        )}

        <TickerList tickers={tickers} selected={selected} onSelect={handleSelect} />
      </div>

      {/* Main content: Chart-first layout */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 p-2 border-b bg-white sticky top-0 z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-sm">{selected?.ticker ?? 'Select ticker'}</span>
        </div>

        {/* Chart takes up majority of space with room for X-axis */}
        <div className="flex-shrink-0 h-[50vh] md:h-[65vh] border-b overflow-hidden pb-2">
          <ChartPanel ticker={selected} />
        </div>

        {/* Callout cards + Analysis section - scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Support / Resistance callouts - compact horizontal */}
          {selected && (
            <div className="px-3 md:px-4 pt-2 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-2">

              <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-green-700 font-semibold text-xs">Support</span>
                  <span
                    className="text-green-500 cursor-help text-xs"
                    title="Highest put OI below current price. Acts as a psychological floor. Sell your CSP at or just below this strike for higher probability."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-green-800">
                  {selected.support_strike ? `$${selected.support_strike.toFixed(2)}` : '—'}
                </div>
                {selected.support_bid && (
                  <div className="text-xs text-green-600 mt-0.5 font-mono">
                    B/A: {selected.support_bid.toFixed(2)} / {selected.support_ask.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-red-700 font-semibold text-xs">Resistance</span>
                  <span
                    className="text-red-400 cursor-help text-xs"
                    title="Highest call OI above current price. Acts as a psychological ceiling. Tells you where upside may be capped."
                  >
                    ⓘ
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-red-800">
                  {selected.resistance_strike ? `$${selected.resistance_strike.toFixed(2)}` : '—'}
                </div>
                {selected.resistance_bid && (
                  <div className="text-xs text-red-600 mt-0.5 font-mono">
                    B/A: {selected.resistance_bid.toFixed(2)} / {selected.resistance_ask.toFixed(2)}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Indicators + CSP - below callouts */}
          <div className="px-3 md:px-4 pb-6">
            <IndicatorsTable ticker={selected} />
            <CSPRecommendation ticker={selected} />
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;