import React from 'react';

const regimeColor = {
  STRONG_BULL: 'text-green-600 bg-green-100',
  LOW_VOL_TREND: 'text-green-500 bg-green-50',
  MODERATE: 'text-yellow-600 bg-yellow-100',
  RANGING: 'text-yellow-500 bg-yellow-50',
  STRONG_BEAR: 'text-red-600 bg-red-100',
  VOL_SPIKE: 'text-red-700 bg-red-200'
};

export default function TickerList({ tickers, selected, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {tickers.map(t => (
        <div
          key={t.ticker}
          onClick={() => onSelect(t)}
          className={`p-3 border-b cursor-pointer hover:bg-gray-100 active:bg-gray-200 ${selected?.ticker === t.ticker ? 'bg-blue-100' : ''}`}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <span className="font-mono font-bold">{t.ticker}</span>
              <div className="text-xs text-gray-500 truncate">
                {t.description || t.ticker}
              </div>
            </div>
            <span className="font-medium shrink-0">${t.price?.toFixed(2) ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1.5 gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${regimeColor[t.regime] || 'bg-gray-200'}`}>
              {t.regime?.replace('_', ' ') ?? 'UNKNOWN'}
            </span>
            <span className="text-gray-500 text-xs">{t.band ?? '—'}</span>
          </div>
        </div>
      ))}
      {tickers.length === 0 && (
        <div className="p-4 text-gray-500 text-center">No tickers loaded. Check backend.</div>
      )}
    </div>
  );
}
