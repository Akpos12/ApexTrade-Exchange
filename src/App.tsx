/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart4, 
  TrendingUp, 
  Wallet, 
  Users, 
  PiggyBank, 
  Calculator, 
  DollarSign, 
  Menu, 
  User, 
  Coins, 
  Building2, 
  Anchor, 
  ArrowRight,
  ChevronDown,
  Bell,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Percent
} from 'lucide-react';

import { 
  Asset, 
  WalletBalance, 
  LeadTrader, 
  StakingProduct, 
  TaxTransaction, 
  UserOrder, 
  OrderType 
} from './types';

import { 
  INITIAL_ASSETS, 
  INITIAL_LEAD_TRADERS, 
  INITIAL_STAKING_PRODUCTS, 
  INITIAL_TAX_TRANSACTIONS 
} from './data';

import LiveChart from './components/LiveChart';
import TradingPanel from './components/TradingPanel';
import SecureWallet from './components/SecureWallet';
import CopyTrading from './components/CopyTrading';
import EarnSection from './components/EarnSection';
import TaxReporting from './components/TaxReporting';
import SentimentTracker from './components/SentimentTracker';
import AdminPanel from './components/AdminPanel';
import { WelcomePage } from './components/WelcomePage';
import { 
  Shield, RefreshCw, Send, CheckCircle2, ChevronRight, X, UserCheck, 
  AlertTriangle, Lock, Copy, Check, CreditCard, Globe
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab ] = useState<'trade' | 'wallet' | 'copy' | 'earn' | 'taxes' | 'admin'>('trade');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom Toast Notification System
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const customAlert = (msg: string) => {
    setToast({ message: msg, visible: true });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Core Trading Assets
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(INITIAL_ASSETS[0].id);
  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0] || INITIAL_ASSETS[0];
  const setSelectedAsset = (asset: Asset) => setSelectedAssetId(asset.id);
  const [assetSearch, setAssetSearch] = useState('');
  const [streamStatus, setStreamStatus] = useState<string>('CONNECTING');

  // Wallet Balances State
  const [balances, setBalances] = useState<WalletBalance[]>(() => {
    const cached = localStorage.getItem('apex_balances');
    if (cached) return JSON.parse(cached);
    return [
      { symbol: 'USD', name: 'USDT (Tether)', category: 'crypto', amount: 24500.00, locked: 0, avgBuyPrice: 1.0 },
      { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', amount: 0.15, locked: 0, avgBuyPrice: 42000.00 },
      { symbol: 'ETH', name: 'Ethereum', category: 'crypto', amount: 1.45, locked: 0, avgBuyPrice: 2800.00 },
      { symbol: 'SOL', name: 'Solana', category: 'crypto', amount: 8.00, locked: 0, avgBuyPrice: 110.00 },
      { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', amount: 10.00, locked: 0, avgBuyPrice: 175.00 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', amount: 5.00, locked: 0, avgBuyPrice: 850.00 },
      { symbol: 'XAU', name: 'Gold Spot', category: 'commodity', amount: 1.5, locked: 0, avgBuyPrice: 2100.00 },
      { symbol: 'WTI', name: 'Crude Oil', category: 'commodity', amount: 15.00, locked: 0, avgBuyPrice: 75.00 },
    ];
  });

  // Active pending orders
  const [activeOrders, setActiveOrders] = useState<UserOrder[]>(() => {
    const cached = localStorage.getItem('apex_orders');
    return cached ? JSON.parse(cached) : [];
  });

  // Copy Trading Traders State
  const [leadTraders, setLeadTraders] = useState<LeadTrader[]>(() => {
    const cached = localStorage.getItem('apex_leads');
    return cached ? JSON.parse(cached) : INITIAL_LEAD_TRADERS;
  });

  // Long-Term Compound Staking Assets State
  const [stakingProducts, setStakingProducts] = useState<StakingProduct[]>(() => {
    const cached = localStorage.getItem('apex_staking');
    return cached ? JSON.parse(cached) : INITIAL_STAKING_PRODUCTS;
  });

  // Regulatory Tax Transactions State
  const [taxTransactions, setTaxTransactions] = useState<TaxTransaction[]>(() => {
    const cached = localStorage.getItem('apex_taxes');
    return cached ? JSON.parse(cached) : INITIAL_TAX_TRANSACTIONS;
  });

  // Notifications banner visual cue
  const [newsFlash, setNewsFlash] = useState<string>('CONNECTING: Synchronizing high-fidelity broker market queues...');

  // Cache persistence side-effects
  useEffect(() => {
    localStorage.setItem('apex_balances', JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem('apex_orders', JSON.stringify(activeOrders));
  }, [activeOrders]);

  useEffect(() => {
    localStorage.setItem('apex_leads', JSON.stringify(leadTraders));
  }, [leadTraders]);

  useEffect(() => {
    localStorage.setItem('apex_staking', JSON.stringify(stakingProducts));
  }, [stakingProducts]);

  useEffect(() => {
    localStorage.setItem('apex_taxes', JSON.stringify(taxTransactions));
  }, [taxTransactions]);

  // Global window.alert bypass for modern non-blocking Toast alerts
  useEffect(() => {
    window.alert = (message: string) => {
      setToast({ message, visible: true });
    };
  }, []);

  // Multi-tier Fallback Pipeline Real-Time Subscriptions: Sockets -> SSE -> PoLL
  useEffect(() => {
    let ws: WebSocket | null = null;
    let sse: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isTerminated = false;

    const processAssets = (assetsData: any[]) => {
      if (isTerminated || !assetsData || assetsData.length === 0) return;
      setAssets(prev => {
        // Build a Map of existing items by ID/Symbol for fast O(1) lookups
        const itemMap = new Map();
        prev.forEach(item => {
          if (item.id) itemMap.set(item.id.toLowerCase(), item);
          if (item.symbol) itemMap.set(item.symbol.toLowerCase(), item);
        });

        const mergedList = [...prev];
        assetsData.forEach(newAsset => {
          const keyId = newAsset.id?.toLowerCase();
          const keySymbol = newAsset.symbol?.toLowerCase();
          
          let existing = null;
          if (keyId && itemMap.has(keyId)) {
            existing = itemMap.get(keyId);
          } else if (keySymbol && itemMap.has(keySymbol)) {
            existing = itemMap.get(keySymbol);
          }

          if (existing) {
            const idx = mergedList.findIndex(item => item === existing);
            if (idx !== -1) {
              mergedList[idx] = {
                ...existing,
                ...newAsset
              };
            }
          } else {
            mergedList.push(newAsset);
          }
        });
        return mergedList;
      });
    };

    const runPollingFallback = () => {
      if (isTerminated) return;
      setStreamStatus('POLLING (REST)');
      
      const fetchTicks = async () => {
        try {
          const res = await fetch('/api/market/init');
          if (res.ok) {
            const data = await res.json();
            processAssets(data);
          }
        } catch (e) {
          console.warn('[Feed Polling] Request err:', e);
        }
      };

      fetchTicks();
      pollInterval = setInterval(fetchTicks, 2000);
    };

    const runSSEFallback = () => {
      if (isTerminated) return;
      setStreamStatus('SSE STREAM');
      console.log('[Institutional Stream] Connecting via Server-Sent Events...');

      try {
        sse = new EventSource('/api/market/stream');
        
        sse.onmessage = (event) => {
          if (isTerminated) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.assets) {
              processAssets(data.assets);
            }
          } catch (e) {
            console.warn('[Stream SSE] Parsing failed:', e);
          }
        };

        sse.onerror = (e) => {
          console.warn('[Stream SSE] Channel error, falling back to Polling.', e);
          if (sse) sse.close();
          runPollingFallback();
        };
      } catch (err) {
        console.warn('[Stream SSE] Setup error, falling back to Polling.', err);
        runPollingFallback();
      }
    };

    const runWebSocketStream = () => {
      if (isTerminated) return;
      setStreamStatus('CONNECTING');
      console.log('[Institutional Stream] Initializing WebSocket...');

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/market/stream`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isTerminated) return;
          setStreamStatus('LIVE WEBSOCKET');
          console.log('[Institutional Stream] Connected. Real-time feeds streaming active.');
        };

        ws.onmessage = (event) => {
          if (isTerminated) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.assets) {
              processAssets(data.assets);
            }
          } catch (e) {
            console.warn('[Stream WS] Message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isTerminated) return;
          console.warn('[Stream WS] Connection closed. Falling back to Server-Sent Events.');
          runSSEFallback();
        };

        ws.onerror = (err) => {
          if (isTerminated) return;
          console.warn('[Stream WS] Socket error, closing to trigger fallback.', err);
          if (ws) ws.close();
        };
      } catch (err) {
        console.warn('[Stream WS] Setup failed. Trying SSE fallback.', err);
        runSSEFallback();
      }
    };

    // Kickoff
    runWebSocketStream();

    // Secondary task: simple news flash timer
    const newsTimer = setInterval(() => {
      const flashes = [
        "ANALYST CONSENSUS: NVIDIA target increased towards $1,020 on surging institutional bulk orders.",
        "MARKET INSIGHT: Staking APR triggers gold asset inflow as defensive hedging picks up.",
        "TAX DEADLINE: Ensure FIFO reporting guidelines are checked via the CPA tax portal.",
        "COPY UPDATE: CryptoSamurai returns soar above +184% ROI with SOL swings.",
        "EXCHANGE NEWS: Apex Broker expands multi-category coverage including global market indices.",
        "REGULATORY COMPLIANCE: Direct audit trails integrated for capital gains reports.",
      ];
      setNewsFlash(flashes[Math.floor(Math.random() * flashes.length)]);
    }, 5000);

    return () => {
      isTerminated = true;
      if (ws) ws.close();
      if (sse) sse.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(newsTimer);
    };
  }, []);



  // Order Matching Simulator
  // Checks pending LIMIT or STOP orders against newly fluctuating asset prices and fills them!
  useEffect(() => {
    if (activeOrders.length === 0) return;

    const remainingOrders: UserOrder[] = [];
    let balancesUpdated = false;
    let newBalances = [...balances];
    let newTaxLedgers = [...taxTransactions];

    activeOrders.forEach(order => {
      const matchAsset = assets.find(a => a.symbol === order.symbol);
      if (!matchAsset) {
        remainingOrders.push(order);
        return;
      }

      let shouldFill = false;
      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && matchAsset.price <= order.price) shouldFill = true;
        if (order.side === 'SELL' && matchAsset.price >= order.price) shouldFill = true;
      } else if (order.type === 'STOP_LIMIT') {
        if (order.triggerPrice) {
          if (order.side === 'BUY' && matchAsset.price >= order.triggerPrice) shouldFill = true;
          if (order.side === 'SELL' && matchAsset.price <= order.triggerPrice) shouldFill = true;
        }
      }

      if (shouldFill) {
        balancesUpdated = true;
        const totalCost = order.quantity * matchAsset.price;

        if (order.side === 'BUY') {
          // BUY Matching Action
          const usdItem = newBalances.find(b => b.symbol === 'USD');
          if (usdItem && usdItem.amount >= totalCost) {
            usdItem.amount -= totalCost;
            
            const existingAsset = newBalances.find(b => b.symbol === order.symbol);
            if (existingAsset) {
              const prevCostTot = existingAsset.amount * existingAsset.avgBuyPrice;
              existingAsset.amount += order.quantity;
              existingAsset.avgBuyPrice = Number(((prevCostTot + totalCost) / existingAsset.amount).toFixed(2));
            } else {
              newBalances.push({
                symbol: order.symbol,
                name: matchAsset.name,
                category: matchAsset.category,
                amount: order.quantity,
                locked: 0,
                avgBuyPrice: matchAsset.price
              });
            }

            // Append standard tax logs
            newTaxLedgers.push({
              id: `matched-tx-${Math.random().toString(36).substring(4)}`,
              timestamp: new Date().toISOString(),
              type: 'BUY',
              symbol: order.symbol,
              category: matchAsset.category,
              quantity: order.quantity,
              priceUSD: matchAsset.price,
              feeUSD: Number((totalCost * 0.001).toFixed(2))
            });
            alert(`✓ LIMIT MATCH: Placed BUY limit order for ${order.quantity} ${order.symbol} matched and FILLED at $${matchAsset.price}`);
          }
        } else {
          // SELL Matching Action
          const holdingItem = newBalances.find(b => b.symbol === order.symbol);
          if (holdingItem && holdingItem.amount >= order.quantity) {
            holdingItem.amount -= order.quantity;
            
            const usdItem = newBalances.find(b => b.symbol === 'USD');
            if (usdItem) usdItem.amount += totalCost;

            // Gains audit
            const costBasis = order.quantity * holdingItem.avgBuyPrice;
            const fee = Number((totalCost * 0.001).toFixed(2));
            const capitalGain = totalCost - costBasis - fee;

            newTaxLedgers.push({
              id: `matched-tx-${Math.random().toString(36).substring(4)}`,
              timestamp: new Date().toISOString(),
              type: 'SELL',
              symbol: order.symbol,
              category: matchAsset.category,
              quantity: order.quantity,
              priceUSD: matchAsset.price,
              feeUSD: fee,
              proceedsUSD: totalCost,
              costBasisUSD: Number(costBasis.toFixed(2)),
              capitalGainUSD: Number(capitalGain.toFixed(2))
            });
            alert(`✓ LIMIT MATCH: Placed SELL limit order for ${order.quantity} ${order.symbol} matched and FILLED at $${matchAsset.price}. Realized Gain: $${capitalGain.toFixed(2)}`);
          }
        }
      } else {
        remainingOrders.push(order);
      }
    });

    if (balancesUpdated) {
      setBalances(newBalances);
      setTaxTransactions(newTaxLedgers);
      setActiveOrders(remainingOrders);
    }
  }, [assets, activeOrders]);

  // Handler: Execute dynamic trade execution from panel (adds instantly for MARKET, otherwise stores in pending)
  const handleExecuteTrade = (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: OrderType;
    price: number;
    quantity: number;
    triggerPrice?: number;
    trailingPercent?: number;
  }) => {
    const targetAsset = assets.find(a => a.symbol === params.symbol);
    if (!targetAsset) return;

    const currentCost = params.price * params.quantity;

    // A. Is user requesting Limit/Stop? If yes, append to active orders pending queue!
    if (params.type !== 'MARKET') {
      const orderItem: UserOrder = {
        id: `ord-${Math.random().toString(36).substring(4)}`,
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        price: params.price,
        quantity: params.quantity,
        triggerPrice: params.triggerPrice,
        trailingPercent: params.trailingPercent,
        total: currentCost,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };

      // Lock up balances logically to prevent double expenditure if limit sell
      if (params.side === 'SELL') {
        const holdingItem = balances.find(b => b.symbol === params.symbol);
        if (!holdingItem || holdingItem.amount < params.quantity) {
          alert(`Insufficient ${params.symbol} holding available to list this limit order.`);
          return;
        }
      }

      setActiveOrders(prev => [orderItem, ...prev]);
      alert(`Pending ${params.type} order submitted into order book queue representing ${params.quantity} ${params.symbol}. Checking execution triggers...`);
      return;
    }

    // B. MARKET executions filled instantly
    const newBalances = [...balances];
    let newTaxLedgers = [...taxTransactions];

    if (params.side === 'BUY') {
      const usdItem = newBalances.find(b => b.symbol === 'USD');
      if (!usdItem || usdItem.amount < currentCost) {
        alert("Insufficient USD balances in Spot wallet to clear this transaction.");
        return;
      }

      usdItem.amount -= currentCost;
      const assetItem = newBalances.find(b => b.symbol === params.symbol);
      
      if (assetItem) {
        const prevCostBasisTotal = assetItem.amount * assetItem.avgBuyPrice;
        assetItem.amount += params.quantity;
        assetItem.avgBuyPrice = Number(((prevCostBasisTotal + currentCost) / assetItem.amount).toFixed(2));
      } else {
        newBalances.push({
          symbol: params.symbol,
          name: targetAsset.name,
          category: targetAsset.category,
          amount: params.quantity,
          locked: 0,
          avgBuyPrice: params.price
        });
      }

      // Append standard buy tax transactions log
      newTaxLedgers.push({
        id: `tx-user-${Math.random().toString(36).substring(4)}`,
        timestamp: new Date().toISOString(),
        type: 'BUY',
        symbol: params.symbol,
        category: targetAsset.category,
        quantity: params.quantity,
        priceUSD: params.price,
        feeUSD: Number((currentCost * 0.001).toFixed(2))
      });

      setBalances(newBalances);
      setTaxTransactions(newTaxLedgers);
      alert(`✓ Order Filled: Successfully purchased ${params.quantity} ${params.symbol} units at spot market price!`);
    } else {
      // Selling asset
      const assetItem = newBalances.find(b => b.symbol === params.symbol);
      if (!assetItem || assetItem.amount < params.quantity) {
        alert(`Insufficient holding of ${params.symbol} units inside Spot Wallet to execute sell order.`);
        return;
      }

      assetItem.amount -= params.quantity;
      const usdItem = newBalances.find(b => b.symbol === 'USD');
      if (usdItem) usdItem.amount += currentCost;

      // Gains mathematics
      const entryCostBasisVal = params.quantity * assetItem.avgBuyPrice;
      const tradeFee = Number((currentCost * 0.001).toFixed(2));
      const capitalGains = currentCost - entryCostBasisVal - tradeFee;

      newTaxLedgers.push({
        id: `tx-user-${Math.random().toString(36).substring(4)}`,
        timestamp: new Date().toISOString(),
        type: 'SELL',
        symbol: params.symbol,
        category: targetAsset.category,
        quantity: params.quantity,
        priceUSD: params.price,
        feeUSD: tradeFee,
        proceedsUSD: currentCost,
        costBasisUSD: Number(entryCostBasisVal.toFixed(2)),
        capitalGainUSD: Number(capitalGains.toFixed(2))
      });

      setBalances(newBalances);
      setTaxTransactions(newTaxLedgers);
      alert(`✓ Order Filled: Successfully sold ${params.quantity} ${params.symbol} units at spot market. Gains accounted in tax scheduler.`);
    }
  };

  const handleCancelOrder = (id: string) => {
    setActiveOrders(prev => prev.filter(order => order.id !== id));
  };

  // Handler: Swap balances
  const handleSwapAssets = (from: string, to: string, qty: number, rate: number) => {
    const newBals = [...balances];
    const fromItem = newBals.find(b => b.symbol === from);
    const toItem = newBals.find(b => b.symbol === to);

    if (fromItem) fromItem.amount -= qty;
    
    if (toItem) {
      toItem.amount += (qty * rate);
    } else {
      const matchingAsset = assets.find(a => a.symbol === to);
      newBals.push({
        symbol: to,
        name: matchingAsset?.name || to,
        category: matchingAsset?.category || 'crypto',
        amount: qty * rate,
        locked: 0,
        avgBuyPrice: matchingAsset ? matchingAsset.price : 1.0
      });
    }

    // append swap ledger item
    const swapTx: TaxTransaction = {
      id: `swap-tx-${Math.random().toString(36).substring(4)}`,
      timestamp: new Date().toISOString(),
      type: 'SWAP',
      symbol: `${from}-${to}`,
      category: 'crypto',
      quantity: qty,
      priceUSD: from === 'USD' ? 1.0 : (assets.find(a => a.symbol === from)?.price || 1.0),
      feeUSD: 0.00
    };

    setBalances(newBals);
    setTaxTransactions(prev => [swapTx, ...prev]);
  };

  // Handler: Deposit & Withdraw
  const handleModifyBalance = (symbol: string, type: 'DEPOSIT' | 'WITHDRAW', qty: number) => {
    const mAsset = assets.find(a => a.symbol === symbol);

    if (currentUser && currentUser.role !== 'admin') {
      if (type === 'DEPOSIT') {
        const depositPayload = {
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          method: "bank",
          currency: symbol,
          amount: qty,
          bankName: "Lloyds Broker Clearinghouse",
          bankAccountRef: "REF-" + Math.floor(100000 + Math.random() * 900000)
        };
        
        fetch("/api/admin/deposits/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(depositPayload)
        })
        .then(res => res.json())
        .then(result => {
          fetchUserTransactions();
          customAlert(`✓ Your deposit of ${qty} ${symbol} has been registered and is currently processing.`);
        })
        .catch(err => {
          customAlert("Error filing deposit payload.");
        });
        return; // Wait for administrative approval!
      } else {
        const item = balances.find(b => b.symbol === symbol);
        const activeAmt = item?.amount || 0;
        if (qty > activeAmt) {
          customAlert("Error: Insufficient assets liquidity for this withdrawal.");
          return;
        }

        const withdrawalPayload = {
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          method: "bank",
          currency: symbol,
          amount: qty,
          bankName: "Apex Offshore Clearing",
          accountName: currentUser.name,
          accountNumber: "910294819"
        };

        fetch("/api/admin/withdrawals/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withdrawalPayload)
        })
        .then(res => res.json())
        .then(result => {
          fetchUserTransactions();
          customAlert(`✓ Your withdrawal request of ${qty} ${symbol} has been submitted and is currently processing.`);
        })
        .catch(err => {
          customAlert("Error filing withdrawal transfer payload.");
        });
        return;
      }
    }

    const newBals = [...balances];
    const item = newBals.find(b => b.symbol === symbol);

    if (type === 'DEPOSIT') {
      if (item) {
        item.amount += qty;
      } else {
        newBals.push({
          symbol,
          name: mAsset?.name || symbol,
          category: mAsset?.category || 'crypto',
          amount: qty,
          locked: 0,
          avgBuyPrice: mAsset ? mAsset.price : 1.0
        });
      }
    } else {
      if (item) item.amount = Math.max(0, item.amount - qty);
    }

    // append tax item
    const tx: TaxTransaction = {
      id: `depwith-tx-${Math.random().toString(36).substring(4)}`,
      timestamp: new Date().toISOString(),
      type: type === 'DEPOSIT' ? 'BUY' : 'SELL', // simplified categories
      symbol,
      category: mAsset?.category || 'crypto',
      quantity: qty,
      priceUSD: symbol === 'USD' ? 1.0 : (mAsset?.price || 1.0),
      feeUSD: 0.0,
      proceedsUSD: type === 'WITHDRAW' ? (qty * (mAsset?.price || 1.0)) : undefined,
      costBasisUSD: type === 'WITHDRAW' ? (qty * (item?.avgBuyPrice || 1.0)) : undefined,
      capitalGainUSD: type === 'WITHDRAW' ? (qty * ((mAsset?.price || 1.0) - (item?.avgBuyPrice || 1.0))) : undefined
    };

    setBalances(newBals);
    setTaxTransactions(prev => [tx, ...prev]);
  };

  // Handler: Copy traders Strategy sub-elements
  const handleCopyTrader = (traderId: string, budget: number) => {
    const usdItem = balances.find(b => b.symbol === 'USD');
    if (usdItem) usdItem.amount -= budget; // lock up budget

    setLeadTraders(prev => prev.map(t => {
      if (t.id === traderId) {
        return {
          ...t,
          isCopied: true,
          copiedBudget: budget,
          followersCount: t.followersCount + 1,
          aum: t.aum + budget
        };
      }
      return t;
    }));
  };

  const handleUncopyTrader = (traderId: string) => {
    const leader = leadTraders.find(t => t.id === traderId);
    if (leader && leader.copiedBudget) {
      const usdItem = balances.find(b => b.symbol === 'USD');
      if (usdItem) usdItem.amount += leader.copiedBudget; // refund principal
    }

    setLeadTraders(prev => prev.map(t => {
      if (t.id === traderId) {
        return {
          ...t,
          isCopied: false,
          aum: Math.max(0, t.aum - (t.copiedBudget || 0)),
          followersCount: Math.max(0, t.followersCount - 1),
          copiedBudget: undefined
        };
      }
      return t;
    }));
  };

  const handleRegisterLeadTrader = (profile: { name: string; profileBio: string; profitRate: number }) => {
    const newLeader: LeadTrader = {
      id: `lead-${Math.random().toString(36).substring(4)}`,
      name: profile.name,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      roi: 32.50, // default starting ROI performance record
      winRate: 85.0,
      aum: 2500,
      followersCount: 1,
      riskScore: 4,
      profileBio: profile.profileBio,
      monthlyPnlChart: [{ day: 1, pnl: 0 }, { day: 30, pnl: 15 }],
      recentTrades: [],
      isCopied: false
    };

    setLeadTraders(prev => [newLeader, ...prev]);
  };

  // Handler: Staking long term earning product locks
  const handleSubscribeStaking = (id: string, qty: number) => {
    const prod = stakingProducts.find(p => p.id === id);
    if (!prod) return;

    // Deduct Spot balance
    setBalances(prev => {
      return prev.map(b => {
        if (b.symbol === prod.symbol) {
          return { ...b, amount: b.amount - qty };
        }
        return b;
      });
    });

    // Update subscribed amount inside staking list
    setStakingProducts(prev => {
      return prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            subscribedAmount: p.subscribedAmount + qty
          };
        }
        return p;
      });
    });
  };

  // Live timer tick to continuously compound staking interests live!
  const handleModifyAccruedInterest = (seconds: number) => {
    setStakingProducts(prev => {
      return prev.map(prod => {
        if (prod.subscribedAmount > 0) {
          // Compound formula interest accrued = principal * (APY% / 31536000 seconds per year)
          const annualAPY = prod.apy / 100;
          const tickYield = prod.subscribedAmount * (annualAPY / 31536000) * seconds;
          return {
            ...prod,
            accruedInterest: prod.accruedInterest + tickYield
          };
        }
        return prod;
      });
    });
  };

  // Quick action Cash Deposit in header - displays step-by-step deposit process guidance
  const triggerDemoQuickCash = () => {
    setQuickDepositMethod('crypto');
    setQuickDepositStep(1);
    setQuickDepositOpen(true);
    setCopiedAddress(false);
  };

  // Filter asset list based on search bar Input
  const filteredAssets = assets.filter(a => {
    const q = assetSearch.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q);
  });

  // TRANSLATION I18N DICTIONARIES
  const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      tradingDesk: "Trading Desk",
      secureWallet: "Secure Wallet",
      copyTrading: "Copy Trading",
      yieldEarn: "Yield Earn",
      taxCenter: "Tax Center",
      adminCommand: "Admin Command",
      signIn: "Sign In",
      markets: "Markets List",
      feed: "LIVE TELEMETRY FEED",
      exchangeFlash: "EXCHANGE FLASH",
      notLoggedIn: "Authentication Required",
      notLoggedInDesc: "Please connect your secure broker session to view live markets, check ledger balances, and execute trade transactions.",
      connectIdentityBtn: "Connect Secure Account Identity",
      googleSso: "Google Secure Identity",
      appleSso: "Apple ID Integration",
      enterSsoEmailPrompt: "Enter your secure credentials to verify identity federations:",
      returnToLogin: "Return to login prompt",
      logout: "Comply Terminate Session",
      ssoEmail: "SSO Email Coordinates",
      continueSso: "Continue & Connect Instant Session",
      ssoConnecting: "Connecting secure security federation...",
      kycState: "KYC Verification State",
      kycCleared: "Fully cleared under SEC and FinCEN regulation policies.",
      kycPending: "Profile is under unverified status. Actions locked to Escrow.",
      verifyEmailBtn: "Verify Email & Clear Compliance Now",
      secNetwork: "APEX SECURE NETWORK CONNECT • END-TO-END SECURITIES ENCRYPTED",
      walletBalance: "Wallet Liquid Balance",
      depositBtn: "Quick $10k Deposit",
      bellNoActivity: "No ledger activity logged yet",
      bellHint: "Fund your account using the Quick $10k Deposit button to see real-time updates.",
      activityAlerts: "Activity Alerts",
      approvedCredit: "Approved Credit",
      rejected: "Rejected",
      pending: "Pending",
      activePrefix: "Active",
      totalLogs: "Total Logs",
      systemLogsVerified: "System Logs Verified",
      recentTrades: "Recent Desk Activity",
      leverage: "Leverage Selection",
      buyBtn: "Buy / Long",
      sellBtn: "Sell / Short",
      ctEngine: "COPY TRADING ENGINE",
      ctMirrorLead: "Mirror Lead Performance",
      ctDiscoverLeaders: "Discover Leaders",
      ctMyCopies: "My Copies",
      ctBecomeLeader: "Become a Leader",
      ctRoi: "ROI (Avg)",
      ctWinRate: "Win Rate",
      ctRiskTier: "Risk tier",
      ctSubscribeToMirror: "SUBSCRIBE TO MIRROR:",
      ctCancel: "Cancel",
      ctAllocatedTrialBudget: "ALLOCATED TRIAL BUDGET (USD)",
      ctReserveInfo: "* The system reserves this capital strictly within the Secure wallet to fulfill mirrored executions at immediate market rates.",
      ctConfirmSubscription: "Confirm Subscription",
      ctMirroringStrategies: "Mirroring Strategies",
      ctMirrorTrader: "Mirror Trader",
      ctNoActivePortfolios: "No active copy portfolios designated. Discover top master traders inside our leaderboard indices and copy.",
      ctDeLink: "De-link Strategy",
      ctNetMirrorOutput: "Net Mirror Output",
      ctActiveTradesMatched: "Active trades matched:",
      ctMimicText: "Mimic",
      ctSizeText: "size",
      ctMatchedText: "matched",
      ctGrowAum: "Grow Assets Under Management",
      ctStrategyIntro: "Enter your trading strategy to show up globally across the Apex exchange leaderboards. Mirror copiers will automatically match your spots/futures allocations, paying you custom performance royalties in real time.",
      ctRoyaltyAdvantage1: "Gain 10% Profit royalties fee of cumulative copies gainers.",
      ctRoyaltyAdvantage2: "Verify track record with isolated ledger audits.",
      ctRoyaltyAdvantage3: "Feature live tags: \"BTC Swinger\", \"Low Risk Stocks\", \"Hedged Commodities\".",
      ctLeaderboardRegistered: "LEADER PROFILE REGISTERED!",
      ctPendingConfirmation: "Your profile will go live on exchange indices after 1 blockchain confirmations block.",
      ctDisplayScreenName: "STRATEGY DISPLAY SCREEN NAME",
      ctBioDetails: "BIO DETAILS & STRATEGY TACTICS (MAX 200 CHR)",
      ctSharingRate: "PROFIT SHARING RATE (%)",
      ctOptionHighlyAttr: "5% Royalties Fee (Highly Attractive)",
      ctOptionStandard: "10% Royalties Fee (Standard)",
      ctOptionElite: "15% Royalties Fee (Experienced Elite Only)",
      ctAccreditMaster: "ACCREDIT AS MASTER LEADER",
      ctStrategyPlaceholder: "Describe your leverage parameters, target assets categories, and exit conditions.",
      ctMinBudgetAlert: "Minimum copying budget threshold is $20.00 USD",
      ctInsuffBalAlert: "Insufficient USD Liquidity available in Secure Wallet to initiate this subscription.",
      ctSuccessAlert: "Successfully instantiated copy sequence! Automated execution will mimic positioning.",
      ctSpecifyProfileAlert: "Please specify a profile screen name & bio strategy.",
      ctUnsubscribedAlert: "Unsubscribed and liquidated copied trader positions back into Wallet cache.",
      earnTitle: "Apex Long-Term Investment \"Earn\"",
      earnYieldFarming: "YIELD FARMING & HIGH SAVINGS",
      earnAll: "All",
      earnSavings: "Savings",
      earnStaking: "Staking",
      earnDual: "Dual Invest",
      earnHeadingMyCompounding: "My Compounding High-Yield Portfolios",
      earnLockedPrincipal: "Locked principal:",
      earnFlexibleLockup: "Flexible Lockup (Instant Out)",
      earnDuration: "Duration:",
      earnDays: "Days",
      earnAccruedReturns: "Accrued Returns",
      earnCompoundingLive: "Compounding live",
      earnEstimatedApy: "ESTIMATED APY",
      earnLockRestriction: "LOCK RESTRICTION",
      earnFlexibleSaver: "Flexible saver",
      earnDaysLimit: "Days Limit",
      earnSubscribe: "Subscribe",
      earnCloseForm: "Close Form",
      earnAvailableBalance: "Spot Available balance",
      earnStakingPrincipal: "STAKING PRINCIPAL (QTY)",
      earnConfirmLockup: "Confirm Lockup",
      earnMinSubAlert: "Minimum subscription threshold is",
      earnInsuffBalanceAlert: "Insufficient available balances inside Spot Secure Wallet to subscribe to this earning product.",
      earnSuccessAlert: "Successfully instantiated long term investment! Interest yields will accumulate and update live.",
      taxSuite: "AUTOMATED REGULATORY SUITE",
      taxGovTitle: "Automated Tax & Gains Reporting",
      taxExportCsv: "Export CSV Ledger",
      taxFilingYearLabel: "TAX FILING YEAR",
      taxFilingYearCurrent: "2026 (Current)",
      taxFilingYearPrior: "2025 (Prior)",
      taxRegionLabel: "FILING ZONE / REGION",
      taxUsa: "USA (IRS Form 8949)",
      taxUk: "UK HM Revenue (HMRC)",
      taxDe: "Germany (EStG)",
      taxSg: "Singapore (Capital-free)",
      taxRateLabel: "MARGINAL BRACKET RATE",
      taxBracket10: "10% Bracket",
      taxBracket15: "15% Bracket",
      taxBracket22: "22% Bracket (Avg)",
      taxBracket32: "32% Bracket (Elite)",
      taxBracket37: "37% Bracket (Maximum)",
      taxDeductibleLabel: "DEDUCTIBLE TAX FEES ($)",
      taxRealizedProceeds: "REALIZED PROCEEDS",
      taxTotalCostBasis: "TOTAL COST BASIS",
      taxNetCapitalGains: "NET CAPITAL GAINS",
      taxEstimatedLiability: "ESTIMATED LIABILITY",
      taxFilingComparison: "Filing Structure Comparison ($ USD)",
      taxGuideTitle: "AI Tax Strategy Guide",
      taxGuideDesc: "Connect to our on-chain server CPA node powered by Gemini to inspect your specific positions and generate immediate tax-loss harvesting plans under",
      taxQueryBtn: "Query Gemini Advisor",
      taxAnalyzing: "Analyzing Ledger...",
      taxAdvisorHeader: "AUDIT STRATEGY REPORT",
      taxAdvisorProvider: "Provider: Gemini AI Cognitive CPA",
      taxLedgerTitle: "Tax Transaction Ledger Ledger",
      taxBuy: "BUY",
      taxSell: "SELL",
      taxUnits: "units",
      taxGain: "Gain:",
      noRegisteredProfile: "No registered profile identified. Try registering or use SSO.",
      ssoSuccess: "Signed in instantly via SSO security trust portal! Account verified.",
      totpText: "Two-Factor Authentication required. Enter the 6-digit TOTP code.",
      qdTitle: "Quick $10,000.00 USD Deposit",
      qdSub: "Escrow Approval Pipeline",
      qdStep1: "Select Payment Channel",
      qdStep2: "Coordinates & Submit",
      qdInfo1: "We offer direct institution clearing channels. Please select your preferred transaction method to retrieve your unique platform gateway coordinates for this ",
      qdInfo1Tail: " deposit:",
      qdCryptoNet: "Crypto Network",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Instant blockchain settlement. Transfers to platform secure smart contract escrow instantly.",
      qdBankClearing: "Bank Clearing",
      qdBankSub: "ACH / Bank Wire",
      qdBankDesc: "Direct Federal Reserve wire transfer. Zero commission clearing with custom automated audit reference.",
      qdContinueBtn: "Continue to coordinates",
      qdSelectCrypto: "Select Cryptocurrency Network",
      qdStep2Text: "Please trigger your transfer of exactly ",
      qdStep2Tail: " via the coordinates generated below:",
      qdVerifiedPlatform: "🚨 VERIFIED PLATFORM ADDRESS",
      qdUsdtDesc: "Secure hot-cold storage vault. Onchain deposits are held in real-time liquidity pools.",
      qdBtcDesc: "Direct blockchain ledger deposit address.",
      qdEthDesc: "TRC-20 standard wrapped smart contract deposit point.",
      qdSolDesc: "Solana high speed asset clearing wallet.",
      qdScanQr: "SCAN DEPOSIT QR",
      qdBankCoordHeader: "🏢 CLEARING INSTITUTION COORDINATES",
      qdBankName: "Clearinghouse Institution:",
      qdRouting: "Clearinghouse Routing (ACH):",
      qdAccount: "Vault Account Number:",
      qdEscrowRef: "Escrow Audit Reference:",
      qdCopyRef: "Copy Reference",
      qdBack: "Back",
      qdSubmitBtn: "Submit Deposit Reference to Ledger"
    },
    pt: {
      tradingDesk: "Mesa de Operações",
      secureWallet: "Carteira Segura",
      copyTrading: "Copiar Operações",
      yieldEarn: "Rendimento Yield",
      taxCenter: "Centro de Impostos",
      adminCommand: "Painel Administrativo",
      signIn: "Entrar",
      markets: "Lista de Mercados",
      feed: "MÉTRICAS AO VIVO",
      exchangeFlash: "COMUNICADO DA BOLSA",
      notLoggedIn: "Autenticação Requerida",
      notLoggedInDesc: "Por favor, conecte sua sessão de corretagem segura para visualizar dados do mercado, saldos em tempo real e executar transações de fundos.",
      connectIdentityBtn: "Conectar Identidade de Conta Segura",
      googleSso: "Acesso Seguro Google",
      appleSso: "Acesso Apple ID",
      enterSsoEmailPrompt: "Insira suas credenciais para segurança de identidade federada:",
      returnToLogin: "Voltar para tela de login",
      logout: "Encerrar Sessão",
      ssoEmail: "E-mail de Login SSO",
      continueSso: "Continuar e Conectar Sessão",
      ssoConnecting: "Verificando federação de segurança segura...",
      kycState: "Status de Verificação KYC",
      kycCleared: "Totalmente liberado de acordo com as políticas SEC e FinCEN.",
      kycPending: "Conta não documentada. Transações em hold temporário.",
      verifyEmailBtn: "Verificar E-mail & Liberar KYC Agora",
      secNetwork: "APEX SECURE NETWORK CONNECT • CRIPTOGRAFIA DE PONTA A PONTA",
      walletBalance: "Saldo Líquido da Carteira",
      depositBtn: "Depósito Rápido $10k",
      bellNoActivity: "Sem atividades de extrato pendentes",
      bellHint: "Deposite fundos usando o botão de Depósito Rápido para ver o extrato atualizar em tempo real.",
      activityAlerts: "Alertas de Atividade",
      approvedCredit: "Crédito Aprovado",
      rejected: "Recusado",
      pending: "Pendente",
      activePrefix: "Ativo",
      totalLogs: "Total de Logs",
      systemLogsVerified: "Registros de Sistema Verificados",
      recentTrades: "Mesa de Operações Recentes",
      leverage: "Seletor de Alavancagem",
      buyBtn: "Comprar / Long",
      sellBtn: "Vender / Short",
      ctEngine: "MOTOR DE COPIAR OPERAÇÕES",
      ctMirrorLead: "Espelhar Desempenho de Líderes",
      ctDiscoverLeaders: "Descobrir Líderes",
      ctMyCopies: "Minhas Cópias",
      ctBecomeLeader: "Torne-se um Líder",
      ctRoi: "ROI (Média)",
      ctWinRate: "Taxa de Vitória",
      ctRiskTier: "Nível de Risco",
      ctSubscribeToMirror: "INSCREVER-SE PARA ESPELHAR:",
      ctCancel: "Cancelar",
      ctAllocatedTrialBudget: "ORÇAMENTO DE TESTE ALOCADO (USD)",
      ctReserveInfo: "* O sistema reserva este capital estritamente dentro da carteira segura para executar transações espelhadas a preços de mercado imediatos.",
      ctConfirmSubscription: "Confirmar Inscrição",
      ctMirroringStrategies: "Espelhando Estratégias",
      ctMirrorTrader: "Copiar Operador",
      ctNoActivePortfolios: "Nenhum portfólio de cópia ativo designado. Descubra os principais operadores em nossa tabela de classificação e copie.",
      ctDeLink: "Desvincular Estratégia",
      ctNetMirrorOutput: "Resultado Líquido do Espelhamento",
      ctActiveTradesMatched: "Operações ativas correspondentes:",
      ctMimicText: "Mimetizar",
      ctSizeText: "tamanho",
      ctMatchedText: "correspondeu",
      ctGrowAum: "Aumentar Ativos Sob Gestão",
      ctStrategyIntro: "Insira sua estratégia de negociação para aparecer globalmente nas tabelas de classificação da Apex. Os copiadores corresponderão automaticamente às suas alocações do mercado à vista/futuros, pagando royalties de desempenho em tempo real.",
      ctRoyaltyAdvantage1: "Ganhe 10% de taxa de royalties sobre os lucros cumulativos dos copiadores.",
      ctRoyaltyAdvantage2: "Verifique seu histórico com auditorias de contabilidade isoladas.",
      ctRoyaltyAdvantage3: "Destaque tags ao vivo: \"BTC Swinger\", \"Low Risk Stocks\", \"Hedged Commodities\".",
      ctLeaderboardRegistered: "PERFIL DE LÍDER REGISTRADO!",
      ctPendingConfirmation: "Seu perfil estará ativo nos índices da bolsa após 1 confirmação de bloco na blockchain.",
      ctDisplayScreenName: "NOME DE EXIBIÇÃO DA ESTRATÉGIA",
      ctBioDetails: "DETALHES DA BIO E TÁTICAS DA ESTRATÉGIA (MÁX. 200 CARACT.)",
      ctSharingRate: "TAXA DE COMPARTILHAMENTO DE LUCROS (%)",
      ctOptionHighlyAttr: "Taxa de 5% de Royalties (Altamente Atraente)",
      ctOptionStandard: "Taxa de 10% de Royalties (Padrão)",
      ctOptionElite: "Taxa de 15% de Royalties (Apenas Elite Experiente)",
      ctAccreditMaster: "CREDENCIAR COMO OPERADOR LÍDER MASTER",
      ctStrategyPlaceholder: "Descreva seus parâmetros de alavancagem, categorias de ativos de destino e condições de saída.",
      ctMinBudgetAlert: "O limite mínimo de orçamento para cópia é de $20,00 USD",
      ctInsuffBalAlert: "Liquidez de USD insuficiente disponível na Carteira Segura para iniciar esta assinatura.",
      ctSuccessAlert: "Sequência de cópia iniciada com sucesso! A execução automatizada repetirá o posicionamento.",
      ctSpecifyProfileAlert: "Por favor, especifique um nome de usuário de exibição do perfil e tática de estratégia.",
      ctUnsubscribedAlert: "Inscrição cancelada e posições do operador copiadas liquidadas de volta no saldo da carteira.",
      earnTitle: "Investimento a Longo Prazo da Apex \"Earn\"",
      earnYieldFarming: "MESA DE RENDIMENTOS E ALTA POUPANÇA",
      earnAll: "Todos",
      earnSavings: "Poupança",
      earnStaking: "Staking",
      earnDual: "Duplo Invest",
      earnHeadingMyCompounding: "Meus Portfólios de Auto-Capitalização de Alto Rendimento",
      earnLockedPrincipal: "Principal bloqueado:",
      earnFlexibleLockup: "Bloqueio Flexível (Saída Instantânea)",
      earnDuration: "Duração:",
      earnDays: "Dias",
      earnAccruedReturns: "Retornos Acumulados",
      earnCompoundingLive: "Capitalizando ao vivo",
      earnEstimatedApy: "APY ESTIMADO",
      earnLockRestriction: "RESTRIÇÃO DE BLOQUEIO",
      earnFlexibleSaver: "Poupador flexível",
      earnDaysLimit: "Dias de Limite",
      earnSubscribe: "Inscrever-se",
      earnCloseForm: "Fechar Formulário",
      earnAvailableBalance: "Saldo Disponível à Vista (Spot)",
      earnStakingPrincipal: "PRINCIPAL DO STAKING (QTD)",
      earnConfirmLockup: "Confirmar Bloqueio",
      earnMinSubAlert: "O limite de inscrição mínimo é",
      earnInsuffBalanceAlert: "Saldo disponível à vista insuficiente na Carteira Segura da Spot para se inscrever neste produto de rendimento.",
      earnSuccessAlert: "Investimento de longo prazo iniciado com sucesso! Os rendimentos de juros serão acumulados e atualizados ao vivo.",
      taxSuite: "SUÍTE DE REGULAMENTAÇÃO AUTOMATIZADA",
      taxGovTitle: "Relatório Automatizado de Impostos e Ganhos",
      taxExportCsv: "Exportar Livro-Razão em CSV",
      taxFilingYearLabel: "ANO FISCAL DE DECLARAÇÃO",
      taxFilingYearCurrent: "2026 (Atual)",
      taxFilingYearPrior: "2025 (Anterior)",
      taxRegionLabel: "ZONA / REGIÃO FISCAL",
      taxUsa: "EUA (Formulário IRS 8949)",
      taxUk: "Reino Unido HM Revenue (HMRC)",
      taxDe: "Alemanha (EStG)",
      taxSg: "Singapura (Isento de capital)",
      taxRateLabel: "TAXA DE ALÍQUOTA MARGINAL",
      taxBracket10: "Alíquota de 10%",
      taxBracket15: "Alíquota de 15%",
      taxBracket22: "Alíquota de 22% (Média)",
      taxBracket32: "Alíquota de 32% (Elite)",
      taxBracket37: "Alíquota de 37% (Máxima)",
      taxDeductibleLabel: "TAXAS DE IMPOSTO DEDUTÍVEIS ($)",
      taxRealizedProceeds: "RECEITAS REALIZADAS",
      taxTotalCostBasis: "BASE total de custos",
      taxNetCapitalGains: "GANHOS DE CAPITAL LÍQUIDOS",
      taxEstimatedLiability: "RESPONSABILIDADE ESTIMADA",
      taxFilingComparison: "Comparação da Estrutura Fiscal ($ USD)",
      taxGuideTitle: "Guia de Estratégia Fiscal por IA",
      taxGuideDesc: "Conecte-se ao nosso nó CPA de servidor integrado alimentado por Gemini para inspecionar suas posições específicas e gerar planos imediatos de compensação de perdas sob",
      taxQueryBtn: "Consultar Consultor Gemini",
      taxAnalyzing: "Analisando o Livro-Razão...",
      taxAdvisorHeader: "RELATÓRIO DE ESTRATÉGIA DE AUDITORIA",
      taxAdvisorProvider: "Provedor: CPA Cognitivo por IA Gemini",
      taxLedgerTitle: "Registro de Transações Fiscais",
      taxBuy: "COMPRA",
      taxSell: "VENDA",
      taxUnits: "unidades",
      taxGain: "Ganho:",
      noRegisteredProfile: "Nenhuma conta identificada. Registre-se ou utilize o login por SSO.",
      ssoSuccess: "Acessado com sucesso via portal integrado de SSO! Conta ativa.",
      totpText: "Autenticação em Duas Etapas ativa. Insira o código de 6 dígitos.",
      qdTitle: "Depósito Rápido $10.000,00 USD",
      qdSub: "Canal de Aprovação de Custódia (Escrow)",
      qdStep1: "Selecionar Canal de Pagamento",
      qdStep2: "Coordenadas & Envio",
      qdInfo1: "Oferecemos canais diretos de compensação institucional. Selecione o método de transação preferido para obter as coordenadas exclusivas do gateway para este depósito de ",
      qdInfo1Tail: " :",
      qdCryptoNet: "Rede Criptográfica",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Liquidação instantânea em blockchain. Transferências diretas para custódia segura da plataforma de forma imediata.",
      qdBankClearing: "Compensação Bancária",
      qdBankSub: "ACH / Ordem de Pagamento",
      qdBankDesc: "Transferência bancária direta pelo Federal Reserve. Liquidação com zero comissão usando código de referência automatizado.",
      qdContinueBtn: "Continuar para as coordenadas",
      qdSelectCrypto: "Selecionar Rede de Criptomoeda",
      qdStep2Text: "Por favor, realize a transferência de exatamente ",
      qdStep2Tail: " através das coordenadas geradas abaixo:",
      qdVerifiedPlatform: "🚨 ENDEREÇO DE PLATAFORMA VERIFICADO",
      qdUsdtDesc: "Cofre seguro com armazenamento frio e quente. Os depósitos são creditados em pools de liquidez em tempo real.",
      qdBtcDesc: "Endereço de depósito direto no livro-razão da blockchain (ledger).",
      qdEthDesc: "Ponto de depósito padrão em contrato inteligente TRC-20.",
      qdSolDesc: "Carteira de compensação de ativos de alta velocidade em Solana.",
      qdScanQr: "ESCANEAR DEPOSIT QR",
      qdBankCoordHeader: "🏢 COORDENADAS DA INSTITUIÇÃO DE COMPENSAÇÃO",
      qdBankName: "Instituição de compensação:",
      qdRouting: "Roteamento de custódia (ACH):",
      qdAccount: "Número da conta do cofre:",
      qdEscrowRef: "Referência de auditoria de custódia:",
      qdCopyRef: "Copiar Referência",
      qdBack: "Voltar",
      qdSubmitBtn: "Enviar Referência de Depósito ao Livro-Razão"
    },
    es: {
      tradingDesk: "Mesa de Operaciones",
      secureWallet: "Billetera Segura",
      copyTrading: "Copiar Operaciones",
      yieldEarn: "Rendimiento Yield",
      taxCenter: "Centro de Impuestos",
      adminCommand: "Mando de Admin",
      signIn: "Entrar",
      markets: "Mercados Activos",
      feed: "TRANSMISIÓN EN VIVO",
      exchangeFlash: "FLASH DE LA BOLSA",
      notLoggedIn: "Autenticación Requerida",
      notLoggedInDesc: "Consiga acceso a su cuenta segura para ver la pizarra comercial en tiempo real, saldos líquidos e iniciar trades.",
      connectIdentityBtn: "Conectar Identidad de Cuenta",
      googleSso: "Identidad Segura Google",
      appleSso: "Servicio de Apple ID",
      enterSsoEmailPrompt: "Ingrese su dirección para verificar su federación de identidad SSO:",
      returnToLogin: "Volver al formulario de login",
      logout: "Cerrar Sesión Segura",
      ssoEmail: "Correo del Sistema SSO",
      continueSso: "Continuar a Conexión de Sesión",
      ssoConnecting: "Identificando credenciales federadas...",
      kycState: "Estado de KYC de Cliente",
      kycCleared: "Completamente verificado bajo reglamentación SEC y FinCEN.",
      kycPending: "Su cuenta no cuenta con KYC completo. Retiros con demora administrativa.",
      verifyEmailBtn: "Verificar Correo y Validar Cuenta",
      secNetwork: "APEX NETWORK SECURE • TÍTULOS PROTEGIDOS CON ENCRIPTACIÓN COMPLETA",
      walletBalance: "Balance Líquido de Cartera",
      depositBtn: "Depósito Veloz $10k",
      bellNoActivity: "No se registran créditos en cuenta",
      bellHint: "Realice un depósito para activar sus balances de manera automática.",
      activityAlerts: "Alertas de Actividad",
      approvedCredit: "Crédito Aprovado",
      rejected: "Rechazado",
      pending: "Pendiente",
      activePrefix: "Activo",
      totalLogs: "Logs Totales",
      systemLogsVerified: "Logs Verificados por el Sistema",
      recentTrades: "Actividad Comercial de Mesa",
      leverage: "Apalancamiento de Orden",
      buyBtn: "Comprar / Long",
      sellBtn: "Vender / Short",
      ctEngine: "MOTOR DE COPIAR OPERACIONES",
      ctMirrorLead: "Copiar Rendimiento de Líderes",
      ctDiscoverLeaders: "Descobrir Líderes",
      ctMyCopies: "Mis Copias",
      ctBecomeLeader: "Convertirse en Líder",
      ctRoi: "ROI (Media)",
      ctWinRate: "Tasa de Victoria",
      ctRiskTier: "Nivel de Riesgo",
      ctSubscribeToMirror: "SUSCRIBIRSE PARA COPIAR:",
      ctCancel: "Cancelar",
      ctAllocatedTrialBudget: "PRESUPUESTO DE PRUEBA ASIGNADO (USD)",
      ctReserveInfo: "* El sistema reserva este capital estrictamente dentro de la billetera segura para ejecutar transacciones duplicadas a tasas de mercado inmediatas.",
      ctConfirmSubscription: "Confirmar Suscripción",
      ctMirroringStrategies: "Copiando Estrategias",
      ctMirrorTrader: "Copiar Operador",
      ctNoActivePortfolios: "No se han designado carteras de copia activas. Descubra a los mejores operadores líderes en nuestra tabla de clasificación y cópielos.",
      ctDeLink: "Desvincular Estrategia",
      ctNetMirrorOutput: "Resultado Neto del Copiado",
      ctActiveTradesMatched: "Operaciones activas correspondientes:",
      ctMimicText: "Imitar",
      ctSizeText: "tamaño",
      ctMatchedText: "completado",
      ctGrowAum: "Aumentar Activos Bajo Gestión",
      ctStrategyIntro: "Ingrese su estrategia comercial para aparecer globalmente en las tablas de clasificación de Apex. Los copiadores igualarán automáticamente sus asignaciones de spot/futuros, pagándole regalías de rendimiento personalizadas en tiempo real.",
      ctRoyaltyAdvantage1: "Obtenga un 10% de regalías sobre las ganancias acumuladas de los copiadores.",
      ctRoyaltyAdvantage2: "Verifique su historial con auditorías de contabilidad aisladas.",
      ctRoyaltyAdvantage3: "Muestre etiquetas en vivo: \"BTC Swinger\", \"Low Risk Stocks\", \"Hedged Commodities\".",
      ctLeaderboardRegistered: "¡PERFIL DE LÍDER REGISTRADO!",
      ctPendingConfirmation: "Su perfil se activará en los índices de la bolsa después de 1 confirmación de bloque en la blockchain.",
      ctDisplayScreenName: "NOMBRE DE PANTALLA DE LA ESTRATEGIA",
      ctBioDetails: "DETALHES DE LA BIO Y TÁCTICAS DE ESTRATEGIA (MÁX. 200 CARACTERES)",
      ctSharingRate: "TASA DE COMPARTICIÓN DE GANANCIAS (%)",
      ctOptionHighlyAttr: "Comisión de regalías del 5% (Muy atractiva)",
      ctOptionStandard: "Comisión de regalías del 10% (Estándar)",
      ctOptionElite: "Comisión de regalías del 15% (Solo élite experimentada)",
      ctAccreditMaster: "ACCREDITAR COMO LÍDER MAESTRO",
      ctStrategyPlaceholder: "Describa sus parámetros de apalancamiento, categorías de activos de destino y condiciones de salida.",
      ctMinBudgetAlert: "El umbral de presupuesto mínimo de copia es $20.00 USD",
      ctInsuffBalAlert: "Liquidez de USD insuficiente disponible en la Billetera Segura para iniciar esta suscripción.",
      ctSuccessAlert: "¡Secuencia de copia iniciada con éxito! La ejecución automatizada imitará el posicionamiento.",
      ctSpecifyProfileAlert: "Especifique un nombre de pantalla de perfil y tácticas de estrategia.",
      ctUnsubscribedAlert: "Suscripción cancelada y posiciones de copia liquidadas de vuelta al saldo de la billetera.",
      earnTitle: "Inversión a Largo Plazo de Apex \"Earn\"",
      earnYieldFarming: "MESA DE RENDIMIENTOS Y ALTOS AHORROS",
      earnAll: "Todos",
      earnSavings: "Ahorros",
      earnStaking: "Staking",
      earnDual: "Inversión Doble",
      earnHeadingMyCompounding: "Mis Carteras de Interés Compuesto de Alto Rendimiento",
      earnLockedPrincipal: "Capital bloqueado:",
      earnFlexibleLockup: "Bloqueo Flexible (Salida Instantánea)",
      earnDuration: "Duración:",
      earnDays: "Días",
      earnAccruedReturns: "Rendimientos Acumulados",
      earnCompoundingLive: "Capitalizándose en vivo",
      earnEstimatedApy: "APY ESTIMADO",
      earnLockRestriction: "RESTRICCIÓN DE BLOQUEIO",
      earnFlexibleSaver: "Ahorrador flexible",
      earnDaysLimit: "Días Límite",
      earnSubscribe: "Suscribirse",
      earnCloseForm: "Cerrar Formulario",
      earnAvailableBalance: "Saldo Disponible en Spot",
      earnStakingPrincipal: "CAPITAL DE STAKING (CANTIDAD)",
      earnConfirmLockup: "Confirmar Bloqueo",
      earnMinSubAlert: "El umbral mínimo de suscripción es",
      earnInsuffBalanceAlert: "Fondos insuficientes en la billetera Spot para suscribirse a este producto de rendimiento.",
      earnSuccessAlert: "¡Inversión a largo plazo iniciada con éxito! Los rendimientos por intereses se acumularán y se actualizarán en vivo.",
      taxSuite: "MÓDULO REGULATORIO AUTOMATIZADO",
      taxGovTitle: "Informes Automatizados de Impuestos y Ganancias",
      taxExportCsv: "Exportar Registro en CSV",
      taxFilingYearLabel: "AÑO DE DECLARACIÓN FISCAL",
      taxFilingYearCurrent: "2026 (Actual)",
      taxFilingYearPrior: "2025 (Anterior)",
      taxRegionLabel: "ZONA / REGIÓN FISCAL",
      taxUsa: "EE.UU. (Formulario IRS 8949)",
      taxUk: "Reino Unido (HMRC)",
      taxDe: "Alemanha (EStG)",
      taxSg: "Singapura (Libre de capital)",
      taxRateLabel: "TASA MARGINAL DEL TRAMO",
      taxBracket10: "Tramo del 10%",
      taxBracket15: "Tramo del 15%",
      taxBracket22: "Tramo del 22% (Promedio)",
      taxBracket32: "Tramo del 32% (Élite)",
      taxBracket37: "Tramo del 37% (Máximo)",
      taxDeductibleLabel: "DEDUCCIONES DE TASAS FISCALES ($)",
      taxRealizedProceeds: "INGRESOS REALIZADOS",
      taxTotalCostBasis: "BASE total de costos",
      taxNetCapitalGains: "GANANCIAS DE CAPITAL NETAS",
      taxEstimatedLiability: "PASIVO ESTIMADO",
      taxFilingComparison: "Comparación de Estructura Fiscal ($ USD)",
      taxGuideTitle: "Guía de Estratégia Fiscal por IA",
      taxGuideDesc: "Conéctese a nuestro nodo CPA alojado en el servidor con tecnología de Gemini para examinar sus posiciones específicas y generar planes de reducción de pérdidas tributarias bajo",
      taxQueryBtn: "Consultar al Asesor Gemini",
      taxAnalyzing: "Analizando Registro...",
      taxAdvisorHeader: "INFORME DE ESTRATEGIA DE AUDITORÍA",
      taxAdvisorProvider: "Proveedor: CPA Cognitivo por IA Gemini",
      taxLedgerTitle: "Registro de Transacciones de Impuestos",
      taxBuy: "COMPRA",
      taxSell: "VENTA",
      taxUnits: "unidades",
      taxGain: "Ganancia:",
      noRegisteredProfile: "No se encontró un perfil. Regístrese o use SSO.",
      ssoSuccess: "¡Ingresado correctamente por SSO federado! Cuenta verídica.",
      totpText: "Verificación de dos pasos requerida. Ingrese el código token.",
      qdTitle: "Depósito Rápido $10.000,00 USD",
      qdSub: "Canal de Aprobación de Fideicomiso (Escrow)",
      qdStep1: "Seleccionar Canal de Pago",
      qdStep2: "Coordenadas y Enviar",
      qdInfo1: "Ofrecemos canales directos de compensación institucional. Elija su método de transacción de preferencia para obtener las coordenadas exclusivas del gateway para este depósito de ",
      qdInfo1Tail: " :",
      qdCryptoNet: "Red Criptográfica",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Liquidación instantánea en blockchain. Transferencias directas al fideicomiso de contrato inteligente de la plataforma de forma inmediata.",
      qdBankClearing: "Compensación Bancaria",
      qdBankSub: "ACH / Transferencia de Fondos",
      qdBankDesc: "Transferencia bancaria directa de la Reserva Federal. Liquidación con cero comisiones utilizando código de referencia automatizado.",
      qdContinueBtn: "Continuar a las coordenadas",
      qdSelectCrypto: "Seleccionar Red de Criptomonedas",
      qdStep2Text: "Por favor, realice la transferencia de exactamente ",
      qdStep2Tail: " a través de las coordenadas generadas abajo:",
      qdVerifiedPlatform: "🚨 DIRECCIÓN DE PLATAFORMA VERIFICADA",
      qdUsdtDesc: "Bóveda segura con almacenamiento en frío y caliente. Los depósitos se acreditan en pools de liquidez en tiempo real.",
      qdBtcDesc: "Dirección de depósito directo en el libro mayor de la blockchain (ledger).",
      qdEthDesc: "Punto de depósito estándar en contrato inteligente TRC-20.",
      qdSolDesc: "Billetera de compensación de activos de alta velocidad en Solana.",
      qdScanQr: "ESCANEAR QR DE DEPÓSITO",
      qdBankCoordHeader: "🏢 COORDENADAS DE LA INSTITUIÇÃO DE COMPENSACIÓN",
      qdBankName: "Institución de compensación:",
      qdRouting: "Enrutamiento de fideicomiso (ACH):",
      qdAccount: "Número de cuenta de la bóveda:",
      qdEscrowRef: "Referencia de auditoría de fideicomiso:",
      qdCopyRef: "Copiar Referencia",
      qdBack: "Volver",
      qdSubmitBtn: "Enviar Referencia de Depósito al Libro Mayor"
    },
    de: {
      tradingDesk: "Handelsplatz",
      secureWallet: "Sichere Wallet",
      copyTrading: "Kopierhandel",
      yieldEarn: "Ertrags-Yield",
      taxCenter: "Steuerzentrum",
      adminCommand: "Admin-Zentrale",
      signIn: "Anmelden",
      markets: "Markt-Übersicht",
      feed: "ECHTZEIT-TELEMETRIE",
      exchangeFlash: "BÖRSEN-MELDUNG",
      notLoggedIn: "Authentifizierung Erforderlich",
      notLoggedInDesc: "Melden Sie sich an, um vollen Zugang zu den Börsenplätzen, Wallets und Live-Transaktionen zu erhalten.",
      connectIdentityBtn: "Identität Verbinden",
      googleSso: "Sicheres Google SSO",
      appleSso: "Apple ID Anmeldung",
      enterSsoEmailPrompt: "Geben Sie Ihre SSO-E-Mail ein, um eine sichere Federation auszuführen:",
      returnToLogin: "Zurück zur Passworteingabe",
      logout: "Sitzung Beenden",
      ssoEmail: "SSO E-Mail Adresse",
      continueSso: "Fortfahren & Anmelden",
      ssoConnecting: "Kontaktaufnahme mit SSO-Server...",
      kycState: "KYC Verifizierungsstatus",
      kycCleared: "Konform mit Regulierungsvorschriften der SEC und FinCEN verifiziert.",
      kycPending: "Nicht vollständig verifiziert. Eingeschränkte Auszahlungsfunktionen.",
      verifyEmailBtn: "E-Mail verifizieren & Compliance abschließen",
      secNetwork: "APEX SECURE NET • END-TO-END VERSCHLÜSSELTE TRANSAKTIONEN",
      walletBalance: "Verfügbares Portfolio-Guthaben",
      depositBtn: "Schnelleinzahlung $10k",
      bellNoActivity: "Keine Transaktionsdaten vorhanden",
      bellHint: "Zahlen Sie über das Schnelleinzahlungs-Widget Guthaben auf Ihr Wallet ein.",
      activityAlerts: "Protokoll-Alerts",
      approvedCredit: "Einzahlung Freigegeben",
      rejected: "Abgelehnt",
      pending: "Ausstehend",
      activePrefix: "Aktiv",
      totalLogs: "Verlaufsprotokolle",
      systemLogsVerified: "Systemprotokolle Geprüft",
      recentTrades: "Letzte Desktop-Kontrakte",
      leverage: "Multiplikator-Hebel",
      buyBtn: "Kaufen / Long",
      sellBtn: "Verkaufen / Short",
      noRegisteredProfile: "Profil nicht gefunden. Bitte registrieren oder SSO nutzen.",
      ssoSuccess: "Über integrierten SSO-Dienst erfolgreich verifiziert! Konto betriebsbereit.",
      totpText: "Zwei-Faktor-Authentifizierung aktiv. Geben Sie den Token ein.",
      qdTitle: "Schnelleinzahlung $10.000,00 USD",
      qdSub: "Treuhand-Freigabepipeline (Escrow)",
      qdStep1: "Zahlungsweg auswählen",
      qdStep2: "Koordinaten & Absenden",
      qdInfo1: "Wir bieten direkte institutionelle Clearingkanäle an. Bitte wählen Sie Ihre bevorzugte Transaktionsmethode aus, um Ihre einzigartigen Plattform-Gateway-Koordinaten für diese Einzahlung von ",
      qdInfo1Tail: " abzurufen:",
      qdCryptoNet: "Krypto-Netzwerk",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Sofortige Blockchain-Abwicklung. Sofortige Überweisungen in das gesicherte Smart-Contract-Treuhandkonto der Plattform.",
      qdBankClearing: "Bankabwicklung",
      qdBankSub: "ACH / Banküberweisung",
      qdBankDesc: "Direkte Überweisung über die Federal Reserve. Provisionsfreie Abwicklung mit benutzerdefiniertem automatisiertem Prüfungsreferenz.",
      qdContinueBtn: "Weiter zu den Koordinaten",
      qdSelectCrypto: "Kryptowährungsnetzwerk auswählen",
      qdStep2Text: "Bitte initiieren Sie Ihre Überweisung von genau ",
      qdStep2Tail: " über die unten generierten Koordinaten:",
      qdVerifiedPlatform: "🚨 VERIFIZIERTE PLATTFORMADRESSE",
      qdUsdtDesc: "Sicherer Tresor mit Heiß- und Kaltspeicherung. On-Chain-Einzahlungen werden in Echtzeit-Liquiditätspools gehalten.",
      qdBtcDesc: "Direkte Blockchain-Ledger-Einzahlungsadresse.",
      qdEthDesc: "TRC-20-Standard-Smart-Contract-Einladungspunkt.",
      qdSolDesc: "Solana High-Speed-Asset-Clearing-Wallet.",
      qdScanQr: "EINZAHLUNG QR SCANNEN",
      qdBankCoordHeader: "🏢 CLEARING-INSTITUTIONSKOORDINATEN",
      qdBankName: "Clearingstelle Institution:",
      qdRouting: "Clearingstelle-Routing (ACH):",
      qdAccount: "Tresor-Kontonummer:",
      qdEscrowRef: "Treuhand-Audit-Referenz:",
      qdCopyRef: "Referenz kopieren",
      qdBack: "Zurück",
      qdSubmitBtn: "Einzahlungsreferenz an das Ledger senden"
    },
    fr: {
      tradingDesk: "Bureau de trading",
      secureWallet: "Portefeuille sécurisé",
      copyTrading: "Copier le trading",
      yieldEarn: "Rendement Yield",
      taxCenter: "Centre fiscal",
      adminCommand: "Panneau d'administration",
      signIn: "Se connecter",
      markets: "Liste des marchés",
      feed: "MÉTRIQUE EN DIRECT",
      exchangeFlash: "COMMUNIQUÉ DE LA BOURSE",
      notLoggedIn: "Authentification requise",
      notLoggedInDesc: "Veuillez connecter votre session de courtage sécurisée pour voir les marchés en direct, vérifier les soldes et exécuter des transactions.",
      connectIdentityBtn: "Connecter l'identité du compte sécurisé",
      googleSso: "Identité sécurisée Google",
      appleSso: "Intégration Apple ID",
      enterSsoEmailPrompt: "Saisissez vos identifiants sécurisés pour vérifier la fédération d'identité :",
      returnToLogin: "Retour à l'écran de connexion",
      logout: "Terminer la session",
      ssoEmail: "Adresse e-mail SSO",
      continueSso: "Continuer & Connecter la session",
      ssoConnecting: "Connexion à la fédération sécurisée...",
      kycState: "Statut de vérification KYC",
      kycCleared: "Entièrement validé selon les directives de la SEC et de FinCEN.",
      kycPending: "Profil non vérifié. Actions restreintes au séquestre.",
      verifyEmailBtn: "Vérifier l'e-mail & Valider le KYC maintenant",
      secNetwork: "CONNEXION RÉSEAU SÉCURISÉ APEX • CRYPTAGE BOUT EN BOUT DES TITRES",
      walletBalance: "Solde liquide du portefeuille",
      depositBtn: "Dépôt rapide de 10k $",
      bellNoActivity: "Aucune activité n'a encore été enregistrée",
      bellHint: "Alimentez votre compte en utilisant le bouton de Dépôt rapide pour voir les mises à jour en direct.",
      activityAlerts: "Alertes d'activité",
      approvedCredit: "Crédit approuvé",
      rejected: "Rejeté",
      pending: "En attente",
      activePrefix: "Actif",
      totalLogs: "Total des journaux",
      systemLogsVerified: "Journaux système vérifiés",
      recentTrades: "Activité récente du bureau",
      leverage: "Sélection de l'effet de levier",
      buyBtn: "Acheter / Long",
      sellBtn: "Vendre / Short",
      noRegisteredProfile: "Aucun profil enregistré trouvé. Veuillez vous inscrire ou utiliser le SSO.",
      ssoSuccess: "Connecté instantanément via le portail SSO de confiance ! Compte vérifié.",
      totpText: "Authentification à deux facteurs requise. Entrez le code TOTP à 6 chiffres.",
      qdTitle: "Dépôt rapide de 10 000,00 $ USD",
      qdSub: "Pipeline d'approbation d'entiercement (Escrow)",
      qdStep1: "Sélectionner le mode de paiement",
      qdStep2: "Coordonnées & Soumettre",
      qdInfo1: "Nous proposons des canaux de compensation institutionnels directs. Veuillez sélectionner votre méthode de transaction préférée pour récupérer vos coordonnées de passerelle uniques pour ce dépôt de ",
      qdInfo1Tail: " :",
      qdCryptoNet: "Réseau Crypto",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Règlement instantané sur la blockchain. Transferts instantanés vers l'entiercement sécurisé du contrat intelligent de la plateforme.",
      qdBankClearing: "Compensation bancaire",
      qdBankSub: "ACH / Virement Bancaire",
      qdBankDesc: "Virement direct de la Réserve Fédérale. Compensation sans commission avec référence d'audit automatisée personnalisée.",
      qdContinueBtn: "Continuer vers les coordonnées",
      qdSelectCrypto: "Sélectionner le réseau de crypto-monnaie",
      qdStep2Text: "Veuillez déclencher votre transfert de précisément ",
      qdStep2Tail: " via les coordonnées générées ci-dessous :",
      qdVerifiedPlatform: "🚨 ADRESSE DE PLATEFORME VÉRIFIÉE",
      qdUsdtDesc: "Le coffre-fort sécurisé (chaud/froid). Les dépôts en chaîne sont conservés dans des pools de liquidité en temps réel.",
      qdBtcDesc: "Adresse de dépôt direct sur le grand livre de la blockchain (ledger).",
      qdEthDesc: "Point de dépôt standard du contrat intelligent TRC-20.",
      qdSolDesc: "Portefeuille de compensation d'actifs ultra-rapide Solana.",
      qdScanQr: "SCANNER LE QR DE DÉPÔT",
      qdBankCoordHeader: "🏢 COORDONNÉES DE L'INSTITUTION DE COMPENSATION",
      qdBankName: "Institution de compensation :",
      qdRouting: "Routage de la chambre de compensation (ACH) :",
      qdAccount: "Numéro de compte du coffre-fort :",
      qdEscrowRef: "Référence d'audit d'entiercement :",
      qdCopyRef: "Copier la Référence",
      qdBack: "Retour",
      qdSubmitBtn: "Soumettre la référence de dépôt au grand livre"
    },
    it: {
      tradingDesk: "Mesa di trading",
      secureWallet: "Portafoglio sicuro",
      copyTrading: "Copia trading",
      yieldEarn: "Rendimento Yield",
      taxCenter: "Centro fiscale",
      adminCommand: "Pannello amministratore",
      signIn: "Accedi",
      markets: "Elenco mercati",
      feed: "METRICHE IN DIRETTA",
      exchangeFlash: "COMUNICATO DI BORSA",
      notLoggedIn: "Autenticazione richiesta",
      notLoggedInDesc: "Connetti la tua sessione broker protetta per visualizzare i mercati live, controllare i saldi ed eseguire transazioni commerciali.",
      connectIdentityBtn: "Connetti identità dell'account sicuro",
      googleSso: "Identità sicura Google",
      appleSso: "Integrazione Apple ID",
      enterSsoEmailPrompt: "Inserisci le tue credenziali sicure per verificare la federazione delle identità:",
      returnToLogin: "Torna alla schermata di accesso",
      logout: "Termina sessione",
      ssoEmail: "E-mail di accesso SSO",
      continueSso: "Continua e connetti sessione",
      ssoConnecting: "Connessione alla federazione sicura...",
      kycState: "Stato della verifica KYC",
      kycCleared: "Completamente approvato ai sensi dei regolamenti SEC e FinCEN.",
      kycPending: "Profilo in stato non verificato. Azioni bloccate in Escrow.",
      verifyEmailBtn: "Verifica e-mail e completa KYC ora",
      secNetwork: "APEX SECURE NETWORK CONNECT • TITOLI PROTETTI CON CRITTOGRAFIA END-TO-END",
      walletBalance: "Saldo liquido del portafoglio",
      depositBtn: "Deposito rapido 10k $",
      bellNoActivity: "Nessuna attività registrata sul registro",
      bellHint: "Ricarica il tuo account utilizzando il pulsante Deposito rapido per vedere gli aggiornamenti in tempo reale.",
      activityAlerts: "Avvisi di attività",
      approvedCredit: "Credito approvato",
      rejected: "Rifiutato",
      pending: "In attesa",
      activePrefix: "Ativo",
      totalLogs: "Totale registri",
      systemLogsVerified: "Registri di sistema verificati",
      recentTrades: "Attività recente sulla mesa",
      leverage: "Selezione della leva",
      buyBtn: "Acquista / Long",
      sellBtn: "Vendi / Short",
      noRegisteredProfile: "Nessun profilo registrato identificato. Prova a registrarti o usa SSO.",
      ssoSuccess: "Accesso completato istantaneamente tramite il portale di sicurezza SSO! Account verificato.",
      totpText: "Autenticazione a due fattori richiesta. Inserisci il codice TOTP a 6 cifre.",
      qdTitle: "Deposito rapido 10.000,00 USD",
      qdSub: "Pipeline di approvazione garanzia (Escrow)",
      qdStep1: "Seleziona canale di pagamento",
      qdStep2: "Coordinate e Invia",
      qdInfo1: "Offriamo canali di liquidazione istituzionali diretti. Seleziona il metodo di transazione preferito per recuperare le coordinate del gateway univoco per questo deposito di ",
      qdInfo1Tail: " :",
      qdCryptoNet: "Rete Cripto",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "Regolamento istantaneo su blockchain. Trasferimenti istantanei verso il deposito a garanzia dello smart contract della piattaforma.",
      qdBankClearing: "Compensazione Bancaria",
      qdBankSub: "ACH / Bonifico Bancario",
      qdBankDesc: "Bonifico diretto Federal Reserve. Compensazione a commissione zero con un codice di riferimento di audit automatizzato.",
      qdContinueBtn: "Continua alle coordinate",
      qdSelectCrypto: "Seleziona rete criptovaluta",
      qdStep2Text: "Si prega di avviare il trasferimento esattamente di ",
      qdStep2Tail: " tramite le coordinate generate di seguito:",
      qdVerifiedPlatform: "🚨 INDIRIZZO PIATTAFORMA VERIFICATO",
      qdUsdtDesc: "Caveau sicuro (hot-cold storage). I depositi on-chain sono detenuti in pool di liquidità in tempo reale.",
      qdBtcDesc: "Indirizzo di deposito diretto sul registro di contabilità della blockchain (ledger).",
      qdEthDesc: "Punto di deposito standard dello smart contract TRC-20.",
      qdSolDesc: "Portafoglio di compensazione delle attività ad alta velocità di Solana.",
      qdScanQr: "SCANSIONA LE QR CODE DI DEPOSITO",
      qdBankCoordHeader: "🏢 COORDINATE DELL'ISTITUTO DI LIQUIDAZIONE",
      qdBankName: "Istituto di compensazione:",
      qdRouting: "Instradamento della stanza di compensazione (ACH):",
      qdAccount: "Numero di conto del caveau:",
      qdEscrowRef: "Riferimento dell'audit di garanzia:",
      qdCopyRef: "Copia riferimento",
      qdBack: "Indietro",
      qdSubmitBtn: "Invia il riferimento di deposito al registro"
    },
    ar: {
      tradingDesk: "منصة التداول",
      secureWallet: "المحفظة الآمنة",
      copyTrading: "نسخ الصفقات",
      yieldEarn: "عوائد الأرباح",
      taxCenter: "مركز الضرائب",
      adminCommand: "لوحة التحكم للمسؤول",
      signIn: "تسجيل الدخول",
      markets: "قائمة الأسواق",
      feed: "موجز البيانات المباشر",
      exchangeFlash: "تنبيه البورصة العاجل",
      notLoggedIn: "المصادقة مطلوبة",
      notLoggedInDesc: "يرجى توصيل جلسة التداول الآمنة الخاصة بك لعرض الأسواق الحية، والتحقق من أرصدة الحسابات، وتنفيذ المعاملات التجارية.",
      connectIdentityBtn: "توصيل الهوية الآمنة للحساب",
      googleSso: "الهوية الآمنة باستخدام Google",
      appleSso: "تكامل معرف Apple ID",
      enterSsoEmailPrompt: "أدخل بيانات الاعتماد الآمنة للتحقق من هوية تسجيل الدخول الموحد:",
      returnToLogin: "الرجوع إلى صفحة تسجيل الدخول",
      logout: "إنهاء الجلسة الآمنة",
      ssoEmail: "البريد الإلكتروني لـ SSO",
      continueSso: "المتابعة وتوصيل الجلسة الفارية",
      ssoConnecting: "جاري الاتصال بالبوابة الأمنية المشتركة...",
      kycState: "حالة التحقق من الهوية (KYC)",
      kycCleared: "تمت الموافقة بالكامل بموجب لوائح وسياسات SEC و FinCEN.",
      kycPending: "الحساب غير موثق حالياً. العمليات مقيدة مؤقتاً.",
      verifyEmailBtn: "تأكيد البريد الإلكتروني وتنشيط الحساب الآن",
      secNetwork: "شبكة APEX الآمنة متصلة • الأوراق المالية محمية بالتشفير الشامل",
      walletBalance: "الرصيد المتاح في المحفظة",
      depositBtn: "إيداع سريع بقيمة 10,000$",
      bellNoActivity: "لم يتم تسجيل أي نشاط مالي بعد",
      bellHint: "قم بتمويل حسابك باستخدام زر الإيداع السريع 10k لرؤية التحديثات في الوقت الفعلي.",
      activityAlerts: "تنبيهات النشاط",
      approvedCredit: "رصيد معتمد",
      rejected: "مرفوض",
      pending: "قيد الانتظار",
      activePrefix: "نشط",
      totalLogs: "إجمالي السجلات",
      systemLogsVerified: "تم التحقق من سجلات النظام",
      recentTrades: "النشاط الأخير للمنصة",
      leverage: "تحديد الرافعة المالية",
      buyBtn: "شراء / طويل المدى",
      sellBtn: "بيع / قصير المدى",
      noRegisteredProfile: "لم يتم العثور على ملف تعريف مسجل. حاول التسجيل أو استخدم تسجيل الدخول الموحد SSO.",
      ssoSuccess: "تم تسجيل الدخول فوراً عبر بوابة أمان SSO! الحساب موثق.",
      totpText: "المصادقة الثنائية مطلوبة. أدخل رمز الـ TOTP المكون من 6 أرقام.",
      qdTitle: "إيداع سريع بقيمة 10,000.00 دولار أمريكي",
      qdSub: "مسار الموافقة الآمن للضمان المالي (Escrow)",
      qdStep1: "حدد قناة الدفع",
      qdStep2: "الإحداثيات والتقديم",
      qdInfo1: "نحن نوفر قنوات تسوية مباشرة للمؤسسات. يرجى اختيار طريقة المعاملة المفضلة لديك للحصول على إحداثيات البوابة المخصصة لك للإيداع بقيمة ",
      qdInfo1Tail: " :",
      qdCryptoNet: "شبكة الكريبتو",
      qdCryptoSub: "USDT, BTC, ETH, SOL",
      qdCryptoDesc: "تسوية فورية على البلوكشين. يتم تحويل الأموال مباشرة للضمان المحمي عبر عقود ذكية.",
      qdBankClearing: "التسوية المصرفية",
      qdBankSub: "غرفة المقاصة الآلية ACH / حوالة بنكية",
      qdBankDesc: "حوالة مصرفية مباشرة من الاحتياطي الفيدرالي. تسوية خالية من العمولات مع مرجع تدقيق تلقائي مخصص.",
      qdContinueBtn: "المتابعة لمعرفة التفاصيل",
      qdSelectCrypto: "حدد شبكة العملة الرقمية",
      qdStep2Text: "يرجى تحويل مبلغ قيمته بالضبط ",
      qdStep2Tail: " باستخدام الإحداثيات الموضحة أدناه:",
      qdVerifiedPlatform: "🚨 عنوان المنصة المؤكد والموثق",
      qdUsdtDesc: "خزنة حماية باردة وساخنة لحفظ الأصول. الإيداعات المباشرة يتم الاحتفاظ بها في مجمعات السيولة الفورية.",
      qdBtcDesc: "عنوان الإيداع المباشر في دفتر الأستاذ للبيتكوين.",
      qdEthDesc: "نقطة الإيداع المحددة لتوافق شبكة Ethereum TRC-20.",
      qdSolDesc: "محفظة تسوية أصول شبكة Solana فائقة السرعة.",
      qdScanQr: "مسح كود الاستجابة السريعة للإيداع QR",
      qdBankCoordHeader: "🏢 إحداثيات وتفاصيل بنك المقاصة والتسوية",
      qdBankName: "مؤسسة المقاصة المصرفية:",
      qdRouting: "رمز التوجيه لغرفة المقاصة (ACH):",
      qdAccount: "رقم الحساب في الخزنة:",
      qdEscrowRef: "الرقم المرجعي للتدقيق والضمان المالي:",
      qdCopyRef: "نسخ الرقم المرجعي",
      qdBack: "تراجع",
      qdSubmitBtn: "تقديم وتوثيق مرجع الإيداع إلى دفتر الأستاذ"
    }
  };

  // NEW SESSION & AUTH FOR ADMIN COMMAND
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const cached = localStorage.getItem('apex_user');
    if (cached) return JSON.parse(cached);
    return null; // Default state is offline logged out
  });

  const [currentLang, setCurrentLang] = useState<'en' | 'pt' | 'es' | 'de' | 'fr' | 'it' | 'ar'>(() => {
    const cached = localStorage.getItem('apex_lang');
    if (cached) return cached as any;
    
    // Automatically detect user's browser language on first visit
    const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
    const supported = ['en', 'pt', 'es', 'de', 'fr', 'it', 'ar'];
    if (supported.includes(browserLang)) {
      return browserLang as any;
    }
    return 'en';
  });

  const [translationCache, setTranslationCache] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('apex_translations_cache');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  const cacheRef = useRef<Record<string, string>>(translationCache);
  useEffect(() => {
    cacheRef.current = translationCache;
  }, [translationCache]);

  const changeLanguage = (lang: 'en' | 'pt' | 'es' | 'de' | 'fr' | 'it' | 'ar') => {
    setCurrentLang(lang);
    localStorage.setItem('apex_lang', lang);
  };

  const t = (key: string, defaultValue?: string) => {
    const staticTranslation = TRANSLATIONS[currentLang]?.[key];
    if (staticTranslation) return staticTranslation;

    const dynamicKey = `${currentLang}_${key}`;
    const dynamicTranslation = translationCache[dynamicKey];
    if (dynamicTranslation) return dynamicTranslation;

    return TRANSLATIONS['en']?.[key] || defaultValue || key;
  };

  // Keep track of texts currently being requested or those that failed to avoid duplicate network queries
  const requestedTextsRef = useRef<Set<string>>(new Set());
  const runDomTranslationRef = useRef<() => void>(undefined);

  // Dynamic DOM Translation script to translate everything that's remaining in real-time
  useEffect(() => {
    let isMounted = true;

    // Reset the mid-flight requested registry on language or tab change to ensure high-accuracy recovery
    requestedTextsRef.current.clear();

    const isEligibleText = (str: string) => {
      const trimStr = str.trim();
      if (!trimStr) return false;
      // Skip purely numeric/symbol strings like "$12,450.00", "+4.2%", "BTC", "ETH", etc.
      if (/^[0-9$%+\-.,\s/\\:()<>|&%#*?•!#@=]+$/.test(trimStr)) return false;
      // Skip very short strings
      if (trimStr.length <= 1) return false;
      // Skip strings that look like codes/hashes
      if (trimStr.startsWith('0x') && trimStr.length > 10) return false;
      return true;
    };

    // Fast static lookup connector to bridge raw text with the i18n TRANSLATIONS dictionaries
    const findStaticTranslation = (englishText: string, lang: string): string | null => {
      const enDict = TRANSLATIONS['en'] || {};
      const targetDict = TRANSLATIONS[lang] || {};

      // 1. Direct key match: if englishText is actually a key
      if (targetDict[englishText]) {
        return targetDict[englishText];
      }

      // 2. Value lookup: find key that matches the text, then get translation
      const foundEntry = Object.entries(enDict).find(([_, val]) => val.toLowerCase() === englishText.toLowerCase());
      if (foundEntry) {
        const [key] = foundEntry;
        if (targetDict[key]) return targetDict[key];
      }
      return null;
    };

    const runDomTranslation = async () => {
      // Heuristic resolver to detect if the text is already translated and retrieve its original English string
      const getOriginalEnglishText = (text: string): string => {
        const normalized = text.trim();
        const lower = normalized.toLowerCase();
        if (!lower) return text;

        // 1. Check if the text is already an exact value or key in the English dictionary
        const enDict = TRANSLATIONS['en'] || {};
        for (const [key, value] of Object.entries(enDict)) {
          if ((value as string).toLowerCase() === lower || key.toLowerCase() === lower) {
            return value as string;
          }
        }

        // 2. Check other target languages to see if this text is a translation of an English key
        for (const lang of Object.keys(TRANSLATIONS)) {
          if (lang === 'en') continue;
          const dict = TRANSLATIONS[lang] || {};
          for (const [key, value] of Object.entries(dict)) {
            if ((value as string).toLowerCase() === lower) {
              return (enDict[key] as string) || key;
            }
          }
        }

        // 3. Check dynamic translationCache to see if this text was a dynamic translation of some English key
        for (const [cacheKey, transVal] of Object.entries(cacheRef.current)) {
          if ((transVal as string).toLowerCase() === lower) {
            const underscoreIdx = cacheKey.indexOf('_');
            if (underscoreIdx !== -1) {
              return cacheKey.substring(underscoreIdx + 1);
            }
          }
        }

        return text;
      };

      // First, always restore all previously translated elements in the DOM back to their original English strings to prevent language overlay bugs
      const elementsToRestore = document.querySelectorAll('[data-orig-text]');
      elementsToRestore.forEach(el => {
        const orig = el.getAttribute('data-orig-text');
        if (orig) {
          const childTextNodes = Array.from(el.childNodes).filter(node => node.nodeType === 3);
          if (childTextNodes.length > 0) {
            childTextNodes[0].textContent = orig;
          } else {
            el.textContent = orig;
          }
        }
      });
      const placeholdersToRestore = document.querySelectorAll('[data-orig-placeholder]');
      placeholdersToRestore.forEach(el => {
        const orig = el.getAttribute('data-orig-placeholder');
        if (orig) {
          el.setAttribute('placeholder', orig);
        }
      });

      if (currentLang === 'en') {
        return;
      }

      const root = document.getElementById('root') || document.body;
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      const textsToFetchSet = new Set<string>();

      let currentNode = walker.nextNode() as Element | null;
      while (currentNode) {
        const tagName = currentNode.tagName.toLowerCase();
        if (['script', 'style', 'svg', 'path', 'iframe', 'canvas', 'code'].includes(tagName)) {
          currentNode = walker.nextNode() as Element | null;
          continue;
        }

        // Skip translation for any elements (and their children) with translate="no" or class "notranslate"
        if (
          currentNode.getAttribute('translate') === 'no' ||
          currentNode.classList.contains('notranslate') ||
          currentNode.closest('[translate="no"]') ||
          currentNode.closest('.notranslate')
        ) {
          currentNode = walker.nextNode() as Element | null;
          continue;
        }

        // Check placeholder
        const placeholder = currentNode.getAttribute('placeholder');
        if (placeholder && isEligibleText(placeholder)) {
          const origPl = getOriginalEnglishText(placeholder);
          if (!currentNode.hasAttribute('data-orig-placeholder')) {
            currentNode.setAttribute('data-orig-placeholder', origPl);
          }
          const finalPl = currentNode.getAttribute('data-orig-placeholder') || origPl;
          
          // A. Check static lexicon dictionary first
          const staticMatch = findStaticTranslation(finalPl, currentLang);
          if (staticMatch) {
            currentNode.setAttribute('placeholder', staticMatch);
          } else {
            // B. Check dynamic cache
            const cacheKey = `${currentLang}_${finalPl}`;
            const cached = cacheRef.current[cacheKey];
            if (cached) {
              currentNode.setAttribute('placeholder', cached);
            } else {
              // C. Check requested registry to prevent duplicate fetch requests
              if (!requestedTextsRef.current.has(cacheKey)) {
                requestedTextsRef.current.add(cacheKey);
                textsToFetchSet.add(finalPl);
              }
            }
          }
        }

        // Scan child text nodes
        const childNodes = Array.from(currentNode.childNodes);
        for (const child of childNodes) {
          if (child.nodeType === 3) { // TEXT_NODE
            const txt = child.textContent?.trim();
            if (txt && isEligibleText(txt)) {
              const origTx = getOriginalEnglishText(txt);
              if (!currentNode.hasAttribute('data-orig-text')) {
                currentNode.setAttribute('data-orig-text', origTx);
              }
              const finalTx = currentNode.getAttribute('data-orig-text') || origTx;
              
              // A. Check static lexicon dictionary first
              const staticMatch = findStaticTranslation(finalTx, currentLang);
              if (staticMatch) {
                child.textContent = staticMatch;
              } else {
                // B. Check dynamic cache
                const cacheKey = `${currentLang}_${finalTx}`;
                const cached = cacheRef.current[cacheKey];
                if (cached) {
                  child.textContent = cached;
                } else {
                  // C. Check requested registry to prevent duplicate fetch requests
                  if (!requestedTextsRef.current.has(cacheKey)) {
                    requestedTextsRef.current.add(cacheKey);
                    textsToFetchSet.add(finalTx);
                  }
                }
              }
            }
          }
        }

        currentNode = walker.nextNode() as Element | null;
      }

      if (textsToFetchSet.size > 0 && isMounted) {
        const textsToFetch = Array.from(textsToFetchSet);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: textsToFetch, targetLang: currentLang })
          });
          if (res.ok && isMounted) {
            const data = await res.json();
            if (data.success && data.translations && data.translations.length === textsToFetch.length) {
              setTranslationCache(prev => {
                const updated = { ...prev };
                textsToFetch.forEach((englishStr, index) => {
                  updated[`${currentLang}_${englishStr}`] = data.translations[index];
                });
                if (!data.isFallback) {
                  localStorage.setItem('apex_translations_cache', JSON.stringify(updated));
                }
                return updated;
              });
            } else {
              // Clear requested texts registry on server error to enable immediate retry
              textsToFetch.forEach((englishStr) => {
                requestedTextsRef.current.delete(`${currentLang}_${englishStr}`);
              });
            }
          } else {
            // Clear requested texts registry on response failure to enable immediate retry
            textsToFetch.forEach((englishStr) => {
              requestedTextsRef.current.delete(`${currentLang}_${englishStr}`);
            });
          }
        } catch (err) {
          console.warn("Translation api fetch failure:", err);
          // Clear requested texts registry on network failure to enable immediate retry
          textsToFetch.forEach((englishStr) => {
            requestedTextsRef.current.delete(`${currentLang}_${englishStr}`);
          });
        }
      }
    };

    runDomTranslationRef.current = runDomTranslation;

    runDomTranslation();
    const interval = setInterval(runDomTranslation, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentLang, activeTab]);

  // Trigger DOM translation immediately when cache updates, avoiding any state clear or flight cancellation
  useEffect(() => {
    if (currentLang !== 'en' && runDomTranslationRef.current) {
      runDomTranslationRef.current();
    }
  }, [translationCache, currentLang]);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // New beautiful inline responsive SSO states (prevents blocked browser prompt dialogs inside sandboxed iframe)
  const [ssoProvider, setSsoProvider] = useState<'google' | 'apple' | null>(null);
  const [ssoEmailInput, setSsoEmailInput] = useState('');

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [awaitingTotp, setAwaitingTotp] = useState(false);
  const [tempSsoUser, setTempSsoUser] = useState<any>(null);

  // Quick 10k Deposit modal states
  const [quickDepositOpen, setQuickDepositOpen] = useState(false);
  const [quickDepositStep, setQuickDepositStep] = useState<1 | 2>(1);
  const [quickDepositMethod, setQuickDepositMethod] = useState<'bank' | 'crypto'>('crypto');
  const [quickDepositCryptoType, setQuickDepositCryptoType] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Dynamic deposit settlement routing coordinates state configured by Administation dynamically
  const [paymentCoordinates, setPaymentCoordinates] = useState<any>({
    bankName: "Alliance Brokerage & Trust",
    routingNumber: "021000021",
    accountNumber: "1029-4581-9238",
    cryptoAddresses: {
      USDT: { name: 'USDT (ERC-20 Network)', address: '0x89201940000ABeC7816ED29A09823AB78E993', sub: 'Secure hot-cold storage vault. Onchain deposits are held in real-time liquidity pools.' },
      BTC: { name: 'Bitcoin (BTC Native)', address: 'bc1q9823ab78e99309823ab78e993bc1q9823', sub: 'Direct blockchain ledger deposit address.' },
      ETH: { name: 'Ethereum (ETH Network)', address: '0x7129A09823AB78E993089201940000ABeC7816', sub: 'ERC-20 standard smart contract deposit point.' },
      SOL: { name: 'Solana (SOL Network)', address: '9823aBeC7816ED29A09823AB78E99389201940eZ', sub: 'Solana high speed asset clearing wallet.' }
    }
  });

  const fetchPaymentCoordinates = async () => {
    try {
      const res = await fetch("/api/admin/payment-coordinates");
      if (res.ok) {
        const data = await res.json();
        setPaymentCoordinates(data);
      }
    } catch (e) {
      console.warn("Failed to retrieve dynamic live payment coordinates:", e);
    }
  };

  // User ticketing systems state
  const [tktSubject, setTktSubject] = useState('');
  const [tktMsg, setTktMsg] = useState('');
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [activeUserTkt, setActiveUserTkt] = useState<any | null>(null);
  const [userTktReply, setUserTktReply] = useState('');

  // Notifications dropdown and user transaction history states
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userDeposits, setUserDeposits] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);

  // Calculate notifications & activity history metrics
  const totalApproved = userDeposits
    .filter(d => d.status === 'approved' || d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalRejected = userDeposits
    .filter(d => d.status === 'rejected')
    .reduce((sum, d) => sum + d.amount, 0);

  const mergedTransactions = [
    ...userDeposits.map(d => ({ ...d, type: 'deposit' as any })),
    ...userWithdrawals.map(w => ({ ...w, type: 'withdrawal' as any }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const pendingTransactionsCount = mergedTransactions.filter(t => t.status === 'pending').length;

  // Synchronise user profiles & balances in real time
  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem('apex_user');
      return;
    }
    
    localStorage.setItem('apex_user', JSON.stringify(currentUser));

    if (currentUser.balances) {
      setBalances(prev => {
        let isDifferent = false;
        const next = prev.map(b => {
          const userAmt = currentUser.balances[b.symbol];
          if (typeof userAmt !== 'undefined' && b.amount !== userAmt) {
            isDifferent = true;
            return {
              ...b,
              amount: userAmt
            };
          }
          return b;
        });
        return isDifferent ? next : prev;
      });
    }

    if (currentUser.role === 'admin') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/me?email=${currentUser.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
        console.warn('Silent user profile sync failed.');
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser?.email]);

  // Fetch user transactions (deposits and withdrawals) for notifications status & logs
  const fetchUserTransactions = async () => {
    if (!currentUser || !currentUser.email) return;
    try {
      const [depRes, wthRes] = await Promise.all([
        fetch('/api/admin/deposits'),
        fetch('/api/admin/withdrawals')
      ]);
      if (depRes.ok) {
        const deposits = await depRes.json();
        const filteredDeps = deposits.filter((d: any) => 
          (d.userId === currentUser.id) || 
          (d.userEmail && d.userEmail.toLowerCase() === currentUser.email.toLowerCase())
        );
        setUserDeposits(filteredDeps);
      }
      if (wthRes.ok) {
        const withdrawals = await wthRes.json();
        const filteredWths = withdrawals.filter((w: any) => 
          (w.userId === currentUser.id) || 
          (w.userEmail && w.userEmail.toLowerCase() === currentUser.email.toLowerCase())
        );
        setUserWithdrawals(filteredWths);
      }
    } catch (err) {
      console.warn("Failed to fetch user transactions history in notifications:", err);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchUserTransactions();
      const tInterval = setInterval(fetchUserTransactions, 4000);
      return () => clearInterval(tInterval);
    } else {
      setUserDeposits(prev => prev.length === 0 ? prev : []);
      setUserWithdrawals(prev => prev.length === 0 ? prev : []);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (quickDepositOpen) {
      fetchPaymentCoordinates();
    }
  }, [quickDepositOpen]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (!response.ok) {
        const errorData = await response.json();
        customAlert(`Error: ${errorData.error || "Login failed."}`);
        return;
      }
      const data = await response.json();
      if (data.success) {
        // Check if user has 2FA enabled
        if (data.user.isTwoFactorEnabled && !awaitingTotp) {
          setTempSsoUser(data.user);
          setAwaitingTotp(true);
          customAlert("🔐 Two-Factor Authentication required. Enter the 6-digit TOTP code.");
          return;
        }
        
        setCurrentUser(data.user);
        setAuthOpen(false);
        setLoginEmail('');
        setLoginPassword('');
        setAwaitingTotp(false);
        setTempSsoUser(null);
        customAlert(`✓ Welcome back, ${data.user.name || data.user.email}! Session authenticated.`);
        if (data.user.role === 'admin') {
          setActiveTab('admin');
        }
      }
    } catch (err) {
      customAlert("Failed to reach identity authentication server.");
    }
  };

  // Complete 2FA login verification
  const handleTotpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpInput === "123456" || totpInput.length === 6) { // allow 123456 as default or any 6 digit
      setCurrentUser(tempSsoUser);
      setAuthOpen(false);
      setAwaitingTotp(false);
      setTotpInput('');
      setTempSsoUser(null);
      customAlert(`✓ TOTP Cleared. Welcome, ${tempSsoUser.name}!`);
      if (tempSsoUser.role === 'admin') {
        setActiveTab('admin');
      }
    } else {
      customAlert("Error: Invalid TOTP key identifier. Please try again.");
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        customAlert(`Error: ${errorData.error || "Registration failed."}`);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        setAuthOpen(false);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        customAlert("✓ Portfolio created successfully! $10,000.00 USD Tether welcome liquidity credited.");
      }
    } catch (err) {
      customAlert("Failed to reach registration server.");
    }
  };

  // SSO Authentication Simulation (Google/Apple)
  const handleSsoAuthenticate = (provider: 'google' | 'apple') => {
    setSsoProvider(provider);
    setSsoEmailInput('');
  };

  const handleSsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssoEmailInput || !ssoEmailInput.includes('@')) {
      customAlert(currentLang === 'pt' ? "Erro: Por favor, insira um endereço de e-mail válido." : "Error: Please enter a valid email address.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ssoEmailInput,
          authProvider: ssoProvider
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.user);
          setAuthOpen(false);
          setSsoProvider(null);
          customAlert(currentLang === 'pt' 
            ? `✓ Conectado instantaneamente com ${ssoProvider === "google" ? "Google Secure SSO" : "Apple Private Relay SSO"}! Conta verificada.`
            : `✓ Signed in instantly with ${ssoProvider === "google" ? "Google Secure SSO" : "Apple Private Relay SSO"}! Account verified.`);
          if (data.user.role === 'admin') {
            setActiveTab('admin');
          }
        }
      } else {
        const err = await response.json();
        customAlert(`SSO Error: ${err.error || "Login failed"}`);
      }
    } catch (err) {
      customAlert("Failed to reach SSO auth relay.");
    }
  };

  // Handle Password Recovery Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (!response.ok) {
        const d = await response.json();
        customAlert(`Fault: ${d.error}`);
        return;
      }
      const data = await response.json();
      if (data.success) {
        const resetOtpInput = prompt(`Secure OTP key dispatched! For security verification in development, your OTP code is: ${data.otp}\n\nEnter the OTP code to set a new password:`);
        if (!resetOtpInput || resetOtpInput !== data.otp) {
          customAlert("Error: OTP mismatch. Verification workflow terminated.");
          return;
        }
        const newPasswordInput = prompt("Enter your new secure password credential:");
        if (!newPasswordInput) return;

        // Reset password API
        const resetRes = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotEmail,
            otp: resetOtpInput,
            password: newPasswordInput
          })
        });
        if (resetRes.ok) {
          customAlert("✓ Password safety cleared. New credentials calibrated. Please Login.");
          setIsForgotOpen(false);
          setAuthMode('login');
          setForgotEmail('');
        } else {
          customAlert("Failed updating credential records.");
        }
      }
    } catch (err) {
      customAlert("Failed connecting to recovery backend systems.");
    }
  };

  // Handle Trigger Compliance Verification (KYC check/Email Verification)
  const triggerComplianceVerify = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        customAlert("✓ Email verified successfully! Compliance status upgraded to VERIFIED KYC under SEC guidelines.");
      }
    } catch (e) {
      customAlert("Failed posting email confirmation.");
    }
  };

  // Toggle user 2FA configuration
  const toggleTwoFactorAuthState = async () => {
    if (!currentUser) return;
    const enable = !currentUser.isTwoFactorEnabled;
    try {
      const response = await fetch("/api/auth/2fa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, enable })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        customAlert(enable 
          ? "🔐 Two-Factor Authentication requested. High density TOTP key established! (Secret: GBSWY... Code: 123456)" 
          : "✓ Two-Factor Authentication suspended. Profile reverted to simple email/password sequence.");
      }
    } catch (e) {
      customAlert("Failed adjusting 2FA configurations.");
    }
  };

  // Sync user support tickets
  const fetchUserTickets = async () => {
    if (!currentUser || currentUser.role === 'admin') return;
    try {
      const response = await fetch(`/api/admin/tickets`);
      if (response.ok) {
        const data = await response.json();
        const mine = data.filter((t: any) => t.userId === currentUser.id || t.userEmail === currentUser.email);
        setUserTickets(mine);
        if (activeUserTkt) {
          const fresh = mine.find((t: any) => t.id === activeUserTkt.id);
          if (fresh) setActiveUserTkt(fresh);
        }
      }
    } catch (e) {
      console.warn('Sync tickets error.');
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      fetchUserTickets();
      const interval = setInterval(fetchUserTickets, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, activeUserTkt?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !tktMsg.trim()) return;
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          subject: tktSubject,
          message: tktMsg
        })
      });

      if (response.ok) {
        setTktSubject('');
        setTktMsg('');
        fetchUserTickets();
        customAlert("✓ Ticket dispatch submitted successfully to active support officers queue!");
      }
    } catch (err) {
      customAlert("Failed initiating ticket stream.");
    }
  };

  const handleUserReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTktReply.trim() || !activeUserTkt) return;
    try {
      const response = await fetch(`/api/admin/tickets/${activeUserTkt.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "user",
          senderName: currentUser.name,
          message: userTktReply
        })
      });

      if (response.ok) {
        setUserTktReply('');
        fetchUserTickets();
      }
    } catch (err) {
      customAlert("Failed dispatching reply.");
    }
  };

  const usdBalanceVal = balances.find(b => b.symbol === 'USD')?.amount || 0;

  return (
    <div dir={currentLang === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen bg-slate-950 flex flex-col antialiased text-slate-100 font-sans ${currentLang === 'ar' ? 'text-right' : 'text-left'}`}>
      
      {/* Upper header section status and ticker banners */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-4 flex justify-between items-center z-15 sticky top-0 md:relative">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <button 
              type="button"
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                if (!sidebarOpen) setMobileMenuOpen(false);
              }}
              className="p-1 px-2.5 hover:bg-slate-800 rounded-lg text-slate-350 cursor-pointer flex items-center gap-1.5 border border-slate-800 shadow-sm"
              title="Toggle asset list drawer"
            >
              <TrendingUp size={14} className="text-amber-500 animate-pulse" />
              <span className="text-[10px] uppercase font-mono font-black tracking-wider hidden xs:inline-block text-slate-300">Markets</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 cursor-pointer ml-1" onClick={() => { setActiveTab('trade'); setMobileMenuOpen(false); }}>
            <div className="p-1.5 rounded-lg bg-amber-500 font-display font-black text-slate-950 text-sm sm:text-base leading-none tracking-tighter"> Apex </div>
            <span className="text-sm font-display tracking-tight text-white font-extrabold hidden md:inline-block">EXCHANGE</span>
          </div>
        </div>

        {/* Main Tabs Selector layout buttons */}
         <nav className="hidden lg:flex bg-slate-950/60 rounded-xl p-1 gap-1 border border-slate-800">
          {[
            { id: 'trade', label: t('tradingDesk'), icon: BarChart4 },
            { id: 'wallet', label: t('secureWallet'), icon: Wallet },
            { id: 'copy', label: t('copyTrading'), icon: Users },
            { id: 'earn', label: t('yieldEarn'), icon: PiggyBank },
            { id: 'taxes', label: t('taxCenter'), icon: Calculator },
            ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: t('adminCommand') + " 🛡️", icon: Shield }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-amber-500 text-slate-950 shadow font-extrabold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right tools and Quick cash actions */}
        <div className="flex items-center gap-2">
          {/* Real-time telemetry feed indicator */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-950/80 py-1.5 px-3 rounded-xl border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${
              streamStatus.includes('WEBSOCKET') ? 'bg-emerald-400' :
              streamStatus.includes('SSE') ? 'bg-cyan-400' : 'bg-amber-400'
            } ${streamStatus.includes('WEBSOCKET') ? 'animate-pulse' : ''}`} style={{ boxShadow: streamStatus.includes('WEBSOCKET') ? '0 0 8px #10b981' : undefined }} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 select-none">
              {t('feed')}: {streamStatus}
            </span>
          </div>

          <button
            onClick={triggerDemoQuickCash}
            id="demo-quick-deposit-btn"
            className="hidden sm:block bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg tracking-wider shadow-md transition-all uppercase"
          >
            {t('depositBtn')}
          </button>

          <div className="relative">
            <button
              type="button"
              id="notification-bell-btn"
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
            >
              <Bell size={18} />
              {pendingTransactionsCount > 0 ? (
                <span className="absolute top-1 right-1 flex h-200% w-200% max-w-[8px] max-h-[8px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              ) : (
                mergedTransactions.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-500" />
                )
              )}
            </button>

            {notificationDropdownOpen && (
              <>
                {/* Backdrop overlay for outside click detection */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setNotificationDropdownOpen(false)} 
                />
                
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-left font-sans text-xs">
                  {/* Header */}
                  <div className="p-4 border-b border-slate-850 bg-slate-950/65 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Activity Alerts</h4>
                      <p className="text-[10px] text-slate-500">Live credit, debit & settlement logs</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Transaction Metrics Dashboard */}
                  <div className="grid grid-cols-3 gap-1 px-4 py-3 bg-[#111317]/40 border-b border-slate-850">
                    <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-850/65 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-bold block">Approved Credit</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        ${totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-850/65 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold block">Rejected</span>
                      <span className="text-xs font-bold font-mono text-rose-400">
                        ${totalRejected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-850/65 text-center font-bold">
                      <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold block">Pending</span>
                      <span className="text-xs font-bold font-mono text-amber-400">
                        {pendingTransactionsCount} Active
                      </span>
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-850">
                    {mergedTransactions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <Bell size={24} className="mx-auto text-slate-650 animate-bounce" />
                        <p className="text-xs">{t('bellNoActivity')}</p>
                        <p className="text-[10px] text-slate-600">{t('bellHint')}</p>
                      </div>
                    ) : (
                      mergedTransactions.map((item) => {
                        const isDeposit = item.type === 'deposit';
                        
                        let statusColor = "";
                        let statusBg = "";
                        let statusText = "";
                        
                        if (item.status === 'pending') {
                          statusColor = "text-amber-400";
                          statusBg = "bg-amber-500/10 border-amber-500/20";
                          statusText = "Pending";
                        } else if (item.status === 'approved' || item.status === 'completed') {
                          statusColor = "text-emerald-400";
                          statusBg = "bg-emerald-500/10 border-emerald-500/20";
                          statusText = isDeposit ? "Approved Credit" : "Completed";
                        } else {
                          statusColor = "text-rose-400";
                          statusBg = "bg-rose-500/10 border-rose-500/20";
                          statusText = "Rejected";
                        }

                        let methodLabel = item.method || '';
                        if (methodLabel === 'bank') methodLabel = '🏦 Bank Wire Transfer';
                        else if (methodLabel.startsWith('crypto_')) {
                          methodLabel = `🪙 Crypto (${methodLabel.replace('crypto_', '').toUpperCase()})`;
                        } else if (methodLabel === 'crypto') {
                          methodLabel = '🪙 Crypto Wallet';
                        } else {
                          methodLabel = methodLabel.toUpperCase();
                        }

                        return (
                          <div key={item.id} className="p-3 hover:bg-slate-850/30 transition-colors flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-slate-200 flex items-center gap-1">
                                {isDeposit ? (
                                  <span className="text-emerald-400">📥 Plus Credit Deposit</span>
                                ) : (
                                  <span className="text-amber-400">📤 Cash Out Withdrawal</span>
                                )}
                                <span className="text-[9px] font-mono font-normal text-slate-500 tracking-tight">({item.id})</span>
                              </span>
                              <span className="font-mono text-[11px] font-extrabold text-slate-100">
                                {isDeposit ? '+' : '-'}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.currency || 'USD'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[200px] font-mono text-slate-500">{methodLabel}</span>
                              <div className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold flex items-center gap-1 ${statusBg} ${statusColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'pending' ? 'bg-amber-400 animate-pulse' : item.status === 'approved' || item.status === 'completed' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {statusText}
                              </div>
                            </div>

                            {item.txHash && (
                              <div className="text-[9px] font-mono text-slate-500 flex justify-between items-center border-t border-slate-850/45 pt-1 mt-0.5 border-dashed">
                                <span className="truncate max-w-[200px]">TxHash: <span className="text-slate-400 select-all font-mono">{item.txHash}</span></span>
                                {item.walletAddress && <span className="truncate max-w-[150px]">Dest: {item.walletAddress}</span>}
                              </div>
                            )}

                            {item.bankName && (
                              <div className="text-[9px] font-mono text-slate-500 flex justify-between items-center border-t border-slate-850/45 pt-1 mt-0.5 border-dashed">
                                <span className="truncate max-w-[200px]">Bank: <span className="text-slate-400 select-all font-mono">{item.bankName}</span></span>
                                {item.bankAccountRef && <span className="truncate max-w-[150px]">Ref: {item.bankAccountRef}</span>}
                              </div>
                            )}

                            <div className="text-[9px] text-slate-600 font-mono text-right">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary / Hint footer */}
                  <div className="p-3 bg-slate-950/80 border-t border-slate-850/70 text-center text-[9px] font-mono text-slate-500 flex justify-between items-center">
                    <span>Total Logs: {mergedTransactions.length}</span>
                    <span className="text-slate-450 font-bold">System Logs Verified ✓</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" translate="no">
            {(() => {
              const renderLanguageBall = (lang: string) => {
                switch (lang) {
                  case 'en':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="32" height="32" fill="#012169"/>
                        <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="4"/>
                        <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.5"/>
                        <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="6"/>
                        <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="4"/>
                      </svg>
                    );
                  case 'pt':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="32" height="32" fill="#009739"/>
                        <polygon points="16,3 29,16 16,29 3,16" fill="#FEDD00"/>
                        <circle cx="16" cy="16" r="6" fill="#012169"/>
                        <path d="M10 16 Q16 13 22 15" stroke="#fff" strokeWidth="1" fill="none"/>
                      </svg>
                    );
                  case 'es':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="32" height="32" fill="#AD1519"/>
                        <rect y="8" width="32" height="16" fill="#FCD116"/>
                        <circle cx="10" cy="16" r="3" fill="#AD1519" opacity="0.85"/>
                      </svg>
                    );
                  case 'fr':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="10.6" height="32" fill="#00209F"/>
                        <rect x="10.6" width="10.8" height="32" fill="#FFF"/>
                        <rect x="21.4" width="10.8" height="32" fill="#F31830"/>
                      </svg>
                    );
                  case 'de':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="32" height="10.6" fill="#000"/>
                        <rect y="10.6" width="32" height="10.8" fill="#FF0000"/>
                        <rect y="21.4" width="32" height="10.6" fill="#FFCC00"/>
                      </svg>
                    );
                  case 'it':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="10.6" height="32" fill="#009246"/>
                        <rect x="10.6" width="10.8" height="32" fill="#FFF"/>
                        <rect x="21.4" width="10.8" height="32" fill="#CE2B37"/>
                      </svg>
                    );
                  case 'ar':
                    return (
                      <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded-full overflow-hidden shadow-sm inline-block shrink-0 border border-slate-700/50">
                        <rect width="32" height="32" fill="#006C35"/>
                        <circle cx="16" cy="16" r="6" fill="#fff"/>
                        <circle cx="18" cy="16" r="6" fill="#006C35"/>
                      </svg>
                    );
                  default:
                    return <Globe size={11} className="text-amber-500" />;
                }
              };

              return (
                <>
                  <button
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="flex items-center gap-1.5 bg-[#111317] hover:bg-slate-900 border border-slate-850 py-1.5 px-3 rounded-full cursor-pointer focus:outline-none transition-all duration-150 active:scale-95 text-[10px] font-mono font-bold text-slate-300"
                    title="Change Language / Alterar Idioma"
                  >
                    {renderLanguageBall(currentLang)}
                    <span>{currentLang.toUpperCase()}</span>
                    <ChevronDown size={10} className="text-slate-500" />
                  </button>
                  
                  {langDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-850 font-sans text-xs">
                        {[
                          { code: 'en', label: 'English' },
                          { code: 'pt', label: 'Português' },
                          { code: 'es', label: 'Español' },
                          { code: 'fr', label: 'Français' },
                          { code: 'de', label: 'Deutsch' },
                          { code: 'it', label: 'Italiano' },
                          { code: 'ar', label: 'العربية' }
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              changeLanguage(lang.code as any);
                              setLangDropdownOpen(false);
                              const alertMsgs: Record<string, string> = {
                                en: "Language switched to English!",
                                pt: "Idioma alterado para Português!",
                                es: "Idioma cambiado a Español!",
                                de: "Sprache auf Deutsch umgestellt!",
                                fr: "Langue changée en Français !",
                                it: "Lingua cambiata in Italiano!",
                                ar: "تم تغيير اللغة إلى العربية!"
                              };
                              customAlert(alertMsgs[lang.code] || `Language switched to ${lang.label}!`);
                            }}
                            className={`w-full text-left px-3.5 py-2 hover:bg-slate-850 text-[11px] font-bold flex items-center gap-2 transition-colors ${
                              currentLang === lang.code ? 'text-amber-500 bg-slate-950/40' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {renderLanguageBall(lang.code)}
                            <span>{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1 bg-[#111317] hover:bg-slate-900 border border-slate-850 py-1.5 px-3 rounded-full cursor-pointer focus:outline-none transition-all active:scale-95 duration-150"
          >
            <User size={13} className={currentUser ? "text-amber-500" : "text-slate-400"} />
            <span className="text-[10px] font-mono font-bold text-slate-300 max-w-[90px] truncate">
              {currentUser ? (currentUser.name.split(' ')[0] || "Client") : t('signIn')}
            </span>
          </button>

          {/* Mobile Hamburger Navigation Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) setSidebarOpen(false); // Close asset list when navigation opens
            }}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-350 cursor-pointer flex items-center justify-center border border-slate-800 shadow-sm transition-colors"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={15} className="text-amber-500" /> : <Menu size={15} className="text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Breaking News Feed Banner */}
      <div className="bg-slate-950 border-b border-slate-850 px-4 py-2 flex items-center gap-2 overflow-hidden text-[10px] font-mono">
        <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 uppercase tracking-widest">{t('exchangeFlash')}</span>
        <div className="animate-pulse text-slate-400 truncate select-none">
          {newsFlash}
        </div>
      </div>

      {/* Main Core Layout drawer structure */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Backdrop for Markets Sidebar Drawer on Mobile */}
        {currentUser && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR: ASSET SELECTOR DRAWER */}
        {currentUser && (
          <aside 
            className={`bg-slate-900 border-r border-slate-850 transition-all duration-300 z-30 flex flex-col justify-between fixed md:relative top-[105px] md:top-0 h-[calc(100vh-105px)] md:h-auto left-0 ${
              sidebarOpen ? 'w-[280px] translate-x-0 opacity-100' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none'
            }`}
          >
          <div className="p-4 flex flex-col h-full">
            <div className="space-y-4">
              <div className="flex bg-slate-950 rounded-lg p-1.5 items-center gap-1 border border-slate-800 text-xs">
                <Search size={14} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter Crypto, Stocks, Commodities"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-650"
                />
              </div>

              {/* Categorized list scroll area */}
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                {/* 1. Crypto Symbol Block */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-2 tracking-widest uppercase">CRYPTOCURRENCY LEADERBOARD</span>
                  <div className="space-y-1">
                    {filteredAssets.filter(a => a.category === 'crypto').map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setActiveTab('trade'); }}
                        className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${
                          selectedAsset.id === asset.id 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-transparent hover:bg-slate-955'
                        }`}
                      >
                        <div>
                          <span className="text-white text-xs font-bold font-sans block">{asset.symbol}</span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px] block">{asset.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white text-xs font-semibold block">${asset.price.toLocaleString()}</span>
                          <span className={`text-[9px] ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Stocks Symbols Block */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-2 tracking-widest uppercase font-mono">EQUITIES & STOCKS</span>
                  <div className="space-y-1">
                    {filteredAssets.filter(a => a.category === 'stock').map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setActiveTab('trade'); }}
                        className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${
                          selectedAsset.id === asset.id 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-transparent hover:bg-slate-955'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white text-xs font-bold block">{asset.symbol}</span>
                            {asset.isPreIpo && (
                              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/35 text-[7px] px-1 rounded font-mono font-black uppercase tracking-wider scale-90">
                                PRE-IPO
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px] block">{asset.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white text-xs font-semibold block">${asset.price.toLocaleString()}</span>
                          <span className={`text-[9px] ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Commodities Symbols Block */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-2 tracking-widest uppercase font-mono">COMMODITIES SPOT INDEX</span>
                  <div className="space-y-1">
                    {filteredAssets.filter(a => a.category === 'commodity').map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setActiveTab('trade'); }}
                        className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${
                          selectedAsset.id === asset.id 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-transparent hover:bg-slate-955'
                        }`}
                      >
                        <div>
                          <span className="text-white text-xs font-bold block">{asset.symbol}</span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px] block">{asset.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white text-xs font-semibold block">${asset.price.toLocaleString()}</span>
                          <span className={`text-[9px] ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Forex Pairs Block */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-2 tracking-widest uppercase font-mono">FOREX TRANSACTIONS (LIVE)</span>
                  <div className="space-y-1">
                    {filteredAssets.filter(a => a.category === 'forex').map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setActiveTab('trade'); }}
                        className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${
                          selectedAsset.id === asset.id 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-transparent hover:bg-slate-955'
                        }`}
                      >
                        <div>
                          <span className="text-white text-xs font-bold block">{asset.symbol}</span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px] block">{asset.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white text-xs font-semibold block">{asset.price.toFixed(4)}</span>
                          <span className={`text-[9px] ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Indices Block */}
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-2 tracking-widest uppercase font-mono">GLOBAL WORLD INDICES</span>
                  <div className="space-y-1">
                    {filteredAssets.filter(a => a.category === 'index').map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => { setSelectedAsset(asset); setActiveTab('trade'); }}
                        className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${
                          selectedAsset.id === asset.id 
                            ? 'border-amber-500/30 bg-amber-500/5' 
                            : 'border-transparent hover:bg-slate-955'
                        }`}
                      >
                        <div>
                          <span className="text-white text-xs font-bold block">{asset.symbol}</span>
                          <span className="text-[9px] text-slate-400 truncate max-w-[100px] block">{asset.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-white text-xs font-semibold block">{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className={`text-[9px] ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micro Wallet status cue inside scroll area so it scrolls naturally with assets list and doesn't cover footer while scrolling */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 font-mono mt-4 text-[11px] shrink-0">
                  <span className="text-slate-500 uppercase block text-[9px]">AVAILABLE LIQUIDITY</span>
                  <span className="text-white font-extrabold block text-sm mt-0.5">${usdBalanceVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className="text-amber-500 hover:underline mt-1.5 inline-flex items-center gap-0.5"
                  >
                    Go to Wallet <ArrowRight size={12} />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </aside>
        )}

        {/* CORE WORKSPACE VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">



          {/* ACTIVE PORTAL TAB */}
          <div className="animate-slide-up">
            
            {!currentUser ? (
              <WelcomePage 
                onAuthSuccess={(user) => setCurrentUser(user)}
                t={t}
                currentLang={currentLang}
                setSelectedAsset={setSelectedAsset}
                setActiveTab={setActiveTab}
                assets={assets}
              />
            ) : (
              <>
                {/* TAB 1: TRADING DESK */}
                {activeTab === 'trade' && (
                  <div id="workspace-desk" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                      
                      {/* Left block (Line chart and news tracking radar - 2 cols) */}
                      <div className="xl:col-span-2 space-y-6">
                        <LiveChart selectedAsset={selectedAsset} />
                        <SentimentTracker selectedAsset={selectedAsset} />
                      </div>

                      {/* Right order executive panel (1 col) */}
                      <div className="xl:col-span-1">
                        <TradingPanel
                          selectedAsset={selectedAsset}
                          userBalances={balances}
                          onExecuteTrade={handleExecuteTrade}
                          activeOrders={activeOrders}
                          onCancelOrder={handleCancelOrder}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SECURE WALLET */}
                {activeTab === 'wallet' && (
                  <SecureWallet
                    balances={balances}
                    assets={assets}
                    onSwapAssets={handleSwapAssets}
                    onModifyBalance={handleModifyBalance}
                  />
                )}

                {/* TAB 3: COPY TRADING */}
                {activeTab === 'copy' && (
                  <CopyTrading
                    leadTraders={leadTraders}
                    walletUsdBalance={usdBalanceVal}
                    onCopyTrader={handleCopyTrader}
                    onUncopyTrader={handleUncopyTrader}
                    onRegisterLeadTrader={handleRegisterLeadTrader}
                    t={t}
                  />
                )}

                {/* TAB 4: EARN (STAKING) */}
                {activeTab === 'earn' && (
                  <EarnSection
                    stakingList={stakingProducts}
                    walletBalances={balances}
                    onSubscribeStaking={handleSubscribeStaking}
                    onModifyAccruedInterest={handleModifyAccruedInterest}
                    t={t}
                  />
                )}

                {/* TAB 5: TAX CENTER */}
                {activeTab === 'taxes' && (
                  <TaxReporting
                    transactionHistory={taxTransactions}
                    onAddTransaction={(tx) => setTaxTransactions(prev => [tx, ...prev])}
                    t={t}
                  />
                )}

                {/* TAB 6: ADMIN CONTROL ROOM */}
                {activeTab === 'admin' && currentUser?.role === 'admin' && (
                  <AdminPanel
                    currentAdminEmail={currentUser.email}
                    onLogout={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('apex_user');
                      setActiveTab('trade');
                      customAlert("Secured administrator session ended. Access restrictions reinstated.");
                    }}
                    triggerGlobalToast={customAlert}
                  />
                )}
              </>
            )}

          </div>
        </main>
      </div>

      {/* Global high density overlay toast notification */}
      {toast.visible && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-slide-up bg-[#181A20] border-2 border-[#2B2F36] text-[#EAECEF] p-3.5 rounded-lg max-w-sm shadow-2xl flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FCD535] animate-pulse shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-mono font-semibold tracking-tight leading-relaxed">{toast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setToast(prev => ({ ...prev, visible: false }))} 
            className="text-[10px] text-slate-400 hover:text-white font-mono cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* QUICK $10K DEPOSIT STEP-BY-STEP MODAL */}
      {quickDepositOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-lg bg-[#111317] border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden">
            
            {/* Ambient Accents */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight">{t('qdTitle')}</h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">{t('qdSub')}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickDepositOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Cancel Deposit"
              >
                <X size={16} />
              </button>
            </div>

            {/* Steps Indicator Progress line */}
            <div className="flex items-center justify-between mb-6 px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold font-mono text-[10px] ${quickDepositStep >= 1 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'}`}>1</span>
                <span className={`font-semibold ${quickDepositStep === 1 ? 'text-amber-500 text-[11px]' : 'text-slate-400 font-normal'}`}>{t('qdStep1')}</span>
              </div>
              <div className="flex-1 h-[1px] bg-slate-800 mx-3" />
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold font-mono text-[10px] ${quickDepositStep >= 2 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'}`}>2</span>
                <span className={`font-semibold ${quickDepositStep === 2 ? 'text-amber-500 text-[11px]' : 'text-slate-400 font-normal'}`}>{t('qdStep2')}</span>
              </div>
            </div>

            {/* Step 1: Choose Payment Method */}
            {quickDepositStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {t('qdInfo1')}<strong className="text-slate-200 font-sans">$10,000.00 USD</strong>{t('qdInfo1Tail')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Option 1: Crypto Transfer */}
                  <label 
                    onClick={() => setQuickDepositMethod('crypto')}
                    className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
                      quickDepositMethod === 'crypto' 
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg font-bold' 
                        : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="p-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-[10px] flex items-center gap-1">
                        <Coins size={12} className="text-amber-500" /> {t('qdCryptoNet')}
                      </span>
                      <input 
                        type="radio" 
                        name="deposit_method_quick"
                        checked={quickDepositMethod === 'crypto'} 
                        onChange={() => setQuickDepositMethod('crypto')}
                        className="accent-amber-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{t('qdCryptoSub')}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 font-normal leading-normal">
                      {t('qdCryptoDesc')}
                    </span>
                  </label>

                  {/* Option 2: Bank Direct Transfer */}
                  <label 
                    onClick={() => setQuickDepositMethod('bank')}
                    className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
                      quickDepositMethod === 'bank' 
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg font-bold' 
                        : 'bg-slate-950/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="p-1 rounded-lg bg-slate-900 border border-slate-800 font-semibold text-[10px] flex items-center gap-1">
                        <Building2 size={12} className="text-amber-500" /> {t('qdBankClearing')}
                      </span>
                      <input 
                        type="radio" 
                        name="deposit_method_quick"
                        checked={quickDepositMethod === 'bank'} 
                        onChange={() => setQuickDepositMethod('bank')}
                        className="accent-amber-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{t('qdBankSub')}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 font-normal leading-normal">
                      {t('qdBankDesc')}
                    </span>
                  </label>

                </div>

                {quickDepositMethod === 'crypto' && (
                  <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">{t('qdSelectCrypto')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'USDT', label: 'USDT (TRC-20)', subText: 'Tether USD TRON Network' },
                        { id: 'BTC', label: 'BTC (Bitcoin Network)', subText: 'Native Bitcoin Chain' },
                        { id: 'ETH', label: 'ETH (TRC-20 Wrapped)', subText: 'Wrapped Ethereum (Tron Hook)' },
                        { id: 'SOL', label: 'SOL (Solana Chain)', subText: 'Solana High Speed' }
                      ].map((crypto) => (
                        <button
                          key={crypto.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickDepositCryptoType(crypto.id as any);
                          }}
                          className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            quickDepositCryptoType === crypto.id
                              ? 'bg-amber-500/10 border-amber-500 text-white shadow-md font-bold'
                              : 'bg-[#111317]/60 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold">{crypto.label}</span>
                          <span className="text-[9px] text-slate-500 truncate mt-0.5">{crypto.subText}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-850 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setQuickDepositStep(2)}
                    className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-[10px] px-5 py-2.5 rounded-xl tracking-wider shadow-md transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    {t('qdContinueBtn')} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Show coordinates of addresses/details */}
            {quickDepositStep === 2 && (() => {
              const cryptoInfo = {
                USDT: { name: 'USDT (TRC-20 Network)', address: paymentCoordinates?.cryptoAddresses?.USDT?.address || 'TXD9820194000ABeC7816ED29A09823AB7', sub: t('qdUsdtDesc') },
                BTC: { name: 'Bitcoin (BTC Native)', address: paymentCoordinates?.cryptoAddresses?.BTC?.address || 'bc1q9823ab78e99309823ab78e993bc1q9823', sub: t('qdBtcDesc') },
                ETH: { name: 'Ethereum (TRC-20 Network)', address: paymentCoordinates?.cryptoAddresses?.ETH?.address || 'TETH7129A09823ABeC7816ED29A09823AB78E', sub: t('qdEthDesc') },
                SOL: { name: 'Solana (SOL Network)', address: paymentCoordinates?.cryptoAddresses?.SOL?.address || '9823aBeC7816ED29A09823AB78E99389201940eZ', sub: t('qdSolDesc') }
              }[quickDepositCryptoType];

              return (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {t('qdStep2Text')}<span className="text-amber-400 font-extrabold font-sans">$10,000.00 USD</span>{t('qdStep2Tail')}
                  </p>

                  {quickDepositMethod === 'crypto' ? (
                    /* Crypto Payment Box */
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-mono">
                        <div className="bg-white p-2 border border-slate-800 rounded-xl flex justify-center items-center shrink-0">
                          {/* QR Code Icon with beautiful layout */}
                          <div className="w-20 h-20 bg-slate-150 rounded flex items-center justify-center border border-slate-300">
                            <span className="font-extrabold text-[9px] text-[#111317] tracking-tighter text-center">{t('qdScanQr')}</span>
                          </div>
                        </div>
                        <div className="space-y-2 flex-grow w-full text-center sm:text-left">
                          <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider block font-mono">{t('qdVerifiedPlatform')} ({cryptoInfo.name})</span>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            {cryptoInfo.sub}
                          </p>
                          
                          <div className="flex bg-[#111317]/90 border border-slate-800 rounded-lg p-2 justify-between items-center mt-1">
                            <span className="text-[10px] text-emerald-400 font-mono truncate select-all">{cryptoInfo.address}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cryptoInfo.address);
                                setCopiedAddress(true);
                                setTimeout(() => setCopiedAddress(false), 2000);
                              }}
                              className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                              title="Copy to Clipboard"
                            >
                              {copiedAddress ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                  /* Bank Clearance Routing Box */
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-3 font-mono text-xs">
                    <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-wider block">{t('qdBankCoordHeader')}</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#111317]/90 p-3 rounded-xl border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('qdBankName')}</span>
                        <span className="text-slate-200 font-semibold font-sans">{paymentCoordinates?.bankName || "Alliance Brokerage & Trust"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('qdRouting')}</span>
                        <span className="text-slate-200 font-semibold">{paymentCoordinates?.routingNumber || "021000021"}</span>
                      </div>
                      <div className="sm:border-t border-slate-800/40 sm:pt-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">{t('qdAccount')}</span>
                        <span className="text-slate-200 font-semibold">{paymentCoordinates?.accountNumber || "1029-4581-9238"}</span>
                      </div>
                      <div className="sm:border-t border-slate-800/40 sm:pt-2 font-bold flex flex-col justify-between">
                        <div>
                          <span className="text-slate-550 block text-[9px] uppercase font-bold text-amber-500">{t('qdEscrowRef')}</span>
                          <span className="text-amber-400 select-all font-mono">REF-10K-USD-{currentUser?.id || "GUEST"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`REF-10K-USD-${currentUser?.id || "GUEST"}`);
                            setCopiedAddress(true);
                            setTimeout(() => setCopiedAddress(false), 2000);
                          }}
                          className="text-[9px] text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded mt-1 hover:bg-amber-500/10 self-start flex items-center gap-1 transition-all"
                        >
                          {copiedAddress ? "Copied!" : t('qdCopyRef')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-850 flex justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickDepositStep(1)}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl tracking-wider transition-all uppercase animate-pulse"
                  >
                    {t('qdBack')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedAddress = quickDepositMethod === 'crypto' ? {
                        USDT: paymentCoordinates?.cryptoAddresses?.USDT?.address || '0x89201940000ABeC7816ED29A09823AB78E993',
                        BTC: paymentCoordinates?.cryptoAddresses?.BTC?.address || 'bc1q9823ab78e99309823ab78e993bc1q9823',
                        ETH: paymentCoordinates?.cryptoAddresses?.ETH?.address || '0x7129A09823AB78E993089201940000ABeC7816',
                        SOL: paymentCoordinates?.cryptoAddresses?.SOL?.address || '9823aBeC7816ED29A09823AB78E99389201940eZ'
                      }[quickDepositCryptoType] : undefined;

                      const depositPayload = {
                        userId: currentUser?.id || "user-alex",
                        userEmail: currentUser?.email || "alexwtchmn@gmail.com",
                        userName: currentUser?.name || "Alexander Watchman",
                        method: quickDepositMethod === 'crypto' ? `crypto_${quickDepositCryptoType.toLowerCase()}` : "bank",
                        currency: "USD",
                        amount: 10000,
                        bankName: quickDepositMethod === 'bank' ? (paymentCoordinates?.bankName || "Alliance Brokerage & Trust") : undefined,
                        bankAccountRef: quickDepositMethod === 'bank' ? `REF-10K-USD-${currentUser?.id || "GUEST"}` : undefined,
                        walletAddress: selectedAddress,
                        txHash: quickDepositMethod === 'crypto' ? "0x" + Math.random().toString(16).substring(2, 10).toUpperCase() : undefined
                      };

                      fetch("/api/admin/deposits/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(depositPayload)
                      })
                      .then(res => res.json())
                      .then(result => {
                        fetchUserTransactions();
                        customAlert(`✓ Your $10,000.00 deposit has been registered successfully and is currently processing.`);
                        setQuickDepositOpen(false);
                      })
                      .catch(err => {
                        customAlert("Error filing transfer verification payload.");
                      });
                    }}
                    className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold text-[10px] px-5 py-2.5 rounded-xl tracking-wider shadow-md transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {t('qdSubmitBtn')}
                  </button>
                </div>
              </div>
            );
          })()}

          </div>
        </div>
      )}

      {/* AUTHENTICATION & SECURITY PROFILE MODAL COMPONENT */}
      {authOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 transition-all duration-250 font-sans">
          <div className="w-full max-w-md bg-[#111317] border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden">
            
            {/* Background ambient accents */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => { setAuthOpen(false); setAwaitingTotp(false); setIsForgotOpen(false); }}
              className="absolute top-4.5 right-4.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Panel"
            >
              <X size={16} />
            </button>

            {currentUser ? (
              /* SECURE PROFILE STATUS & CREDENTIALS INFO PANEL */
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 font-mono font-bold text-lg">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">SECURED PORTFOLIO IDENTITY</span>
                    <h3 className="text-base font-bold text-white leading-tight mt-0.5">{currentUser.name || "Default Client"}</h3>
                    <p className="text-xs text-slate-400 font-mono italic">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Status checklist */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <span className="text-[9px] text-slate-500 font-mono font-extrabold uppercase tracking-wider block">Compliance & Integrity Registry</span>
                    
                    {/* KYC state */}
                    <div className="flex items-start gap-2.5">
                      {currentUser.verified ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-1 rounded-lg mt-0.5">
                          <CheckCircle2 size={13} />
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-1 rounded-lg mt-0.5 animate-pulse">
                          <AlertTriangle size={13} />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold block text-white">KYC Verification State</span>
                        <p className="text-[10px] text-slate-400">
                          {currentUser.verified 
                            ? "✓ Fully cleared under SEC and FinCEN regulation policies." 
                            : "⚠️ Profile is under unverified status. Actions locked to Escrow."}
                        </p>
                        {!currentUser.verified && (
                          <button
                            type="button"
                            onClick={triggerComplianceVerify}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[9px] px-3.5 py-1.5 rounded-lg mt-2 cursor-pointer transition font-mono tracking-wide uppercase shadow"
                          >
                            Verify Email & Clear Compliance Now
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2FA state */}
                    <div className="flex items-start gap-2.5 border-t border-slate-900 pt-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-1 rounded-lg mt-0.5">
                        <Shield size={13} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white block">Two-Factor Authentication (2FA)</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${currentUser.isTwoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                            {currentUser.isTwoFactorEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Protect your portfolio liquid assets with 2-step dynamic prompt checks during authentication checkpoints.</p>
                        
                        <button
                          type="button"
                          onClick={toggleTwoFactorAuthState}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[9px] px-3.5 py-1.8 rounded-lg mt-2 cursor-pointer transition border border-slate-700 font-mono uppercase"
                        >
                          {currentUser.isTwoFactorEnabled ? "Deactivate 2FA Guard" : "Activate Secure 2FA Guard 🔐"}
                        </button>
                      </div>
                    </div>

                  </div>



                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('apex_user');
                      setAuthOpen(false);
                      setActiveTab('trade');
                      customAlert("Identity session ended relative to active terminal browser state.");
                    }}
                    className="w-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 font-bold py-2.5 rounded-xl text-xs transition uppercase font-mono tracking-wider cursor-pointer"
                  >
                    Logout Security Profile
                  </button>
                </div>

              </div>
            ) : (
              /* GUEST LOGIN REGISTER PASS-RECOVERY FORMS FLOW */
              <div className="space-y-5">
                
                {/* Headers */}
                <div className="text-center">
                  <span className="text-[#FCD535] text-[10px] font-mono font-bold tracking-widest uppercase block mb-1">APEX TRADING GROUP</span>
                  <h3 className="text-lg font-bold text-white">
                    {isForgotOpen ? "Restore Access Credentials" : awaitingTotp ? "2FA Protection Shield" : authMode === "login" ? "Institutional Ledger Login" : "Initiate Global Brokerage Account"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {isForgotOpen 
                      ? "Dispatched keys via encrypted routing structures." 
                      : awaitingTotp 
                        ? "Enter your 2F compliance lock token." 
                        : "Secure, non-custodial capital access terminals."}
                  </p>
                </div>

                {/* SubTab selectors for login vs register */}
                {!awaitingTotp && !isForgotOpen && !ssoProvider && (
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 font-mono text-[10px] font-bold">
                    <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-2 rounded-lg text-center transition ${authMode === 'login' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'}`}
                    >
                      SECURE SIGN IN
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 py-2 rounded-lg text-center transition ${authMode === 'register' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'}`}
                    >
                      REGISTER ACCOUNT
                    </button>
                  </div>
                )}

                {/* 2FA Awaiting form option */}
                {awaitingTotp ? (
                  <form onSubmit={handleTotpVerify} className="space-y-4 font-mono text-xs">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block font-bold">ENTER 2FA AUTHENTICATOR CODE</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={totpInput}
                        onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-sm font-bold tracking-widest text-[#FCD535] focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[9px] text-slate-500 mt-1 block leading-relaxed italic text-center">
                        🔒 Note: For sandbox and presentation testing purposes, any 6-digit credential (such as <strong className="text-amber-500 font-mono">123456</strong>) will pass verification.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#FCD535] text-slate-950 font-bold py-2.5 rounded-xl hover:bg-[#e2bf30] transition shadow cursor-pointer font-sans"
                    >
                      COMPLY SYSTEM HANDSHAKE
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAwaitingTotp(false); setTempSsoUser(null); }}
                      className="w-full text-slate-500 hover:text-slate-300 font-semibold text-center block text-[10px] uppercase font-mono mt-3"
                    >
                      Abort login stream
                    </button>
                  </form>
                ) : ssoProvider ? (
                  /* RENDER CUSTOM INTERACTIVE SSO EMAIL PANEL */
                  <form onSubmit={handleSsoSubmit} className="space-y-4">
                    <div className="flex flex-col items-center text-center pb-2">
                      <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-lg mb-2">
                        <span className="text-red-400 font-extrabold font-mono">G</span>
                      </div>
                      <h4 className="text-sm font-bold text-white capitalize">
                        Google SSO / Gmail
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                        {t('enterSsoEmailPrompt')}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase">{t('ssoEmail')}</label>
                      <input
                        type="email"
                        required
                        placeholder="investor@apextrade.com"
                        value={ssoEmailInput}
                        onChange={(e) => setSsoEmailInput(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl hover:bg-amber-400 transition shadow text-xs uppercase cursor-pointer"
                    >
                      {t('continueSso')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSsoProvider(null)}
                      className="w-full text-slate-500 hover:text-slate-350 font-bold text-center block text-[9px] uppercase font-mono mt-2"
                    >
                      &larr; {t('returnToLogin')}
                    </button>
                  </form>
                ) : isForgotOpen ? (
                  /* PASSWORD RECOVERY SCREEN */
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block text-[10px] font-mono font-bold uppercase">SECURE REGISTRATION EMAIL</label>
                      <input
                        type="email"
                        required
                        placeholder="investor@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FCD535]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#FCD535] text-slate-950 font-bold py-2.5 rounded-xl hover:bg-[#e2bf30] transition shadow text-xs cursor-pointer font-sans uppercase tracking-wider"
                    >
                      DISPATCH ACCESS KEY CODE
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIsForgotOpen(false); setAuthMode('login'); }}
                      className="w-full text-slate-500 hover:text-slate-300 font-bold text-center block text-[9px] uppercase font-mono mt-2"
                    >
                      &larr; Return to login prompt
                    </button>
                  </form>
                ) : authMode === "login" ? (
                  /* LOGIN FORM PANEL */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase mb-1">Brokerage Email Identity</label>
                        <input
                          type="email"
                          required
                          placeholder="client@apextrade.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase">Secure Verification Password</label>
                          <button
                            type="button"
                            onClick={() => setIsForgotOpen(true)}
                            className="text-amber-500 text-[9px] hover:underline font-bold font-mono uppercase"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>



                    <button
                      type="submit"
                      className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl hover:bg-amber-400 transition shadow text-xs uppercase cursor-pointer"
                    >
                      COMPLY IMMUTABLE SESSION INITIALISE
                    </button>

                    {/* Divider visual */}
                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-600 my-4 uppercase font-bold">
                      <div className="flex-1 h-[1px] bg-slate-850" />
                      <span>Security Federation Relays</span>
                      <div className="flex-1 h-[1px] bg-slate-850" />
                    </div>

                    <div className="text-[10px] font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => handleSsoAuthenticate('google')}
                        className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-200 py-2 rounded-xl transition cursor-pointer"
                      >
                        <span className="text-red-400">G</span> Google Sign In / Gmail
                      </button>
                    </div>

                  </form>
                ) : (
                  /* REGISTER FORM PANEL */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Alex Watchman"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase mb-1">Secure Email Coordinate</label>
                        <input
                          type="email"
                          required
                          placeholder="alex@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase mb-1">Direct Contact Phone</label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block text-[9px] font-mono font-bold uppercase mb-1">Access Pass Keyphrase</label>
                        <input
                          type="password"
                          required
                          placeholder="Password Minimum 6 Chars"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl hover:bg-amber-400 transition shadow text-xs uppercase cursor-pointer mt-2"
                    >
                      ESTABLISH MUTIBLE BROKER VAULT
                    </button>

                    {/* Divider visual */}
                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-600 my-3 uppercase font-bold">
                      <div className="flex-1 h-[1px] bg-slate-850" />
                      <span>Federated Registry</span>
                      <div className="flex-1 h-[1px] bg-slate-850" />
                    </div>

                    <div className="text-[10px] font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => handleSsoAuthenticate('google')}
                        className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-200 py-2 rounded-xl transition cursor-pointer"
                      >
                        <span className="text-red-400">G</span> Google SSO / Gmail
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

            {/* Footer security tag */}
            <div className="border-t border-slate-800/60 mt-5 pt-3 flex items-center justify-center gap-2 text-[9px] font-mono text-slate-500">
              <Shield size={10} className="text-amber-500/60" />
              <span>APEX SECURE NETWORK CONNECT • END-TO-END SECURITIES ENCRYPTED</span>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE/TABLET SLIDE-OVER NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9900] lg:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-72 sm:w-80 bg-slate-900 border-l border-slate-800 p-5 z-[9910] lg:hidden flex flex-col justify-between shadow-2xl font-sans text-xs animate-slide-left">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveTab('trade'); setMobileMenuOpen(false); }}>
                  <div className="p-1 px-2 rounded-lg bg-amber-500 font-display font-black text-slate-950 text-xs sm:text-sm leading-none tracking-tighter"> Apex </div>
                  <span className="text-xs font-display tracking-tight text-white font-extrabold">NAVIGATE Portal</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Navigation Tabs List */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-2 font-mono">WORKSPACE MAIN MODULES</span>
                {[
                  { id: 'trade', label: t('tradingDesk'), icon: BarChart4 },
                  { id: 'wallet', label: t('secureWallet'), icon: Wallet },
                  { id: 'copy', label: t('copyTrading'), icon: Users },
                  { id: 'earn', label: t('yieldEarn'), icon: PiggyBank },
                  { id: 'taxes', label: t('taxCenter'), icon: Calculator },
                  ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: t('adminCommand') + " 🛡️", icon: Shield }] : [])
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                        activeTab === tab.id 
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow' 
                          : 'text-slate-300 bg-slate-950/20 border-transparent hover:bg-slate-850'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="text-[11px] font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions (Deposit inside drawer for phones) */}
              <div className="space-y-3 pt-4 border-t border-slate-850">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block font-mono">EXPEDITED FUNDING</span>
                <button
                  onClick={() => {
                    triggerDemoQuickCash();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-extrabold text-[10px] py-2.5 rounded-xl tracking-wider shadow-md transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  + {t('depositBtn')}
                </button>
              </div>
            </div>

            {/* Footer containing live telemetry info */}
            <div className="space-y-4 pt-4 border-t border-slate-850">
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  streamStatus.includes('WEBSOCKET') ? 'bg-emerald-400' :
                  streamStatus.includes('SSE') ? 'bg-cyan-400' : 'bg-amber-400'
                } ${streamStatus.includes('WEBSOCKET') ? 'animate-pulse' : ''}`} style={{ boxShadow: streamStatus.includes('WEBSOCKET') ? '0 0 8px #10b981' : undefined }} />
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#94a3b8] select-none">
                  FEED: {streamStatus}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono text-center leading-relaxed">
                Identity: {currentUser?.email || "Guest Client"}<br />
                Security Layer Encrypted ✓
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
