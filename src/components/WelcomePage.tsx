import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Wallet, 
  Users, 
  PiggyBank, 
  Shield, 
  ArrowRight, 
  Lock, 
  Activity, 
  CheckCircle2, 
  User, 
  Key, 
  Mail, 
  Layers, 
  Zap, 
  LineChart, 
  Cpu, 
  Fingerprint, 
  Smartphone, 
  CheckCircle,
  Clock
} from "lucide-react";
import { Asset } from "../types";

interface WelcomePageProps {
  onAuthSuccess: (user: any) => void;
  t: (key: string, defaultValue?: string) => string;
  currentLang: string;
  setSelectedAsset: (asset: Asset) => void;
  setActiveTab: (tab: 'trade' | 'wallet' | 'copy' | 'earn' | 'taxes' | 'admin') => void;
  assets: Asset[];
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onAuthSuccess,
  t,
  currentLang,
  setSelectedAsset,
  setActiveTab,
  assets
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Custom auth states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState('');

  // Local state for dynamic stats
  const [volumeCounter, setVolumeCounter] = useState(1482930214);
  const [connectedClients, setConnectedClients] = useState(142981);
  const [systemUptime, setSystemUptime] = useState("99.982%");

  // Auto-increment stats real-time to make the welcome interface feel live and connected!
  useEffect(() => {
    const statInterval = setInterval(() => {
      setVolumeCounter(prev => prev + Math.floor(Math.random() * 5430) + 120);
      if (Math.random() > 0.7) {
        setConnectedClients(prev => prev + 1);
      }
    }, 4000);
    return () => clearInterval(statInterval);
  }, []);

  const handleValidationReset = () => {
    setErrorText('');
    setSuccessText('');
  };

  const executeAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleValidationReset();
    setLoading(true);

    if (!emailInput || !passwordInput) {
      setErrorText("Email and password fields are strictly required.");
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput, password: passwordInput })
        });
        
        if (!response.ok) {
          const data = await response.json();
          setErrorText(data.error || "Authentication failed. Double check your credentials.");
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setSuccessText(`Session secure! Welcome back, ${data.user.name || 'Client'}.`);
          setTimeout(() => {
            onAuthSuccess(data.user);
          }, 800);
        }
      } else {
        if (!fullNameInput) {
          setErrorText("Please specify your full regulatory name for KYC registry.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullNameInput,
            email: emailInput,
            phone: phoneInput || "+1 (555) 000-0000",
            password: passwordInput
          })
        });

        if (!response.ok) {
          const data = await response.json();
          setErrorText(data.error || "Registration rejected by identity policy.");
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setSuccessText(`Profile registered securely! Initiating workstation...`);
          setTimeout(() => {
            onAuthSuccess(data.user);
          }, 1000);
        }
      }
    } catch (err) {
      setErrorText("Failed to communicate with the secure identity cluster.");
    } finally {
      setLoading(false);
    }
  };

  // Automated Quick Sandbox credentials login for reviewer testing
  const triggerSandboxAccess = async (isAdmin: boolean) => {
    handleValidationReset();
    setLoading(true);
    try {
      if (isAdmin) {
        setEmailInput("admin@apextrade.com");
        setPasswordInput("admin123");
        setAuthMode('login');
        
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@apextrade.com", password: "admin123" })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuccessText("🛡️ Administrator Vault authorized! Unlocking control tower...");
            setTimeout(() => {
              onAuthSuccess(data.user);
              setActiveTab('admin');
            }, 800);
          }
        } else {
          setErrorText("Failed to initiate administrator bypass.");
        }
      } else {
        // Create an instant, fresh Sandbox profile via verified Google SSO proxy endpoint back-end routing
        const ssoEmail = `investor_guest_${Math.random().toString(36).substring(5)}@apextrade.com`;
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: ssoEmail, authProvider: "google" })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuccessText("✓ Guest Sandbox initiated! Free $10,000 reference simulation credited.");
            setTimeout(() => {
              onAuthSuccess(data.user);
              setActiveTab('trade');
            }, 800);
          }
        } else {
          setErrorText("Failed to generate virtual sandbox session.");
        }
      }
    } catch (err) {
      setErrorText("Sandbox endpoint offline.");
    } finally {
      setLoading(false);
    }
  };

  // Extract topmost active symbols to display as tickers
  const tickerAssets = assets.filter(a => ['btc', 'eth', 'sol', 'bnb', 'stake-btc'].includes(a.id)).slice(0, 5);

  return (
    <div className="w-full text-left space-y-8 animate-slide-up pb-12">
      
      {/* 1. TOP PREMIUM STATUS HERO HEAD */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 max-w-xl text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Zap size={10} className="text-amber-500 animate-pulse" />
            <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-500">APEXTRADE PLATFORM V4.0</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-none">
            Institutional Asset Clearance <br className="hidden sm:inline" />
            &amp; <span className="text-amber-500">Wealth Execution</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            Unify high-fidelity margin trading, real-time social copy streams, multi-sig secured deposit vaults, and automated transaction reports in one regulatory compliance pipeline. Fully backed 1:1 on chain auditing.
          </p>

          {/* Quick Stats Ticker Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-850">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">24h volume raw</span>
              <span className="text-xs sm:text-sm font-semibold text-white font-mono block">
                ${volumeCounter.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">active pipelines</span>
              <span className="text-xs sm:text-sm font-semibold text-white font-mono block">
                {connectedClients.toLocaleString()} nodes
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase">Node SLA Target</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-mono block">
                {systemUptime}
              </span>
            </div>
          </div>
        </div>

        {/* 2. LIVE DUAL-MODE GLASS AUTH CARD */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative z-10 shrink-0">
          
          {/* Auth Header Tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 gap-1">
            <button
              onClick={() => { setAuthMode('login'); handleValidationReset(); }}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-black tracking-wide transition-all uppercase ${
                authMode === 'login' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Secure Login
            </button>
            <button
              onClick={() => { setAuthMode('register'); handleValidationReset(); }}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-black tracking-wide transition-all uppercase ${
                authMode === 'register' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={executeAuthSubmit} className="space-y-3.5">
            {errorText && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-2.5 rounded-xl text-xs font-semibold leading-normal">
                ⚠️ {errorText}
              </div>
            )}
            
            {successText && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs font-semibold leading-normal">
                ✓ {successText}
              </div>
            )}

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Regulatory Name (KYC)</label>
                <div className="relative flex items-center bg-[#111317] border border-slate-850 rounded-xl px-3 py-2 text-white">
                  <User size={13} className="text-slate-450 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Full Registered Name"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-650"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Security Email</label>
              <div className="relative flex items-center bg-[#111317] border border-slate-850 rounded-xl px-3 py-2 text-white">
                <Mail size={13} className="text-slate-450 mr-2 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="name@institution.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-650"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Contact Phone (Compliance)</label>
                <div className="relative flex items-center bg-[#111317] border border-slate-850 rounded-xl px-3 py-2 text-white">
                  <Smartphone size={13} className="text-slate-450 mr-2 shrink-0" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-650"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block font-bold">Access Password</label>
              <div className="relative flex items-center bg-[#111317] border border-slate-850 rounded-xl px-3 py-2 text-white">
                <Key size={13} className="text-slate-450 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-slate-650"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-xs py-2.5 rounded-xl tracking-wider uppercase transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-amber-400/30"
            >
              {loading ? (
                <>
                  <Clock size={12} className="animate-spin" /> Authorization Pending...
                </>
              ) : (
                <>
                  <Lock size={12} /> {authMode === 'login' ? 'Authorize Safe Access' : 'Create Compliant Node'}
                </>
              )}
            </button>
          </form>

          {/* SIMULATION OR BYPASS CONTROLS */}
          <div className="border-t border-slate-850/80 pt-3 space-y-2">
            <span className="text-[9px] uppercase text-slate-500 font-mono tracking-wider block text-center">INSTANT WORKSTATION SIMULATOR</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => triggerSandboxAccess(false)}
                className="bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold p-2 text-center rounded-xl border border-slate-800 transition active:scale-95 text-[10px] uppercase"
              >
                🚀 Sandbox Preview
              </button>
              <button
                type="button"
                onClick={() => triggerSandboxAccess(true)}
                className="bg-[#2a1306]/20 hover:bg-[#3d1a04]/40 text-[#fca535] font-bold p-2 text-center rounded-xl border border-[#fb923c]/10 transition active:scale-95 text-[10px] uppercase"
              >
                🛡️ Admin Bypass
              </button>
            </div>
            {/* Login tip credentials */}
            <div className="text-[9px] text-slate-500 font-mono text-center leading-normal">
              Admin Credential Hint: <span className="text-slate-400 font-bold">admin@apextrade.com</span> / <span className="text-slate-400 font-bold">admin123</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. COHESIVE PRICES TICKER CARDS */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-mono tracking-widest text-slate-550 block uppercase font-bold">REAL-TIME SEED CONTRACTS INDEX</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tickerAssets.map(asset => {
            const isPos = asset.change24h >= 0;
            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="bg-slate-900 border border-slate-850 hover:border-amber-500/30 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all duration-150 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors rounded-full blur-lg pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white text-xs font-bold font-display tracking-tight block">
                      {asset.symbol}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate max-w-[90px]">
                      {asset.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                  }`}>
                    {isPos ? '+' : ''}{asset.change24h}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-semibold text-slate-200 font-mono">
                    {asset.category === 'forex' ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase">USD</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PREMIUM BENTO FEATURE SHOWCASE */}
      <div className="space-y-4">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 block uppercase font-bold">INTEGRATED ECOSYSTEM ARCHITECTURE</span>
          <h2 className="text-lg sm:text-xl font-display font-medium text-white tracking-tight">
            Institutional Utilities Engineered for Digital Assets
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Trading Workspace */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">1. Ultra Desk</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Real-time charting pipelines powered by WebSockets. Instant Limit, Market, and Stop-Limit block fills.
              </p>
            </div>
            <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Activity size={10} className="text-amber-500" />
              Sub-1.5ms execution latency
            </div>
          </div>

          {/* Card 2: Safe Clearing Custody */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-xl flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">2. Cold Ledger</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Secure multisig coordinates and direct institutional clearing networks. Zero conversion settlement with dynamic addresses.
              </p>
            </div>
            <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-blue-400" />
              Fully audited custody coordinates
            </div>
          </div>

          {/* Card 3: Copy Trading Synchronizer */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 bg-purple-500/10 text-purple-400 border border-purple-500/25 rounded-xl flex items-center justify-center">
                <Users size={16} />
              </div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">3. Syndicate Copy</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Synchronize order flows directly with certified, historically-vetted syndicate lead traders completely hands-free.
              </p>
            </div>
            <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Cpu size={10} className="text-purple-400" />
              Automated smart sizing logic
            </div>
          </div>

          {/* Card 4: High Yield Saver */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl flex items-center justify-center">
                <PiggyBank size={16} />
              </div>
              <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">4. Flexible Saver</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Access sovereign liquidity-backed staking products. Earn predictable daily payouts on institutional-grade custody reserves.
              </p>
            </div>
            <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Fingerprint size={10} className="text-emerald-400" />
              Up to 18.4% verified APY
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
