/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  Clock, 
  Layers, 
  Info, 
  Award, 
  Database,
  ArrowRight,
  BookmarkCheck
} from 'lucide-react';
import { StakingProduct, WalletBalance, Asset } from '../types';

interface EarnSectionProps {
  stakingList: StakingProduct[];
  walletBalances: WalletBalance[];
  onSubscribeStaking: (productId: string, amount: number) => void;
  onModifyAccruedInterest: (intervalSeconds: number) => void; // incremental timer ticks
  t: (key: string, defaultValue?: string) => string;
}

export default function EarnSection({
  stakingList,
  walletBalances,
  onSubscribeStaking,
  onModifyAccruedInterest,
  t
}: EarnSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'savings' | 'staking' | 'dual'>('all');
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [subAmt, setSubAmt] = useState<string>('');

  // Real-time compound interest simulation ticker!
  // Increments accrued interest values on all subscribed products every 2 seconds
  useEffect(() => {
    const ticker = setInterval(() => {
      onModifyAccruedInterest(2);
    }, 2000);

    return () => clearInterval(ticker);
  }, []);

  const handleStakingSubscribe = (e: React.FormEvent, product: StakingProduct) => {
    e.preventDefault();
    const qty = parseFloat(subAmt);
    
    if (isNaN(qty) || qty < product.minAmount) {
      alert(`${t('earnMinSubAlert', 'Minimum subscription threshold is')} ${product.minAmount} ${product.symbol}`);
      return;
    }

    const availableBal = walletBalances.find(b => b.symbol === product.symbol)?.amount || 0;
    if (qty > availableBal) {
      alert(t('earnInsuffBalanceAlert', "Insufficient available balances inside Spot Secure Wallet to subscribe to this earning product."));
      return;
    }

    onSubscribeStaking(product.id, qty);
    setSubscribingId(null);
    setSubAmt('');
    alert(t('earnSuccessAlert', "Successfully instantiated long term investment! Interest yields will accumulate and update live."));
  };

  const filteredProducts = stakingList.filter(prod => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'savings') return prod.category === 'savings';
    if (activeCategory === 'staking') return prod.category === 'staking';
    return prod.category === 'dual_investment';
  });

  const activeSubscriptions = stakingList.filter(prod => prod.subscribedAmount > 0);

  return (
    <div id="apex-earn-suite" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5">
      
      {/* 1. Header options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5 font-mono uppercase">{t('earnYieldFarming', 'YIELD FARMING & HIGH SAVINGS')}</span>
          <span className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            <PiggyBank size={18} className="text-amber-500" /> {t('earnTitle', 'Apex Long-Term Investment "Earn"')}
          </span>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['all', 'savings', 'staking', 'dual'] as const).map(cat => (
            <button
              key={cat}
              id={`earn-filter-btn-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase ${
                activeCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? t('earnAll', 'All') : cat === 'savings' ? t('earnSavings', 'Savings') : cat === 'staking' ? t('earnStaking', 'Staking') : t('earnDual', 'Dual Invest')}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTIONS DASHBOARD MONITOR */}
      {activeSubscriptions.length > 0 && (
        <div id="earn-actives" className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl space-y-3 font-mono text-xs">
          <span className="text-amber-500 font-bold text-xs flex items-center gap-1.5">
            <BookmarkCheck size={14} /> {t('earnHeadingMyCompounding', 'My Compounding High-Yield Portfolios')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeSubscriptions.map(prod => (
              <div key={`active-${prod.id}`} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex justify-between items-center">
                <div>
                  <div className="text-white font-extrabold flex items-center gap-1">
                    {prod.name}
                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1 rounded">{prod.apy}% APY</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {t('earnLockedPrincipal', 'Locked principal:')} {prod.subscribedAmount} {prod.symbol}
                  </span>
                  <span className="text-[10px] text-slate-450 flex items-center gap-1 mt-1">
                    <Clock size={10} /> {prod.termDays === 0 ? t('earnFlexibleLockup', 'Flexible Lockup (Instant Out)') : `${t('earnDuration', 'Duration:')} ${prod.termDays} ${t('earnDays', 'Days')}`}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">{t('earnAccruedReturns', 'Accrued Returns')}</span>
                  <span className="text-emerald-400 text-sm font-black font-sans tracking-wide">
                    {prod.accruedInterest.toFixed(8)} {prod.symbol}
                  </span>
                  <span className="text-[8px] text-slate-600 block">{t('earnCompoundingLive', 'Compounding live')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST OF PRODUCTS */}
      <div id="earn-products-list" className="space-y-4">
        {filteredProducts.map(prod => {
          const isExpanded = subscribingId === prod.id;
          const userSpotBal = walletBalances.find(b => b.symbol === prod.symbol)?.amount || 0;

          return (
            <div key={prod.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 hover:border-slate-800 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-amber-500 font-black font-mono">
                    {prod.symbol}
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-sm">{prod.name}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">{prod.description}</p>
                  </div>
                </div>

                {/* Return Rates & Actions */}
                <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-slate-850 pt-3 sm:pt-0">
                  <div className="font-mono text-center sm:text-right">
                    <span className="text-[9px] text-slate-500 block">{t('earnEstimatedApy', 'ESTIMATED APY')}</span>
                    <span className="text-emerald-400 text-base font-black tracking-tight">{prod.apy}%</span>
                  </div>
                  
                  <div className="font-mono text-center sm:text-right">
                    <span className="text-[9px] text-slate-500 block">{t('earnLockRestriction', 'LOCK RESTRICTION')}</span>
                    <span className="text-indigo-400 font-semibold text-xs py-0.5 px-2 bg-indigo-500/10 rounded inline-block">
                      {prod.termDays === 0 ? t('earnFlexibleSaver', 'Flexible saver') : `${prod.termDays} ${t('earnDaysLimit', 'Days Limit')}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    id={`earn-sub-btn-${prod.id}`}
                    onClick={() => { setSubscribingId(isExpanded ? null : prod.id); setSubAmt(''); }}
                    className="px-4 py-1.5 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-705 text-[11px] text-amber-500 font-bold rounded-lg transition-all"
                  >
                    {isExpanded ? t('earnCloseForm', 'Close Form') : t('earnSubscribe', 'Subscribe')}
                  </button>
                </div>
              </div>

              {/* Collapsed subscription form */}
              {isExpanded && (
                <form 
                  onSubmit={(e) => handleStakingSubscribe(e, prod)} 
                  className="bg-slate-900 border border-amber-500/10 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end font-mono text-xs mt-3 animate-fade-in"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">{t('earnAvailableBalance', 'Spot Available balance')}</span>
                    <span className="text-white text-sm font-extrabold">
                      {userSpotBal.toLocaleString(undefined, { maximumFractionDigits: 4 })} {prod.symbol}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-450 block">{t('earnStakingPrincipal', 'STAKING PRINCIPAL (QTY)')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        required
                        id={`earn-qty-input-${prod.id}`}
                        value={subAmt}
                        onChange={(e) => setSubAmt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-white placeholder-slate-600 focus:outline-none"
                        placeholder={`Min: ${prod.minAmount} ${prod.symbol}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id={`earn-confirm-btn-${prod.id}`}
                    className="py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg w-full transition-colors flex justify-center items-center gap-1 shadow-md"
                  >
                    {t('earnConfirmLockup', 'Confirm Lockup')} <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
