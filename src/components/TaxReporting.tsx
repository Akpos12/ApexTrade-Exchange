/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calculator, 
  Download, 
  ArrowDownToLine, 
  CheckCircle, 
  HelpCircle, 
  Scale, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { TaxTransaction, TaxCategory } from '../types';

interface TaxReportingProps {
  transactionHistory: TaxTransaction[];
  onAddTransaction: (tx: TaxTransaction) => void;
  t: (key: string, defaultValue?: string) => string;
}

export default function TaxReporting({ transactionHistory, onAddTransaction, t }: TaxReportingProps) {
  const [taxYear, setTaxYear] = useState('2026');
  const [bracketRate, setBracketRate] = useState('0.22'); // 22% rate standard holding
  const [jurisdiction, setJurisdiction] = useState('united_states');
  const [deductions, setDeductions] = useState('0'); // custom deduction fees
  
  // Custom advice state
  const [isCpaConsulting, setIsCpaConsulting] = useState(false);
  const [advisorAnalysis, setAdvisorAnalysis] = useState<string>('');

  // Math totals
  const totalProceeds = transactionHistory
    .filter(t => t.type === 'SELL' && t.proceedsUSD)
    .reduce((sum, t) => sum + (t.proceedsUSD || 0), 0);

  const totalCostBasis = transactionHistory
    .filter(t => t.type === 'SELL' && t.costBasisUSD)
    .reduce((sum, t) => sum + (t.costBasisUSD || 0), 0);

  // Capital gain calculation
  const netCapitalGains = Math.max(0, totalProceeds - totalCostBasis);
  const estimatedTaxDue = Math.max(0, (netCapitalGains - parseFloat(deductions || '0')) * parseFloat(bracketRate));

  // CSV Exporter generator helper
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction ID,Timestamp,Operation Type,Asset Symbol,Asset Category,Quantity,Price USD,Fee USD,Proceeds USD,Cost Basis USD,Capital Gain USD\n";
    
    transactionHistory.forEach(tx => {
      const line = [
        tx.id,
        tx.timestamp,
        tx.type,
        tx.symbol,
        tx.category,
        tx.quantity,
        tx.priceUSD,
        tx.feeUSD,
        tx.proceedsUSD || '',
        tx.costBasisUSD || '',
        tx.capitalGainUSD || ''
      ].join(",");
      csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApexTrade_Tax_Ledger_${taxYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit API call to server-side Gemini to analyze and suggest a portfolio tax-loss harvesting strategy!
  const triggerGeminiAdvisor = async () => {
    setIsCpaConsulting(true);
    setAdvisorAnalysis('');
    
    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balances: [
            { symbol: 'BTC', amount: 0.15, category: 'crypto' },
            { symbol: 'TSLA', amount: 12.0, category: 'stock' },
            { symbol: 'SOL', amount: 24.5, category: 'crypto' }
          ],
          transactionHistory,
          taxBracket: `Bracket Rate: ${parseFloat(bracketRate) * 100}%, Region: ${jurisdiction}`
        })
      });

      const data = await response.json();
      setAdvisorAnalysis(data.strategyDetails || 'No dynamic advice returned.');
    } catch (error) {
      console.error(error);
      setAdvisorAnalysis("Execution error querying remote audit intelligence. Please verify backend networks.");
    } finally {
      setIsCpaConsulting(false);
    }
  };

  // Recharts Chart modeling
  const chartData = [
    {
      name: 'Tax Breakdown',
      Proceeds: Number(totalProceeds.toFixed(2)),
      'Cost Basis': Number(totalCostBasis.toFixed(2)),
      'Net Gains': Number(netCapitalGains.toFixed(2)),
      'Tax Due': Number(estimatedTaxDue.toFixed(2))
    }
  ];

  return (
    <div id="apex-tax-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-6">
      
      {/* 1. Header with title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5 font-mono uppercase">{t('taxSuite', 'AUTOMATED REGULATORY SUITE')}</span>
          <span className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            <Calculator size={18} className="text-amber-500" /> {t('taxGovTitle', 'Automated Tax & Gains Reporting')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs text-white font-bold rounded-lg transition-all"
        >
          <Download size={14} /> {t('taxExportCsv', 'Export CSV Ledger')}
        </button>
      </div>

      {/* Tax configuration controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-xs">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">{t('taxFilingYearLabel', 'TAX FILING YEAR')}</label>
          <select value={taxYear} onChange={(e) => setTaxYear(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-1.5 text-white focus:outline-none">
            <option value="2026">{t('taxFilingYearCurrent', '2026 (Current)')}</option>
            <option value="2025">{t('taxFilingYearPrior', '2025 (Prior)')}</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">{t('taxRegionLabel', 'FILING ZONE / REGION')}</label>
          <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-1.5 text-white focus:outline-none">
            <option value="united_states">{t('taxUsa', 'USA (IRS Form 8949)')}</option>
            <option value="united_kingdom">{t('taxUk', 'UK HM Revenue (HMRC)')}</option>
            <option value="germany">{t('taxDe', 'Germany (EStG)')}</option>
            <option value="singapore">{t('taxSg', 'Singapore (Capital-free)')}</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">{t('taxRateLabel', 'MARGINAL BRACKET RATE')}</label>
          <select value={bracketRate} onChange={(e) => setBracketRate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-1.5 text-white focus:outline-none">
            <option value="0.10">{t('taxBracket10', '10% Bracket')}</option>
            <option value="0.15">{t('taxBracket15', '15% Bracket')}</option>
            <option value="0.22">{t('taxBracket22', '22% Bracket (Avg)')}</option>
            <option value="0.32">{t('taxBracket32', '32% Bracket (Elite)')}</option>
            <option value="0.37">{t('taxBracket37', '37% Bracket (Maximum)')}</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 block mb-1">{t('taxDeductibleLabel', 'DEDUCTIBLE TAX FEES ($)')}</label>
          <input 
            type="number" 
            placeholder="0.00" 
            value={deductions} 
            onChange={(e) => setDeductions(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-1.5 text-white focus:outline-none" 
          />
        </div>
      </div>

      {/* METRIC CARD STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center font-mono">
          <span className="text-[9px] text-slate-500 block font-bold">{t('taxRealizedProceeds', 'REALIZED PROCEEDS')}</span>
          <span className="text-white text-base font-extrabold font-sans">${totalProceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center font-mono">
          <span className="text-[9px] text-slate-500 block font-bold">{t('taxTotalCostBasis', 'TOTAL COST BASIS')}</span>
          <span className="text-white text-base font-extrabold font-sans">${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center font-mono">
          <span className="text-[9px] text-slate-500 block font-bold">{t('taxNetCapitalGains', 'NET CAPITAL GAINS')}</span>
          <span className="text-emerald-400 text-base font-extrabold font-sans">${netCapitalGains.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center font-mono">
          <span className="text-[9px] text-slate-500 block font-bold">{t('taxEstimatedLiability', 'ESTIMATED LIABILITY')}</span>
          <span className="text-amber-500 text-base font-extrabold font-sans">${estimatedTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* CHART & HISTORY TAB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gain visual charting bar graph (Left 2/3) */}
        <div className="lg:col-span-2 bg-slate-950/40 p-4 border border-slate-800 rounded-xl flex flex-col justify-between">
          <span className="text-[11px] text-slate-350 block mb-3 font-mono">{t('taxFilingComparison', 'Filing Structure Comparison ($ USD)')}</span>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155' }} />
                <Legend />
                <Bar dataKey="Proceeds" fill="#6366f1" />
                <Bar dataKey="Cost Basis" fill="#f59e0b" />
                <Bar dataKey="Net Gains" fill="#10b981" />
                <Bar dataKey="Tax Due" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Advice list (Right 1/3) */}
        <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Sparkles size={14} className="text-amber-400" /> {t('taxGuideTitle', 'AI Tax Strategy Guide')}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-sans">
              {t('taxGuideDesc', 'Connect to our on-chain server CPA node powered by Gemini to inspect your specific positions and generate immediate tax-loss harvesting plans under')} {taxYear}.
            </p>
          </div>

          <button
            type="button"
            onClick={triggerGeminiAdvisor}
            disabled={isCpaConsulting}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-lg tracking-wide shadow-md transition-all flex items-center justify-center gap-1"
          >
            {isCpaConsulting ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> {t('taxAnalyzing', 'Analyzing Ledger...')}
              </>
            ) : (
              t('taxQueryBtn', 'Query Gemini Advisor')
            )}
          </button>
        </div>
      </div>

      {/* EXPANDED GEMINI RESPONSE BLOCK */}
      {advisorAnalysis && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-300 animate-slide-up">
          <div className="flex justify-between items-center text-[10px] text-amber-500 border-b border-slate-850 pb-2 font-bold mb-1">
            <span>{t('taxAdvisorHeader', 'AUDIT STRATEGY REPORT')}</span>
            <span className="text-slate-550 font-normal">{t('taxAdvisorProvider', 'Provider: Gemini AI Cognitive CPA')}</span>
          </div>
          <div className="space-y-2 leading-relaxed whitespace-pre-line text-[11px]">
            {advisorAnalysis}
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORICAL LEDGER LIST */}
      <div className="border-t border-slate-800/60 pt-4">
        <span className="text-xs font-bold text-slate-200 block mb-3 font-mono">{t('taxLedgerTitle', 'Tax Transaction Ledger Ledger')} ({transactionHistory.length})</span>
        
        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-xs font-mono">
          {transactionHistory.map(tx => (
            <div key={tx.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center hover:border-slate-800 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : tx.type === 'SELL' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {tx.type === 'BUY' ? t('taxBuy', 'BUY') : tx.type === 'SELL' ? t('taxSell', 'SELL') : tx.type}
                  </span>
                  <span className="text-white font-bold">{tx.symbol}</span>
                  <span className="text-slate-550 font-normal text-[10px]">({tx.category})</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(tx.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-white text-sm font-bold">
                  {tx.quantity} {t('taxUnits', 'units')} @ ${tx.priceUSD.toLocaleString()}
                </div>
                {tx.capitalGainUSD !== undefined && (
                  <div className={`text-[10px] font-bold ${tx.capitalGainUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t('taxGain', 'Gain:')} ${tx.capitalGainUSD.toLocaleString()} USD
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
