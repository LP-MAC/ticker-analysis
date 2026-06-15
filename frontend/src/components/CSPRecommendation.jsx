import React from 'react';

export default function CSPRecommendation({ ticker }) {
  if (!ticker) return null;
  const hasSupport = ticker.support_strike && ticker.support_strike > 0;
  return (
    <div className="mt-6 p-3 md:p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold text-base md:text-lg mb-2">📈 Cash‑Secured Put Recommendation</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs md:text-sm">
        <div className="text-gray-600">Suggested strike:</div>
        <div className="font-mono text-right">{hasSupport ? ticker.support_strike.toFixed(2) : 'N/A (use OTM put)'}</div>
        <div className="text-gray-600">Bid / Ask:</div>
        <div className="font-mono text-right">{hasSupport ? `${ticker.support_bid?.toFixed(2)} / ${ticker.support_ask?.toFixed(2)}` : '—'}</div>
        <div className="text-gray-600">Premium (mid):</div>
        <div className="font-mono text-right">{hasSupport ? ((ticker.support_bid + ticker.support_ask)/2).toFixed(2) : '—'}</div>
        <div className="text-gray-600">Delta target:</div>
        <div className="font-mono text-right">{ticker.delta?.toFixed(2)}</div>
        <div className="text-gray-600">DTE:</div>
        <div className="font-mono text-right">{ticker.dte} days</div>
        <div className="text-gray-600">IV (ATM):</div>
        <div className="font-mono text-right">{ticker.iv_mid ? (ticker.iv_mid * 100).toFixed(1) + '%' : 'N/A'}</div>
        <div className="text-gray-600">Regime / Band:</div>
        <div className="text-right">{ticker.regime} / {ticker.band}</div>
      </div>
      <div className="mt-3 text-xs text-gray-600">
        * Based on highest put OI below current price. Adjust strike according to your risk tolerance.
      </div>
    </div>
  );
}
