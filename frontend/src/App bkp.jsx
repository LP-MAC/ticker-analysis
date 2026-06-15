import React, { useEffect, useState } from 'react';
import TickerList from './components/TickerList';
import ChartPanel from './components/ChartPanel';

function App() {
  const [tickers, setTickers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadTickers = async () => {
    try {
      const res = await fetch('/api/tickers');
      const data = await res.json();
      setTickers(data);
      if (data.length && (!selected || !data.find(t => t.ticker === selected.ticker))) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickers();
  };

  const handleSelect = (t) => {
    setSelected(t);
    setDrawerOpen(false); // close drawer on mobile after selecting
  };

  if (loading) return <div className="p-4">Loading market data...</div>;

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Mobile: backdrop when drawer open */}
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
          // Mobile: fixed drawer slides in from left
          'fixed inset-y-0 left-0 w-72 z-30 transform transition-transform ' +
          (drawerOpen ? 'translate-x-0' : '-translate-x-full') + ' ' +
          // Desktop: always visible, normal flow, wider
          'md:relative md:translate-x-0 md:w-80'
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
              {refreshing ? '...' : 'Refresh'}
            </button>
            {/* Close button only on mobile */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="md:hidden p-1.5 text-gray-600 hover:bg-gray-200 rounded"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>
        <TickerList tickers={tickers} selected={selected} onSelect={handleSelect} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
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
          <span className="font-bold">{selected?.ticker ?? 'Select ticker'}</span>
        </div>

        <ChartPanel ticker={selected} />
      </div>
    </div>
  );
}

export default App;
