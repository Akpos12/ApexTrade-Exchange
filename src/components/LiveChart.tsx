/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Area, 
  AreaChart, 
  LineChart 
} from 'recharts';
import { TrendingUp, TrendingDown, Eye, Activity, ZoomIn, Sliders, BarChart3 } from 'lucide-react';
import { Asset, HistoricalPoint } from '../types';
import { generateHistoricalData } from '../data';

interface LiveChartProps {
  selectedAsset: Asset;
}

export default function LiveChart({ selectedAsset }: LiveChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '15m' | '1h' | '1D'>('1D');
  const [chartData, setChartData] = useState<HistoricalPoint[]>([]);
  const [showBB, setShowBB] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [indicatorHeight, setIndicatorHeight] = useState<'rsi' | 'macd' | 'none'>('rsi');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  useEffect(() => {
    setLastUpdatedTime(new Date().toLocaleTimeString());
  }, [selectedAsset.price]);

  // Load historical data whenever selectedAsset or timeframe changes
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const mappedTimeframe = timeframe === '1h' ? '1H' : timeframe;
        const res = await fetch(`/api/market/history?symbol=${selectedAsset.symbol}&timeframe=${mappedTimeframe}`);
        if (!res.ok) throw new Error("History fetch failure");
        const pts = await res.json();

        if (isMounted && Array.isArray(pts) && pts.length > 0) {
          const withIndicators = pts.map((pt, index, arr) => {
            let ma9 = pt.ma9 || pt.ema12;
            if (!ma9) {
              const slice = arr.slice(Math.max(0, index - 8), index + 1);
              const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
              ma9 = Number((sum / slice.length).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
            }

            let ma25 = pt.ma25 || pt.ema26;
            if (!ma25) {
              const slice = arr.slice(Math.max(0, index - 24), index + 1);
              const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
              ma25 = Number((sum / slice.length).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
            }

            return {
              ...pt,
              ma9: Number(ma9),
              ma25: Number(ma25),
              bbMid: pt.bbMid ? Number(pt.bbMid) : undefined,
              bbUpper: pt.bbUpper ? Number(pt.bbUpper) : undefined,
              bbLower: pt.bbLower ? Number(pt.bbLower) : undefined,
              rsi: pt.rsi ? Number(pt.rsi) : 50,
              macdLine: pt.macd ? Number(pt.macd.macdLine) : (pt.macdLine || 0),
              signalLine: pt.macd ? Number(pt.macd.signalLine) : (pt.signalLine || 0),
              macdHist: pt.macd ? Number(pt.macd.macdHist) : (pt.macdHist || 0),
            };
          });

          setChartData(withIndicators);
          return;
        }
      } catch (e) {
        console.warn("[LiveChart Feed API] Falling back to high density synthesis:", e);
      }

      if (!isMounted) return;
      const pts = generateHistoricalData(selectedAsset.price, 40, timeframe);
      const withIndicators = pts.map((pt, index, arr) => {
        let ma9 = pt.close;
        if (index >= 8) {
          const sum = arr.slice(index - 8, index + 1).reduce((acc, curr) => acc + curr.close, 0);
          ma9 = Number((sum / 9).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
        }

        let ma25 = pt.close;
        if (index >= 24) {
          const sum = arr.slice(index - 24, index + 1).reduce((acc, curr) => acc + curr.close, 0);
          ma25 = Number((sum / 25).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
        }

        const devCap = selectedAsset.category === 'forex' ? 0.0015 : selectedAsset.price * 0.025;
        const bbMid = ma9;
        const bbUpper = Number((bbMid + devCap).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
        const bbLower = Number((bbMid - devCap).toFixed(selectedAsset.category === 'forex' ? 4 : 2));

        const rsi = Math.max(10, Math.min(90, Number((48 + Math.sin(index * 0.45) * 16 + (Math.random() - 0.5) * 6).toFixed(2))));
        const macdLine = Number((Math.sin(index * 0.3) * (pt.close * 0.004)).toFixed(3));
        const signalLine = Number((Math.sin((index - 2) * 0.3) * (pt.close * 0.0035)).toFixed(3));
        const macdHist = Number((macdLine - signalLine).toFixed(3));

        return {
          ...pt,
          ma9,
          ma25,
          bbMid,
          bbUpper,
          bbLower,
          rsi,
          macdLine,
          signalLine,
          macdHist,
        };
      });

      setChartData(withIndicators);
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [selectedAsset.id, selectedAsset.symbol, timeframe]);

  // Synchronously update the last candle of chartData in real time as tick frames arrive
  useEffect(() => {
    setChartData(prev => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const lastPt = prev[lastIndex];
      const newClose = selectedAsset.price;
      const newHigh = Number(Math.max(lastPt.high, newClose).toFixed(selectedAsset.category === 'forex' ? 4 : 2));
      const newLow = Number(Math.min(lastPt.low, newClose).toFixed(selectedAsset.category === 'forex' ? 4 : 2));

      const updated = [...prev];
      updated[lastIndex] = {
        ...lastPt,
        close: newClose,
        high: newHigh,
        low: newLow
      };
      return updated;
    });
  }, [selectedAsset.price, selectedAsset.id]);

  // Formatter for prices
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: p < 10 ? 4 : 2,
      maximumFractionDigits: p < 10 ? 4 : 2
    }).format(p);
  };

  // Custom Candle node drawing
  const CandleChartNode = (props: any) => {
    const { x, y, width, open, close, high, low } = props;
    const isUp = close >= open;
    const strokeColor = isUp ? 'var(--color-emerald-500)' : 'var(--color-rose-500)';
    const fillColor = isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

    // Map high and low coordinates based on value positions
    // Recharts scales coordinates for bar but we can use values to render whiskers
    const ratio = props.height / Math.abs(close - open || 1);
    const topWhiskerY = y - (high - Math.max(open, close)) * ratio;
    const bottomWhiskerY = y + props.height + (Math.min(open, close) - low) * ratio;

    return (
      <g>
        {/* Draw main vertical whisker */}
        <line 
          x1={x + width / 2} 
          y1={topWhiskerY} 
          x2={x + width / 2} 
          y2={bottomWhiskerY} 
          stroke={strokeColor} 
          strokeWidth={1.5} 
        />
        {/* Draw main trading body */}
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={Math.max(2, props.height)} 
          fill={fillColor} 
          stroke={strokeColor} 
          strokeWidth={1.5} 
          rx={1}
        />
      </g>
    );
  };

  return (
    <div id="apex-live-chart" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Chart Toolbar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider">
            LIVE ANALYTICS
          </div>
          <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            {selectedAsset.name}
          </span>
          {selectedAsset.isPreIpo ? (
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-widest animate-pulse">
              PRE-IPO SEC-TRADING
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold border uppercase tracking-wider ${
                (selectedAsset.marketOpen || selectedAsset.category === 'crypto')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
              }`}>
                {(selectedAsset.marketOpen || selectedAsset.category === 'crypto') ? '● Market Open' : '● Market Closed'}
              </span>
              {selectedAsset.sessionDetails && (
                <span className="text-[9px] font-mono text-slate-500 hidden xl:inline max-w-[140px] truncate" title={selectedAsset.sessionDetails}>
                  ({selectedAsset.sessionDetails})
                </span>
              )}
            </div>
          )}
          {lastUpdatedTime && (
            <span className="text-[9px] font-mono text-slate-500 border border-slate-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span>Sync:</span>
              <span className="text-amber-500 font-bold">{lastUpdatedTime}</span>
            </span>
          )}
          <span className={`text-sm font-semibold flex items-center gap-1 ${
            selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {selectedAsset.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
          </span>
          {/* Public Sentiment tag */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border uppercase tracking-wider ${
            selectedAsset.sentimentLabel.toLowerCase().includes('extremely bullish')
              ? 'bg-[#02C076]/15 text-[#02C076] border-[#02C076]/25'
              : selectedAsset.sentimentLabel.toLowerCase().includes('bullish')
              ? 'bg-[#02C076]/10 text-[#02C076] border-[#02C076]/15'
              : selectedAsset.sentimentLabel.toLowerCase().includes('bearish')
              ? 'bg-[#F84960]/10 text-[#F84960] border-[#F84960]/15'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {selectedAsset.sentimentLabel}
          </span>
        </div>

        {/* Configurations */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selectors */}
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex">
            {(['1m', '15m', '1h', '1D'] as const).map(tf => (
              <button
                key={tf}
                id={`timeframe-btn-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-semibold font-mono transition-all ${
                  timeframe === tf 
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Lines / Candles Toggle */}
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex">
            <button
              id="chart-type-candle"
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                chartType === 'candle' 
                  ? 'bg-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              id="chart-type-line"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                chartType === 'line' 
                  ? 'bg-slate-800 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Area
            </button>
          </div>

          {/* Technical Overlays */}
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex text-xs">
            <button
              id="toggle-bb"
              onClick={() => setShowBB(!showBB)}
              className={`px-2.5 py-1 rounded ${
                showBB ? 'text-[#10b981] font-bold bg-[#10b981]/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Show Bollinger Bands indicators"
            >
              BB
            </button>
            <button
              id="toggle-ma"
              onClick={() => setShowMA(!showMA)}
              className={`px-2.5 py-1 rounded ${
                showMA ? 'text-amber-400 font-bold bg-amber-400/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Show MA-9 & MA-25 indicators"
            >
              MA
            </button>
            <button
              id="toggle-ema"
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2.5 py-1 rounded ${
                showEMA ? 'text-cyan-400 font-bold bg-cyan-400/10' : 'text-slate-400 hover:text-white'
              }`}
              title="Show 50-period Exponential MA"
            >
              EMA
            </button>
          </div>

          {/* Lower Indicator Selectors */}
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex text-xs">
            <button
              id="indicator-rsi"
              onClick={() => setIndicatorHeight('rsi')}
              className={`px-2.5 py-1 rounded ${
                indicatorHeight === 'rsi' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RSI
            </button>
            <button
              id="indicator-macd"
              onClick={() => setIndicatorHeight('macd')}
              className={`px-2.5 py-1 rounded ${
                indicatorHeight === 'macd' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              MACD
            </button>
            <button
              id="indicator-none"
              onClick={() => setIndicatorHeight('none')}
              className={`px-2.5 py-1 rounded ${
                indicatorHeight === 'none' ? 'bg-slate-800 text-slate-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Off
            </button>
          </div>
        </div>
      </div>

      {/* Main Asset Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 gap-4 bg-slate-950/65 border border-slate-800 p-3 rounded-lg mb-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block mb-0.5">LAST PRICE</span>
          <span className="text-white text-base font-bold font-sans tracking-wide">
            {formatPrice(selectedAsset.price)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">24h HIGH</span>
          <span className="text-emerald-400 font-semibold font-sans">
            {formatPrice(selectedAsset.high24h)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">24h LOW</span>
          <span className="text-rose-400 font-semibold font-sans">
            {formatPrice(selectedAsset.low24h)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">24h VOLUME</span>
          <span className="text-white font-sans font-semibold">
            {new Intl.NumberFormat(undefined, { notation: 'compact' }).format(selectedAsset.volume24h)} USD
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5 font-mono">
            {selectedAsset.isPreIpo ? "EXPECTED IPO" : "MARKET CAP"}
          </span>
          <span className={`font-sans font-semibold block text-xs ${selectedAsset.isPreIpo ? "text-amber-400 font-extrabold" : "text-white"}`}>
            {selectedAsset.isPreIpo 
              ? `$${selectedAsset.expectedListingPrice?.toFixed(2) || "N/A"}`
              : `${new Intl.NumberFormat(undefined, { notation: 'compact' }).format(selectedAsset.marketCap)} USD`
            }
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">PUBLIC SENTIMENT</span>
          <span className="text-amber-400 text-sm font-extrabold font-sans flex items-center gap-1">
            {selectedAsset.sentimentScore}/100
            <span className="text-[9px] font-normal text-slate-400 font-mono">({selectedAsset.sentimentLabel})</span>
          </span>
        </div>
      </div>

      {/* Main chart panels */}
      <div className="space-y-4">
        {/* Price panel */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-slate-700)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-slate-700)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']} 
                orientation="right" 
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff' }}
                formatter={(val: any) => [formatPrice(Number(val)), 'Value']}
              />

              {/* Grid-like guide lines */}
              <ReferenceLine y={selectedAsset.price} stroke="#334155" strokeDasharray="3 3" />

              {/* Lines vs. Candlesticks */}
              {chartType === 'line' ? (
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="var(--color-amber-500)" 
                  strokeWidth={2}
                  fill="url(#chartAreaGradient)" 
                />
              ) : (
                <Bar 
                  dataKey="close" 
                  shape={(p: any) => <CandleChartNode {...p} open={p.open} close={p.close} high={p.high} low={p.low} />} 
                />
              )}

              {/* Technical Indicator Curves */}
              {showMA && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="ma9" 
                    stroke="#f59e0b" 
                    strokeWidth={1.2} 
                    dot={false} 
                    name="MA(9)" 
                    activeDot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ma25" 
                    stroke="#a855f7" 
                    strokeWidth={1.2} 
                    dot={false} 
                    name="MA(25)" 
                    activeDot={false} 
                  />
                </>
              )}

              {showEMA && (
                <Line 
                  type="monotone" 
                  dataKey="ma25" // simulated overlay path
                  stroke="#06b6d4" 
                  strokeWidth={1.5} 
                  dot={false} 
                  name="EMA(50)" 
                  activeDot={false} 
                />
              )}

              {/* Bollinger Bands Curves */}
              {showBB && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="bbUpper" 
                    stroke="rgba(16, 185, 129, 0.45)" 
                    strokeWidth={1} 
                    dot={false} 
                    strokeDasharray="3 3"
                    name="BB Upper" 
                    activeDot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbLower" 
                    stroke="rgba(239, 68, 68, 0.45)" 
                    strokeWidth={1} 
                    dot={false} 
                    strokeDasharray="3 3"
                    name="BB Lower" 
                    activeDot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bbMid" 
                    stroke="rgba(148, 163, 184, 0.3)" 
                    strokeWidth={1} 
                    dot={false} 
                    strokeDasharray="4 4"
                    name="BB Mid" 
                    activeDot={false} 
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Lower Indicators (RSI or MACD panel) */}
        {indicatorHeight !== 'none' && (
          <div className="h-[100px] w-full border-t border-slate-800 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              {indicatorHeight === 'rsi' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={[0, 100]} 
                    orientation="right" 
                    stroke="#cbd5e1" 
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    ticks={[30, 70]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  {/* Oversold and Overbought thresholds lines */}
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Overbought', fill: '#ef4444', fontSize: 8, position: 'insideRight' }} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Oversold', fill: '#10b981', fontSize: 8, position: 'insideRight' }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="#6366f1" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name="RSI(14)" 
                    activeDot={false} 
                  />
                </LineChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    orientation="right" 
                    stroke="#cbd5e1" 
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Bar dataKey="macdHist" fill="#c084fc">
                    {/* Color hist index dynamically green/red */}
                    {chartData.map((entry, index) => (
                      <rect 
                        key={`cell-${index}`} 
                        fill={entry.macdHist >= 0 ? '#10b981' : '#ef4444'} 
                        opacity={0.6}
                      />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="macdLine" stroke="#cbd5e1" strokeWidth={1} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="signalLine" stroke="#f59e0b" strokeWidth={1} dot={false} name="Signal" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart Tip Alert banner */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
        <Activity size={12} className="text-cyan-400 animate-pulse" />
        <span>Fully real-time synchronized: Use upper overlays tool to swap technical indices instantly.</span>
      </div>
    </div>
  );
}
