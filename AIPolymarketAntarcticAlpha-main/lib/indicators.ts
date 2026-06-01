export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  current: {
    rsi: number;
    macdHist: number;
    prevMacdHist: number;
    ema9: number;
    ema21: number;
    vwap: number;
    atr: number;
    hl10High: number;
    hl10Low: number;
    price: number;
    bbUpper: number;
    bbLower: number;
    bbPercentB: number;
    adx: number;
    plusDI: number;
    minusDI: number;
    obvSlope: number;
    mfi: number;
  };
}

function ema(values: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      sum += values[i];
      if (i === period - 1) result.push(sum / period);
      else result.push(0);
    } else {
      result.push(values[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      result.push(sum / period);
    }
  }
  return result;
}

function stddev(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const mean = sma(values, period)[i];
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) sumSq += (values[j] - mean) ** 2;
      result.push(Math.sqrt(sumSq / period));
    }
  }
  return result;
}

function rsi(values: number[], period: number): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i === 0) { gains.push(0); losses.push(0); continue; }
    const diff = values[i] - values[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < values.length; i++) {
    if (i < period) {
      result.push(0);
      if (i === period - 1) {
        avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
        avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result[i] = 100 - 100 / (1 + rs);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

function macd(
  values: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): { MACD: number[]; signal: number[]; histogram: number[] } {
  const fastEma = ema(values, fastPeriod);
  const slowEma = ema(values, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < slowPeriod - 1) macdLine.push(0);
    else macdLine.push(fastEma[i] - slowEma[i]);
  }

  const signal = ema(macdLine, signalPeriod);
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    histogram.push(i < signalPeriod - 1 ? 0 : macdLine[i] - signal[i]);
  }

  return { MACD: macdLine, signal, histogram };
}

function atr(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const tr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
    }
  }

  const result: number[] = [];
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else if (i === period - 1) {
      result.push(tr.slice(0, period).reduce((a, b) => a + b, 0) / period);
    } else {
      result.push((result[i - 1] * (period - 1) + tr[i]) / period);
    }
  }
  return result;
}

function adx(highs: number[], lows: number[], closes: number[], period: number): { adx: number[]; plusDI: number[]; minusDI: number[] } {
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
      plusDM.push(0);
      minusDM.push(0);
    } else {
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
  }

  const smoothedTR: number[] = [];
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      smoothedTR.push(0);
      smoothedPlusDM.push(0);
      smoothedMinusDM.push(0);
    } else if (i === period) {
      smoothedTR.push(tr.slice(0, period + 1).reduce((a, b) => a + b, 0));
      smoothedPlusDM.push(plusDM.slice(0, period + 1).reduce((a, b) => a + b, 0));
      smoothedMinusDM.push(minusDM.slice(0, period + 1).reduce((a, b) => a + b, 0));
    } else {
      smoothedTR.push(smoothedTR[i - 1] - smoothedTR[i - 1] / period + tr[i]);
      smoothedPlusDM.push(smoothedPlusDM[i - 1] - smoothedPlusDM[i - 1] / period + plusDM[i]);
      smoothedMinusDM.push(smoothedMinusDM[i - 1] - smoothedMinusDM[i - 1] / period + minusDM[i]);
    }
  }

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (smoothedTR[i] === 0) {
      plusDI.push(0);
      minusDI.push(0);
      dx.push(0);
    } else {
      const pdi = 100 * smoothedPlusDM[i] / smoothedTR[i];
      const mdi = 100 * smoothedMinusDM[i] / smoothedTR[i];
      plusDI.push(pdi);
      minusDI.push(mdi);
      const sum = pdi + mdi;
      dx.push(sum > 0 ? 100 * Math.abs(pdi - mdi) / sum : 0);
    }
  }

  const adxArr = ema(dx, period);
  return { adx: adxArr, plusDI, minusDI };
}

function obv(closes: number[], volumes: number[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) result.push(result[i - 1] + volumes[i]);
    else if (closes[i] < closes[i - 1]) result.push(result[i - 1] - volumes[i]);
    else result.push(result[i - 1]);
  }
  return result;
}

function mfiCalc(highs: number[], lows: number[], closes: number[], volumes: number[], period: number): number[] {
  const result: number[] = [];
  const typicalPrices = highs.map((h, i) => (h + lows[i] + closes[i]) / 3);
  const moneyFlow = typicalPrices.map((tp, i) => tp * volumes[i]);
  const posFlow: number[] = [];
  const negFlow: number[] = [];

  for (let i = 0; i < typicalPrices.length; i++) {
    if (i === 0) { posFlow.push(0); negFlow.push(0); continue; }
    if (typicalPrices[i] > typicalPrices[i - 1]) { posFlow.push(moneyFlow[i]); negFlow.push(0); }
    else if (typicalPrices[i] < typicalPrices[i - 1]) { posFlow.push(0); negFlow.push(moneyFlow[i]); }
    else { posFlow.push(0); negFlow.push(0); }
  }

  for (let i = 0; i < typicalPrices.length; i++) {
    if (i < period) { result.push(0); continue; }
    const posSum = posFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const negSum = negFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    if (negSum === 0) { result.push(100); continue; }
    result.push(100 - 100 / (1 + posSum / negSum));
  }
  return result;
}

export function calcIndicators(ohlcv: OHLCV[]): IndicatorResult {
  const closes = ohlcv.map(c => c.close);
  const highs = ohlcv.map(c => c.high);
  const lows = ohlcv.map(c => c.low);
  const volumes = ohlcv.map(c => c.volume);

  const rsiArr = rsi(closes, 14);
  const macdResult = macd(closes, 12, 26, 9);
  const ema9Arr = ema(closes, 9);
  const ema21Arr = ema(closes, 21);
  const atrArr = atr(highs, lows, closes, 14);

  const vwapArr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const cumTPV = ohlcv.slice(0, i + 1).reduce((s, c) => s + ((c.high + c.low + c.close) / 3) * c.volume, 0);
    const cumVol = ohlcv.slice(0, i + 1).reduce((s, c) => s + c.volume, 0);
    vwapArr.push(cumVol > 0 ? cumTPV / cumVol : closes[i]);
  }

  const bbSma = sma(closes, 20);
  const bbStd = stddev(closes, 20);
  const bbUpperArr = bbSma.map((m, i) => m + 2 * bbStd[i]);
  const bbLowerArr = bbSma.map((m, i) => m - 2 * bbStd[i]);

  const adxResult = adx(highs, lows, closes, 14);
  const obvArr = obv(closes, volumes);
  const mfiArr = mfiCalc(highs, lows, closes, volumes, 14);

  const hl10High: number[] = [];
  const hl10Low: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const sliceHigh = highs.slice(Math.max(0, i - 9), i + 1);
    const sliceLow = lows.slice(Math.max(0, i - 9), i + 1);
    hl10High.push(Math.max(...sliceHigh));
    hl10Low.push(Math.min(...sliceLow));
  }

  const last = closes.length - 1;
  const prev = Math.max(0, last - 1);

  const bbPercentB = (closes[last] - bbLowerArr[last]) / (bbUpperArr[last] - bbLowerArr[last]);

  const obvSlope = obvArr[last] - obvArr[Math.max(0, last - 3)];

  return {
    current: {
      rsi: rsiArr[last],
      macdHist: macdResult.histogram[last] ?? 0,
      prevMacdHist: macdResult.histogram[prev] ?? 0,
      ema9: ema9Arr[last],
      ema21: ema21Arr[last],
      vwap: vwapArr[last] ?? closes[last],
      atr: atrArr[last] ?? 0,
      hl10High: hl10High[last],
      hl10Low: hl10Low[last],
      price: closes[last],
      bbUpper: bbUpperArr[last],
      bbLower: bbLowerArr[last],
      bbPercentB,
      adx: adxResult.adx[last] ?? 0,
      plusDI: adxResult.plusDI[last] ?? 0,
      minusDI: adxResult.minusDI[last] ?? 0,
      obvSlope,
      mfi: mfiArr[last] ?? 0,
    },
  };
}

export function evaluateSignal(ind: IndicatorResult['current']) {
  let score = 0;
  const details: Record<string, string> = {};
  const signals: Record<string, number> = {};

  if (ind.rsi < 35) { score++; signals.rsi = 1; details.rsi = `✅ RSI ${ind.rsi.toFixed(0)} — перепроданность`; }
  else if (ind.rsi > 65) { score--; signals.rsi = -1; details.rsi = `❌ RSI ${ind.rsi.toFixed(0)} — выход из перекупленности`; }
  else { signals.rsi = 0; details.rsi = `⚪ RSI ${ind.rsi.toFixed(0)} — нейтрально`; }

  if (ind.macdHist > 0 && ind.macdHist > ind.prevMacdHist) { score++; signals.macd = 1; details.macd = '✅ MACD — гистограмма растёт, выше нуля'; }
  else if (ind.macdHist < 0 && ind.macdHist < ind.prevMacdHist) { score--; signals.macd = -1; details.macd = '❌ MACD — гистограмма падает, ниже нуля'; }
  else { signals.macd = 0; details.macd = '⚪ MACD — без чёткого сигнала'; }

  if (ind.ema9 > ind.ema21) { score++; signals.ema = 1; details.ema = '✅ EMA 9 выше EMA 21 (бычий фон)'; }
  else { score--; signals.ema = -1; details.ema = '❌ EMA 9 ниже EMA 21 (медвежий фон)'; }

  const vwapDiff = ind.price - ind.vwap;
  if (vwapDiff > 0) { score++; signals.vwap = 1; details.vwap = `✅ VWAP — цена выше на $${Math.abs(vwapDiff).toFixed(2)}`; }
  else { score--; signals.vwap = -1; details.vwap = `❌ VWAP — цена ниже на $${Math.abs(vwapDiff).toFixed(2)}`; }

  const pivotMid = (ind.hl10High + ind.hl10Low) / 2;
  if (ind.price > pivotMid * 1.001) { score++; signals.pivots = 1; details.pivots = '✅ Pivots HL10 — цена выше середины'; }
  else if (ind.price < pivotMid * 0.999) { score--; signals.pivots = -1; details.pivots = '❌ Pivots HL10 — цена ниже середины'; }
  else { signals.pivots = 0; details.pivots = '⚪ Pivots HL10 — между уровнями'; }

  if (ind.bbPercentB < 0.2) { score++; signals.bb = 1; details.bb = `✅ BB %B ${ind.bbPercentB.toFixed(2)} — у нижней границы (перепроданность)`; }
  else if (ind.bbPercentB > 0.8) { score--; signals.bb = -1; details.bb = `❌ BB %B ${ind.bbPercentB.toFixed(2)} — у верхней границы (перекупленность)`; }
  else { signals.bb = 0; details.bb = `⚪ BB %B ${ind.bbPercentB.toFixed(2)} — внутри диапазона`; }

  if (ind.adx > 20 && ind.plusDI > ind.minusDI) { score++; signals.adx = 1; details.adx = `✅ ADX ${ind.adx.toFixed(0)} — тренд вверх (+DI > -DI)`; }
  else if (ind.adx > 20 && ind.minusDI > ind.plusDI) { score--; signals.adx = -1; details.adx = `❌ ADX ${ind.adx.toFixed(0)} — тренд вниз (-DI > +DI)`; }
  else { signals.adx = 0; details.adx = `⚪ ADX ${ind.adx.toFixed(0)} — нет тренда`; }

  if (ind.obvSlope > 0) { score++; signals.obv = 1; details.obv = `✅ OBV — растущий объём подтверждает движение`; }
  else if (ind.obvSlope < 0) { score--; signals.obv = -1; details.obv = `❌ OBV — падающий объём, расхождение с ценой`; }
  else { signals.obv = 0; details.obv = '⚪ OBV — объём нейтрален'; }

  if (ind.mfi < 20) { score++; signals.mfi = 1; details.mfi = `✅ MFI ${ind.mfi.toFixed(0)} — перепроданность`; }
  else if (ind.mfi > 80) { score--; signals.mfi = -1; details.mfi = `❌ MFI ${ind.mfi.toFixed(0)} — перекупленность`; }
  else { signals.mfi = 0; details.mfi = `⚪ MFI ${ind.mfi.toFixed(0)} — нейтрально`; }

  let verdict = 'NEUTRAL';
  let positiveCount = 0;

  if (score >= 3) {
    verdict = 'UP';
    positiveCount = Object.values(signals).filter(v => v === 1).length;
  } else if (score <= -3) {
    verdict = 'DOWN';
    positiveCount = Object.values(signals).filter(v => v === -1).length;
  }

  const emoji = verdict === 'UP' ? '🟢' : verdict === 'DOWN' ? '🔴' : '⚪';

  return { score, verdict, emoji, details, positiveCount };
}
