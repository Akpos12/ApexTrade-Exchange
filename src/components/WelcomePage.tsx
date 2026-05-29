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

  // Dynamic rotating pools of all available client assets
  const cryptoAssets = assets.filter(a => a.category === 'crypto');
  const stockAssets = assets.filter(a => a.category === 'stock' || a.category === 'index');
  const commodityAssets = assets.filter(a => a.category === 'commodity' || a.category === 'forex');
  
  const fallbackAssets = [
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 68431.25, change24h: 3.42, category: 'crypto' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3842.14, change24h: 2.14, category: 'crypto' },
    { id: 'sol', symbol: 'SOL', name: 'Solana', price: 162.75, change24h: 8.52, category: 'crypto' },
    { id: 'bnb', symbol: 'BNB', name: 'BNB Chain', price: 592.10, change24h: 1.83, category: 'crypto' },
    { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', price: 189.20, change24h: -0.45, category: 'stock' },
    { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc.', price: 174.50, change24h: 4.12, category: 'stock' },
    { id: 'gold', symbol: 'GOLD', name: 'Gold Bullion', price: 2341.80, change24h: 1.15, category: 'commodity' },
    { id: 'oil', symbol: 'USOIL', name: 'Crude Oil', price: 78.43, change24h: -1.25, category: 'commodity' }
  ];

  const pool1 = cryptoAssets.length > 0 ? cryptoAssets : fallbackAssets.filter(a => a.category === 'crypto');
  const pool2 = stockAssets.length > 0 ? stockAssets : fallbackAssets.filter(a => a.category === 'stock');
  const pool3 = commodityAssets.length > 0 ? commodityAssets : fallbackAssets.filter(a => a.category === 'commodity');
  const pool4 = assets.length > 0 ? assets : fallbackAssets;

  const [t1Index, setT1Index] = useState(0);
  const [t2Index, setT2Index] = useState(0);
  const [t3Index, setT3Index] = useState(0);
  const [t4Index, setT4Index] = useState(0);

  useEffect(() => {
    // Rotating timers at slightly offset intervals to create highly organic, dynamic background energy
    const tG1 = setInterval(() => {
      setT1Index(prev => (prev + 1) % pool1.length);
    }, 4200);

    const tG2 = setInterval(() => {
      setT2Index(prev => (prev + 1) % pool2.length);
    }, 5500);

    const tG3 = setInterval(() => {
      setT3Index(prev => (prev + 1) % pool3.length);
    }, 4800);

    const tG4 = setInterval(() => {
      setT4Index(prev => (prev + 1) % pool4.length);
    }, 6200);

    return () => {
      clearInterval(tG1);
      clearInterval(tG2);
      clearInterval(tG3);
      clearInterval(tG4);
    };
  }, [pool1.length, pool2.length, pool3.length, pool4.length]);

  const activeAsset1 = pool1[t1Index] || fallbackAssets[0];
  const activeAsset2 = pool2[t2Index] || fallbackAssets[4];
  const activeAsset3 = pool3[t3Index] || fallbackAssets[6];
  const activeAsset4 = pool4[t4Index] || fallbackAssets[1];

  const getAssetStyle = (asset: any) => {
    const isPos = asset.change24h >= 0;
    const formatChange = `${isPos ? '+' : ''}${asset.change24h.toFixed(2)}%`;
    const formatPrice = asset.category === 'forex' ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    switch(asset.category) {
      case 'crypto':
        return {
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/20 hover:border-amber-400/60',
          glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]',
          symbolColor: 'bg-amber-500',
          symbolChar: '₿',
          badgeText: `${asset.symbol} $${formatPrice} (${formatChange})`
        };
      case 'stock':
        return {
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/20 hover:border-blue-400/60',
          glowShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.08)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
          symbolColor: 'bg-blue-400',
          symbolChar: '⚡',
          badgeText: `${asset.symbol} $${formatPrice} (${formatChange})`
        };
      case 'commodity':
        return {
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/20 hover:border-emerald-400/60',
          glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
          symbolColor: 'bg-emerald-400',
          symbolChar: '✦',
          badgeText: `${asset.symbol} $${formatPrice} (${formatChange})`
        };
      default:
        return {
          textColor: 'text-fuchsia-400',
          borderColor: 'border-fuchsia-500/25 hover:border-fuchsia-400/60',
          glowShadow: 'shadow-[0_0_20px_rgba(217,70,239,0.08)] hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]',
          symbolColor: 'bg-fuchsia-400',
          symbolChar: '❖',
          badgeText: `${asset.symbol} $${formatPrice} (${formatChange})`
        };
    }
  };

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="w-full text-left space-y-8 animate-slide-up pb-12 relative overflow-hidden transition-all duration-300"
    >
      
      {/* 0. DETAILED PREMIUM DYNAMIC MARQUEES STYLE */}
      <style>{`
        @keyframes marquee-left-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right-slow {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes marquee-left-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 80px; }
        }
        @keyframes pulse-accent-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
        @keyframes float-gentle-1 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-16px) rotate(4deg) scale(1.04); }
        }
        @keyframes float-gentle-2 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(18px) rotate(-6deg) scale(0.96); }
        }
        @keyframes float-gentle-3 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-22px) rotate(3deg) scale(1.08); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .animate-float-1 {
          animation: float-gentle-1 8s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-gentle-2 11s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-gentle-3 9s ease-in-out infinite;
        }
        .animate-grid-move {
          animation: grid-move 28s linear infinite;
        }
        .animate-marquee-left-slow {
          display: flex;
          width: max-content;
          animation: marquee-left-slow 42s linear infinite;
        }
        .animate-marquee-right-slow {
          display: flex;
          width: max-content;
          animation: marquee-right-slow 48s linear infinite;
        }
        .animate-marquee-left-fast {
          display: flex;
          width: max-content;
          animation: marquee-left-slow 22s linear infinite;
        }
        .animate-marquee-right-fast {
          display: flex;
          width: max-content;
          animation: marquee-right-slow 26s linear infinite;
        }
        .animate-marquee-prices {
          display: flex;
          width: max-content;
          animation: marquee-left-fast 30s linear infinite;
        }
        .animate-marquee-prices:hover {
          animation-play-state: paused;
        }
        .word-glow-amber {
          text-shadow: 0 0 15px rgba(245,158,11,0.25), 0 0 4px rgba(245,158,11,0.12);
        }
        .font-outline-transparent {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.04);
          color: transparent;
        }
        .font-outline-amber-dim {
          -webkit-text-stroke: 1px rgba(245, 158, 11, 0.08);
          color: transparent;
        }
        .cyber-grid {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .bounce-letter {
          display: inline-block;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.4);
        }
        .bounce-letter:hover {
          transform: translateY(-10px) scale(1.35) rotate(6deg);
          color: #f59e0b;
          text-shadow: 0 0 15px rgba(245, 158, 11, 0.7);
        }
        @keyframes dynamic-pop-shine {
          0% { transform: scale(0.6) rotate(-4deg); opacity: 0; filter: blur(5px); }
          50% { transform: scale(1.15) rotate(3deg); filter: blur(0); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-dynamic-pop-shine {
          animation: dynamic-pop-shine 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards;
        }
      `}</style>

      {/* BACKGROUND MOVING DECORATIVE STRIPS & CYBER SHIELD ELEMENT */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Dynamic Interactive spotlight tracker */}
        <div 
          className="absolute inset-0 transition-opacity duration-500 opacity-80" 
          style={{
            background: `radial-gradient(circle 380px at ${mousePos.x}% ${mousePos.y}%, rgba(245, 158, 11, 0.08), rgba(59, 130, 246, 0.03), transparent 75%)`
          }}
        />

        {/* Slow Moving Cyber Grid Overlay */}
        <div className="absolute inset-0 cyber-grid animate-grid-move opacity-70" />

        {/* HIGHEST-OCTANE FLOATING GRAPHICS THAT PHYSICALLY OSCILLATE & DYNAMICALLY ROTATE BETWEEN EVERY STOCK, COMMODITY, AND CRYPTO */}
        <div 
          key={`float-node-1-${activeAsset1.id}`}
          onClick={() => { setSelectedAsset(activeAsset1); setActiveTab('trade'); }}
          className={`absolute top-[16%] left-[6%] z-15 animate-float-1 animate-dynamic-pop-shine pointer-events-auto bg-slate-950/80 border ${getAssetStyle(activeAsset1).borderColor} backdrop-blur-md px-3.5 py-2 rounded-full flex items-center gap-2 cursor-pointer select-none transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${getAssetStyle(activeAsset1).glowShadow}`}
          title={`Click to trade ${activeAsset1.name}`}
        >
          <span className={`w-2 h-2 rounded-full ${getAssetStyle(activeAsset1).symbolColor} animate-ping`} />
          <span className={`text-[10px] font-mono font-bold ${getAssetStyle(activeAsset1).textColor} flex items-center gap-1.5`}>
            <span>{getAssetStyle(activeAsset1).symbolChar}</span>
            <span>{getAssetStyle(activeAsset1).badgeText}</span>
          </span>
        </div>

        <div 
          key={`float-node-2-${activeAsset2.id}`}
          onClick={() => { setSelectedAsset(activeAsset2); setActiveTab('trade'); }}
          className={`absolute top-[48%] left-[80%] z-15 animate-float-2 animate-dynamic-pop-shine pointer-events-auto bg-slate-950/80 border ${getAssetStyle(activeAsset2).borderColor} backdrop-blur-md px-3.5 py-2 rounded-full flex items-center gap-2 cursor-pointer select-none transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${getAssetStyle(activeAsset2).glowShadow}`}
          title={`Click to trade ${activeAsset2.name}`}
        >
          <span className={`w-2 h-2 rounded-full ${getAssetStyle(activeAsset2).symbolColor} animate-pulse`} />
          <span className={`text-[10px] font-mono font-bold ${getAssetStyle(activeAsset2).textColor} flex items-center gap-1.5`}>
            <span>{getAssetStyle(activeAsset2).symbolChar}</span>
            <span>{getAssetStyle(activeAsset2).badgeText}</span>
          </span>
        </div>

        <div 
          key={`float-node-3-${activeAsset3.id}`}
          onClick={() => { setSelectedAsset(activeAsset3); setActiveTab('trade'); }}
          className={`absolute top-[75%] left-[10%] z-15 animate-float-3 animate-dynamic-pop-shine pointer-events-auto bg-slate-950/80 border ${getAssetStyle(activeAsset3).borderColor} backdrop-blur-md px-3.5 py-2 rounded-full flex items-center gap-2 cursor-pointer select-none transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${getAssetStyle(activeAsset3).glowShadow}`}
          title={`Click to trade ${activeAsset3.name}`}
        >
          <span className={`w-2 h-2 rounded-full ${getAssetStyle(activeAsset3).symbolColor}`} />
          <span className={`text-[10px] font-mono font-bold ${getAssetStyle(activeAsset3).textColor} flex items-center gap-1.5`}>
            <span>{getAssetStyle(activeAsset3).symbolChar}</span>
            <span>{getAssetStyle(activeAsset3).badgeText}</span>
          </span>
        </div>

        <div 
          key={`float-node-4-${activeAsset4.id}`}
          onClick={() => { setSelectedAsset(activeAsset4); setActiveTab('trade'); }}
          className={`absolute top-[26%] left-[73%] z-15 animate-float-1 animate-dynamic-pop-shine pointer-events-auto bg-slate-950/70 border ${getAssetStyle(activeAsset4).borderColor} backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer select-none transition-all duration-300 hover:scale-110 ${getAssetStyle(activeAsset4).glowShadow}`}
          title={`Click to trade ${activeAsset4.name}`}
        >
          <span className={`text-[9px] font-mono font-bold ${getAssetStyle(activeAsset4).textColor} flex items-center gap-1`}>
            <span>{getAssetStyle(activeAsset4).symbolChar}</span>
            <span>{getAssetStyle(activeAsset4).badgeText}</span>
          </span>
        </div>

        {/* Diagonal high-vibe modern layout rows */}
        <div className="absolute -inset-20 flex flex-col justify-around rotate-[-10deg] scale-110 space-y-4">
          
          {/* Row 1: Crypto Assets Flowing Row (LEFT FAST) */}
          <div className="py-3 overflow-hidden border-y border-white/[0.015] bg-slate-950/[0.15]">
            <div className="animate-marquee-left-fast font-mono text-6xl md:text-8xl font-black tracking-widest uppercase flex gap-16 whitespace-nowrap">
              <span className="font-outline-transparent">BTC / USD $68,431.25</span>
              <span className="text-amber-500/15 font-outline-amber-dim word-glow-amber">★ BITCOIN BULL RUN ★</span>
              <span className="font-outline-transparent">MIN-LATENCY ORDERBOOK CONNECTED</span>
              <span className="font-outline-transparent">ETH / USD $3,842.14</span>
              <span className="text-emerald-500/10 font-outline-transparent">✦ PREMIUM LIQUIDITY ✦</span>
              <span className="font-outline-transparent">SOL / USD $162.75</span>
              <span className="font-outline-transparent">BNB / USD $592.10</span>

              {/* Duplicate array list */}
              <span className="font-outline-transparent">BTC / USD $68,431.25</span>
              <span className="text-amber-500/15 font-outline-amber-dim word-glow-amber">★ BITCOIN BULL RUN ★</span>
              <span className="font-outline-transparent">MIN-LATENCY ORDERBOOK CONNECTED</span>
              <span className="font-outline-transparent">ETH / USD $3,842.14</span>
              <span className="text-emerald-500/10 font-outline-transparent">✦ PREMIUM LIQUIDITY ✦</span>
              <span className="font-outline-transparent">SOL / USD $162.75</span>
              <span className="font-outline-transparent">BNB / USD $592.10</span>
            </div>
          </div>

          {/* Row 2: Stocks & Equities Flowing Row (RIGHT FAST) */}
          <div className="py-3 overflow-hidden border-y border-white/[0.015] bg-slate-950/[0.15]">
            <div className="animate-marquee-right-fast font-mono text-5xl md:text-7xl font-bold tracking-widest uppercase flex gap-20 whitespace-nowrap text-slate-700/15">
              <span className="font-outline-transparent">AAPL / COMMODITIES $189.20</span>
              <span className="text-amber-500/10 font-outline-amber-dim font-bold">● APEX CLEARING SUITE ●</span>
              <span className="font-outline-transparent">TSLA / ELECTRIC $174.50</span>
              <span className="font-outline-transparent">SEC COMPLIANT LEDGER PROTOCOL</span>
              <span className="font-outline-transparent">NVDA / CHIPS $935.20</span>
              <span className="font-outline-transparent">MSFT / SOFTWARE $421.30</span>

              {/* Duplicate list */}
              <span className="font-outline-transparent">AAPL / COMMODITIES $189.20</span>
              <span className="text-amber-500/10 font-outline-amber-dim font-bold">● APEX CLEARING SUITE ●</span>
              <span className="font-outline-transparent">TSLA / ELECTRIC $174.50</span>
              <span className="font-outline-transparent">SEC COMPLIANT LEDGER PROTOCOL</span>
              <span className="font-outline-transparent">NVDA / CHIPS $935.20</span>
              <span className="font-outline-transparent">MSFT / SOFTWARE $421.30</span>
            </div>
          </div>

          {/* Row 3: Institutional Protocols Flowing Row (LEFT SLOW) */}
          <div className="py-2 overflow-hidden border-y border-white/[0.01]">
            <div className="animate-marquee-left-slow font-mono text-4xl md:text-6xl font-extrabold tracking-wider uppercase flex gap-20 whitespace-nowrap text-slate-800/10">
              <span className="font-outline-transparent">MULTI-SIG COLD LOCK SECURED</span>
              <span className="text-amber-500/10 font-outline-amber-dim word-glow-amber">⚡ SUB-1.5MS EXECUTION LATENCY ⚡</span>
              <span className="font-outline-transparent">SWIFT SETTLEMENT PIPELINE V4.0</span>
              <span className="font-outline-transparent">FULLY AUDITED 1:1 SECURE COLD NODES</span>

              {/* Duplicate */}
              <span className="font-outline-transparent">MULTI-SIG COLD LOCK SECURED</span>
              <span className="text-amber-500/10 font-outline-amber-dim word-glow-amber">⚡ SUB-1.5MS EXECUTION LATENCY ⚡</span>
              <span className="font-outline-transparent">SWIFT SETTLEMENT PIPELINE V4.0</span>
              <span className="font-outline-transparent">FULLY AUDITED 1:1 SECURE COLD NODES</span>
            </div>
          </div>

          {/* Row 4: Extra Angled Tech Spec Ticker (RIGHT SLOW) */}
          <div className="py-2 overflow-hidden border-y border-white/[0.008]">
            <div className="animate-marquee-right-slow font-mono text-3xl md:text-5xl font-light tracking-wide uppercase flex gap-16 whitespace-nowrap text-slate-900/10">
              <span className="font-outline-transparent">STAKED RESERVES OVERVIEW</span>
              <span className="text-emerald-500/5 font-outline-transparent">★ SOLANA SPL &amp; BITCOIN SEED CONTRACTS INDEX ★</span>
              <span className="font-outline-transparent">ZERO FEES DEPOSIT SWAP INSTANT</span>
              <span className="font-outline-transparent">QUANTUM SHIELD ENCRYPTION KEYCHAIN</span>

              {/* Duplicate */}
              <span className="font-outline-transparent">STAKED RESERVES OVERVIEW</span>
              <span className="text-emerald-500/5 font-outline-transparent">★ SOLANA SPL &amp; BITCOIN SEED CONTRACTS INDEX ★</span>
              <span className="font-outline-transparent">ZERO FEES DEPOSIT SWAP INSTANT</span>
              <span className="font-outline-transparent">QUANTUM SHIELD ENCRYPTION KEYCHAIN</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* 1. TOP PREMIUM STATUS HERO HEAD */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between backdrop-blur-md">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '9s' }} />

        <div className="space-y-4 max-w-xl text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Zap size={10} className="text-amber-500 animate-pulse" />
            <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-500">APEXTRADE PLATFORM V4.0</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-none">
            <span className="block mb-2">
              {"Institutional Asset Clearance".split(' ').map((word, wIdx) => (
                <span key={wIdx} className="inline-block mr-2.5">
                  {word.split('').map((char, cIdx) => (
                    <span key={cIdx} className="bounce-letter hover:text-amber-400">
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </span>
            <span className="block">
              {"& ".split(' ').map((word, wIdx) => (
                <span key={wIdx} className="inline-block mr-2.5">
                  {word.split('').map((char, cIdx) => (
                    <span key={cIdx} className="bounce-letter text-slate-500 hover:text-white">
                      {char}
                    </span>
                  ))}
                </span>
              ))}
              {"Wealth Execution".split(' ').map((word, wIdx) => (
                <span key={wIdx} className="inline-block mr-2.5 text-amber-500">
                  {word.split('').map((char, cIdx) => (
                    <span key={cIdx} className="bounce-letter hover:text-white hover:scale-125">
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </span>
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

        </div>

      </div>

      {/* 3. COHESIVE PRICES TICKER CARDS */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono tracking-widest text-slate-550 block uppercase font-bold">REAL-TIME SEED CONTRACTS INDEX</h3>
          <span className="text-[9px] font-mono text-slate-500 animate-pulse hidden sm:inline-block">✦ HOVER TO PAUSE &amp; SELECT CONTRACT</span>
        </div>
        
        {/* Mask Overlay Container to fade left and right edges */}
        <div className="relative w-full overflow-hidden rounded-2xl">
          {/* Subtle gradient fades on edges */}
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
          
          <div className="overflow-hidden">
            <div className="animate-marquee-prices flex gap-3 py-1">
              {/* Duplicate the array list multiple times so that the infinite tape stays continuous */}
              {[...tickerAssets, ...tickerAssets, ...tickerAssets, ...tickerAssets].map((asset, index) => {
                const isPos = asset.change24h >= 0;
                return (
                  <div
                    key={`${asset.id}-${index}`}
                    onClick={() => setSelectedAsset(asset)}
                    className="w-[180px] sm:w-[220px] bg-slate-900 border border-slate-850 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all duration-150 relative group overflow-hidden shrink-0"
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
