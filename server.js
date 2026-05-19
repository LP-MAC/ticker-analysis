import express from 'express';
import cors from 'cors';
import yahooFinanceLib from 'yahoo-finance2';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------- Load tickers from external JSON file ----------
let TICKERS = [];
try {
  const tickersPath = join(__dirname, 'tickers.json');
  const tickersData = fs.readFileSync(tickersPath, 'utf8');
  const raw = JSON.parse(tickersData);
  if (Array.isArray(raw)) {
    TICKERS = raw.map(item => {
      if (typeof item === 'string') return { symbol: item, description: item };
      return { symbol: item.symbol, description: item.description || item.symbol };
    });
  }
  console.log(`Loaded ${TICKERS.length} tickers from configuration.`);
} catch (err) {
  console.error('Failed to load tickers.json, using fallback list.');
  TICKERS = [
    { symbol: "GLD", description: "Gold ETF" },
    { symbol: "SLV", description: "Silver ETF" },
    { symbol: "SILJ", description: "Junior Silver Miners ETF" }
  ];
}

const yahooFinance = new yahooFinanceLib({
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cookie': 'B=consent; GUC=consent'
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Serve static frontend (built React) ----------
app.use(express.static(join(__dirname, 'frontend/dist')));

// ---------- Historical data using chart() ----------
async function fetchHistorical(symbol) {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);
  try {
    const result = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1d'
    });
    if (result && result.quotes) {
      return result.quotes.map(q => ({
        date: new Date(q.date),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume
      }));
    }
    return null;
  } catch (err) {
    console.error(`Historical error for ${symbol}:`, err.message);
    return null;
  }
}

// ---------- Technical indicators ----------
function SMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    result.push(sum / period);
  }
  return result;
}

function RSI(prices, period = 14) {
  if (prices.length < period + 1) return Array(prices.length).fill(null);
  let gains = [], losses = [];
  for (let i = 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i-1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = [], avgLoss = [];
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) { avgGain.push(null); avgLoss.push(null); continue; }
    if (i === period - 1) {
      let sumG = 0, sumL = 0;
      for (let j = 0; j < period; j++) { sumG += gains[j]; sumL += losses[j]; }
      avgGain.push(sumG / period);
      avgLoss.push(sumL / period);
    } else {
      avgGain.push((avgGain[avgGain.length-1] * (period-1) + gains[i]) / period);
      avgLoss.push((avgLoss[avgLoss.length-1] * (period-1) + losses[i]) / period);
    }
  }
  const rsi = [];
  for (let i = 0; i < avgGain.length; i++) {
    if (avgGain[i] === null || avgLoss[i] === 0) rsi.push(null);
    else rsi.push(100 - 100 / (1 + avgGain[i] / avgLoss[i]));
  }
  return [null, ...rsi];
}

function HV(prices, period = 20) {
  let logReturns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] > 0) logReturns.push(Math.log(prices[i] / prices[i-1]));
    else logReturns.push(0);
  }
  let hv = Array(period).fill(null);
  for (let i = period; i <= prices.length; i++) {
    let slice = logReturns.slice(i-period, i);
    let mean = slice.reduce((a,b) => a+b, 0) / period;
    let sqSum = slice.reduce((a,b) => a + Math.pow(b-mean, 2), 0);
    let std = Math.sqrt(sqSum / (period-1));
    hv.push(std * Math.sqrt(252));
  }
  return hv;
}

function BBWidth(prices, period = 20) {
  const sma = SMA(prices, period);
  let bbw = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1 || sma[i] === null) { bbw.push(null); continue; }
    let slice = prices.slice(i-period+1, i+1);
    let mean = slice.reduce((a,b) => a+b,0)/period;
    let sqSum = slice.reduce((a,b) => a + Math.pow(b-mean,2), 0);
    let stdev = Math.sqrt(sqSum / (period-1));
    bbw.push(4 * stdev / sma[i]);
  }
  return bbw;
}

function getRegime(adx, hvRatio, bbw, sma50, sma200, currentPrice) {
  if (hvRatio > 1.3) return "VOL_SPIKE";
  if (bbw < 0.05 && adx > 20) return "LOW_VOL_TREND";
  if (adx < 20) return "RANGING";
  if (adx > 30 && sma50 > sma200) return "STRONG_BULL";
  if (adx > 30 && sma50 < sma200) return "STRONG_BEAR";
  return "MODERATE";
}

function getBand(regime) {
  if (regime === "VOL_SPIKE" || regime === "RANGING") return "TIGHT";
  if (regime === "STRONG_BULL" || regime === "LOW_VOL_TREND") return "LOOSE";
  return "MEDIUM";
}

function recommendedDelta(regime, band, iv) {
  if (regime === "STRONG_BULL" && iv > 0.4) return -0.20;
  if (band === "LOOSE") return -0.30;
  if (band === "MEDIUM") return -0.25;
  return -0.15;
}

// ---------- Max Pain calculation ----------
function computeMaxPain(puts, calls, currentPrice) {
  const strikesSet = new Set();
  puts.forEach(p => strikesSet.add(p.strike));
  calls.forEach(c => strikesSet.add(c.strike));
  const strikes = Array.from(strikesSet).sort((a,b) => a-b);
  let minPain = Infinity;
  let maxPainStrike = null;
  for (const strike of strikes) {
    let pain = 0;
    puts.forEach(p => {
      if (p.openInterest) {
        pain += p.openInterest * Math.max(0, strike - currentPrice);
      }
    });
    calls.forEach(c => {
      if (c.openInterest) {
        pain += c.openInterest * Math.max(0, currentPrice - strike);
      }
    });
    if (pain < minPain) {
      minPain = pain;
      maxPainStrike = strike;
    }
  }
  return maxPainStrike;
}

// ---------- Core analysis with robust IV handling ----------
async function analyzeTicker(tickerObj) {
  const symbol = tickerObj.symbol;
  const description = tickerObj.description;
  const data = await fetchHistorical(symbol);
  if (!data || data.length < 100) return null;

  const closes = data.map(d => d.close);
  const currentPrice = closes[closes.length-1];

  const sma50_arr = SMA(closes, 50);
  const sma200_arr = SMA(closes, 200);
  const rsi14_arr = RSI(closes, 14);
  const rsi2_arr = RSI(closes, 2);
  const hv20_arr = HV(closes, 20);
  const hv60_arr = HV(closes, 60);
  const bbw_arr = BBWidth(closes, 20);

  const lastSMA50 = sma50_arr[sma50_arr.length-1];
  const lastSMA200 = sma200_arr[sma200_arr.length-1];
  const lastRSI14 = rsi14_arr[rsi14_arr.length-1];
  const lastRSI2 = rsi2_arr[rsi2_arr.length-1];
  const lastHV20 = hv20_arr[hv20_arr.length-1];
  const lastHV60 = hv60_arr[hv60_arr.length-1];
  const lastBBW = bbw_arr[bbw_arr.length-1];
  const hvRatio = lastHV60 ? lastHV20 / lastHV60 : 1;
  let adx = 25;
  if (lastSMA50 > lastSMA200 && lastSMA50 > lastSMA200 * 1.05) adx = 35;
  else if (lastSMA50 < lastSMA200) adx = 28;

  const regime = getRegime(adx, hvRatio, lastBBW, lastSMA50, lastSMA200, currentPrice);
  const band = getBand(regime);

  let score = 0;
  if (lastRSI14 >= 35 && lastRSI14 <= 65) score += 1;
  else if (lastRSI14 > 65 && lastRSI14 <= 70) score += 0.5;
  if (currentPrice > lastSMA50) score += 1;
  if (lastSMA50 > sma50_arr[sma50_arr.length-26]) score += 1;
  if (currentPrice > lastSMA200) score += 1;
  score += 0;

  let iv = 0.3;
  let supportStrike = null, supportBid = null, supportAsk = null;
  let resistanceStrike = null, resistanceBid = null, resistanceAsk = null;
  let maxPainStrike = null;
  let putCallOiRatio = null, putCallVolRatio = null;

  try {
    const optionsData = await yahooFinance.options(symbol);
    if (optionsData?.options?.length) {
      const chain = optionsData.options[0];
      const puts = chain.puts || [];
      const calls = chain.calls || [];

      const totalCallOi = calls.reduce((s, c) => s + (c.openInterest || 0), 0);
      const totalPutOi = puts.reduce((s, p) => s + (p.openInterest || 0), 0);
      putCallOiRatio = totalCallOi > 0 ? totalPutOi / totalCallOi : null;
      
      const totalCallVol = calls.reduce((s, c) => s + (c.volume || 0), 0);
      const totalPutVol = puts.reduce((s, p) => s + (p.volume || 0), 0);
      putCallVolRatio = totalCallVol > 0 ? totalPutVol / totalCallVol : null;

      let maxSupportOI = 0;
      for (const p of puts) {
        if (p.strike < currentPrice && (p.openInterest || 0) > maxSupportOI) {
          maxSupportOI = p.openInterest;
          supportStrike = p.strike;
          supportBid = p.bid || null;
          supportAsk = p.ask || null;
        }
      }
      
      let maxResistOI = 0;
      for (const c of calls) {
        if (c.strike > currentPrice && (c.openInterest || 0) > maxResistOI) {
          maxResistOI = c.openInterest;
          resistanceStrike = c.strike;
          resistanceBid = c.bid || null;
          resistanceAsk = c.ask || null;
        }
      }
      
      if (puts.length > 0 && calls.length > 0) {
        maxPainStrike = computeMaxPain(puts, calls, currentPrice);
      }

      const allOptions = [...puts, ...calls].filter(opt => opt.strike);
      if (allOptions.length > 0) {
        const atmOption = allOptions.reduce((best, opt) =>
          Math.abs(opt.strike - currentPrice) < Math.abs(best.strike - currentPrice) ? opt : best
        );
        
        let rawIv = atmOption.impliedVolatility ?? atmOption.iv ?? atmOption.implicitVolatility;
        
        if (typeof rawIv !== 'number' || !isFinite(rawIv) || rawIv <= 0) {
          const bid = atmOption.bid;
          const ask = atmOption.ask;
          if (bid && ask && bid > 0 && ask > 0) {
            const midPrice = (bid + ask) / 2;
            const strike = atmOption.strike;
            let daysToExpiry = 30;
            if (atmOption.expiration) {
              const expiry = new Date(atmOption.expiration);
              const today = new Date();
              daysToExpiry = Math.max(1, Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)));
            }
            const timeToExpiry = daysToExpiry / 365;
            const intrinsicValue = Math.abs(strike - currentPrice);
            const timeValue = Math.max(0, midPrice - intrinsicValue);
            if (timeValue > 0 && currentPrice > 0 && timeToExpiry > 0) {
              const approxIv = (timeValue / currentPrice) / Math.sqrt(timeToExpiry);
              if (isFinite(approxIv) && approxIv > 0 && approxIv < 2) {
                rawIv = approxIv;
                console.log(`${symbol}: Using approximate IV from bid/ask = ${(rawIv * 100).toFixed(1)}%`);
              }
            }
          }
        }
        
        if (typeof rawIv === 'number' && isFinite(rawIv) && rawIv > 0) {
          if (rawIv > 1 && rawIv <= 100) rawIv = rawIv / 100;
          iv = rawIv;
          console.log(`${symbol}: IV extracted = ${(iv * 100).toFixed(1)}%`);
        } else {
          if (lastHV20 && isFinite(lastHV20) && lastHV20 > 0) {
            iv = lastHV20;
            console.log(`${symbol}: Using HV20 as IV proxy = ${(iv * 100).toFixed(1)}%`);
          } else {
            iv = 0.3;
            console.log(`${symbol}: Using default IV = 30%`);
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Options fetch failed for ${symbol}:`, e.message);
    supportStrike = currentPrice * 0.95;
    supportBid = supportStrike * 0.03;
    supportAsk = supportBid * 1.1;
    resistanceStrike = currentPrice * 1.05;
    resistanceBid = 0.01;
    resistanceAsk = 0.02;
    if (lastHV20 && isFinite(lastHV20) && lastHV20 > 0) {
      iv = lastHV20;
      console.log(`${symbol}: Using HV20 as IV proxy after options error = ${(iv * 100).toFixed(1)}%`);
    } else {
      iv = 0.3;
    }
  }

  if (!Number.isFinite(iv) || iv <= 0) {
    console.warn(`${symbol}: IV became invalid (${iv}), resetting to 0.3`);
    iv = 0.3;
  }

  const delta = recommendedDelta(regime, band, iv);
  const dteMap = { TIGHT: 30, MEDIUM: 45, LOOSE: 60 };
  const dte = dteMap[band];

  return {
    ticker: symbol,
    description: description,
    price: currentPrice,
    sma50: lastSMA50,
    sma200: lastSMA200,
    rsi14: lastRSI14,
    rsi2: lastRSI2,
    hv_ratio: hvRatio,
    bb_width: lastBBW,
    adx: adx,
    score: score,
    regime,
    band,
    delta,
    dte,
    iv_mid: iv,
    put_call_oi_ratio: putCallOiRatio,
    put_call_vol_ratio: putCallVolRatio,
    support_strike: supportStrike,
    support_bid: supportBid,
    support_ask: supportAsk,
    resistance_strike: resistanceStrike,
    resistance_bid: resistanceBid,
    resistance_ask: resistanceAsk,
    max_pain_strike: maxPainStrike,
    historical: data
  };
}

// ---------- API Routes ----------
app.get('/api/tickers', async (req, res) => {
  try {
    const results = [];
    for (const t of TICKERS) {
      try {
        const analysis = await analyzeTicker(t);
        if (analysis) results.push(analysis);
      } catch (err) {
        console.error(`Failed ${t.symbol}:`, err.message);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ticker/:symbol', async (req, res) => {
  try {
    const tickerObj = TICKERS.find(t => t.symbol === req.params.symbol);
    if (!tickerObj) return res.status(404).json({ error: 'Ticker not found' });
    const result = await analyzeTicker(tickerObj);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Catch-all: serve React frontend ----------
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
