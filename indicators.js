// Simple moving average
export function SMA(data, period) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    result.push(sum / period);
  }
  return result;
}

// RSI
export function RSI(prices, period = 14) {
  let gains = [], losses = [];
  for (let i = 1; i < prices.length; i++) {
    let diff = prices[i] - prices[i-1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = [], avgLoss = [];
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      avgGain.push(null);
      avgLoss.push(null);
      continue;
    }
    if (i === period - 1) {
      let sumG = 0, sumL = 0;
      for (let j = 0; j < period; j++) {
        sumG += gains[j];
        sumL += losses[j];
      }
      avgGain.push(sumG / period);
      avgLoss.push(sumL / period);
    } else {
      avgGain.push((avgGain[avgGain.length-1] * (period-1) + gains[i]) / period);
      avgLoss.push((avgLoss[avgLoss.length-1] * (period-1) + losses[i]) / period);
    }
  }
  let rsi = [];
  for (let i = 0; i < avgGain.length; i++) {
    if (avgGain[i] === null || avgLoss[i] === 0) rsi.push(null);
    else rsi.push(100 - 100 / (1 + avgGain[i] / avgLoss[i]));
  }
  return [null, ...rsi];
}

// ADX placeholder
export function ADX(high, low, close, period = 14) {
  return close.map(() => 25);
}

// Historical volatility
export function HV(prices, period = 20) {
  let logReturns = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i] / prices[i-1]));
  }
  let hv = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period) hv.push(null);
    else {
      let slice = logReturns.slice(i-period, i);
      let std = Math.sqrt(slice.reduce((a,b) => a + b*b, 0) / (period-1));
      hv.push(std * Math.sqrt(252));
    }
  }
  return hv;
}

// Bollinger Band width
export function BBWidth(prices, period = 20) {
  let sma = SMA(prices, period);
  let std = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period-1) { std.push(null); continue; }
    let slice = prices.slice(i-period+1, i+1);
    let avg = slice.reduce((a,b) => a+b,0)/period;
    let sq = slice.map(v => Math.pow(v-avg,2));
    let stdev = Math.sqrt(sq.reduce((a,b)=>a+b,0)/(period-1));
    std.push(stdev);
  }
  let bbw = [];
  for (let i = 0; i < prices.length; i++) {
    if (sma[i] === null || std[i-period+1] === null) bbw.push(null);
    else bbw.push(4 * std[i-period+1] / sma[i]);
  }
  return bbw;
}

// Regime classification
export function getRegime(adx, hvRatio, bbw, sma50, sma200, currentPrice) {
  if (hvRatio > 1.3) return "VOL_SPIKE";
  if (bbw < 0.05 && adx > 20) return "LOW_VOL_TREND";
  if (adx < 20) return "RANGING";
  if (adx > 30 && sma50 > sma200) return "STRONG_BULL";
  if (adx > 30 && sma50 < sma200) return "STRONG_BEAR";
  return "MODERATE";
}

export function getBand(regime) {
  if (regime === "VOL_SPIKE" || regime === "RANGING") return "TIGHT";
  if (regime === "STRONG_BULL" || regime === "LOW_VOL_TREND") return "LOOSE";
  return "MEDIUM";
}

export function recommendedDelta(regime, band, iv) {
  if (regime === "STRONG_BULL" && iv > 0.4) return -0.20;
  if (band === "LOOSE") return -0.30;
  if (band === "MEDIUM") return -0.25;
  return -0.15;
}
