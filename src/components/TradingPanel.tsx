/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpDown, 
  Settings, 
  Info, 
  ShieldAlert, 
  ChevronDown, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import { Asset, OrderBookItem, OrderType, UserOrder, WalletBalance } from '../types';
import { generateOrderBook } from '../data';

interface TradingPanelProps {
  selectedAsset: Asset;
  userBalances: WalletBalance[];
  onExecuteTrade: (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: OrderType;
    price: number;
    quantity: number;
    triggerPrice?: number;
    trailingPercent?: number;
  }) => void;
  activeOrders: UserOrder[];
  onCancelOrder: (id: string) => void;
}

export default function TradingPanel({
  selectedAsset,
  userBalances,
  onExecuteTrade,
  activeOrders,
  onCancelOrder
}: TradingPanelProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const priceRef = useRef(selectedAsset.price);
  useEffect(() => {
    priceRef.current = selectedAsset.price;
  }, [selectedAsset.price]);
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [leveraged, setLeveraged] = useState<number>(1); // Leverage slider 1x - 100x
  
  // Advanced fields
  const [triggerPrice, setTriggerPrice] = useState<string>('');
  const [trailingPercent, setTrailingPercent] = useState<string>('2');
  const [limitIfTouched, setLimitIfTouched] = useState<string>(''); // For OCO
  
  // Simulated Order Book
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookItem[]; asks: OrderBookItem[] }>({ bids: [], asks: [] });
  const [recentTrades, setRecentTrades] = useState<{ price: number; amount: number; time: string; side: 'BUY' | 'SELL' }[]>([]);

  // Initialize prices when asset updates
  useEffect(() => {
    setPrice(selectedAsset.price.toString());
    setLimitIfTouched((selectedAsset.price * 1.05).toFixed(2));
    setTriggerPrice((selectedAsset.price * 0.95).toFixed(2));
    setQuantity('');
  }, [selectedAsset.id]);

  // Regenerate dynamic order book matches
  useEffect(() => {
    const ob = generateOrderBook(selectedAsset.price);
    setOrderBook(ob);

    // Initial trades list
    const trades = Array.from({ length: 12 }, () => {
      const isBuy = Math.random() > 0.48;
      const deviation = (Math.random() - 0.5) * 0.002;
      return {
        price: Number((selectedAsset.price * (1 + deviation)).toFixed(2)),
        amount: Number((Math.random() * 0.8 + 0.01).toFixed(4)),
        time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        side: isBuy ? 'BUY' as const : 'SELL' as const
      };
    });
    setRecentTrades(trades);
  }, [selectedAsset.id]);

  // Periodic order book and trade flow movements (1.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const activePrice = priceRef.current;
      // Fluctuate central price slightly in book
      const isUp = Math.random() > 0.5;
      const drift = activePrice * (Math.random() - 0.5) * 0.001;
      
      setOrderBook(prev => {
        const bids = prev.bids.map(b => ({
          ...b,
          amount: Math.max(0.005, Number((b.amount + (Math.random() - 0.5) * 0.05).toFixed(4)))
        }));
        const asks = prev.asks.map(a => ({
          ...a,
          amount: Math.max(0.005, Number((a.amount + (Math.random() - 0.5) * 0.05).toFixed(4)))
        }));
        return { bids, asks };
      });

      // Append standard matched trade item
      setRecentTrades(prev => {
        const newTrade = {
          price: Number((activePrice + drift).toFixed(2)),
          amount: Number((Math.random() * 1.2 + 0.002).toFixed(4)),
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          side: isUp ? 'BUY' as const : 'SELL' as const
        };
        return [newTrade, ...prev.slice(0, 11)];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [selectedAsset.id]);

  // Find user balance for current trade
  const usdBalance = userBalances.find(b => b.symbol === 'USD')?.amount || 0;
  const assetBalance = userBalances.find(b => b.symbol === selectedAsset.symbol)?.amount || 0;

  // Percentage slider clicks (25%, 50%, 75%, 100%)
  const handlePercentSelect = (pct: number) => {
    const activePrice = Number(price) || selectedAsset.price;
    if (side === 'BUY') {
      // Buying relies on USD balance
      const maxBuyQty = (usdBalance * leveraged) / activePrice;
      setQuantity((maxBuyQty * pct).toFixed(4));
    } else {
      // Selling relies on holding
      setQuantity((assetBalance * pct).toFixed(4));
    }
  };

  // Liquidation calculation for derivatives positions
  const liquidationPrice = () => {
    const entryPrice = Number(price) || selectedAsset.price;
    if (leveraged <= 1) return null;
    
    if (side === 'BUY') {
      // Long liquidation: entry * (1 - 1/leverage)
      const liq = entryPrice * (1 - (0.9 / leveraged));
      return Number(liq.toFixed(2));
    } else {
      // Short liquidation: entry * (1 + 1/leverage)
      const liq = entryPrice * (1 + (0.9 / leveraged));
      return Number(liq.toFixed(2));
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseFloat(quantity);
    const parsedPrice = orderType === 'MARKET' ? selectedAsset.price : parseFloat(price);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert("Please enter a valid amount / quantity.");
      return;
    }

    onExecuteTrade({
      symbol: selectedAsset.symbol,
      side,
      type: orderType,
      price: parsedPrice,
      quantity: parsedQty,
      triggerPrice: orderType === 'STOP_LIMIT' || orderType === 'OCO' ? parseFloat(triggerPrice) : undefined,
      trailingPercent: orderType === 'TRAILING_STOP' ? parseFloat(trailingPercent) : undefined
    });

    setQuantity('');
  };

  const currentAvailableBalance = side === 'BUY' 
    ? `${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
    : `${assetBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${selectedAsset.symbol}`;

  return (
    <div id="trading-desk-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. ORDER TYPE & EXECUTIONS (Left Col - Taking 2/3 on lg) */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-white tracking-wide">
              Advanced Order Execution
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">MARGIN MODE: ISOLATED</span>
              <Settings size={14} className="text-slate-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* BUY vs SELL Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl">
            <button
              type="button"
              id="trade-side-buy"
              onClick={() => setSide('BUY')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                side === 'BUY' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              LONG (BUY)
            </button>
            <button
              type="button"
              id="trade-side-sell"
              onClick={() => setSide('SELL')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                side === 'SELL' 
                  ? 'bg-rose-500 text-white shadow-md font-extrabold' 
                  : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              SHORT (SELL)
            </button>
          </div>

          {/* Advanced Order Types Navigation Buttons */}
          <div className="flex flex-wrap gap-1.5 justify-between">
            {(['LIMIT', 'MARKET', 'STOP_LIMIT', 'TRAILING_STOP', 'OCO'] as const).map(type => (
              <button
                key={type}
                type="button"
                id={`order-type-${type}`}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                  orderType === type 
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold' 
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Dynamic Order Form Inputs */}
          <div className="space-y-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Available Capital</span>
              <span className="text-white font-semibold font-mono">{currentAvailableBalance}</span>
            </div>

            {/* Price (not shown for market) */}
            {orderType !== 'MARKET' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  PRICE (USD)
                  <Info size={10} title="Execution entry threshold" />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    id="order-price-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-3 pr-16 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="Enter limit price"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">USD</span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">QUANTITY</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  required
                  id="order-quantity-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-3 pr-16 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder={`Amount in ${selectedAsset.symbol}`}
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">{selectedAsset.symbol}</span>
              </div>
            </div>

            {/* Percentage shortcuts */}
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.50, 0.75, 1.00].map(val => (
                <button
                  key={val}
                  type="button"
                  id={`pct-shortcut-${val * 100}`}
                  onClick={() => handlePercentSelect(val)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1 rounded text-xs text-slate-400 font-semibold"
                >
                  {val * 100}%
                </button>
              ))}
            </div>

            {/* OCO Target Boundary / Stop Trigger */}
            {(orderType === 'STOP_LIMIT' || orderType === 'OCO') && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">TRIGGER STOP PRICE (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  id="order-trigger-price"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none"
                  placeholder="Exit / Entry boundary trigger price"
                />
              </div>
            )}

            {/* OCO Upper Boundary */}
            {orderType === 'OCO' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">LIMIT PRICE IF TRIGGERED (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitIfTouched}
                  onChange={(e) => setLimitIfTouched(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none"
                  placeholder="Secondary limit pricing"
                />
              </div>
            )}

            {/* Trailing Stop percentages */}
            {orderType === 'TRAILING_STOP' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">TRAILING DELTA CALLBACK (%)</label>
                <select
                  value={trailingPercent}
                  onChange={(e) => setTrailingPercent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none"
                >
                  <option value="1">1% Premium Call</option>
                  <option value="2">2% Standard Call</option>
                  <option value="5">5% Growth Gap</option>
                  <option value="10">10% Defensive Gap</option>
                </select>
              </div>
            )}

            {/* FUTURES Leverage selection panel */}
            <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">LEVERAGE LEVEL</span>
                <span className="text-amber-500 font-bold font-mono">{leveraged}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="5"
                value={leveraged}
                onChange={(e) => setLeveraged(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>1x (Spot)</span>
                <span>20x (Standard)</span>
                <span>50x (Professional)</span>
                <span>100x (Extreme)</span>
              </div>
            </div>
          </div>

          {/* Premium stats summary prior to execution */}
          <div className="text-xs bg-slate-950/20 rounded-lg p-2.5 space-y-1 border border-slate-800/40 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Valuation:</span>
              <span className="text-white font-semibold">
                ${((Number(price) || selectedAsset.price) * (Number(quantity) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {leveraged > 1 && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Margin Cost:</span>
                  <span className="text-amber-400 font-semibold">
                    ${(((Number(price) || selectedAsset.price) * (Number(quantity) || 0)) / leveraged).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-rose-400 text-[10px]">
                  <span className="flex items-center gap-1">
                    <ShieldAlert size={10} />
                    Dynamic Liquidation Est:
                  </span>
                  <span className="font-bold underline">${liquidationPrice()?.toLocaleString()} USD</span>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            id="submit-order-btn"
            className={`w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-all shadow-lg text-slate-950 ${
              side === 'BUY' 
                ? 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-950/20' 
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-950/20'
            }`}
          >
            CONFIRM {side === 'BUY' ? 'LONG' : 'SHORT'} ORDER
          </button>
        </form>

        {/* Dynamic active orders list at trading root bottom */}
        <div className="mt-6 border-t border-slate-800/60 pt-4">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
            <FileText size={14} className="text-amber-500" />
            <span>Active Spot & Futures Orders ({activeOrders.length})</span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-slate-950/40 p-4 rounded-xl text-center text-xs text-slate-500">
              No pending orders. Executed fills accumulate in your wallet and transaction files.
            </div>
          ) : (
            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex justify-between items-center text-xs font-mono">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {order.side}
                      </span>
                      <span className="text-white font-bold">{order.symbol}</span>
                      <span className="text-slate-400 text-[10px]">{order.type}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Qty: {order.quantity} @ Price: ${order.price.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="text-[10px] text-rose-400 hover:underline px-2 py-1 rounded hover:bg-rose-500/10 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. ORDER BOOK & RECENT TRADES (Right Col - 1/3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2 text-xs font-semibold text-white">
            <ArrowUpDown size={14} className="text-indigo-400" />
            <span>Order Book</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Spread: 0.04%</span>
        </div>

        {/* Bids asks lists */}
        <div className="space-y-4">
          
          {/* ASKS (Sellers - Red) */}
          <div className="space-y-1">
            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-mono border-b border-slate-800/40 pb-1">
              <span>PRICE(USD)</span>
              <span className="text-right">SIZE({selectedAsset.symbol})</span>
              <span className="text-right">TOTAL</span>
            </div>
            
            <div className="space-y-0.5 max-h-[120px] overflow-hidden">
              {orderBook.asks.slice().reverse().map((ask, idx) => (
                <div key={`ask-${idx}`} className="grid grid-cols-3 text-xs font-mono text-rose-400 relative py-0.5 hover:bg-rose-500/5 cursor-pointer">
                  {/* Visual background depth bar representing ask sizing */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all duration-300"
                    style={{ width: `${Math.min(100, (ask.amount / 1.5) * 100)}%` }}
                  />
                  <span className="z-10">${ask.price.toLocaleString()}</span>
                  <span className="text-right text-slate-300 z-10">{ask.amount}</span>
                  <span className="text-right text-slate-500 z-10">${idx===0 ? ask.total.toLocaleString() : (ask.price * ask.amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SPREAD INDICATOR */}
          <div className="bg-slate-950 py-1.5 px-2 rounded border border-slate-800/80 flex justify-between items-center text-xs font-mono">
            <span className="text-white font-bold animate-pulse text-sm">${selectedAsset.price.toLocaleString()}</span>
            <span className="text-slate-400 text-[10px] flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin text-indigo-400" />
              Live Feed
            </span>
          </div>

          {/* BIDS (Buyers - Green) */}
          <div className="space-y-0.5 max-h-[120px] overflow-hidden">
            {orderBook.bids.map((bid, idx) => (
              <div key={`bid-${idx}`} className="grid grid-cols-3 text-xs font-mono text-emerald-400 relative py-0.5 hover:bg-emerald-500/5 cursor-pointer">
                {/* Visual background depth bar representing bid sizing */}
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/11 pointer-events-none transition-all duration-300"
                  style={{ width: `${Math.min(100, (bid.amount / 1.5) * 100)}%` }}
                />
                <span className="z-10">${bid.price.toLocaleString()}</span>
                <span className="text-right text-slate-300 z-10">{bid.amount}</span>
                <span className="text-right text-slate-500 z-10">${idx===0 ? bid.total.toLocaleString() : (bid.price * bid.amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT MATCHED TRADES SUBSECTION */}
        <div className="border-t border-slate-800/60 pt-4 space-y-2">
          <div className="text-xs font-semibold text-white">Recent Client Transactions</div>
          <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1 text-[11px] font-mono">
            {recentTrades.map((t, i) => (
              <div key={`trade-${i}`} className="flex justify-between items-center">
                <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                  ${t.price.toLocaleString()}
                </span>
                <span className="text-slate-300">{t.amount}</span>
                <span className="text-slate-500">{t.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
