/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  ChevronRight, 
  ShieldCheck, 
  Award, 
  DollarSign, 
  UserPlus, 
  ChevronUp, 
  Percent,
  CheckCircle2
} from 'lucide-react';
import { LeadTrader } from '../types';

interface CopyTradingProps {
  leadTraders: LeadTrader[];
  walletUsdBalance: number;
  onCopyTrader: (traderId: string, budget: number) => void;
  onUncopyTrader: (traderId: string) => void;
  onRegisterLeadTrader: (profile: { name: string; profileBio: string; profitRate: number }) => void;
  t: (key: string, defaultValue?: string) => string;
}

export default function CopyTrading({
  leadTraders,
  walletUsdBalance,
  onCopyTrader,
  onUncopyTrader,
  onRegisterLeadTrader,
  t
}: CopyTradingProps) {
  const [activeSection, setActiveSection] = useState<'discover' | 'my_copiers' | 'become_leader'>('discover');
  
  // Create allocation states
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [allocationBudget, setAllocationBudget] = useState<string>('500');
  
  // Become lead state holds
  const [leadName, setLeadName] = useState('');
  const [leadBio, setLeadBio] = useState('');
  const [leadFee, setLeadFee] = useState('10'); // profit sharing rate %
  const [leadAdded, setLeadAdded] = useState(false);

  const handleCopySubmit = (traderId: string) => {
    const budget = parseFloat(allocationBudget);
    if (isNaN(budget) || budget <= 20) {
      alert(t('ctMinBudgetAlert', "Minimum copying budget threshold is $20.00 USD"));
      return;
    }

    if (budget > walletUsdBalance) {
      alert(t('ctInsuffBalAlert', "Insufficient USD Liquidity available in Secure Wallet to initiate this subscription."));
      return;
    }

    onCopyTrader(traderId, budget);
    setCopyingId(null);
    alert(t('ctSuccessAlert', "Successfully instantiated copy sequence! Automated execution will mimic positioning."));
  };

  const handleCreateLeadProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadBio) {
      alert(t('ctSpecifyProfileAlert', "Please specify a profile screen name & bio strategy."));
      return;
    }

    onRegisterLeadTrader({
      name: leadName,
      profileBio: leadBio,
      profitRate: parseFloat(leadFee)
    });

    setLeadAdded(true);
    setTimeout(() => {
      setLeadAdded(false);
      setLeadName('');
      setLeadBio('');
      setActiveSection('discover');
    }, 2500);
  };

  const copiedTraders = leadTraders.filter(t => t.isCopied);

  return (
    <div id="copytrading-matrix" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5">
      
      {/* 1. Dashboard tab layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5 font-mono uppercase">{t('ctEngine', 'COPY TRADING ENGINE')}</span>
          <span className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            <Users size={18} className="text-amber-500" /> {t('ctMirrorLead', 'Mirror Lead Performance')}
          </span>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="copy-tab-discover"
            onClick={() => { setActiveSection('discover'); setCopyingId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeSection === 'discover' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('ctDiscoverLeaders', 'Discover Leaders')}
          </button>
          <button
            id="copy-tab-my"
            onClick={() => setActiveSection('my_copiers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap relative ${
              activeSection === 'my_copiers' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('ctMyCopies', 'My Copies')} ({copiedTraders.length})
          </button>
          <button
            id="copy-tab-become"
            onClick={() => setActiveSection('become_leader')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeSection === 'become_leader' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('ctBecomeLeader', 'Become a Leader')}
          </button>
        </div>
      </div>

      {/* DISCOVER LEADERS PANEL */}
      {activeSection === 'discover' && (
        <div id="copy-discover-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leadTraders.map(trader => (
            <div key={trader.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
              
              {/* Leader Avatar profile summary */}
              <div className="flex items-center gap-3">
                <img 
                  src={trader.avatar} 
                  alt={trader.name} 
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/20" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-white font-bold flex items-center gap-1">
                    {trader.name}
                    <ShieldCheck size={12} className="text-cyan-400" title="Kyc fully verified Master Trader" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono italic">AUM: ${trader.aum.toLocaleString()} USD</span>
                </div>
              </div>

              {/* BIO strategy text */}
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-3">
                {trader.profileBio}
              </p>

              {/* Metrics blocks */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850/60 font-mono text-center">
                <div>
                  <span className="text-[9px] text-slate-500 block">{t('ctRoi', 'ROI (Avg)')}</span>
                  <span className="text-emerald-400 text-xs font-bold font-sans flex items-center justify-center gap-0.5">
                    <TrendingUp size={10} /> +{trader.roi}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">{t('ctWinRate', 'Win Rate')}</span>
                  <span className="text-white text-xs font-bold">{trader.winRate}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">{t('ctRiskTier', 'Risk tier')}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded inline-block ${
                    trader.riskScore <= 3 ? 'bg-emerald-500/10 text-emerald-400' : trader.riskScore <= 6 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {trader.riskScore}/10
                  </span>
                </div>
              </div>

              {/* Expanded Action form overlay */}
              {copyingId === trader.id ? (
                <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-3.5 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>{t('ctSubscribeToMirror', 'SUBSCRIBE TO MIRROR:')} {trader.name}</span>
                    <button 
                      onClick={() => setCopyingId(null)} 
                      className="text-rose-400 select-none cursor-pointer"
                    >
                      {t('ctCancel', 'Cancel')}
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 block">{t('ctAllocatedTrialBudget', 'ALLOCATED TRIAL BUDGET (USD)')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        id={`copy-budget-input-${trader.id}`}
                        value={allocationBudget}
                        onChange={(e) => setAllocationBudget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 rounded pr-12 focus:outline-none"
                      />
                      <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-extrabold font-mono">USD</span>
                    </div>
                  </div>

                  <span className="text-[9px] text-slate-500 leading-snug block">
                    {t('ctReserveInfo', '* The system reserves this capital strictly within the Secure wallet to fulfill mirrored executions at immediate market rates.')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopySubmit(trader.id)}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded"
                  >
                    {t('ctConfirmSubscription', 'Confirm Subscription')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    id={`copy-setup-${trader.id}`}
                    disabled={trader.isCopied}
                    onClick={() => { setCopyingId(trader.id); setAllocationBudget('500'); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      trader.isCopied 
                        ? 'bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed' 
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md'
                    }`}
                  >
                    {trader.isCopied ? t('ctMirroringStrategies', 'Mirroring Strategies') : t('ctMirrorTrader', 'Mirror Trader')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MY ACTIVE COPIED SUBSCRIPTIONS */}
      {activeSection === 'my_copiers' && (
        <div id="copy-my-layout" className="space-y-4">
          {copiedTraders.length === 0 ? (
            <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
              {t('ctNoActivePortfolios', 'No active copy portfolios designated. Discover top master traders inside our leaderboard indices and copy.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {copiedTraders.map(trader2 => {
                // Simulated daily mirror performance calculations
                const returnAmt = (trader2.copiedBudget || 500) * (trader2.roi * 0.001);
                
                return (
                  <div key={trader2.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4 font-mono text-xs">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-2">
                        <img src={trader2.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <span className="text-white font-bold block">{trader2.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">ACTIVE MIRROR POSITION</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onUncopyTrader(trader2.id);
                          alert(t('ctUnsubscribedAlert', "Unsubscribed and liquidated copied trader positions back into Wallet cache."));
                        }}
                        className="text-rose-400 hover:underline text-[10px]"
                      >
                        {t('ctDeLink', 'De-link Strategy')}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/60 text-center">
                        <span className="text-[10px] text-slate-500 block">{t('ctAllocatedTrialBudget', 'Allocated Trial Budget')}</span>
                        <span className="text-white text-sm font-bold">${trader2.copiedBudget?.toLocaleString()} USD</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/60 text-center">
                        <span className="text-[10px] text-slate-500 block">{t('ctNetMirrorOutput', 'Net Mirror Output')}</span>
                        <span className="text-emerald-400 text-sm font-bold flex items-center justify-center gap-0.5">
                          <ChevronUp size={14} /> +${returnAmt.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900/20 p-2.5 rounded border border-slate-850/40 text-[10px] text-slate-400">
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 font-bold">{t('ctActiveTradesMatched', 'Active trades matched:')}</div>
                      {trader2.recentTrades.slice(0, 2).map((trade, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{t('ctMimicText', 'Mimic')} {trade.side} 100% {t('ctSizeText', 'size')} {trade.symbol}</span>
                          <span className="text-emerald-400">+{trade.profitPercent}% {t('ctMatchedText', 'matched')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BECOME A LEADER SECTION */}
      {activeSection === 'become_leader' && (
        <div id="copy-become-section" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
          
          <div className="space-y-4">
            <span className="text-xs font-bold text-amber-500 block uppercase tracking-wide">{t('ctGrowAum', 'Grow Assets Under Management')}</span>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('ctStrategyIntro', 'Enter your trading strategy to show up globally across the Apex exchange leaderboards. Mirror copiers will automatically match your spots/futures allocations, paying you custom performance royalties in real time.')}
            </p>
            
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>{t('ctRoyaltyAdvantage1', 'Gain 10% Profit royalties fee of cumulative copies gainers.')}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>{t('ctRoyaltyAdvantage2', 'Verify track record with isolated ledger audits.')}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>{t('ctRoyaltyAdvantage3', 'Feature live tags: "BTC Swinger", "Low Risk Stocks", "Hedged Commodities".')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateLeadProfile} className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            {leadAdded ? (
              <div className="h-[200px] flex flex-col justify-center items-center text-center space-y-2 font-mono">
                <CheckCircle2 size={48} className="text-emerald-400 animate-bounce" />
                <span className="text-white font-bold">{t('ctLeaderboardRegistered', 'LEADER PROFILE REGISTERED!')}</span>
                <p className="text-[10px] text-slate-500">{t('ctPendingConfirmation', 'Your profile will go live on exchange indices after 1 blockchain confirmations block.')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">{t('ctDisplayScreenName', 'STRATEGY DISPLAY SCREEN NAME')}</label>
                  <input
                    type="text"
                    required
                    id="lead-name-input"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    placeholder="e.g., StockGuru_AUM"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">{t('ctBioDetails', 'BIO DETAILS & STRATEGY TACTICS (MAX 200 CHR)')}</label>
                  <textarea
                    required
                    maxLength={200}
                    id="lead-bio-input"
                    value={leadBio}
                    onChange={(e) => setLeadBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-xs text-white placeholder-slate-600 h-16 focus:outline-none font-sans"
                    placeholder={t('ctStrategyPlaceholder', 'Describe your leverage parameters, target assets categories, and exit conditions.')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">{t('ctSharingRate', 'PROFIT SHARING RATE (%)')}</label>
                  <select
                    value={leadFee}
                    onChange={(e) => setLeadFee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="5">{t('ctOptionHighlyAttr', '5% Royalties Fee (Highly Attractive)')}</option>
                    <option value="10">{t('ctOptionStandard', '10% Royalties Fee (Standard)')}</option>
                    <option value="15">{t('ctOptionElite', '15% Royalties Fee (Experienced Elite Only)')}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  id="submit-leader-btn"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg tracking-wider"
                >
                  {t('ctAccreditMaster', 'ACCREDIT AS MASTER LEADER')}
                </button>
              </>
            )}
          </form>

        </div>
      )}

    </div>
  );
}
