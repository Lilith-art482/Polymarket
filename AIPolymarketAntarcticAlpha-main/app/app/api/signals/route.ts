import { NextRequest, NextResponse } from 'next/server';
import { calcIndicators, evaluateSignal } from '@/lib/indicators';
import { fetchPolymarketPrices } from '@/lib/polymarket';
import { fetchOHLCV, getSessionInfo } from '@/lib/mexc';
import { generateSignalText, SignalFormatParams } from '@/lib/formatter';

export async function POST(req: NextRequest) {
  try {
    const { symbol, timeframe, marketId, url, strike, entry } = await req.json();

    if (!symbol || !timeframe) {
      return NextResponse.json({ error: 'Missing required fields: symbol, timeframe' }, { status: 400 });
    }

    const ohlcv = await fetchOHLCV(symbol, timeframe, 100);

    if (ohlcv.length < 30) {
      return NextResponse.json({ error: 'Not enough OHLCV data' }, { status: 400 });
    }

    let pm = { up: 0, down: 0, spread: 0, endDate: '' };
    if (marketId) {
      try {
        pm = await fetchPolymarketPrices(marketId);
      } catch {}
    }

    const ind = calcIndicators(ohlcv);
    const signal = evaluateSignal(ind.current);
    const session = getSessionInfo();

    const change = entry ? (((pm.up - entry) / entry) * 100).toFixed(1) : '0.0';
    const strikeNum = strike || 0;
    const price = ind.current.price;
    const strikeDiff = strikeNum ? Math.abs(price - strikeNum) / strikeNum : 1;
    const strikeStatus = !strikeNum ? '—' : strikeDiff < 0.005 ? 'у страйка' : price > strikeNum ? 'выше' : 'ниже';

    const atrPct = (ind.current.atr / price) * 100;
    let volEmoji: string;
    let volComment: string;
    if (atrPct >= 0.3 && atrPct <= 0.8) {
      volEmoji = '🟢';
      volComment = 'Золотая зона — идеальная волатильность для входа';
    } else if (atrPct < 0.3) {
      volEmoji = '🟡';
      volComment = 'Низкая волатильность — возможен флет';
    } else {
      volEmoji = '🔴';
      volComment = 'Высокая волатильность — повышенный риск';
    }

    const formatParams: SignalFormatParams = {
      marketId: marketId || '',
      verdict: signal.verdict,
      emoji: signal.emoji,
      entryPrice: entry || 0,
      currentPrice: pm.up,
      change,
      symbol,
      price,
      strikeStatus,
      upPrice: pm.up,
      downPrice: pm.down,
      spread: pm.spread,
      sessionTime: session.sessionTime,
      totalMinutes: session.totalMinutes,
      currentMin: session.currentMin,
      sessionName: session.name,
      sessionEmoji: session.emoji,
      positiveCount: signal.positiveCount,
      rsiLine: signal.details.rsi,
      macdLine: signal.details.macd,
      vwapLine: signal.details.vwap,
      emaLine: signal.details.ema,
      pivotsLine: signal.details.pivots,
      bbLine: signal.details.bb,
      adxLine: signal.details.adx,
      obvLine: signal.details.obv,
      volEmoji,
      atrValue: ind.current.atr.toFixed(4),
      volComment,
      polymarketUrl: url || (marketId ? `https://polymarket.com/event/${marketId}` : ''),
    };

    const text = generateSignalText(formatParams);

    return NextResponse.json({
      signal,
      pm,
      price,
      atr: ind.current.atr,
      atrPct,
      ind: ind.current,
      session,
      volEmoji,
      volComment,
      atrValue: ind.current.atr.toFixed(4),
      polymarketUrl: url || (marketId ? `https://polymarket.com/event/${marketId}` : ''),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
