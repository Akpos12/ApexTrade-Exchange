/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AssetCategory = 'crypto' | 'stock' | 'commodity' | 'forex' | 'index';

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  price: number;
  change24h: number; // percentage, e.g., +2.4
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  description: string;
  sentimentScore: number; // 0 (extreme fear) to 100 (extreme greed)
  sentimentLabel: string; // "Bullish", "Bearish", "Neutral"
  fearGreedIndex: number; 
  communityPollBullish: number; // e.g. 78% bullish
  isPreIpo?: boolean;
  expectedListingPrice?: number;
}

export interface HistoricalPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'TRAILING_STOP' | 'OCO';

export interface UserOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: OrderType;
  price: number;
  quantity: number;
  triggerPrice?: number;
  trailingPercent?: number;
  total: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: string;
}

export interface WalletBalance {
  symbol: string;
  name: string;
  category: AssetCategory;
  amount: number;
  locked: number; // e.g., in active staking or limit orders
  avgBuyPrice: number;
}

export interface LeadTrader {
  id: string;
  name: string;
  avatar: string;
  roi: number; // yearly ROI in %
  winRate: number; // e.g., 88.5%
  aum: number; // assets under management in USD
  followersCount: number;
  riskScore: number; // 1 to 10
  profileBio: string;
  monthlyPnlChart: { day: number; pnl: number }[];
  recentTrades: {
    symbol: string;
    side: 'BUY' | 'SELL';
    price: number;
    amount: number;
    timestamp: string;
    profitPercent: number;
  }[];
  isCopied: boolean;
  copiedBudget?: number;
}

export interface StakingProduct {
  id: string;
  symbol: string;
  name: string;
  apy: number; // e.g., 12.5%
  termDays: number; // 0 for Flexible, otherwise 30, 60, 90, 180
  minAmount: number;
  category: 'savings' | 'staking' | 'dual_investment';
  description: string;
  subscribedAmount: number; // user's subscription
  accruedInterest: number;
  lastPayoutDate?: string;
}

export type TaxCategory = 'Short-Term Capital Gains' | 'Long-Term Capital Gains' | 'Earned Interest/Income';

export interface TaxTransaction {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL' | 'STAKE_REWARD' | 'SWAP';
  symbol: string;
  category: AssetCategory;
  quantity: number;
  priceUSD: number;
  feeUSD: number;
  proceedsUSD?: number;
  costBasisUSD?: number;
  capitalGainUSD?: number;
}
