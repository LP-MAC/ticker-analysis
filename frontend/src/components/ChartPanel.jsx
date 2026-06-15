import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

function computeBollingerBands(candles, period = 20, multiplier = 2) {
  const closes = candles.map(c => c.close);
  const bands = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + (price - sma) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    bands.push({ time: candles[i].time, upper: sma + multiplier * std, middle: sma, lower: sma - multiplier * std });
  }
  return bands;
}

const TIMEFRAMES = [
  { key: '1H', label: '1H', interval: '60m' },
  { key: '1D', label: '1D', interval: '1d' },
];

const PANELS = [
  { key: 'metrics', label: '📊 Metrics' },
  { key: 'csp',     label: '📈 CSP' },
  { key: 'strikes', label: '🎯 Strikes' },
];

export default function ChartPanel({ ticker, panelMode, setPanelMode }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [showBB, setShowBB] = useState(true);
  const [timeframe, setTimeframe] = useState('1D');
  const [historicalData, setHistoricalData] = useState(null);
  const [loadingTf, setLoadingTf] = useState(false);

  useEffect(() => {
    if (ticker?.historical) {
      setHistoricalData(ticker.historical);
      setTimeframe('1D');
    }
  }, [ticker?.ticker]);

  const handleTimeframeChange = async (tfKey) => {
    if (tfKey === timeframe || !ticker) return;
    setTimeframe(tfKey);
    if (tfKey === '1D') { setHistoricalData(ticker.historical); return; }
    const tf = TIMEFRAMES.find(t => t.key === tfKey);
    setLoadingTf(true);
    try {
      const res = await fetch(`/api/history/${ticker.ticker}?interval=${tf.interval}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) setHistoricalData(data);
    } catch (err) {
      console.error('Timeframe fetch failed', err);
    } finally {
      setLoadingTf(false);
    }
  };

  useEffect(() => {
    if (!ticker || !historicalData || !chartContainerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    const isMobile = window.innerWidth < 768;
    const h = chartContainerRef.current.clientHeight || (isMobile ? 300 : 420);
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: h,
      layout: { background: { color: '#ffffff' }, textColor: '#333' },
      grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
      timeScale: { timeVisible: true, secondsVisible: false }
    });
    const candlestickSeries = chart.addCandlestickSeries();
    const candleData = historicalData.map(d => ({
      time: Math.floor(new Date(d.date).getTime() / 1000),
      open: d.open, high: d.high, low: d.low, close: d.close
    })).filter(d => d.open != null && d.close != null);
    candlestickSeries.setData(candleData);
    if (showBB && candleData.length >= 20) {
      const bands = computeBollingerBands(candleData, 20, 2);
      const upper = chart.addLineSeries({ color: '#888', lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
      const middle = chart.addLineSeries({ color: '#888', lineWidth: 1, title: 'BB Mid' });
      const lower = chart.addLineSeries({ color: '#888', lineWidth: 1, lineStyle: 2, title: 'BB Lower' });
      upper.setData(bands.map(b => ({ time: b.time, value: b.upper })));
      middle.setData(bands.map(b => ({ time: b.time, value: b.middle })));
      lower.setData(bands.map(b => ({ time: b.time, value: b.lower })));
    }
    if (timeframe === '1D') {
      const closes = candleData.map(d => d.close);
      const sma50 = [], sma200 = [];
      for (let i = 0; i < closes.length; i++) {
        if (i >= 49) { let s = 0; for (let j = 0; j < 50; j++) s += closes[i-j]; sma50.push({ time: candleData[i].time, value: s/50 }); }
        if (i >= 199) { let s = 0; for (let j = 0; j < 200; j++) s += closes[i-j]; sma200.push({ time: candleData[i].time, value: s/200 }); }
      }
      if (sma50.length) { const l = chart.addLineSeries({ color: '#2962FF', lineWidth: 2, title: 'SMA50' }); l.setData(sma50); }
      if (sma200.length) { const l = chart.addLineSeries({ color: '#FF6B6B', lineWidth: 2, title: 'SMA200' }); l.setData(sma200); }
    }
    chartRef.current = chart;
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || (window.innerWidth < 768 ? 300 : 420)
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ticker, historicalData, showBB, timeframe]);

  if (!ticker) return <div className="p-4 text-gray-500">Select a ticker</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1">
        <h2 className="text-xl font-bold">
          {ticker.ticker}
          <span className="ml-2 text-sm font-normal text-gray-500">{ticker.description}</span>
        </h2>
        <div className="text-sm text-gray-600 mt-0.5">
          <span className="font-mono font-semibold">${ticker.price?.toFixed(2)}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>{ticker.regime}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span>{ticker.band}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
        {/* Timeframe */}
        <div className="inline-flex rounded border border-gray-300 overflow-hidden">
          {TIMEFRAMES.map(tf => (
            <button key={tf.key} onClick={() => handleTimeframeChange(tf.key)} disabled={loadingTf}
              className={'px-3 py-1.5 text-sm transition-colors ' + (timeframe === tf.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100')}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* BB checkbox */}
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
          <input type="checkbox" checked={showBB} onChange={(e) => setShowBB(e.target.checked)} className="accent-blue-500 w-4 h-4" />
          BB
        </label>

        {/* Panel toggle */}
        <div className="inline-flex rounded border border-gray-300 overflow-hidden">
          {PANELS.map(p => (
            <button key={p.key} onClick={() => setPanelMode(p.key)}
              className={'px-3 py-1.5 text-sm transition-colors ' + (panelMode === p.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100')}>
              {p.label}
            </button>
          ))}
        </div>

        {loadingTf && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      <div ref={chartContainerRef} className="flex-1 w-full min-h-0" />
    </div>
  );
}
