import React, { useState } from 'react';

export default function InterpretationGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
      >
        📖 Interpretation Guide
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">📘 How to Interpret the Output</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6 text-gray-700">
              {/* ========== REGIME SECTION – EXPANDED ========== */}
              <section>
                <h3 className="text-lg font-semibold">📈 Market Regime (Very Precise)</h3>
                <p>The <strong>Regime</strong> is the most important output. It tells you what the market is doing now and directly influences the recommended <strong>Delta</strong>, <strong>DTE</strong>, and <strong>Band</strong>.</p>
                
                <div className="mt-2 space-y-3">
                  <div><strong className="text-green-700">STRONG_BULL</strong> – Powerful uptrend (ADX &gt;30, SMA50&gt;SMA200). Trend followers in control. <br/>✅ <em>Action:</em> Sell slightly OTM puts with LOOSE band (60 DTE, -0.30 delta).</div>
                  <div><strong className="text-red-700">STRONG_BEAR</strong> – Strong downtrend (ADX &gt;30, SMA50&lt;SMA200). Risky for put selling. <br/>⚠️ <em>Action:</em> Avoid CSPs or sell deep OTM with TIGHT band (short DTE).</div>
                  <div><strong className="text-yellow-700">RANGING</strong> – Sideways (ADX &lt;20). Support/resistance well defined. <br/>✅ <em>Action:</em> Sell ATM or slightly OTM puts with TIGHT band (30 DTE, -0.15 to -0.20 delta).</div>
                  <div><strong className="text-orange-700">VOL_SPIKE</strong> – HV Ratio &gt;1.3 (recent volatility explosion). Premiums inflated. <br/>✅ <em>Action:</em> Sell OTM puts with TIGHT band (short DTE).</div>
                  <div><strong className="text-blue-700">LOW_VOL_TREND</strong> – Trending but BB Width &lt;0.05 (narrow bands). Quiet trend. <br/>✅ <em>Action:</em> Sell slightly OTM puts with LOOSE band (60 DTE, -0.30 delta).</div>
                  <div><strong className="text-gray-700">MODERATE</strong> – Everything else (balanced). <br/>✅ <em>Action:</em> Use MEDIUM band (45 DTE, -0.25 delta).</div>
                </div>
              </section>

              {/* ========== OPTIONS METRICS – EXPANDED ========== */}
              <section>
                <h3 className="text-lg font-semibold">📊 Detailed Options Metrics</h3>
                
                <div className="mt-2 space-y-3">
                  <div><strong>Put/Call OI Ratio</strong> – Open interest ratio (total puts / total calls). &gt;1 = more puts (bearish long‑term bets), &lt;1 = more calls (bullish). High ratio (&gt;1.5) can be contrarian bullish.</div>
                  <div><strong>Put/Call Vol Ratio</strong> – Volume ratio (recent activity). Same directional meaning but reacts faster to news. Spike in put volume often precedes a drop.</div>
                  <div><strong>Support Strike</strong> – Highest put OI below current price. Acts as a psychological floor. <br/>💡 <em>Use:</em> Sell your CSP at or just below this strike for higher probability.</div>
                  <div><strong>Resistance Strike</strong> – Highest call OI above current price. Acts as a psychological ceiling. Tells you where upside may be capped.</div>
                  <div><strong>Max Pain Strike</strong> – Strike where option buyers lose the most (market makers profit). Price tends to gravitate toward Max Pain at expiry. <br/>💡 <em>Use:</em> As a profit‑taking target. If Max Pain is above current price, expect upward pressure; if below, expect downward pressure.</div>
                </div>
              </section>

              {/* ========== REMAINING SECTIONS (unchanged but included) ========== */}
              <section>
                <h3 className="text-lg font-semibold">🎯 Cash‑Secured Put (CSP) Recommendation</h3>
                <p><strong>Suggested strike:</strong> Based on highest put open interest below current price. Selling a put at this strike gives a high probability of keeping the premium.</p>
                <p><strong>Bid/Ask &amp; Premium (mid):</strong> Market prices. Mid premium is what you'd likely receive per share (multiply by 100 for total per contract).</p>
                <p><strong>Delta target:</strong> Approximate probability of option expiring in‑the‑money (absolute value). -0.30 delta ≈ 30% chance of assignment. Lower delta = safer but less premium.</p>
                <p><strong>DTE (Days to Expiry):</strong> Recommended days to expiration, based on regime. Longer DTE for trending, shorter for volatile/ranging.</p>
                <p><strong>IV (ATM):</strong> Implied volatility of the at‑the‑money option. Higher IV = higher premium but higher risk.</p>
                <p><strong>Regime / Band:</strong> Market condition and suggested credit spread "band" (tight/medium/loose).</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold">📊 Technical Metrics</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>ADX:</strong> Trend strength. &gt;25 = strong trend, &lt;20 = ranging.</li>
                  <li><strong>HV Ratio:</strong> 20d HV / 60d HV. &gt;1.3 = volatility spike.</li>
                  <li><strong>BB Width:</strong> Narrow (&lt;0.05) = low volatility/consolidation.</li>
                  <li><strong>RSI (2 &amp; 14):</strong> RSI2 &lt;10 extremely oversold, &gt;90 overbought. RSI14 &lt;30 oversold, &gt;70 overbought.</li>
                  <li><strong>SMA50 / SMA200:</strong> Golden cross (50&gt;200) bullish, death cross bearish.</li>
                  <li><strong>Score:</strong> Composite technical strength (0‑5). Higher is better for put selling.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold">⚠️ How to Use This for Cash‑Secured Puts</h3>
                <p>1. Sell puts on stocks/ETFs you are willing to own at the suggested strike or lower.<br/>
                2. Use Delta target as a risk guide: -0.15 to -0.20 conservative, -0.30 moderate.<br/>
                3. Regime matters: In STRONG_BULL, sell slightly OTM puts. In RANGING, sell ATM or slightly OTM.<br/>
                4. IV (Mid) above 30% gives juicy premiums but higher risk. Below 20% is low premium.<br/>
                5. Check support/resistance strikes and Max Pain – they act as magnets.<br/>
                6. Manage winners: Buy back put when you've captured 50‑70% of max profit.</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold">📐 Bollinger Bands on Chart</h3>
                <p>Upper/lower bands (dashed grey) = 2 standard deviations from 20‑period SMA. Price touching upper = overbought, lower = oversold. A squeeze (narrow bands) often precedes a volatility breakout.</p>
              </section>

              <div className="text-xs text-gray-400 mt-4">* This is not financial advice. Always do your own research.</div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}