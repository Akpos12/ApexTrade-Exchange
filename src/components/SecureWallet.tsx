/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { 
  Wallet, 
  Lock, 
  Unlock, 
  ArrowRightLeft, 
  QrCode, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  SlidersHorizontal,
  Key,
  ShieldAlert
} from 'lucide-react';
import { WalletBalance, Asset, TaxTransaction } from '../types';

interface SecureWalletProps {
  balances: WalletBalance[];
  assets: Asset[];
  onSwapAssets: (fromSymbol: string, toSymbol: string, fromQty: number, rate: number) => void;
  onModifyBalance: (symbol: string, direction: 'DEPOSIT' | 'WITHDRAW', qty: number) => void;
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'];

export default function SecureWallet({ balances, assets, onSwapAssets, onModifyBalance }: SecureWalletProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'swap' | 'deposit_withdraw'>('balances');
  
  // Swap holds
  const [swapFrom, setSwapFrom] = useState('USD');
  const [swapTo, setSwapTo] = useState('BTC');
  const [swapQty, setSwapQty] = useState('');
  
  // Deposit Withdraw holds
  const [opType, setOpType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [opAsset, setOpAsset] = useState('USD');
  const [opQty, setOpQty] = useState('');
  const [walletAddr, setWalletAddr] = useState('');

  // Security elements
  const [isColdStorageLocked, setIsColdStorageLocked] = useState(true);
  const [authorizedCoSigners, setAuthorizedCoSigners] = useState<string[]>([
    'Apex co-signing Node #A1 (Validated)',
    'Personal Hardware Key (Ledger Flex - Connected)'
  ]);
  const [seedPhraseExported, setSeedPhraseExported] = useState(false);

  // Math helper for rate pricing
  const getRate = () => {
    const fromAsset = assets.find(a => a.symbol === swapFrom);
    const toAsset = assets.find(a => a.symbol === swapTo);

    const fromVal = swapFrom === 'USD' ? 1.0 : (fromAsset?.price || 1.0);
    const toVal = swapTo === 'USD' ? 1.0 : (toAsset?.price || 1.0);

    return fromVal / toVal;
  };

  const currentRate = getRate();

  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(swapQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const fromBalance = balances.find(b => b.symbol === swapFrom)?.amount || 0;
    if (qty > fromBalance) {
      alert("Insufficient wallet balance for this swap operations.");
      return;
    }

    onSwapAssets(swapFrom, swapTo, qty, currentRate);
    setSwapQty('');
    alert(`Successfully swapped ${qty} ${swapFrom} to ${(qty * currentRate).toFixed(4)} ${swapTo}!`);
  };

  const handleDepositWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(opQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Please specify a valid quantity amount.");
      return;
    }

    if (opType === 'WITHDRAW') {
      const activeBal = balances.find(b => b.symbol === opAsset)?.amount || 0;
      if (qty > activeBal) {
        alert("Insufficient wallet balance for this withdrawal.");
        return;
      }
    }

    onModifyBalance(opAsset, opType, qty);
    setOpQty('');
    setWalletAddr('');
    alert(`Successfully registered ${opType} of ${qty} ${opAsset}!`);
  };

  const copyDepositAddr = () => {
    setCopied(true);
    navigator.clipboard.writeText('0x89201940000ABeC781...78E993');
    setTimeout(() => setCopied(false), 2000);
  };

  // Build Pie Chart Data allocation
  const pieData = balances
    .filter(b => b.amount > 0)
    .map(b => {
      const assetPrice = assets.find(a => a.symbol === b.symbol)?.price || 1.0;
      const valUSD = b.amount * (b.symbol === 'USD' ? 1.0 : assetPrice);
      return {
        name: b.symbol,
        value: Number(valUSD.toFixed(2))
      };
    })
    .filter(item => item.value > 0.05);

  const totalValueUSD = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div id="secure-wallet-dashboard" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-6">
      
      {/* 1. Header with balances overall metrics and Multi-Sig Cold Lock status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-xs text-slate-400 block mb-1 font-mono uppercase tracking-widest">SECURE NET ASSET VALUE</span>
          <span className="text-3xl font-extrabold text-white font-sans tracking-tight">
            ${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Multi-Sig Cold Storage visual simulation */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800/80">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Key size={18} />
          </div>
          <div className="text-xs font-mono">
            <div className="text-slate-400 font-bold flex items-center gap-1.5">
              <span>MULTI-SIG SHEATH:</span>
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <Lock size={12} /> SECURED
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">2-of-2 Hardware Cosigners Live</div>
          </div>
        </div>
      </div>

      {/* Nav Actions layout tab selectors */}
      <div className="flex bg-slate-950 p-1 rounded-xl">
        <button
          id="wallet-tab-balances"
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex justify-center items-center gap-2 transition-all ${
            activeTab === 'balances' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet size={14} /> Balances
        </button>
        <button
          id="wallet-tab-swap"
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex justify-center items-center gap-2 transition-all ${
            activeTab === 'swap' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft size={14} /> Swapping
        </button>
        <button
          id="wallet-tab-dep-with"
          onClick={() => setActiveTab('deposit_withdraw')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex justify-center items-center gap-2 transition-all ${
            activeTab === 'deposit_withdraw' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight size={14} /> Deposit / Withdraw
        </button>
      </div>

      {/* DYNAMIC TAB RENDERING */}
      {activeTab === 'balances' && (
        <div id="wallet-balances-rendering" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* A. Pie Chart allocations */}
          <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-800 rounded-xl flex flex-col justify-center items-center h-[240px]">
            <span className="text-xs font-bold text-slate-300 mb-2">Asset Allocation (Normalized USD)</span>
            
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* B. Balance listing with names and prices */}
          <div className="space-y-3.5 overflow-y-auto max-h-[240px] pr-2">
            {balances.map((balance, index) => {
              const price = assets.find(a => a.symbol === balance.symbol)?.price || 1.0;
              const valUSD = balance.amount * (balance.symbol === 'USD' ? 1.0 : price);

              return (
                <div key={balance.symbol} className="bg-slate-950 border border-slate-800/85 p-3 rounded-xl flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <div>
                      <div className="text-white text-sm font-bold flex items-center gap-1.5 font-sans">
                        {balance.name} 
                        <span className="text-[10px] text-slate-400 font-mono font-normal">({balance.symbol})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-semibold capitalize bg-slate-900 border border-slate-800/60 px-1.5 py-0.5 rounded-md inline-block">
                        {balance.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white text-sm font-bold">
                      {balance.amount.toLocaleString(undefined, { 
                        minimumFractionDigits: balance.symbol === 'USD' ? 2 : 0,
                        maximumFractionDigits: balance.symbol === 'USD' ? 2 : 4 
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      ${valUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SWAPPING MODULE */}
      {activeTab === 'swap' && (
        <form onSubmit={handleExecuteSwap} className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <ArrowRightLeft size={14} className="text-amber-500" /> Free Hot Swaps
            </span>
            <span className="text-slate-500 text-[10px] font-mono">Zero Slippage System active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Swap From */}
            <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <label className="text-[10px] text-slate-400 block font-mono">FROM HOLDING</label>
              <select
                value={swapFrom}
                onChange={(e) => setSwapFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2 text-sm text-white focus:outline-none"
              >
                <option value="USD">USD Tether (Cash)</option>
                {assets.map(a => <option key={`swapf-${a.symbol}`} value={a.symbol}>{a.name} ({a.symbol})</option>)}
              </select>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Balance: {balances.find(b => b.symbol === swapFrom)?.amount.toLocaleString() || '0'}
              </span>
            </div>

            {/* Swap To */}
            <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <label className="text-[10px] text-slate-400 block font-mono">TO HOLDING</label>
              <select
                value={swapTo}
                onChange={(e) => setSwapTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2 text-sm text-white focus:outline-none"
              >
                {assets.map(a => <option key={`swapt-${a.symbol}`} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                <option value="USD">USD Tether (Cash)</option>
              </select>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Balance: {balances.find(b => b.symbol === swapTo)?.amount.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          {/* Quantity Amount input and estimate calculations */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-mono block">QUANTITY TO SWAP</label>
            <input
              type="number"
              value={swapQty}
              onChange={(e) => setSwapQty(e.target.value)}
              step="0.0001"
              id="swap-quantity-input"
              className="w-full bg-slate-900 border border-slate-800 py-2.5 px-3 text-sm rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              placeholder={`Enter amount in ${swapFrom}`}
            />
          </div>

          {/* Rates conversion display */}
          {Number(swapQty) > 0 && (
            <div className="text-xs space-y-1 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <div className="flex justify-between">
                <span className="text-slate-500">Execution Conversion Rate:</span>
                <span className="text-white">1 {swapFrom} ≈ {currentRate.toFixed(6)} {swapTo}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/40 pt-1.5">
                <span className="text-slate-300 font-bold">Estimated Yield:</span>
                <span className="text-emerald-400 font-extrabold text-sm font-sans">
                  {(Number(swapQty) * currentRate).toLocaleString(undefined, { maximumFractionDigits: 6 })} {swapTo}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="execute-swap-btn"
            className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-500 font-bold py-2.5 rounded-lg text-xs tracking-wider transition-all"
          >
            EXECUTE INSTANT SWAP
          </button>
        </form>
      )}

      {/* DEPOSITS & WITHDRAWALS */}
      {activeTab === 'deposit_withdraw' && (
        <form onSubmit={handleDepositWithdraw} className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
          <div className="flex gap-2 p-0.5 rounded-lg bg-slate-950 border border-slate-850">
            <button
              type="button"
              id="wallet-op-deposit"
              onClick={() => setOpType('DEPOSIT')}
              className={`flex-1 py-1 text-xs font-semibold rounded ${
                opType === 'DEPOSIT' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Deposit Funds
            </button>
            <button
              type="button"
              id="wallet-op-withdraw"
              onClick={() => setOpType('WITHDRAW')}
              className={`flex-1 py-1 text-xs font-semibold rounded ${
                opType === 'WITHDRAW' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Withdraw Cashout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Choose Asset */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">SELECT TARGET ASSET</label>
              <select
                value={opAsset}
                onChange={(e) => setOpAsset(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 py-2 px-2.5 text-xs rounded text-white focus:outline-none"
              >
                <option value="USD">USD Tether (Cash)</option>
                {assets.map(a => <option key={`op-${a.symbol}`} value={a.symbol}>{a.name} ({a.symbol})</option>)}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono block">INPUT VALUE (TOTALS)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={opQty}
                onChange={(e) => setOpQty(e.target.value)}
                id="deposit-withdraw-qty-input"
                className="w-full bg-slate-900 border border-slate-800 py-2 px-2.5 text-xs rounded text-white font-mono focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {opType === 'DEPOSIT' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-1.5 border border-slate-800 rounded-lg flex justify-center items-center">
                {/* Visual QRCode simulator */}
                <QrCode size={110} className="text-white" />
              </div>
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <span className="text-amber-500 font-bold text-xs uppercase block tracking-wider">SECURED ERC-20 COMPLIANT PORT</span>
                <p className="text-slate-400 text-[10px]">
                  Send your preferred {opAsset} payments directly to the platform storage vault gateway below:
                </p>
                
                <div className="flex bg-slate-950 border border-slate-800 rounded p-2 justify-between items-center mt-1">
                  <span className="text-[10px] text-white truncate mr-2 select-all">0x89201940000ABeC781...78E993</span>
                  <button
                    type="button"
                    onClick={copyDepositAddr}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 font-mono block">RECEIVER ADDRESS (MOCK COMPLIANT ROUTING)</span>
                <input
                  type="text"
                  required
                  value={walletAddr}
                  onChange={(e) => setWalletAddr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 py-1.5 px-2.5 text-xs rounded text-white font-mono focus:outline-none"
                  placeholder="Insert valid External Destination Wallet Address"
                />
              </div>
              <p className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold leading-relaxed">
                <ShieldAlert size={12} className="flex-shrink-0" /> Note: Ensure the address supports standard token network layers. Funds diverted to erroneous destinations cannot be retrieved.
              </p>
            </div>
          )}

          <button
            type="submit"
            id="wallet-action-submit-btn"
            className={`w-full font-bold py-2.5 rounded-lg text-xs tracking-wider transition-all shadow-md uppercase ${
              opType === 'DEPOSIT' 
                ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' 
                : 'bg-rose-500 text-white hover:bg-rose-400'
            }`}
          >
            CONFIRM INTERNAL {opType}
          </button>
        </form>
      )}

      {/* MULTI-SIG CO-SIGNERS LOGS & SECURITY DEPOSIT CREDENTIAL CARDS */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs space-y-3 font-mono">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <SlidersHorizontal size={14} className="text-amber-500" /> Multi-Sig Security Infrastructure Settings
        </span>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 text-[11px]">
            <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Authorized Co-Signing Oracles ({authorizedCoSigners.length})</span>
            <ul className="space-y-1">
              {authorizedCoSigners.map((signer, i) => (
                <li key={i} className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span>●</span> {signer}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 flex justify-between items-center">
            <div>
              <span className="text-slate-300 text-[10px] font-bold block">Cold Recovery seed phrase backup</span>
              <p className="text-[9px] text-slate-500 mt-0.5">Protect against primary key device damages</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSeedPhraseExported(true);
                alert("Decrypted Seed backup bundle printed! Verify in your offline secure safe vaults: label 'Apex-Wallet-Master-138402'");
              }}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-[10px] text-amber-500 border border-amber-500/20 rounded font-bold transition-all"
            >
              {seedPhraseExported ? "Generated V2" : "Export Seed"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
