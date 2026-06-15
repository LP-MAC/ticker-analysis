import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import CSPRecommendation from './CSPRecommendation';
import IndicatorsTable from './IndicatorsTable';

function computeBollingerBands(candles, period = 20, multiplier = 2) {
  const closes = candles.map(c => c.close);
  const bands = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + (price - sma) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    bands.push({
      time: candles[i].time,
      upper: sma + multiplier * std,
      middle: sma,
      lower: sma - multiplier * std,
    });
  }
  return bands;
}

const TIMEFRAMES = [
  { key: '1H', label: '1H', interval: '60m' },
  { key: '1D', label: '1D', interval: '1d' },
];

export default function ChartPanel({ ticker }) {
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

    if (tfKey === '1D') {
      setHistoricalData(ticker.historical);
      return;
    }

    const tf = TIMEFRAMES.find(t => t.key === tfKey);
    setLoadingTf(true);
    try {
      const res = await fetch(`/api/history/${ticker.ticker}?interval=${tf.interval}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setHistoricalData(data);
      } else {
        console.error('No data for timeframe', tfKey, data);
      }
    } catch (err) {
      console.error('Timeframe fetch failed', err);
    } finally {
      setLoadingTf(false);
    }
  };

  useEffect(() => {
    if (!ticker || !historicalData) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    const isMobile = window.innerWidth < 768;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isMobile ? 320 : 500,
      layout: { background: { color: '#ffffff' }, textColor: '#333' },
      grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
      timeScale: { timeVisible: true, secondsVisible: false }
    });
    const candlestickSeries = chart.addCandlestickSeries();
    const candleData = historicalData.map(d => ({
      time: Math.floor(new Date(d.date).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    })).filter(d => d.open != null && d.close != null);
    candlestickSeries.setData(candleData);

    if (showBB && candleData.length >= 20) {
      const bands = computeBollingerBands(candleData, 20, 2);
      const upperSeries = chart.addLineSeries({ color: '#888888', lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
      const middleSeries = chart.addLineSeries({ color: '#888888', lineWidth: 1, title: 'BB Middle' });
      const lowerSeries = chart.addLineSeries({ color: '#888888', lineWidth: 1, lineStyle: 2, title: 'BB Lower' });
      upperSeries.setData(bands.map(b => ({ time: b.time, value: b.upper })));
      middleSeries.setData(bands.map(b => ({ time: b.time, value: b.middle })));
      lowerSeries.setData(bands.map(b => ({ time: b.time, value: b.lower })));
    }

    if (timeframe === '1D') {
      const closes = candleData.map(d => d.close);
      const sma50 = [];
      const sma200 = [];
      for (let i = 0; i < closes.length; i++) {
        if (i >= 49) {
          let sum = 0;
          for (let j = 0; j < 50; j++) sum += closes[i - j];
          sma50.push({ time: candleData[i].time, value: sum / 50 });
        }
        if (i >= 199) {
          let sum = 0;
          for (let j = 0; j < 200; j++) sum += closes[i - j];
          sma200.push({ time: candleData[i].time, value: sum / 200 });
        }
      }
      if (sma50.length) {
        const line50 = chart.addLineSeries({ color: '#2962FF', lineWidth: 2, title: 'SMA50' });
        line50.setData(sma50);
      }
      if (sma200.length) {
        const line200 = chart.addLineSeries({ color: '#FF6B6B', lineWidth: 2, title: 'SMA200' });
        line200.setData(sma200);
      }
    }

    chartRef.current = chart;
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: window.innerWidth < 768 ? 320 : 500
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ticker, historicalData, showBB, timeframe]);

  if (!ticker) return <div className="flex-1 p-4">Select a ticker</div>;

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto">
      <div className="mb-3 md:mb-4">
        <h2 className="text-xl md:text-2xl font-bold">{ticker.ticker}</h2>
        <div className="text-sm md:text-base text-gray-600 break-words">
          {ticker.description}
        </div>
        <div className="text-sm md:text-base text-gray-600 mt-1">
          <span className="font-mono">${ticker.price}</span>
          <span className="mx-2">•</span>
          <span>{ticker.regime}</span>
          <span className="mx-2">•</span>
          <span>{ticker.band}</span>
        </div>
      </div>

      {/* Chart controls — wrap on mobile */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="inline-flex rounded border border-gray-300 overflow-hidden">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => handleTimeframeChange(tf.key)}
              disabled={loadingTf}
              className={
                'px-4 py-2 text-sm transition-colors ' +
                (timeframe === tf.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200')
              }
            >
              {tf.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={showBB}
            onChange={(e) => setShowBB(e.target.checked)}
            className="accent-blue-500 w-4 h-4"
          />
          Bollinger Bands
        </label>

        {loadingTf && <span className="text-sm text-gray-500">Loading {timeframe}...</span>}
      </div>

      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} className="flex-1" />
      <IndicatorsTable ticker={ticker} />
      <CSPRecommendation ticker={ticker} />
    </div>
  );
}
