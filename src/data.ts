/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, LeadTrader, StakingProduct, TaxTransaction } from './types';

export const INITIAL_ASSETS: Asset[] = [
  // CRYPTO
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    category: 'crypto',
    price: 68420.50,
    change24h: 3.42,
    high24h: 69100.00,
    low24h: 66120.00,
    volume24h: 28450123500,
    marketCap: 1340120190400,
    description: 'Bitcoin is the original decentralized digital currency, introduced in 2009 by the pseudonymous creator Satoshi Nakamoto. It uses Proof of Work consensus.',
    sentimentScore: 78,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 75,
    communityPollBullish: 82,
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    category: 'crypto',
    price: 3480.20,
    change24h: -1.24,
    high24h: 3560.50,
    low24h: 3410.00,
    volume24h: 15120440000,
    marketCap: 418240500100,
    description: 'Ethereum is a decentralized, smart-contract platform. It is the birthplace of DeFi, NFT markets, and utilizes Proof of Stake validation.',
    sentimentScore: 54,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 58,
    communityPollBullish: 61,
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    category: 'crypto',
    price: 182.45,
    change24h: 8.75,
    high24h: 185.00,
    low24h: 167.50,
    volume24h: 6890200000,
    marketCap: 81450200300,
    description: 'Solana is a high-performance Layer 1 blockchain known for fast block times, low transactions fees, and its unique Proof of History consensus.',
    sentimentScore: 89,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 84,
    communityPollBullish: 91,
  },
  {
    id: 'bnb',
    name: 'BNB',
    symbol: 'BNB',
    category: 'crypto',
    price: 585.10,
    change24h: 0.15,
    high24h: 591.20,
    low24h: 578.40,
    volume24h: 1450200100,
    marketCap: 89201940000,
    description: 'BNB is the native utility token of the Binance ecosystem, fueling BNB Smart Chain transactions, exchange fee discounts, and launchpad entries.',
    sentimentScore: 62,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 60,
    communityPollBullish: 64,
  },
  
  // STOCKS
  {
    id: 'aapl',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    category: 'stock',
    price: 189.84,
    change24h: 1.12,
    high24h: 191.05,
    low24h: 188.20,
    volume24h: 124508000,
    marketCap: 2980120400000,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and sells a variety of related services.',
    sentimentScore: 68,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 65,
    communityPollBullish: 72,
  },
  {
    id: 'tsla',
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    category: 'stock',
    price: 174.60,
    change24h: -4.38,
    high24h: 181.20,
    low24h: 172.50,
    volume24h: 210540000,
    marketCap: 556012000000,
    description: 'Tesla, Inc. designs, develops, manufactures, sells, and leases fully electric vehicles, energy generation systems, and storage hardware.',
    sentimentScore: 28,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 30,
    communityPollBullish: 35,
  },
  {
    id: 'nvda',
    name: 'NVIDIA Corp.',
    symbol: 'NVDA',
    category: 'stock',
    price: 945.30,
    change24h: 6.91,
    high24h: 955.00,
    low24h: 885.10,
    volume24h: 420120000,
    marketCap: 2362140500000,
    description: 'NVIDIA Corporation designs graphics processing units (GPUs) for the gaming and professional markets, alongside System on a Chip units for mobile systems.',
    sentimentScore: 94,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 90,
    communityPollBullish: 95,
  },
  {
    id: 'msft',
    name: 'Microsoft Corp.',
    symbol: 'MSFT',
    category: 'stock',
    price: 421.90,
    change24h: 0.45,
    high24h: 424.30,
    low24h: 419.00,
    volume24h: 89650000,
    marketCap: 3130120100000,
    description: 'Microsoft Corporation is an American multinational technology corporation specializing in computer software, cloud solutions, and enterprise services.',
    sentimentScore: 71,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 69,
    communityPollBullish: 75,
  },
  {
    id: 'space',
    name: 'SpaceX (SPCX)',
    symbol: 'SPCX',
    category: 'stock',
    price: 135.20,
    change24h: 2.45,
    high24h: 138.00,
    low24h: 134.10,
    volume24h: 42000000,
    marketCap: 180000000,
    description: 'SpaceX ETF (SPCX) tracks space development, satellite systems, and rocket booster exploration companies, capturing the growth of the private and public space economy.',
    sentimentScore: 92,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 88,
    communityPollBullish: 94
  },
  {
    id: 'openai',
    name: 'OpenAI (Pre-IPO)',
    symbol: 'OPENAI',
    category: 'stock',
    price: 154.50,
    change24h: 4.85,
    high24h: 158.00,
    low24h: 151.20,
    volume24h: 62000000,
    marketCap: 150000000000,
    description: 'OpenAI is an AI research and deployment company known for pioneering ChatGPT, Sora, and leading frontier artificial intelligence systems.',
    sentimentScore: 95,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 92,
    communityPollBullish: 96,
    isPreIpo: true,
    expectedListingPrice: 210.00
  },
  {
    id: 'strip',
    name: 'Stripe Inc. (Pre-IPO)',
    symbol: 'STRIP',
    category: 'stock',
    price: 28.40,
    change24h: -1.02,
    high24h: 29.10,
    low24h: 28.00,
    volume24h: 18000000,
    marketCap: 65000000000,
    description: 'Stripe is an Irish-American financial services and software as a service company. It provides payment processing software and application programming interfaces for e-commerce websites.',
    sentimentScore: 78,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 75,
    communityPollBullish: 80,
    isPreIpo: true,
    expectedListingPrice: 38.50
  },

  // COMMODITIES
  {
    id: 'xau',
    name: 'Gold Spot',
    symbol: 'XAU',
    category: 'commodity',
    price: 2420.45,
    change24h: 0.84,
    high24h: 2435.00,
    low24h: 2398.50,
    volume24h: 18450000000,
    marketCap: 15402000000000,
    description: 'Gold spot contracts represent the current market price of one troy ounce of stable physical gold, a classic safe haven element during inflation.',
    sentimentScore: 82,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 80,
    communityPollBullish: 85,
  },
  {
    id: 'xag',
    name: 'Silver Spot',
    symbol: 'XAG',
    category: 'commodity',
    price: 30.85,
    change24h: 2.15,
    high24h: 31.40,
    low24h: 29.98,
    volume24h: 4120000000,
    marketCap: 1420120000000,
    description: 'Silver spot contracts track the spot standard valuation of industrial and precious silver. Silver undergoes high industrial manufacturing usage.',
    sentimentScore: 75,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 72,
    communityPollBullish: 79,
  },
  {
    id: 'crude-oil',
    name: 'Crude Oil WTI',
    symbol: 'WTI',
    category: 'commodity',
    price: 78.42,
    change24h: -1.82,
    high24h: 80.10,
    low24h: 77.85,
    volume24h: 9150000000,
    marketCap: 2150000000000,
    description: 'West Texas Intermediate (WTI) is a high-quality light sweet crude oil serving as an international pricing benchmark for energy futures trades.',
    sentimentScore: 38,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 35,
    communityPollBullish: 41,
  }
];

export const INITIAL_LEAD_TRADERS: LeadTrader[] = [
  {
    id: 'lead-1',
    name: 'CryptoSamurai',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    roi: 184.22,
    winRate: 91.4,
    aum: 12450800,
    followersCount: 1845,
    riskScore: 6,
    profileBio: 'Specialist in SOL & high-cap crypto swing trading. Risk sizing is key. Join the squad for steady high-compounded long-term gains.',
    monthlyPnlChart: [
      { day: 1, pnl: 0 }, { day: 5, pnl: 12 }, { day: 10, pnl: 8 }, 
      { day: 15, pnl: 24 }, { day: 20, pnl: 45 }, { day: 25, pnl: 32 }, { day: 30, pnl: 58 }
    ],
    recentTrades: [
      { symbol: 'SOL', side: 'BUY', price: 172.10, amount: 250, timestamp: '12 mins ago', profitPercent: 6.01 },
      { symbol: 'BTC', side: 'SELL', price: 68120.00, amount: 1.4, timestamp: '1 hr ago', profitPercent: 3.12 },
      { symbol: 'ETH', side: 'BUY', price: 3415.50, amount: 12, timestamp: '4 hrs ago', profitPercent: -0.42 }
    ],
    isCopied: false
  },
  {
    id: 'lead-2',
    name: 'AlphaWhale_Capital',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    roi: 124.75,
    winRate: 85.2,
    aum: 48910200,
    followersCount: 3912,
    riskScore: 3,
    profileBio: 'Deep systemic algorithmic analyst focusing on Stock/Crypto cross-pair arbitrages. 100% disciplined, zero émotion, tight stop losses.',
    monthlyPnlChart: [
      { day: 1, pnl: 0 }, { day: 5, pnl: 4 }, { day: 10, pnl: 10 }, 
      { day: 15, pnl: 15 }, { day: 20, pnl: 18 }, { day: 25, pnl: 22 }, { day: 30, pnl: 28 }
    ],
    recentTrades: [
      { symbol: 'NVDA', side: 'BUY', price: 921.40, amount: 120, timestamp: '34 mins ago', profitPercent: 2.59 },
      { symbol: 'AAPL', side: 'BUY', price: 187.90, amount: 500, timestamp: '2 hrs ago', profitPercent: 1.03 },
      { symbol: 'MSFT', side: 'SELL', price: 422.10, amount: 300, timestamp: '8 hrs ago', profitPercent: 0.88 }
    ],
    isCopied: false
  },
  {
    id: 'lead-3',
    name: 'CommodityGoldKing',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=200&auto=format&fit=crop',
    roi: 94.10,
    winRate: 89.1,
    aum: 8120500,
    followersCount: 942,
    riskScore: 4,
    profileBio: 'Focusing strictly on Gold (XAU), Silver (XAG), & Oil (WTI) macro cycles. Hedging through global volatility. Built for solid inflation-busting returns.',
    monthlyPnlChart: [
      { day: 1, pnl: 0 }, { day: 5, pnl: -2 }, { day: 10, pnl: 5 }, 
      { day: 15, pnl: 8 }, { day: 20, pnl: 14 }, { day: 25, pnl: 19 }, { day: 30, pnl: 22 }
    ],
    recentTrades: [
      { symbol: 'XAU', side: 'BUY', price: 2410.50, amount: 40, timestamp: '50 mins ago', profitPercent: 0.41 },
      { symbol: 'WTI', side: 'SELL', price: 79.10, amount: 800, timestamp: '3 hrs ago', profitPercent: 1.62 },
      { symbol: 'XAG', side: 'BUY', price: 30.12, amount: 1500, timestamp: '1 day ago', profitPercent: 2.42 }
    ],
    isCopied: false
  }
];

export const INITIAL_STAKING_PRODUCTS: StakingProduct[] = [
  {
    id: 'stake-btc',
    symbol: 'BTC',
    name: 'Bitcoin Flexible Saver',
    apy: 3.5,
    termDays: 0,
    minAmount: 0.001,
    category: 'savings',
    description: 'Grow your holdings daily with no lock-up restrictions. Deposit and withdraw instantly.',
    subscribedAmount: 0,
    accruedInterest: 0,
  },
  {
    id: 'stake-eth-locked',
    symbol: 'ETH',
    name: 'Ethereum 60-Day Lock-up',
    apy: 6.8,
    termDays: 60,
    minAmount: 0.05,
    category: 'staking',
    description: 'Support network validator operations inside Ethereum’s proof-of-stake mechanism with premium rewards.',
    subscribedAmount: 0,
    accruedInterest: 0,
  },
  {
    id: 'stake-sol-premium',
    symbol: 'SOL',
    name: 'Solana High-Yield 90D',
    apy: 12.4,
    termDays: 90,
    minAmount: 0.5,
    category: 'staking',
    description: 'Liquid staking derivatives with maximum optimized validation yields. Earn top tier interest.',
    subscribedAmount: 0,
    accruedInterest: 0,
  },
  {
    id: 'stake-sol-dual',
    symbol: 'SOL',
    name: 'Dual Investment: SOL Buy Low',
    apy: 38.5,
    termDays: 7,
    minAmount: 1.0,
    category: 'dual_investment',
    description: 'Get high yields regardless of asset direction. Buy SOL at a lower target price and earn APY.',
    subscribedAmount: 0,
    accruedInterest: 0,
  },
  {
    id: 'stake-gold-savings',
    symbol: 'XAU',
    name: 'Gold Stable Savings Rate',
    apy: 4.8,
    termDays: 120,
    minAmount: 0.1,
    category: 'savings',
    description: 'A dedicated savings vehicle allowing physical-backed gold spot exposure to earn yield.',
    subscribedAmount: 0,
    accruedInterest: 0,
  }
];

export const INITIAL_TAX_TRANSACTIONS: TaxTransaction[] = [
  {
    id: 'tx-1',
    timestamp: '2026-01-15T14:30:22Z',
    type: 'BUY',
    symbol: 'BTC',
    category: 'crypto',
    quantity: 0.25,
    priceUSD: 42000.00,
    feeUSD: 21.00
  },
  {
    id: 'tx-2',
    timestamp: '2026-03-10T09:15:00Z',
    type: 'BUY',
    symbol: 'SOL',
    category: 'crypto',
    quantity: 15.0,
    priceUSD: 120.00,
    feeUSD: 1.80
  },
  {
    id: 'tx-3',
    timestamp: '2026-04-02T16:45:10Z',
    type: 'SELL',
    symbol: 'BTC',
    category: 'crypto',
    quantity: 0.10,
    priceUSD: 64000.00,
    feeUSD: 32.00,
    proceedsUSD: 6400.00,
    costBasisUSD: 4200.00,
    capitalGainUSD: 2168.00 // 6400 - 4200 - 32
  },
  {
    id: 'tx-4',
    timestamp: '2026-04-18T11:22:04Z',
    type: 'BUY',
    symbol: 'NVDA',
    category: 'stock',
    quantity: 5.0,
    priceUSD: 780.00,
    feeUSD: 4.50
  },
  {
    id: 'tx-5',
    timestamp: '2026-05-12T13:04:45Z',
    type: 'SELL',
    symbol: 'SOL',
    category: 'crypto',
    quantity: 5.0,
    priceUSD: 180.00,
    feeUSD: 1.80,
    proceedsUSD: 900.00,
    costBasisUSD: 600.00,
    capitalGainUSD: 298.20 // 900 - 600 - 1.8
  }
];

// Generates beautiful realistic candlestick data on demand
export function generateHistoricalData(
  initialPrice: number,
  pointsCount: number = 30,
  timeframe: '1m' | '15m' | '1h' | '1D' = '1D'
) {
  const data = [];
  let currentPrice = initialPrice * 0.93; // start slightly below for upward momentum trend
  const now = new Date();
  
  for (let i = pointsCount; i >= 0; i--) {
    const pointDate = new Date(now.getTime());
    if (timeframe === '1m') {
      pointDate.setMinutes(now.getMinutes() - i);
    } else if (timeframe === '15m') {
      pointDate.setMinutes(now.getMinutes() - i * 15);
    } else if (timeframe === '1h') {
      pointDate.setHours(now.getHours() - i);
    } else {
      pointDate.setDate(now.getDate() - i);
    }

    const volatility = 0.025; // 2.5% max volatility per step
    const change = currentPrice * (Math.random() - 0.47) * volatility; // slight upward bias
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * 0.01);
    const low = Math.min(open, close) - (Math.random() * currentPrice * 0.01);
    const volume = Math.floor(100000 + Math.random() * 900000);

    const timeStr = timeframe === '1D' 
      ? pointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : pointDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

    data.push({
      time: timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: volume
    });

    currentPrice = close;
  }
  return data;
}

// Order Book Generator
export function generateOrderBook(midPrice: number) {
  const bids = [];
  const asks = [];
  let bidCumulative = 0;
  let askCumulative = 0;

  for (let i = 1; i <= 8; i++) {
    // Bids (Buy orders - below midPrice)
    const bidPrice = midPrice * (1 - (i * 0.001) - Math.random() * 0.0005);
    const bidAmount = Math.random() * 1.5 + 0.1;
    bidCumulative += bidPrice * bidAmount;
    bids.push({
      price: Number(bidPrice.toFixed(2)),
      amount: Number(bidAmount.toFixed(4)),
      total: Number(bidCumulative.toFixed(2))
    });

    // Asks (Sell orders - above midPrice)
    const askPrice = midPrice * (1 + (i * 0.001) + Math.random() * 0.0005);
    const askAmount = Math.random() * 1.5 + 0.1;
    askCumulative += askPrice * askAmount;
    asks.push({
      price: Number(askPrice.toFixed(2)),
      amount: Number(askAmount.toFixed(4)),
      total: Number(askCumulative.toFixed(2))
    });
  }

  // Bids descending, asks ascending
  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price)
  };
}
