import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import TickerList from './components/TickerList';
import ChartPanel from './components/ChartPanel';

function App() {
  const [tickers, setTickers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Mock data for development/fallback
  const getMockData = () => {
    return [
      { ticker: 'SLV', name: 'iShares Silver Trust', price: 22.50, change: 0.32, changePercent: 1.44 },
      { ticker: 'PAAS', name: 'Pan American Silver Corp', price: 18.75, change: -0.28, changePercent: -1.47 },
      { ticker: 'HL', name: 'Hecla Mining Company', price: 4.92, change: 0.11, changePercent: 2.29 },
      { ticker: 'AG', name: 'First Majestic Silver', price: 6.83, change: 0.05, changePercent: 0.74 },
      { ticker: 'EXK', name: 'Endeavour Silver Corp', price: 3.12, change: 0.08, changePercent: 2.63 },
      { ticker: 'MAG', name: 'MAG Silver Corp', price: 14.56, change: 0.24, changePercent: 1.68 },
      { ticker: 'SILJ', name: 'Junior Silver Miners ETF', price: 9.87, change: 0.15, changePercent: 1.54 },
    ];
  };

  const loadTickers = useCallback(async (isRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const res = await fetch('/api/tickers', { 
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      
      setTickers(data);
      
      // Fix: Use some() for proper object comparison
      if (data.length > 0 && (!selected || !data.some(t => t.ticker === selected.ticker))) {
        setSelected(data[0]);
      }
    } catch (err) {
      // Don't treat abort as error
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      
      console.error('Failed to load tickers:', err);
      setError(err.message);
      
      // Use mock data as fallback
      const mockData = getMockData();
      setTickers(mockData);
      if (mockData.length > 0 && (!selected || !mockData.some(t => t.ticker === selected.ticker))) {
        setSelected(mockData[0]);
      }
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [selected]);

  // Check if selected ticker is valid
  const hasValidSelected = useMemo(() => {
    return selected && tickers.some(t => t.ticker === selected.ticker);
  }, [selected, tickers]);

  // Update selected if invalid
  useEffect(() => {
    if (tickers.length > 0 && !hasValidSelected) {
      setSelected(tickers[0]);
    }
  }, [tickers, hasValidSelected]);

  // Initial load
  useEffect(() => {
    loadTickers(false);
    
    // Cleanup function to abort any ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTickers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTickers(true);
  }, [loadTickers]);

  const handleSelect = useCallback((ticker) => {
    setSelected(ticker);
    setDrawerOpen(false); // Close drawer on mobile after selecting
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative overflow-hidden bg-gray-50">
      {/* Mobile: backdrop when drawer open */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20 transition-opacity duration-300"
          onClick={handleDrawerClose}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          'flex flex-col bg-white border-r border-gray-200 shadow-lg ' +
          // Mobile: fixed drawer slides in from left
          'fixed inset-y-0 left-0 w-72 z-30 transition-transform duration-300 ease-in-out ' +
          (drawerOpen ? 'translate-x-0' : '-translate-x-full') + ' ' +
          // Desktop: always visible, normal flow, wider
          'md:relative md:translate-x-0 md:w-80 md:shadow-none'
        }
        aria-label="Ticker selection menu"
        aria-hidden={!drawerOpen && window.innerWidth < 768}
      >
        {/* Sidebar Header */}
        <div className="p-4 md:p-5 font-bold text-base md:text-lg border-b border-gray-200 flex justify-between items-center gap-2 bg-gradient-to-r from-blue-50 to-white">
          <span className="truncate text-gray-800">Silver / Miners CSP</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
              aria-label="Refresh ticker data"
            >
              {refreshing ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                  ...
                </span>
              ) : (
                'Refresh'
              )}
            </button>
            {/* Close button only on mobile */}
            <button
              onClick={handleDrawerClose}
              className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-3 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              ⚠️ {error} - Using cached data
            </p>
          </div>
        )}

        {/* Ticker List */}
        <TickerList 
          tickers={tickers} 
          selected={selected} 
          onSelect={handleSelect} 
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
          <button
            onClick={handleDrawerToggle}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex-1">
            <span className="font-semibold text-gray-800">
              {selected?.ticker ?? 'Select ticker'}
            </span>
            {selected?.name && (
              <span className="block text-xs text-gray-500 truncate">
                {selected.name}
              </span>
            )}
          </div>
          {selected?.price && (
            <div className="text-right">
              <span className="font-medium text-gray-800">
                ${selected.price.toFixed(2)}
              </span>
              {selected.change && (
                <span className={`block text-xs ${selected.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selected.change >= 0 ? '+' : ''}{selected.changePercent?.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chart Panel */}
        <ChartPanel ticker={selected} />
      </main>
    </div>
  );
}

export default App;