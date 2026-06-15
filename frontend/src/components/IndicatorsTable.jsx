import React from 'react';
import InterpretationGuide from './InterpretationGuide';

export default function IndicatorsTable({ ticker }) {
  if (!ticker) return null;

  const formatNumber = (val, decimals = 2) => {
    if (val === null || val === undefined) return '—';
    return Number(val).toFixed(decimals);
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `${(val * 100).toFixed(1)}%`;
  };

  const rows = [
    { label: 'ADX', value: formatNumber(ticker.adx, 0) },
    { label: 'HV Ratio', value: formatNumber(ticker.hv_ratio, 3) },
    { label: 'BB Width', value: formatNumber(ticker.bb_width, 3) },
    { label: 'RSI (2)', value: formatNumber(ticker.rsi2, 0) },
    { label: 'RSI (14)', value: formatNumber(ticker.rsi14, 0) },
    { label: 'SMA50', value: formatNumber(ticker.sma50, 2) },
    { label: 'SMA200', value: formatNumber(ticker.sma200, 2) },
    { label: 'Score', value: formatNumber(ticker.score, 1) },
    { label: 'Regime', value: ticker.regime },
    { label: 'Band', value: ticker.band },
    { label: 'Delta', value: formatNumber(ticker.delta, 2) },
    { label: 'DTE', value: ticker.dte ? `${ticker.dte} days` : '—' },
    { label: 'IV (Mid)', value: formatPercent(ticker.iv_mid) },
    { label: 'P/C OI', value: formatNumber(ticker.put_call_oi_ratio, 2) },
    { label: 'P/C Vol', value: formatNumber(ticker.put_call_vol_ratio, 2) },
    { label: 'Support', value: ticker.support_strike ? formatNumber(ticker.support_strike, 2) : '—' },
    { label: 'Support B/A', value: ticker.support_bid ? `${formatNumber(ticker.support_bid)} / ${formatNumber(ticker.support_ask)}` : '—' },
    { label: 'Resistance', value: ticker.resistance_strike ? formatNumber(ticker.resistance_strike, 2) : '—' },
    { label: 'Resist B/A', value: ticker.resistance_bid ? `${formatNumber(ticker.resistance_bid)} / ${formatNumber(ticker.resistance_ask)}` : '—' },
    { label: 'Max Pain', value: ticker.max_pain_strike ? formatNumber(ticker.max_pain_strike, 2) : '—' },
  ];

  return (
    <div className="mt-6 p-3 md:p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3 gap-2">
        <h3 className="font-bold text-base md:text-lg">📊 Technical & Options Metrics</h3>
        <InterpretationGuide />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-2 text-xs md:text-sm">
        {rows.map((row, idx) => (
          <div key={idx} className="flex justify-between items-baseline border-b border-gray-100 py-1 gap-2">
            <span className="font-medium text-gray-600 truncate">{row.label}:</span>
            <span className="font-mono shrink-0 text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
