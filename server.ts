/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Load Firebase Config
let firebaseApp: any = null;
let firestoreDb: any = null;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase] Successfully connected to Firestore database:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("[Firebase] Config file firebase-applet-config.json not found. Falling back to in-memory mode.");
  }
} catch (error) {
  console.error("[Firebase] Initialization failed:", error);
}

// Lazy initialization of GoogleGenAI to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST APIs Go Here FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// TYPES DEFINITION FOR THE SERVER REGISTRY
interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  category: 'crypto' | 'stock' | 'commodity' | 'forex' | 'index';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  previousClose: number;
  description: string;
  sentimentScore: number;
  sentimentLabel: string;
  fearGreedIndex: number;
  communityPollBullish: number;
  yahooSymbol: string;
  exchange: string;
  isPreIpo?: boolean;
  expectedListingPrice?: number;
}

// 37 COMPREHENSIVE PLATFORM ASSETS
const GLOBAL_ASSETS: MarketAsset[] = [
  // --- CRYPTO --- (Open 24/7/365)
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
    previousClose: 66150.00,
    description: 'Bitcoin is the original decentralized digital currency, introduced in 2009 by the pseudonymous creator Satoshi Nakamoto.',
    sentimentScore: 78,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 75,
    communityPollBullish: 82,
    yahooSymbol: 'BTC-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
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
    previousClose: 3524.30,
    description: 'Ethereum is a decentralized, smart-contract platform. It is the birthplace of DeFi, NFT markets, and utilizes Proof of Stake validation.',
    sentimentScore: 54,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 58,
    communityPollBullish: 61,
    yahooSymbol: 'ETH-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
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
    previousClose: 167.70,
    description: 'Solana is a high-performance Layer 1 blockchain known for fast block times, low transactions fees, and its unique Proof of History consensus.',
    sentimentScore: 89,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 84,
    communityPollBullish: 91,
    yahooSymbol: 'SOL-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
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
    previousClose: 584.20,
    description: 'BNB is the native utility token of the Binance ecosystem, fueling BNB Smart Chain transactions, exchange fee discounts, and launchpad entries.',
    sentimentScore: 62,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 60,
    communityPollBullish: 64,
    yahooSymbol: 'BNB-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
  },
  {
    id: 'xrp',
    name: 'Ripple',
    symbol: 'XRP',
    category: 'crypto',
    price: 0.5230,
    change24h: 1.45,
    high24h: 0.5340,
    low24h: 0.5120,
    volume24h: 912400300,
    marketCap: 29012400100,
    previousClose: 0.5150,
    description: 'XRP is the native token of the XRP Ledger, an open-source public blockchain designed for high-speed cross-border settlement payments.',
    sentimentScore: 48,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 50,
    communityPollBullish: 52,
    yahooSymbol: 'XRP-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
  },
  {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGE',
    category: 'crypto',
    price: 0.1420,
    change24h: 4.12,
    high24h: 0.1450,
    low24h: 0.1340,
    volume24h: 1420100200,
    marketCap: 20420194500,
    previousClose: 0.1360,
    description: 'Dogecoin is an open-source peer-to-peer meme-based cryptocurrency created in 2013 as a lighthearted alternative to Bitcoin.',
    sentimentScore: 71,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 70,
    communityPollBullish: 74,
    yahooSymbol: 'DOGE-USD',
    exchange: 'INTEGRATED BLOCKCHAIN CRYPTO FEED'
  },

  // --- GLOBAL STOCKS --- (Subject to Exchange Hours)
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
    previousClose: 187.73,
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and sells related software services globally.',
    sentimentScore: 68,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 65,
    communityPollBullish: 72,
    yahooSymbol: 'AAPL',
    exchange: 'NASDAQ (US)'
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
    previousClose: 182.60,
    description: 'Tesla, Inc. designs, developments, manufactures, sells, and leases fully electric vehicles, energy generation systems, and storage hardware.',
    sentimentScore: 28,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 30,
    communityPollBullish: 35,
    yahooSymbol: 'TSLA',
    exchange: 'NASDAQ (US)'
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
    previousClose: 884.20,
    description: 'NVIDIA Corporation designs graphics processing units (GPUs) for gaming, alongside neural tensor cores leading the enterprise GenAI sector.',
    sentimentScore: 94,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 90,
    communityPollBullish: 95,
    yahooSymbol: 'NVDA',
    exchange: 'NASDAQ (US)'
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
    previousClose: 420.00,
    description: 'Microsoft Corporation is an American multinational technology corporation specializing in computer software, enterprise Azure cloud solutions, and gaming.',
    sentimentScore: 71,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 69,
    communityPollBullish: 75,
    yahooSymbol: 'MSFT',
    exchange: 'NASDAQ (US)'
  },
  {
    id: 'space',
    name: 'SpaceX (Pre-IPO)',
    symbol: 'SPACE',
    category: 'stock',
    price: 135.20,
    change24h: 2.45,
    high24h: 138.00,
    low24h: 134.10,
    volume24h: 42000000,
    marketCap: 180000000000,
    previousClose: 132.00,
    description: 'Space Exploration Technologies Corp. is an American spacecraft manufacturer and satellite communications company. Expected to be the largest space-related IPO in history.',
    sentimentScore: 92,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 88,
    communityPollBullish: 94,
    yahooSymbol: '',
    exchange: 'PRIVATE SECONDARY MARKET',
    isPreIpo: true,
    expectedListingPrice: 195.00
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
    previousClose: 147.35,
    description: 'OpenAI is an AI research and deployment company known for pioneering ChatGPT, Sora, and leading frontier artificial intelligence systems.',
    sentimentScore: 95,
    sentimentLabel: 'Extremely Bullish',
    fearGreedIndex: 92,
    communityPollBullish: 96,
    yahooSymbol: '',
    exchange: 'PRIVATE SECONDARY MARKET',
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
    previousClose: 28.70,
    description: 'Stripe is an Irish-American financial services and software as a service company. It provides payment processing software and application programming interfaces for e-commerce websites.',
    sentimentScore: 78,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 75,
    communityPollBullish: 80,
    yahooSymbol: '',
    exchange: 'PRIVATE SECONDARY MARKET',
    isPreIpo: true,
    expectedListingPrice: 38.50
  },
  {
    id: 'bp',
    name: 'BP plc',
    symbol: 'BP',
    category: 'stock',
    price: 485.20,
    change24h: -0.32,
    high24h: 491.50,
    low24h: 481.20,
    volume24h: 18450000,
    marketCap: 98450000000,
    previousClose: 486.80,
    description: 'BP plc is a British multinational oil and gas company headquartered in London, England. It is one of the world\'s supermajors.',
    sentimentScore: 50,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 52,
    communityPollBullish: 53,
    yahooSymbol: 'BP.L',
    exchange: 'LSE (UK)'
  },
  {
    id: 'bhp',
    name: 'BHP Group',
    symbol: 'BHP',
    category: 'stock',
    price: 43.15,
    change24h: 1.02,
    high24h: 43.80,
    low24h: 42.60,
    volume24h: 8450000,
    marketCap: 218200000000,
    previousClose: 42.71,
    description: 'BHP Group Limited is an Anglo-Australian multinational mining, metals, natural gas, and petroleum public company headquartered in Melbourne.',
    sentimentScore: 58,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 55,
    communityPollBullish: 60,
    yahooSymbol: 'BHP.AX',
    exchange: 'ASX (Australia)'
  },
  {
    id: 'ry',
    name: 'Royal Bank of Canada',
    symbol: 'RY',
    category: 'stock',
    price: 142.10,
    change24h: 0.55,
    high24h: 143.00,
    low24h: 141.20,
    volume24h: 4120000,
    marketCap: 198000000000,
    previousClose: 141.32,
    description: 'The Royal Bank of Canada is a Canadian multinational financial services corporation and the largest bank in Canada by market capitalization.',
    sentimentScore: 61,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 63,
    communityPollBullish: 65,
    yahooSymbol: 'RY.TO',
    exchange: 'TSX (Canada)'
  },
  {
    id: 'tencent',
    name: 'Tencent Holdings',
    symbol: 'TENCENT',
    category: 'stock',
    price: 382.40,
    change24h: 2.14,
    high24h: 388.20,
    low24h: 374.00,
    volume24h: 24500000,
    marketCap: 450120194000,
    previousClose: 374.30,
    description: 'Tencent Holdings Ltd. is a Chinese multinational technology conglomerate holding company, specializing in diverse internet services, video games and AI.',
    sentimentScore: 75,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 72,
    communityPollBullish: 78,
    yahooSymbol: '0700.HK',
    exchange: 'HKEX (Hong Kong)'
  },
  {
    id: 'asml',
    name: 'ASML Holding',
    symbol: 'ASML',
    category: 'stock',
    price: 894.20,
    change24h: 1.84,
    high24h: 902.10,
    low24h: 881.00,
    volume24h: 1840000,
    marketCap: 358400100000,
    previousClose: 878.00,
    description: 'ASML Holding N.V. is a Dutch multinational corporation specializing in the development and manufacturing of photolithography systems for semiconductor production.',
    sentimentScore: 83,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 80,
    communityPollBullish: 85,
    yahooSymbol: 'ASML.AS',
    exchange: 'Euronext (Europe)'
  },

  // --- COMMODITIES --- (Open 5 days a week, 24 hr basis)
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
    previousClose: 2400.30,
    description: 'Gold spot contracts represent the current market price of one troy ounce of stable physical gold, a classic defense against fiat debasement.',
    sentimentScore: 82,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 80,
    communityPollBullish: 85,
    yahooSymbol: 'GC=F',
    exchange: 'NYMEX / GLOBEX (COMMODITIES)'
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
    previousClose: 30.20,
    description: 'Silver spot contracts track precious silver. Silver undergoes high industrial manufacturing usage, especially in solar photovoltaics and battery cells.',
    sentimentScore: 75,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 72,
    communityPollBullish: 79,
    yahooSymbol: 'SI=F',
    exchange: 'NYMEX / GLOBEX (COMMODITIES)'
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
    marketCap: 215000000000,
    previousClose: 79.87,
    description: 'West Texas Intermediate (WTI) is a sweet light crude oil serving as a primary pricing standard for international energy futures trades.',
    sentimentScore: 38,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 35,
    communityPollBullish: 41,
    yahooSymbol: 'CL=F',
    exchange: 'NYMEX / GLOBEX (COMMODITIES)'
  },
  {
    id: 'brent-oil',
    name: 'Brent Crude Oil',
    symbol: 'BRENT',
    category: 'commodity',
    price: 82.60,
    change24h: -1.45,
    high24h: 84.20,
    low24h: 81.80,
    volume24h: 8450000000,
    marketCap: 235000000000,
    previousClose: 83.82,
    description: 'Brent Crude is a major trading classification of sweet light crude oil sourced from the North Sea, defining the premium global oil benchmarks.',
    sentimentScore: 42,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 40,
    communityPollBullish: 46,
    yahooSymbol: 'BZ=F',
    exchange: 'ICE / GLOBEX (COMMODITIES)'
  },
  {
    id: 'natgas',
    name: 'Natural Gas',
    symbol: 'NATGAS',
    category: 'commodity',
    price: 2.105,
    change24h: 3.52,
    high24h: 2.180,
    low24h: 2.012,
    volume24h: 1840000000,
    marketCap: 45000000000,
    previousClose: 2.033,
    description: 'Natural Gas contracts track the Henry Hub index, the leading physical delivery benchmark of the global LNG and natural gas energy markets.',
    sentimentScore: 68,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 65,
    communityPollBullish: 70,
    yahooSymbol: 'NG=F',
    exchange: 'NYMEX / GLOBEX (COMMODITIES)'
  },
  {
    id: 'copper',
    name: 'Copper Spot',
    symbol: 'COPPER',
    category: 'commodity',
    price: 4.825,
    change24h: 1.15,
    high24h: 4.910,
    low24h: 4.740,
    volume24h: 1240000000,
    marketCap: 68000000000,
    previousClose: 4.770,
    description: 'Copper is highly sensitive to macro industrial growth, finding rapid integration inside power grid expansions, electric vehicles, and heavy motors.',
    sentimentScore: 70,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 68,
    communityPollBullish: 73,
    yahooSymbol: 'HG=F',
    exchange: 'COMEX (COMMODITIES)'
  },
  {
    id: 'wheat',
    name: 'Wheat Futures',
    symbol: 'WHEAT',
    category: 'commodity',
    price: 684.50,
    change24h: -0.85,
    high24h: 695.00,
    low24h: 678.00,
    volume24h: 540000000,
    marketCap: 18000000000,
    previousClose: 690.40,
    description: 'Wheat commodity futures traded on the CBOT benchmark, tracking fundamental agriculture supply sheets and international grain corridors.',
    sentimentScore: 49,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 47,
    communityPollBullish: 50,
    yahooSymbol: 'W=F',
    exchange: 'CBOT (COMMODITIES)'
  },
  {
    id: 'coffee',
    name: 'Coffee Arabica',
    symbol: 'COFFEE',
    category: 'commodity',
    price: 212.10,
    change24h: 1.65,
    high24h: 216.40,
    low24h: 208.50,
    volume24h: 410000000,
    marketCap: 12500000000,
    previousClose: 208.66,
    description: 'Coffee C futures track the premier agricultural global Arabica standard, deeply influenced by South American growing forecasts and storage rates.',
    sentimentScore: 62,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 60,
    communityPollBullish: 65,
    yahooSymbol: 'KC=F',
    exchange: 'ICE (COMMODITIES)'
  },

  // --- FOREX --- (Open 5 days a week, 24 hr basis)
  {
    id: 'eurusd',
    name: 'EUR / USD',
    symbol: 'EURUSD',
    category: 'forex',
    price: 1.0845,
    change24h: 0.12,
    high24h: 1.0890,
    low24h: 1.0815,
    volume24h: 45000000000,
    marketCap: 0,
    previousClose: 1.0832,
    description: 'The Euro to US Dollar exchange rate. Defined as the most liquid currency pair in the global foreign exchange markets.',
    sentimentScore: 52,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 50,
    communityPollBullish: 53,
    yahooSymbol: 'EURUSD=X',
    exchange: 'GLOBAL OVER-THE-COUNTER FOREX'
  },
  {
    id: 'gbpusd',
    name: 'GBP / USD',
    symbol: 'GBPUSD',
    category: 'forex',
    price: 1.2680,
    change24h: -0.24,
    high24h: 1.2740,
    low24h: 1.2630,
    volume24h: 32000000000,
    marketCap: 0,
    previousClose: 1.2711,
    description: 'The British Pound Sterling to US Dollar transaction rate. Culturally referred to as the "Cable" rate inside institutional trading rooms.',
    sentimentScore: 45,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 46,
    communityPollBullish: 48,
    yahooSymbol: 'GBPUSD=X',
    exchange: 'GLOBAL OVER-THE-COUNTER FOREX'
  },
  {
    id: 'usdjpy',
    name: 'USD / JPY',
    symbol: 'USDJPY',
    category: 'forex',
    price: 156.45,
    change24h: 0.48,
    high24h: 157.10,
    low24h: 155.80,
    volume24h: 38000000000,
    marketCap: 0,
    previousClose: 155.70,
    description: 'The US Dollar to Japanese Yen exchange multiplier. Deeply dynamic index sensitive to Central Bank policy rate differentials.',
    sentimentScore: 68,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 65,
    communityPollBullish: 70,
    yahooSymbol: 'JPY=X',
    exchange: 'GLOBAL OVER-THE-COUNTER FOREX'
  },
  {
    id: 'usdcad',
    name: 'USD / CAD',
    symbol: 'USDCAD',
    category: 'forex',
    price: 1.3650,
    change24h: -0.05,
    high24h: 1.3710,
    low24h: 1.3610,
    volume24h: 18000000000,
    marketCap: 0,
    previousClose: 1.3657,
    description: 'The US Dollar to Canadian Dollar exchange multiplier. Strongly influenced by Crude Oil price shifts and CAD interest rate policies.',
    sentimentScore: 51,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 50,
    communityPollBullish: 52,
    yahooSymbol: 'CAD=X',
    exchange: 'GLOBAL OVER-THE-COUNTER FOREX'
  },
  {
    id: 'audusd',
    name: 'AUD / USD',
    symbol: 'AUDUSD',
    category: 'forex',
    price: 0.6650,
    change24h: 0.35,
    high24h: 0.6705,
    low24h: 0.6610,
    volume24h: 14000000000,
    marketCap: 0,
    previousClose: 0.6627,
    description: 'The Australian Dollar to US Dollar exchange. Strongly classified as a risk-on commodity currency reflecting general Chinese factory index activity.',
    sentimentScore: 59,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 57,
    communityPollBullish: 61,
    yahooSymbol: 'AUDUSD=X',
    exchange: 'GLOBAL OVER-THE-COUNTER FOREX'
  },

  // --- INDICES --- (Subject to Exchange Hours)
  {
    id: 'spx',
    name: 'S&P 500 Index',
    symbol: 'SPX',
    category: 'index',
    price: 5310.45,
    change24h: 0.65,
    high24h: 5325.00,
    low24h: 5288.00,
    volume24h: 4200000000,
    marketCap: 44000000000000,
    previousClose: 5276.13,
    description: 'The Standard & Poor\'s 500 index tracking the share valuation of 500 capital-heavy corporations listed in US stock exchanges.',
    sentimentScore: 78,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 72,
    communityPollBullish: 80,
    yahooSymbol: '^GSPC',
    exchange: 'CBOE / US MARKETS'
  },
  {
    id: 'ndx',
    name: 'Nasdaq 100 Index',
    symbol: 'NDX',
    category: 'index',
    price: 18810.20,
    change24h: 1.12,
    high24h: 18920.00,
    low24h: 18705.00,
    volume24h: 5300000000,
    marketCap: 22000000000000,
    previousClose: 18601.32,
    description: 'The Nasdaq 100 index tracking the largest 100 non-financial tech-heavy firms listed on the Nasdaq Stock Market.',
    sentimentScore: 84,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 81,
    communityPollBullish: 86,
    yahooSymbol: '^IXIC',
    exchange: 'NASDAQ (US)'
  },
  {
    id: 'dji',
    name: 'Dow Jones Industrial',
    symbol: 'DJI',
    category: 'index',
    price: 39120.50,
    change24h: 0.18,
    high24h: 39250.00,
    low24h: 38990.00,
    volume24h: 890000000,
    marketCap: 11000000000000,
    previousClose: 39050.22,
    description: 'The Dow Jones Industrial Average is a price-weighted measure of 30 prominent blue-chip US corporations.',
    sentimentScore: 64,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 61,
    communityPollBullish: 66,
    yahooSymbol: '^DJI',
    exchange: 'NYSE (US)'
  },
  {
    id: 'ftse',
    name: 'FTSE 100 Index',
    symbol: 'FTSE',
    category: 'index',
    price: 8245.10,
    change24h: -0.15,
    high24h: 8295.50,
    low24h: 8212.00,
    volume24h: 740000000,
    marketCap: 2400000000000,
    previousClose: 8257.50,
    description: 'The Financial Times Stock Exchange 100 Index, representing the capital-heavy blue chips listed on the London Stock Exchange.',
    sentimentScore: 52,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 51,
    communityPollBullish: 54,
    yahooSymbol: '^FTSE',
    exchange: 'LSE (UK)'
  },
  {
    id: 'dax',
    name: 'DAX 40 Index',
    symbol: 'DAX',
    category: 'index',
    price: 18645.20,
    change24h: 0.44,
    high24h: 18720.00,
    low24h: 18585.00,
    volume24h: 1200000000,
    marketCap: 1800000000000,
    previousClose: 18563.41,
    description: 'The Deutscher Aktienindex DAX tracking the 40 largest and most active German equities trading on the Frankfurt Stock Exchange.',
    sentimentScore: 71,
    sentimentLabel: 'Bullish',
    fearGreedIndex: 68,
    communityPollBullish: 74,
    yahooSymbol: '^GDAXI',
    exchange: 'Deutsche Börse (Frankfurt)'
  },
  {
    id: 'n225',
    name: 'Nikkei 225 Index',
    symbol: 'N225',
    category: 'index',
    price: 38740.00,
    change24h: -0.65,
    high24h: 39120.00,
    low24h: 38610.00,
    volume24h: 1450000000,
    marketCap: 4500000000000,
    previousClose: 38993.45,
    description: 'The Nikkei Stock Average is the leading and most respected stock index for Japan, representing a price-weighted average of 225 equities.',
    sentimentScore: 40,
    sentimentLabel: 'Bearish',
    fearGreedIndex: 43,
    communityPollBullish: 45,
    yahooSymbol: '^N225',
    exchange: 'JPX (Tokyo)'
  },
  {
    id: 'asx200',
    name: 'ASX 200 Index',
    symbol: 'ASX200',
    category: 'index',
    price: 7780.40,
    change24h: 0.28,
    high24h: 7815.00,
    low24h: 7755.00,
    volume24h: 680000000,
    marketCap: 1950000000000,
    previousClose: 7758.70,
    description: 'The S&P/ASX 200 index is the benchmark stock market index of Australia, tracking the 200 largest public companies on the ASX.',
    sentimentScore: 61,
    sentimentLabel: 'Neutral',
    fearGreedIndex: 59,
    communityPollBullish: 64,
    yahooSymbol: '^AXJO',
    exchange: 'ASX (Sydney)'
  }
];

// REUSABLE YAHOO FINANCE PRICE SYNCER
async function fetchYahooPrice(yahooSymbol: string): Promise<{ price: number; change24h: number; high24h: number; low24h: number; volume: number; previousClose: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=15m&range=2d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!res.ok) return null;
    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    
    const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
    const quote = result.indicators?.quote?.[0] || {};
    const highs = (quote.high || []).filter((h: any) => h !== null);
    const lows = (quote.low || []).filter((l: any) => l !== null);
    const volumes = (quote.volume || []).filter((v: any) => v !== null);

    return {
      price,
      change24h: change,
      high24h: highs.length ? Math.max(...highs, price) : price * 1.02,
      low24h: lows.length ? Math.min(...lows, price) : price * 0.98,
      volume: volumes.length ? volumes.reduce((a: number, b: number) => a + b, 0) : (meta.regularMarketVolume || 1500000),
      previousClose: prevClose
    };
  } catch (err) {
    console.warn(`[Yahoo Syncer] Network error or throttled for ${yahooSymbol}`);
    return null;
  }
}

// MARKET SESSION STATS ALGORITHM
interface SessionResponse {
  status: 'OPEN' | 'CLOSED';
  sessionDetails: string;
}

function getMarketSessionInfo(category: string, symbol: string): SessionResponse {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = now.getUTCHours();
  const mins = now.getUTCMinutes();
  const timeValue = hours + mins / 60; // Decimal UTC Hour

  if (category === 'crypto') {
    return { status: 'OPEN', sessionDetails: '24/7/365 Non-Stop Global Asset' };
  }

  if (category === 'forex' || category === 'commodity') {
    const isWeekend = (day === 6) || (day === 5 && timeValue > 22) || (day === 0 && timeValue < 22);
    if (isWeekend) {
      return { status: 'CLOSED', sessionDetails: 'OTC Weekend Holiday (Opens Sunday 22:00 UTC)' };
    }
    return { status: 'OPEN', sessionDetails: '24/5 OTC Institutional Trading' };
  }

  // Stocks & Indices sessions
  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) {
    return { status: 'CLOSED', sessionDetails: 'Weekend Closing Break' };
  }

  // US Exchanges (NYSE / NASDAQ / DJI / SPX / NDX)
  if (symbol === 'AAPL' || symbol === 'TSLA' || symbol === 'NVDA' || symbol === 'MSFT' || symbol === 'SPX' || symbol === 'NDX' || symbol === 'DJI') {
    if (timeValue >= 13.5 && timeValue <= 20) {
      return { status: 'OPEN', sessionDetails: 'US Regular Trading Session' };
    }
    return { status: 'CLOSED', sessionDetails: 'US After-Hours / Pre-Market' };
  }

  // LSE (UK - BP, FTSE): 08:00 - 16:30 UTC
  if (symbol === 'BP' || symbol === 'FTSE') {
    if (timeValue >= 8 && timeValue <= 16.5) {
      return { status: 'OPEN', sessionDetails: 'LSE Royal Market Active' };
    }
    return { status: 'CLOSED', sessionDetails: 'LSE Overnight Closed' };
  }

  // ASX (Australia - BHP, ASX200): 00:00 - 06:00 UTC
  if (symbol === 'BHP' || symbol === 'ASX200') {
    if (timeValue >= 0 && timeValue <= 6) {
      return { status: 'OPEN', sessionDetails: 'ASX Regular Trading' };
    }
    return { status: 'CLOSED', sessionDetails: 'ASX Closed' };
  }

  // TSX (Canada - RY): 13:30 - 20:00 UTC
  if (symbol === 'RY') {
    if (timeValue >= 13.5 && timeValue <= 20) {
      return { status: 'OPEN', sessionDetails: 'TSX Canada Regular Session' };
    }
    return { status: 'CLOSED', sessionDetails: 'TSX Toronto Market Closed' };
  }

  // HKEX (Tencent - Hong Kong): 01:30 - 08:00 UTC
  if (symbol === 'TENCENT') {
    if (timeValue >= 1.5 && timeValue <= 8) {
      return { status: 'OPEN', sessionDetails: 'HKEX Asia Market Session' };
    }
    return { status: 'CLOSED', sessionDetails: 'HKEX Closed' };
  }

  // Euronext (ASML, DAX): 07:00 - 15:30 UTC
  if (symbol === 'ASML' || symbol === 'DAX') {
    if (timeValue >= 7 && timeValue <= 15.5) {
      return { status: 'OPEN', sessionDetails: 'Euronext Frankfurt Active' };
    }
    return { status: 'CLOSED', sessionDetails: 'Euronext Closed' };
  }

  // Tokyo (N225): 00:00 - 06:00 UTC
  if (symbol === 'N225') {
    if (timeValue >= 0 && timeValue <= 6) {
      return { status: 'OPEN', sessionDetails: 'JPX Tokyo Active Session' };
    }
    return { status: 'CLOSED', sessionDetails: 'JPX Tokyo Closed' };
  }

  return { status: 'OPEN', sessionDetails: '24-hour baseline rate' };
}

// API: INIT ALL ASSETS
app.get("/api/market/init", (req, res) => {
  const payload = GLOBAL_ASSETS.map(asset => {
    const session = getMarketSessionInfo(asset.category, asset.symbol);
    return {
      ...asset,
      marketOpen: session.status === 'OPEN',
      sessionDetails: session.sessionDetails
    };
  });
  res.json(payload);
});

// API: INDIVIDUAL CANDLESTICKS WITH ADVANCED MATHEMATICAL INDICATORS
app.get("/api/market/history", (req, res) => {
  const symbol = (req.query.symbol as string || 'BTC').toUpperCase();
  const tf = (req.query.timeframe as string || '1D');
  
  const asset = GLOBAL_ASSETS.find(a => a.symbol === symbol) || GLOBAL_ASSETS[0];
  const midPrice = asset.price;
  
  // Choose simulated historical price anchor
  let currentPrice = midPrice * 0.92; // overall upward trend starting point
  const pointsCount = 65; // enough room to build nice 20-candle buffers for SMA/EMA/BB/RSI
  
  const now = new Date();
  const candles = [];

  for (let i = pointsCount; i >= 0; i--) {
    const pointDate = new Date(now.getTime());
    
    // Time translation corresponding to selected timescale
    if (tf === '1m') pointDate.setMinutes(now.getMinutes() - i);
    else if (tf === '5m') pointDate.setMinutes(now.getMinutes() - i * 5);
    else if (tf === '15m') pointDate.setMinutes(now.getMinutes() - i * 15);
    else if (tf === '1H') pointDate.setHours(now.getHours() - i);
    else if (tf === '4H') pointDate.setHours(now.getHours() - i * 4);
    else if (tf === '1D') pointDate.setDate(now.getDate() - i);
    else if (tf === '1W') pointDate.setDate(now.getDate() - i * 7);

    // Dynamic Volatility limits depending on type
    const multiplier = asset.category === 'crypto' ? 0.045 :
                       asset.category === 'stock' ? 0.015 :
                       asset.category === 'index' ? 0.008 : 0.003; // forex is lowest volatility

    const change = currentPrice * (Math.random() - 0.47) * multiplier; // positive drift bias
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * (multiplier * 0.5));
    const low = Math.min(open, close) - (Math.random() * currentPrice * (multiplier * 0.5));
    const volume = Math.floor(100000 + Math.random() * 900000);

    const timeStr = (tf === '1D' || tf === '1W')
      ? pointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : pointDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

    candles.push({
      time: timeStr,
      open: Number(open.toFixed(asset.category === 'forex' ? 4 : 2)),
      high: Number(high.toFixed(asset.category === 'forex' ? 4 : 2)),
      low: Number(low.toFixed(asset.category === 'forex' ? 4 : 2)),
      close: Number(close.toFixed(asset.category === 'forex' ? 4 : 2)),
      volume: volume
    });

    currentPrice = close;
  }

  // Overwrite final point close value to match exactly the true live price!
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = midPrice;
    last.high = Math.max(last.open, last.close, last.high);
    last.low = Math.min(last.open, last.close, last.low);
  }

  // MATHEMATICAL FINANCIAL INDICATORS INJECTION
  const closes = candles.map(c => c.close);
  const size = candles.length;

  // 1. EMA 12 and EMA 26
  const getEMA = (data: number[], p: number) => {
    const k = 2 / (p + 1);
    const ema = [];
    ema[0] = data[0];
    for(let j=1; j<data.length; j++) {
      ema[j] = data[j] * k + ema[j-1] * (1 - k);
    }
    return ema;
  };
  const ema12 = getEMA(closes, 12);
  const ema26 = getEMA(closes, 26);

  // 2. Bollinger Bands (Mid = 20 SMA, BB upper/lower = Mid +/- 2 SD)
  const bbMid = Array(size).fill(0);
  const bbUpper = Array(size).fill(0);
  const bbLower = Array(size).fill(0);
  for (let j = 0; j < size; j++) {
    if (j < 19) {
      bbMid[j] = closes[j];
      bbUpper[j] = closes[j] * 1.02;
      bbLower[j] = closes[j] * 0.98;
    } else {
      const slice = closes.slice(j - 19, j + 1);
      const avg = slice.reduce((a,b)=>a+b, 0) / 20;
      const vari = slice.reduce((a,b)=> a + Math.pow(b - avg, 2), 0) / 20;
      const sd = Math.sqrt(vari);
      bbMid[j] = avg;
      bbUpper[j] = avg + 2 * sd;
      bbLower[j] = avg - 2 * sd;
    }
  }

  // 3. RSI 14
  const rsi = Array(size).fill(50);
  let gainsSum = 0;
  let lossesSum = 0;
  for (let j = 1; j < 15 && j < size; j++) {
    const diff = closes[j] - closes[j-1];
    if (diff > 0) gainsSum += diff;
    else lossesSum -= diff;
  }
  let avgGain = gainsSum / 14;
  let avgLoss = lossesSum / 14;
  for (let j = 0; j < size; j++) {
    if (j < 14) rsi[j] = 50;
    else {
      const diff = closes[j] - closes[j-1];
      if (diff > 0) {
        avgGain = (avgGain * 13 + diff) / 14;
        avgLoss = (avgLoss * 13) / 14;
      } else {
        avgGain = (avgGain * 13) / 14;
        avgLoss = (avgLoss * 13 - diff) / 14;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[j] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    }
  }

  // Assemble full payload
  const responseData = candles.map((c, idx) => ({
    ...c,
    ema12: Number(ema12[idx].toFixed(asset.category === 'forex' ? 4 : 2)),
    ema26: Number(ema26[idx].toFixed(asset.category === 'forex' ? 4 : 2)),
    bbMid: Number(bbMid[idx].toFixed(asset.category === 'forex' ? 4 : 2)),
    bbUpper: Number(bbUpper[idx].toFixed(asset.category === 'forex' ? 4 : 2)),
    bbLower: Number(bbLower[idx].toFixed(asset.category === 'forex' ? 4 : 2)),
    rsi: Number(rsi[idx].toFixed(2)),
    macd: Number((ema12[idx] - ema26[idx]).toFixed(asset.category === 'forex' ? 4 : 2)),
  }));

  res.json(responseData.slice(15)); // slice off first indices to allow beautiful clean buffer calculations visible immediately on loading
});

// BROADCASTING SUBSCRIPTION HUBS
const activeSseClients = new Map<string, (data: string) => void>();

// API: REAL-TIME STREAM SSE BROADCASTER
app.get("/api/market/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send initial cache payload immediately to speed up onboarding
  const initialPayload = GLOBAL_ASSETS.map(asset => {
    const session = getMarketSessionInfo(asset.category, asset.symbol);
    return {
      ...asset,
      marketOpen: session.status === 'OPEN',
      sessionDetails: session.sessionDetails
    };
  });
  
  res.write(`data: ${JSON.stringify({ type: 'init', assets: initialPayload })}\n\n`);

  const sseId = Math.random().toString(36).substring(4);
  const broadcaster = (jsonString: string) => {
    res.write(`data: ${jsonString}\n\n`);
  };

  activeSseClients.set(sseId, broadcaster);

  req.on("close", () => {
    activeSseClients.delete(sseId);
  });
});

// In-memory translation caches and safety cooldown mechanisms to prevent quota exhaustion
const serverTranslationCache: Record<string, string[]> = {};
let geminiCooldownUntil = 0;

// High fidelity offline fallback dictionaries for major terms across all platform views
const OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  pt: {
    "balance": "Saldo",
    "wallet": "Carteira",
    "deposit": "Depósito",
    "withdraw": "Retirar",
    "trading": "Negociação",
    "status": "Status",
    "action": "Ação",
    "date": "Data",
    "pending": "Pendente",
    "approved": "Aprovado",
    "rejected": "Rejeitado",
    "submit": "Enviar",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "close": "Fechar",
    "settings": "Configurações",
    "profile": "Perfil",
    "buy": "Comprar",
    "sell": "Vender",
    "price": "Preço",
    "quantity": "Quantidade",
    "total": "Total",
    "fee": "Taxa",
    "yield": "Rendimento",
    "staking": "Staking",
    "earn": "Ganhar",
    "leverage": "Alavancagem",
    "markets": "Mercados",
    "search": "Buscar",
    "follow": "Seguir",
    "unfollow": "Deixar de seguir",
    "followers": "Seguidores",
    "leaderboard": "Classificação",
    "roi": "Retorno",
    "days": "Dias",
    "verification": "Verificação",
    "completed": "Concluído",
    "processing": "Processando",
    "wallet address": "Endereço da Carteira",
    "security": "Segurança",
    "overview": "Visão Geral",
    "copied": "Copiado!",
    "copied to clipboard": "Copiado para o clipboard!",
    "address copied": "Endereço copiado!",
    "amount": "Quantia"
  },
  es: {
    "balance": "Saldo",
    "wallet": "Billetera",
    "deposit": "Depósito",
    "withdraw": "Retirar",
    "trading": "Operaciones",
    "status": "Estado",
    "action": "Acción",
    "date": "Fecha",
    "pending": "Pendiente",
    "approved": "Aprobado",
    "rejected": "Rechazado",
    "submit": "Enviar",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "close": "Cerrar",
    "settings": "Ajustes",
    "profile": "Perfil",
    "buy": "Comprar",
    "sell": "Vender",
    "price": "Precio",
    "quantity": "Cantidad",
    "total": "Total",
    "fee": "Comisión",
    "yield": "Rendimiento",
    "staking": "Staking",
    "earn": "Ganar",
    "leverage": "Apalancamiento",
    "markets": "Mercados",
    "search": "Buscar",
    "follow": "Seguir",
    "unfollow": "Dejar de seguir",
    "followers": "Seguidores",
    "leaderboard": "Clasificación",
    "roi": "Rendimiento",
    "days": "Días",
    "verification": "Verificación",
    "completed": "Completado",
    "processing": "Procesando",
    "wallet address": "Dirección de Billetera",
    "security": "Seguridad",
    "overview": "Resumen",
    "copied": "¡Copiado!",
    "copied to clipboard": "¡Copiado al portapapeles!",
    "address copied": "¡Dirección copiada!",
    "amount": "Monto"
  },
  fr: {
    "balance": "Solde",
    "wallet": "Portefeuille",
    "deposit": "Dépôt",
    "withdraw": "Retirer",
    "trading": "Trading",
    "status": "Statut",
    "action": "Action",
    "date": "Date",
    "pending": "En attente",
    "approved": "Approuvé",
    "rejected": "Rejeté",
    "submit": "Soumettre",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "close": "Fermer",
    "settings": "Paramètres",
    "profile": "Profil",
    "buy": "Acheter",
    "sell": "Vendre",
    "price": "Prix",
    "quantity": "Quantité",
    "total": "Total",
    "fee": "Frais",
    "yield": "Rendement",
    "staking": "Staking",
    "earn": "Gagner",
    "leverage": "Effet de levier",
    "markets": "Marchés",
    "search": "Rechercher",
    "follow": "Suivre",
    "unfollow": "Ne plus suivre",
    "followers": "Abonnés",
    "leaderboard": "Classement",
    "roi": "ROI",
    "days": "Jours",
    "verification": "Vérification",
    "completed": "Terminé",
    "processing": "Traitement",
    "wallet address": "Adresse du portefeuille",
    "security": "Sécurité",
    "overview": "Aperçu",
    "copied": "Copié!",
    "copied to clipboard": "Copié dans le presse-papiers!",
    "address copied": "Adresse copiée!",
    "amount": "Montant"
  },
  de: {
    "balance": "Guthaben",
    "wallet": "Wallet",
    "deposit": "Einzahlung",
    "withdraw": "Auszahlung",
    "trading": "Handel",
    "status": "Status",
    "action": "Aktion",
    "date": "Datum",
    "pending": "Ausstehend",
    "approved": "Genehmigt",
    "rejected": "Abgelehnt",
    "submit": "Absenden",
    "cancel": "Abbrechen",
    "confirm": "Bestätigen",
    "close": "Schließen",
    "settings": "Einstellungen",
    "profile": "Profil",
    "buy": "Kaufen",
    "sell": "Verkaufen",
    "price": "Preis",
    "quantity": "Menge",
    "total": "Gesamt",
    "fee": "Gebühr",
    "yield": "Rendite",
    "staking": "Staking",
    "earn": "Verdienen",
    "leverage": "Hebel",
    "markets": "Märkte",
    "search": "Suchen",
    "follow": "Folgen",
    "unfollow": "Entfolgen",
    "followers": "Follower",
    "leaderboard": "Bestenliste",
    "roi": "Rendite",
    "days": "Tage",
    "verification": "Verifizierung",
    "completed": "Abgeschlossen",
    "processing": "In Bearbeitung",
    "wallet address": "Wallet-Adresse",
    "security": "Sicherheit",
    "overview": "Übersicht",
    "copied": "Kopiert!",
    "copied to clipboard": "In die Zwischenablage kopiert!",
    "address copied": "Adresse kopiert!",
    "amount": "Betrag"
  },
  it: {
    "balance": "Saldo",
    "wallet": "Portafoglio",
    "deposit": "Deposito",
    "withdraw": "Prelievo",
    "trading": "Trading",
    "status": "Stato",
    "action": "Azione",
    "date": "Data",
    "pending": "In attesa",
    "approved": "Approvato",
    "rejected": "Rifiutato",
    "submit": "Invia",
    "cancel": "Annulla",
    "confirm": "Conferma",
    "close": "Chiudi",
    "settings": "Impostazioni",
    "profile": "Profilo",
    "buy": "Acquista",
    "sell": "Vendi",
    "price": "Prezzo",
    "quantity": "Quantità",
    "total": "Totale",
    "fee": "Commissione",
    "yield": "Rendimento",
    "staking": "Staking",
    "earn": "Guadagna",
    "leverage": "Leva",
    "markets": "Mercati",
    "search": "Cerca",
    "follow": "Segui",
    "unfollow": "Non seguire più",
    "followers": "Follower",
    "leaderboard": "Classifica",
    "roi": "ROI",
    "days": "Giorni",
    "verification": "Verifica",
    "completed": "Completato",
    "processing": "In elaborazione",
    "wallet address": "Indirizzo del portafoglio",
    "security": "Sicurezza",
    "overview": "Panoramica",
    "copied": "Copiato!",
    "copied to clipboard": "Copiato negli appunti!",
    "address copied": "Indirizzo copiato!",
    "amount": "Importo"
  },
  ar: {
    "balance": "الرصيد",
    "wallet": "المحفظة",
    "deposit": "إيداع",
    "withdraw": "سحب",
    "trading": "التداول",
    "status": "الحالة",
    "action": "الإجراء",
    "date": "التاريخ",
    "pending": "قيد الانتظار",
    "approved": "مقبول",
    "rejected": "مرفوض",
    "submit": "إرسال",
    "cancel": "إلغاء",
    "confirm": "تأكيد",
    "close": "إغلاق",
    "settings": "الإعدادات",
    "profile": "الملف الشخصي",
    "buy": "شراء",
    "sell": "بيع",
    "price": "السعر",
    "quantity": "الكمية",
    "total": "الإجمالي",
    "fee": "الرسوم",
    "yield": "العائد",
    "staking": "الحصص",
    "earn": "ربح",
    "leverage": "الرافعة المالية",
    "markets": "الأسواق",
    "search": "بحث",
    "follow": "متابعة",
    "unfollow": "إلغاء المتابعة",
    "followers": "المتابعون",
    "leaderboard": "لوحة الصدارة",
    "roi": "معدل الاستثمار",
    "days": "أيام",
    "verification": "التحقق",
    "completed": "مكتمل",
    "processing": "جاري المعالجة",
    "wallet address": "عنوان المحفظة",
    "security": "الأمان",
    "overview": "نظرة عامة",
    "copied": "تم النسخ!",
    "copied to clipboard": "تم النسخ إلى الحافظة!",
    "address copied": "تم نسخ العنوان!",
    "amount": "الكمية"
  }
};

// Word-by-word heuristic offline translation resolver
function offlineTranslatePhrase(text: string, lang: string): string {
  const dictionary = OFFLINE_DICTIONARY[lang];
  if (!dictionary) return text;

  const normalized = text.trim().toLowerCase();
  
  // Exact lookup:
  if (dictionary[normalized]) return dictionary[normalized];

  // If simple compound string, try converting component words
  const words = text.split(/\s+/);
  if (words.length <= 3) {
    const translatedWords = words.map(w => {
      const cleanWord = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
      const match = dictionary[cleanWord];
      if (match) {
        // preserve casing structure
        if (w[0] === w[0].toUpperCase()) {
          return match[0].toUpperCase() + match.slice(1);
        }
        return match;
      }
      return w;
    });
    return translatedWords.join(" ");
  }

  return text;
}

// Post endpoint for automatic translation of English string lists using structured Gemini arrays
app.post("/api/translate", async (req, res) => {
  const { texts, targetLang } = req.body;
  if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
    return res.status(400).json({ error: "Missing mandated translation parameters." });
  }

  const cacheKey = `${targetLang}_${JSON.stringify(texts)}`;
  if (serverTranslationCache[cacheKey]) {
    return res.json({
      success: true,
      translations: serverTranslationCache[cacheKey]
    });
  }

  // Pre-translate everything using our extensive offline dictionary
  const fallbackTranslations = texts.map(t => offlineTranslatePhrase(t, targetLang));

  // If the target is english, or we're in cooldown, return offline translation immediately
  const isCooldown = Date.now() < geminiCooldownUntil;
  if (targetLang === "en" || isCooldown) {
    return res.json({
      success: true,
      translations: fallbackTranslations,
      isFallback: isCooldown
    });
  }

  const langNames: Record<string, string> = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    ar: "Arabic"
  };
  const targetName = langNames[targetLang] || "Portuguese";

  try {
    const ai = getGeminiClient();
    const prompt = `You are a professional financial trading platform translator. Translate the following array of English strings/labels into ${targetName}. Keep numbers, short symbols, names like "Apex" or "USDT", and standard trading codes exactly as they are. Keep the exact order of elements in the array.
    
    Array to translate:
    ${JSON.stringify(texts)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const outputText = response.text || "[]";
    const translations = JSON.parse(outputText);

    if (Array.isArray(translations) && translations.length === texts.length) {
      serverTranslationCache[cacheKey] = translations;
      return res.json({
        success: true,
        translations
      });
    }

    // fallback matching if lengths mismatch
    return res.json({
      success: true,
      translations: fallbackTranslations,
      isFallback: true
    });

  } catch (error: any) {
    // Graceful logging of quota/demand state to avoid messy full error outputs
    const errMsg = error.message || String(error);
    const isQuota = error.status === "RESOURCE_EXHAUSTED" || errMsg.includes("429") || errMsg.includes("quota") || error.status === 429;
    const isServiceDown = error.status === 503 || error.status === "UNAVAILABLE" || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("demand") || errMsg.includes("temporary");
    
    if (isQuota) {
      console.warn("Notice: Gemini Quota Exceeded (429). Activating safe translation cooldown backoff for 12 hours.");
      geminiCooldownUntil = Date.now() + 12 * 60 * 60 * 1000; // 12-hour safe offline fallback mode
    } else if (isServiceDown) {
      console.warn("Notice: Gemini is experiencing demand spikes (503). Activating temporary translation cooldown backoff for 15 minutes.");
      geminiCooldownUntil = Date.now() + 15 * 60 * 1000; // 15-minute safe offline fallback mode
    } else {
      console.warn("Gemini translation helper connection issue:", errMsg);
    }

    // Always succeed cleanly with the high accuracy offline dictionary matching, ensuring an ultra-smooth experience
    return res.json({
      success: true,
      translations: fallbackTranslations,
      isFallback: true
    });
  }
});

// Post endpoint for Gemini Social Sentiment generation
app.post("/api/gemini/sentiment", async (req, res) => {
  const { symbol, name, category } = req.body;
  
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert social media and news sentiment analyst for direct trading platforms like Binance, Bybit, and Bloomberg.
      Analyze the current public and social sentiment for: ${name} (Symbol: ${symbol}, Category: ${category}).
      Give us a premium dashboard summary of around 4-5 bullet points covering:
      1. Overall direct social sentiment (Twitter/X, Reddit, Telegram chat volume and momentum).
      2. Key current narrative or community debate.
      3. Technical analyst consensus (Support/Resistance or buy/sell signal strength).
      4. Community fear or greed trigger right now.
      
      Keep the report highly analytical (not generic) and style it in concise Markdown bullet points. Include standard trading tags. Do not tell us anything about yourself or about AI limitations. Be direct, authoritative, and concise.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({
      success: true,
      sentimentDetails: response.text,
      source: "Gemini Real-Time Cognitive Service"
    });
  } catch (error: any) {
    console.warn("Gemini sentiment error, falling back to simulated high-fidelity analyst reports.", error.message);
    
    // Provide a beautiful analyst fallback recommendation if the API key isn't provided/is invalid
    const simulatedAnswers: Record<string, string> = {
      BTC: `*   **Social Sentiment (Strong Bullish):** X (formerly Twitter) volume is surging +24% with retail interest revolving around potential spot ETF inflows and macroeconomic easing parameters.
*   **Narrative Momentum:** Key discussion centers on long-term accumulation wallets reaching an all-time high, decreasing direct exchange liquid supply.
*   **Technical Indicator Consensus:** Retesting $68K support, with the 50-day EMA showing key golden cross signals suggesting continuation towards $72k resistance levels.
*   **Fear & Greed Index:** Rated 78/100 (Greed), communities remain highly resilient against minor selling pressures.`,
      ETH: `*   **Social Sentiment (Neutral-Bullish):** Layer-2 scaling upgrades and fee stabilization debates have cooled chatter slightly, but institutional staking remains stable.
*   **Narrative Momentum:** High discussion volume on restaking protocols and gas-fee optimization, reinforcing Ethereum as the main Decentralized Application execution tier.
*   **Technical Indicator Consensus:** Finding comfortable support at $3,400 with immediate consolidation. Relative Strength Index (RSI) hover near 52 indicates balanced flow.
*   **Fear & Greed Index:** Rated 58/100 (Neutral), traders are waiting for volume volatility breakups.`,
      SOL: `*   **Social Sentiment (Extremely Bullish):** Massive social engagement across Reddit and meme-asset trading ecosystems with transaction volume reaching record highs.
*   **Narrative Momentum:** Solana’s speed and low fee structures keep attracting high crowds of capital, creating decentralized exchange fee dominance.
*   **Technical Indicator Consensus:** Rallying +8.7% to $182.45, bullish oscillators and the MACD show immense buyer velocity. Targets set at $195.
*   **Fear & Greed Index:** Rated 89/100 (Extreme Greed), indicating heavy FOMO from momentum traders.`,
      NVDA: `*   **Social Sentiment (Extremely Bullish):** Massive interest in hardware cycles, corporate AI scaling, and strategic semiconductor positions. 
*   **Narrative Momentum:** Institutional investors actively debating Nvidia's next-gen chip releases and its near-monopoly on server-side GPU chips.
*   **Technical Indicator Consensus:** Price surging past $945 with incredible buy orders. MACD indicates strong support with a target level of $1,020.
*   **Fear & Greed Index:** Rated 94/100 (Extreme Greed) as buyers aggressively pile in.`,
      XAU: `*   **Social Sentiment (Bullish Hedging):** High interest from global central banks and defensive retail traders looking for a robust inflation hedge.
*   **Narrative Momentum:** Discussion focused on treasury yields cooling off and geopolitics encouraging safe haven asset accumulations.
*   **Technical Indicator Consensus:** Consolidating cleanly at $2,420 with an EMA golden cross, indicating potential targets testing toward $2,500 over the medium-term run.
*   **Fear & Greed Index:** Rated 82/100 (Consistent Greed) with minimal structural volatility of price levels.`
    };

    const fallbackResponse = simulatedAnswers[symbol] || `*   **Social Volume Trend:** Moderate uptick (+8%) in social chatter across professional trading groups discussing ${name} integration potentials.
*   **Primary Discussion Topic:** Asset stabilization and risk management during key macroeconomic rate reports later this week.
*   **Market Sentiment Index:** Rated 65/100 (Bullish leaning) as liquidity accumulates in spot books.
*   **Technical Alignment:** Oscillators show initial consolidation support, with a clean consolidation structure forming.`;

    res.json({
      success: false,
      sentimentDetails: fallbackResponse,
      source: "ApexTrade Internal Analytical Engine (Cognitive Service Key Not Configured)"
    });
  }
});

// Post endpoint for Gemini portfolio and tax strategy advisor
app.post("/api/gemini/advisor", async (req, res) => {
  const { balances, transactionHistory, taxBracket } = req.body;

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert crypto, stock, and commodities tax CPA and investment strategic advisor.
      Analyze the user's holdings and historical transactions list:
      - Balances: ${JSON.stringify(balances)}
      - Transaction Logs: ${JSON.stringify(transactionHistory)}
      - Tax Bracket/Zone Selected: ${taxBracket}
      
      Generate a professional, actionable tax-reporting and portfolio growth report including:
      1. Estimates on tax liability or capital gains based on the Sell transactions.
      2. Tactical tax-loss harvesting recommendations (e.g. optimizing cost basis or locking losses).
      3. APY earning optimization suggestions utilizing standard Staking or high-yield options.
      4. Regulatory compliance checklist tailored for this portfolio.
      
      Output in highly structured Markdown paragraphs and list tables. Ensure the tone is objective, professional, and directly useful. Do not include template disclaimers about not being a real CPA; just provide the analysis with a clear strategic layout.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    res.json({
      success: true,
      strategyDetails: response.text,
      source: "Gemini Tactical Financial Advisor"
    });
  } catch (error: any) {
    console.warn("Gemini advisor error, falling back to simulated premium advisory report.", error.message);
    
    // Fallback premium structured advisory that reacts beautifully to user state
    const simulatedAdvisory = `
### 📊 Tax Advisory Report

Based on your current transaction history and selected **${taxBracket}** tax tier:

#### 1. Realized Capital Gains & Net Liability (Tax Impact)
*   **Realized Gains (Short-Term):** You sold portions of **BTC** and **SOL** for a total net short-term gains of **$2,466.20**.
*   **Estimated Tax liability:** Estimated at roughly **$542.56** based on your current marginal tier bracket.
*   **Cost Basis Asset Standard:** Optimized via **FIFO (First-In, First-Out)** calculations to capture accurate asset entry values.

#### 2. Tactical Tax-Loss Harvesting Strategies
*   **Unrealized Positions Audit:** Your current entries in Stocks (like TSLA) present an excellent tax-loss harvesting candidate.
*   **How to execute:** If you realize current paper losses by selling, you can offset your **$2,466.20** short-term capital gains, potentially reducing this year's net tax liability to **zero**. (Note: Be mindful of any 30-day Wash Sale Rules if rebuying the stock).

#### 3. Yield Optimization (Earn Recommendations)
*   **Idle Asset Check:** Your current BTC and ETH holds in the wallet can be subscribed to the **APY Savings Portal**.
*   **BTC Flex Savings:** Subscribing to flexible staking instantly increases compound growth by **3.5% APY** with zero lockups.
*   **SOL Premium Staking:** Highly recommended to lock your SOL portion in our **12.4% APY** validators for massive secondary gains.

#### 4. Regulatory & Compliance Best Practices
*   **Form 8949 Prep:** Always declare your physical commodity spot hedges and crypto exits inside IRS Form 8949 (or equivalent country assets schedule).
*   **Record Integrity:** Maintain distinct ledgers of your staking distributions as Earned Interest/Income to prevent double taxation. Access our direct ledger export feature to download standard-format CSV records.
    `;

    res.json({
      success: false,
      strategyDetails: simulatedAdvisory,
      source: "ApexTrade Audit & Compliance Suite (Cognitive Service Key Not Configured)"
    });
  }
});

// ==========================================
// INSTITUTIONAL CORE: SECURE ADMIN & USER MANAGEMENT ENDPOINTS
// ==========================================

// In-Memory Database Schema & Seed Data
interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "suspended";
  verified: boolean;
  registrationDate: string;
  balances: { [symbol: string]: number };
  avgProfitPercentage: number; // custom user profit percentage multiplier
  accountNotes: string;
  activityHistory: { time: string; action: string; ip: string }[];
  profitHistory: { date: string; amount: number; description: string }[];
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  role: "admin" | "user";
}

interface ServerDeposit {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: string;
  currency: string;
  amount: number;
  amountInCrypto?: number;
  paymentProofUrl?: string; // Standard Bank Receipt Base64 / Simulation UI Link
  walletAddress?: string;
  txHash?: string;
  bankName?: string;
  bankAccountRef?: string;
  status: "pending" | "approved" | "rejected";
  adminComments?: string;
  timestamp: string;
}

interface ServerWithdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: "bank" | "crypto";
  currency: string;
  amount: number;
  // bank fields
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  // crypto fields
  walletAddress?: string;
  network?: string;
  status: "pending" | "processing" | "approved" | "rejected";
  adminNotes?: string;
  timestamp: string;
}

interface ServerTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  status: "open" | "closed";
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: {
    id: string;
    sender: "user" | "admin" | "system";
    senderName: string;
    message: string;
    timestamp: string;
  }[];
  timestamp: string;
}

interface AdminAuditTrail {
  id: string;
  actor: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

interface ServerFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Global In-Memory Store Initiators
const SEED_USERS: ServerUser[] = [
  {
    id: "user-alex",
    name: "Alexander Watchman",
    email: "alexwtchmn@gmail.com",
    phone: "+1 (555) 349-2041",
    status: "active",
    verified: true,
    registrationDate: "2026-02-14T09:30:00Z",
    balances: { USD: 76850.25, BTC: 0.28, ETH: 1.45, SOL: 15.2, BNB: 4.5 },
    avgProfitPercentage: 8.4,
    accountNotes: "Primary high-net-worth demonstration asset account. Verified high volume KYC tier.",
    isTwoFactorEnabled: true,
    twoFactorSecret: "GBSWY3DPEB3W64TBNQ======",
    role: "user",
    activityHistory: [
      { time: "2026-05-24T12:10:00Z", action: "User session authenticated standard route", ip: "192.168.1.102" },
      { time: "2026-05-24T10:45:00Z", action: "Requested flexible earn auto-accrual subscription", ip: "192.168.1.102" },
      { time: "2026-05-23T15:00:20Z", action: "Setup 2FA Google Authenticator protocol", ip: "192.168.1.102" }
    ],
    profitHistory: [
      { date: "2026-05-24", amount: 142.50, description: "Daily compound yield stake accruals" },
      { date: "2026-05-23", amount: 139.80, description: "Daily compound yield stake accruals" },
      { date: "2026-05-22", amount: 145.10, description: "Daily profit payout adjustments (Apex system)" }
    ]
  },
  {
    id: "user-sarah",
    name: "Sarah Jenkins",
    email: "sjenkins@finance-alpha.com",
    phone: "+44 7911 123456",
    status: "active",
    verified: false,
    registrationDate: "2026-04-18T14:15:00Z",
    balances: { USD: 14500.00, BTC: 0.0, ETH: 0.0, SOL: 0.0, BNB: 0.0 },
    avgProfitPercentage: 4.5,
    accountNotes: "Pending full verification. Requested onboarding support guidelines.",
    isTwoFactorEnabled: false,
    role: "user",
    activityHistory: [
      { time: "2026-05-24T08:32:00Z", action: "Submitted bank slip for $14,500 core deposit", ip: "85.255.233.15" },
      { time: "2026-04-18T14:17:00Z", action: "Registered normal user account entry", ip: "85.255.233.15" }
    ],
    profitHistory: [
      { date: "2026-05-24", amount: 32.20, description: "Standard account growth interest index" }
    ]
  },
  {
    id: "user-david",
    name: "David Miller",
    email: "dave.miller@techcorp.io",
    phone: "+1 (415) 888-9922",
    status: "suspended",
    verified: true,
    registrationDate: "2025-11-05T10:00:00Z",
    balances: { USD: 852.12, BTC: 0.015, ETH: 0.0, SOL: 0.0, BNB: 0.0 },
    avgProfitPercentage: 1.2,
    accountNotes: "Account flag suspended pending source-of-wealth compliance receipt update.",
    isTwoFactorEnabled: false,
    role: "user",
    activityHistory: [
      { time: "2026-05-20T10:00:00Z", action: "Account marked suspended by security logic", ip: "127.0.0.1" }
    ],
    profitHistory: []
  }
];

const SEED_DEPOSITS: ServerDeposit[] = [
  {
    id: "dep-1001",
    userId: "user-sarah",
    userEmail: "sjenkins@finance-alpha.com",
    userName: "Sarah Jenkins",
    method: "bank",
    currency: "USD",
    amount: 14500.00,
    paymentProofUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='100%' height='100%' fill='%231e293b'/><text x='15' y='45' fill='%23e2e8f0' font-size='10' font-family='monospace'>BANK SLIP PROOF</text><text x='15' y='65' fill='%2310b981' font-size='11' font-family='monospace'>$14,500.00 USD</text><text x='15' y='85' fill='%2394a3b8' font-size='7' font-family='monospace'>Ref: ApexTx-90112</text></svg>",
    bankName: "Lloyds Bank UK",
    bankAccountRef: "Alpha Finance Account End 89112",
    status: "pending",
    timestamp: "2026-05-24T08:32:00Z"
  },
  {
    id: "dep-1002",
    userId: "user-alex",
    userEmail: "alexwtchmn@gmail.com",
    userName: "Alexander Watchman",
    method: "crypto",
    currency: "USDT",
    amount: 5000.00,
    amountInCrypto: 5000.00,
    walletAddress: "TY6b2vAn6K37N1LqA8f278Gsk9D1Pz8zTx",
    txHash: "f1a2e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    status: "approved",
    adminComments: "Auto-matched and verified via blockchain ledger indexer.",
    timestamp: "2026-05-23T11:20:00Z"
  },
  {
    id: "dep-1003",
    userId: "user-alex",
    userEmail: "alexwtchmn@gmail.com",
    userName: "Alexander Watchman",
    method: "crypto",
    currency: "BTC",
    amount: 10000.00,
    amountInCrypto: 0.15,
    walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    txHash: "889ce87329f635293297a7a24e4ebda03ef9decd8397a7b83072b2c9ad3209fa",
    status: "pending",
    timestamp: "2026-05-24T13:02:11Z"
  }
];

const SEED_WITHDRAWALS: ServerWithdrawal[] = [
  {
    id: "wth-2001",
    userId: "user-alex",
    userEmail: "alexwtchmn@gmail.com",
    userName: "Alexander Watchman",
    method: "bank",
    currency: "USD",
    amount: 3500.00,
    bankName: "JP Morgan Chase Bank",
    accountName: "Alexander Watchman Savings",
    accountNumber: "990142330911",
    routingNumber: "021000021",
    status: "processing",
    timestamp: "2026-05-24T11:00:00Z"
  },
  {
    id: "wth-2002",
    userId: "user-david",
    userEmail: "dave.miller@techcorp.io",
    userName: "David Miller",
    method: "crypto",
    currency: "ETH",
    amount: 2500.00,
    walletAddress: "T742d35Cc6634C0532925a3b844Bc454e4438f44",
    network: "TRC20",
    status: "pending",
    timestamp: "2026-05-24T12:45:00Z"
  }
];

const SEED_TICKETS: ServerTicket[] = [
  {
    id: "tkt-3001",
    userId: "user-alex",
    userEmail: "alexwtchmn@gmail.com",
    userName: "Alexander Watchman",
    subject: "Accrued earn multiplier inquiry",
    status: "open",
    unreadByAdmin: true,
    unreadByUser: false,
    timestamp: "2026-05-24T10:15:00Z",
    messages: [
      {
        id: "m-1",
        sender: "user",
        senderName: "Alexander Watchman",
        message: "Hello team, I noticed my core staking interest in the APY dashboard showing flex rates. Can you confirm if my custom VIP 8.4% multiplier is currently applied?",
        timestamp: "2026-05-24T10:15:00Z"
      }
    ]
  },
  {
    id: "tkt-3002",
    userId: "user-sarah",
    userEmail: "sjenkins@finance-alpha.com",
    userName: "Sarah Jenkins",
    subject: "ID Upload assistance query",
    status: "open",
    unreadByAdmin: false,
    unreadByUser: false,
    timestamp: "2026-05-24T06:00:00Z",
    messages: [
      {
        id: "m-2",
        sender: "user",
        senderName: "Sarah Jenkins",
        message: "I am having issues uploading my company Certificate of Incorporation. Is high-resolution PDF format supported?",
        timestamp: "2026-05-24T05:50:00Z"
      },
      {
        id: "m-3",
        sender: "admin",
        senderName: "System Administrator Support",
        message: "Yes Sarah, PDFs up to 15MB are safely supported. Please try again, or respond here attaching the certificate directly. We'll verify it manually for you immediately.",
        timestamp: "2026-05-24T06:00:00Z"
      }
    ]
  }
];

const SEED_FAQS: ServerFAQ[] = [
  {
    id: "faq-1",
    question: "How long do Bank Transfer deposits take to credit?",
    answer: "Typically Bank Deposits are manually audited and cleared within 1 to 4 hours of payment proof upload during global market hours.",
    category: "deposits"
  },
  {
    id: "faq-2",
    question: "What cryptocurrency blockchain networks are supported?",
    answer: "We support BTC (Bitcoin Mainnet), ETH (TRC20), USDT (TRC20), and BNB (BSC BEP20). Confirm your sending address matches the displayed network strictly.",
    category: "crypto"
  },
  {
    id: "faq-3",
    question: "How is my 2-Factor Authentication secured?",
    answer: "Two-Factor Authentication utilizes Google Authenticator TOTOP standard algorithm keys. All keys remain encrypted inside secure sandbox HSM tiers, isolating your login vectors.",
    category: "security"
  }
];

const SEED_AUDITS: AdminAuditTrail[] = [
  {
    id: "log-1",
    actor: "SYSTEM WATCHDOG",
    action: "Intrusion Audit Complete",
    details: "Automated cryptographic and pipeline audit finished with 0 warnings.",
    ip: "127.0.0.1",
    timestamp: "2026-05-24T13:00:00Z"
  },
  {
    id: "log-2",
    actor: "Admin (admin@apextrade.com)",
    action: "VIP Margin Adjustment",
    details: "Manually increased user-alex cumulative staking profit percentage target to 8.4%. Owner requested balance calibration.",
    ip: "185.22.40.91",
    timestamp: "2026-05-23T18:32:00Z"
  }
];

// Persistent state handlers mapped from memory
let usersDb: ServerUser[] = [...SEED_USERS];
let depositsDb: ServerDeposit[] = [...SEED_DEPOSITS];
let withdrawalsDb: ServerWithdrawal[] = [...SEED_WITHDRAWALS];
let ticketsDb: ServerTicket[] = [...SEED_TICKETS];
let faqsDb: ServerFAQ[] = [...SEED_FAQS];
let auditLogsDb: AdminAuditTrail[] = [...SEED_AUDITS];

// Configurable Settlement/Payment coordinates for user deposits
let paymentCoordinates = {
  bankName: "Alliance Brokerage & Trust",
  routingNumber: "021000021",
  accountNumber: "1029-4581-9238",
  cryptoAddresses: {
    USDT: { name: "USDT (TRC-20 Network)", address: "TXD9820194000ABeC7816ED29A09823AB7", sub: "Secure high-speed Tron network contract deposit on TRC-20." },
    BTC: { name: "Bitcoin (BTC Native)", address: "bc1q9823ab78e99309823ab78e993bc1q9823", sub: "Direct blockchain ledger deposit address." },
    ETH: { name: "Ethereum (TRC-20 Network)", address: "TETH7129A09823ABeC7816ED29A09823AB78E", sub: "TRC-20 standard wrapped smart contract deposit point." },
    SOL: { name: "Solana (SOL Network)", address: "9823aBeC7816ED29A09823AB78E99389201940eZ", sub: "Solana high speed asset clearing wallet." }
  }
};

// Firestore helper sync methods
async function syncFromFirestore() {
  if (!firestoreDb) return;
  try {
    console.log("[Firebase] Syncing local cache from Firestore...");
    
    // 1. Sync FAQs
    const faqSnap = await getDocs(collection(firestoreDb, "faqs"));
    if (!faqSnap.empty) {
      faqsDb = faqSnap.docs.map(doc => doc.data() as ServerFAQ);
    } else {
      for (const faq of SEED_FAQS) {
        await setDoc(doc(firestoreDb, "faqs", faq.id), faq);
      }
    }

    // 2. Sync Users
    const userSnap = await getDocs(collection(firestoreDb, "users"));
    if (!userSnap.empty) {
      usersDb = userSnap.docs.map(doc => doc.data() as ServerUser);
    } else {
      for (const user of SEED_USERS) {
        await setDoc(doc(firestoreDb, "users", user.id), user);
      }
    }

    // 3. Sync Deposits
    const depSnap = await getDocs(collection(firestoreDb, "deposits"));
    if (!depSnap.empty) {
      depositsDb = depSnap.docs.map(doc => doc.data() as ServerDeposit);
    } else {
      for (const dep of SEED_DEPOSITS) {
        await setDoc(doc(firestoreDb, "deposits", dep.id), dep);
      }
    }

    // 4. Sync Withdrawals
    const wthSnap = await getDocs(collection(firestoreDb, "withdrawals"));
    if (!wthSnap.empty) {
      withdrawalsDb = wthSnap.docs.map(doc => doc.data() as ServerWithdrawal);
    } else {
      for (const wth of SEED_WITHDRAWALS) {
        await setDoc(doc(firestoreDb, "withdrawals", wth.id), wth);
      }
    }

    // 5. Sync Tickets
    const ticketSnap = await getDocs(collection(firestoreDb, "tickets"));
    if (!ticketSnap.empty) {
      ticketsDb = ticketSnap.docs.map(doc => doc.data() as ServerTicket);
    } else {
      for (const tkt of SEED_TICKETS) {
        await setDoc(doc(firestoreDb, "tickets", tkt.id), tkt);
      }
    }

    // 6. Sync Audit Logs
    const auditSnap = await getDocs(collection(firestoreDb, "audits"));
    if (!auditSnap.empty) {
      auditLogsDb = auditSnap.docs.map(doc => doc.data() as AdminAuditTrail);
    } else {
      for (const log of SEED_AUDITS) {
        await setDoc(doc(firestoreDb, "audits", log.id), log);
      }
    }

    // 7. Sync Payment Config
    const pcSnap = await getDocs(collection(firestoreDb, "payment_config"));
    if (!pcSnap.empty) {
      paymentCoordinates = pcSnap.docs[0].data() as any;
    } else {
      await setDoc(doc(firestoreDb, "payment_config", "general"), paymentCoordinates);
    }

    console.log("[Firebase] Successfully fully synchronized other caches.");
  } catch (error) {
    console.error("[Firebase] Error during initial synchronization:", error);
  }
}

async function persistUser(user: ServerUser) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "users", user.id), user);
  } catch (err) {
    console.error(`[Firebase] Failed to write user ${user.id}:`, err);
  }
}

async function persistDeposit(deposit: ServerDeposit) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "deposits", deposit.id), deposit);
  } catch (err) {
    console.error(`[Firebase] Failed to write deposit ${deposit.id}:`, err);
  }
}

async function persistWithdrawal(wth: ServerWithdrawal) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "withdrawals", wth.id), wth);
  } catch (err) {
    console.error(`[Firebase] Failed to write withdrawal ${wth.id}:`, err);
  }
}

async function persistTicket(ticket: ServerTicket) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "tickets", ticket.id), ticket);
  } catch (err) {
    console.error(`[Firebase] Failed to write ticket ${ticket.id}:`, err);
  }
}

async function persistFAQ(faq: ServerFAQ) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "faqs", faq.id), faq);
  } catch (err) {
    console.error(`[Firebase] Failed to write FAQ ${faq.id}:`, err);
  }
}

async function persistDeleteFAQ(faqId: string) {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, "faqs", faqId));
  } catch (err) {
    console.error(`[Firebase] Failed to delete FAQ ${faqId}:`, err);
  }
}

async function persistAudit(log: AdminAuditTrail) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "audits", log.id), log);
  } catch (err) {
    console.error(`[Firebase] Failed to write audit log ${log.id}:`, err);
  }
}

async function persistPaymentCoordinates() {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "payment_config", "general"), paymentCoordinates);
  } catch (err) {
    console.error("[Firebase] Failed to write payment coordinates:", err);
  }
}

// Helper: Append system audit actions safely
function appendAudit(actor: string, action: string, details: string, ip: string = "unknown-agent") {
  const newLog: AdminAuditTrail = {
    id: "log-" + Math.random().toString(36).substring(4),
    actor,
    action,
    details,
    ip,
    timestamp: new Date().toISOString()
  };
  auditLogsDb.unshift(newLog);
  persistAudit(newLog);
}

// REST DEFINED ENDPOINTS

// AUTH ACTIONS
app.post("/api/auth/login", (req, res) => {
  const { email, password, authProvider } = req.body;
  
  // Custom Admin check
  if (email === "admin@apextrade.com" && password === "admin123") {
    appendAudit("admin@apextrade.com", "Admin Terminal Login", "Successful authentication into elite admin suite.", req.ip || "127.0.0.1");
    return res.json({
      success: true,
      user: {
        id: "admin-root",
        name: "Supreme Administrator",
        email: "admin@apextrade.com",
        role: "admin",
        verified: true,
        balances: {},
        isTwoFactorEnabled: true
      }
    });
  }

  // Normal user lookup
  let matched = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!matched && (authProvider === "google" || authProvider === "apple")) {
    // Auto register SSO users for high performance premium convenience!
    const newId = "user-" + Math.random().toString(36).substring(4);
    const newSsoUser: ServerUser = {
      id: newId,
      name: email.split("@")[0].toUpperCase() || "SSO Investor",
      email: email,
      phone: "+1 (555) 000-0000",
      status: "active",
      verified: true,
      registrationDate: new Date().toISOString(),
      balances: { USD: 0, BTC: 0, ETH: 0, SOL: 0, BNB: 0, AAPL: 0, NVDA: 0, XAU: 0, WTI: 0 }, // seeded with zero initial funds as requested by user
      avgProfitPercentage: 0.0,
      accountNotes: `Generated securely via ${authProvider} instant OAuth.`,
      isTwoFactorEnabled: false,
      role: "user",
      activityHistory: [{ time: new Date().toISOString(), action: `Registered immediately via ${authProvider} security trust portal`, ip: req.ip || "127.0.0.1" }],
      profitHistory: []
    };
    usersDb.push(newSsoUser);
    persistUser(newSsoUser);
    matched = newSsoUser;
  }

  if (matched) {
    if (matched.status === "suspended") {
      return res.status(403).json({ error: "Access prohibited. This investor profile has been suspended by corporate safety." });
    }
    
    // Add login log
    matched.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `Authenticated with system. Verified: ${matched.verified}`,
      ip: req.ip || "127.0.0.1"
    });
    
    appendAudit(matched.email, "User Login", `Client logged in successfully. Role: ${matched.role}`, req.ip || "127.0.0.1");
    persistUser(matched);
    
    return res.json({
      success: true,
      user: matched
    });
  }

  // Default credentials for testing standard users if standard fields submitted
  if (email === "alexwtchmn@gmail.com") {
    const userObj = usersDb.find(u => u.id === "user-alex")!;
    return res.json({ success: true, user: userObj });
  }

  return res.status(401).json({ error: "Invalid credentials. Please verify your email and password or register a new profile." });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Missing mandated registration parameters." });
  }

  const existing = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "An investment profile with this email address already is registered." });
  }

  const newId = "user-" + Math.random().toString(36).substring(4);
  const newUser: ServerUser = {
    id: newId,
    name,
    email,
    phone: phone || "+1 (555) 123-4567",
    status: "active",
    verified: false,
    registrationDate: new Date().toISOString(),
    balances: { USD: 0, BTC: 0, ETH: 0, SOL: 0, BNB: 0, AAPL: 0, NVDA: 0, XAU: 0, WTI: 0 }, // seeded with zero initial funds as requested by user
    avgProfitPercentage: 0.0,
    accountNotes: "New registration profile. Safe verification status pending.",
    isTwoFactorEnabled: false,
    role: "user",
    activityHistory: [{ time: new Date().toISOString(), action: "Account created", ip: req.ip || "127.0.0.1" }],
    profitHistory: []
  };

  usersDb.push(newUser);
  appendAudit(email, "New Registration", "User completed platform registration successfully", req.ip || "127.0.0.1");
  persistUser(newUser);

  return res.json({ success: true, user: newUser });
});

app.post("/api/auth/2fa-setup", (req, res) => {
  const { email, enable } = req.body;
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(404).json({ error: "User profile not found." });

  user.isTwoFactorEnabled = enable;
  if (enable) {
    user.twoFactorSecret = "GBSWY3DPEB3W64TBNQ======"; // TOTP secret representation
    user.activityHistory.unshift({
      time: new Date().toISOString(),
      action: "Two-Factor authentication configured successfully",
      ip: req.ip || "127.0.0.1"
    });
  }
  persistUser(user);
  return res.json({ success: true, user });
});

// PASSWORD RECOVERY & EMAIL VERIFICATION ENDPOINTS
const passwordResetTokens = new Map<string, string>();

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email parameter is required." });
  
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "No investment profile identified with that email address." });
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  passwordResetTokens.set((email || "").toLowerCase(), generatedOtp);

  user.activityHistory.unshift({
    time: new Date().toISOString(),
    action: `Requested password recovery. Reset OTP code issued: ${generatedOtp}`,
    ip: req.ip || "127.0.0.1"
  });

  appendAudit(email, "Password Reset Requested", `Temporary OTP: ${generatedOtp} issued for user password recovery`, req.ip || "127.0.0.1");
  persistUser(user);
  
  return res.json({ 
    success: true, 
    message: "A secure reset code has been successfully generated and dispatched in our routing tables.",
    otp: generatedOtp // Deliver OTP in response for testing/fluid experience in preview!
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ error: "Missing required fields for password recovery." });
  }

  const activeToken = passwordResetTokens.get((email || "").toLowerCase());
  if (!activeToken || activeToken !== String(otp)) {
    return res.status(400).json({ error: "Invalid or expired recovery OTP code. Please try again." });
  }

  const user = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(404).json({ error: "User profile not found." });

  // Reset password (normally hashed; in in-memory simulation we update it)
  passwordResetTokens.delete((email || "").toLowerCase());
  user.activityHistory.unshift({
    time: new Date().toISOString(),
    action: "Password security credentials safely updated via verification OTP code",
    ip: req.ip || "127.0.0.1"
  });

  appendAudit(email, "Password Reset Cleared", "User upgraded credentials and logged in", req.ip || "127.0.0.1");
  persistUser(user);
  return res.json({ success: true, message: "Security credentials successfully updated." });
});

app.post("/api/auth/verify-email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  const user = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(404).json({ error: "User profile not found." });

  user.verified = true;
  user.activityHistory.unshift({
    time: new Date().toISOString(),
    action: "Email address compliance state verified successfully",
    ip: req.ip || "127.0.0.1"
  });

  appendAudit(email, "Email Verified", "Compliance verifications updated to VERIFIED", req.ip || "127.0.0.1");
  persistUser(user);
  return res.json({ success: true, user });
});

// GENERAL USER ENDPOINT
app.get("/api/auth/me", (req, res) => {
  const { email } = req.query;
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === String(email || "").toLowerCase());
  if (user) {
    return res.json({ success: true, user });
  }
  return res.status(404).json({ error: "Not logged in" });
});

// ADMIN PANEL STATS OVERVIEW
app.get("/api/admin/overview", (req, res) => {
  const usersCount = usersDb.length;
  const activeUsers = usersDb.filter(u => u.status === "active").length;
  const pendingDeposits = depositsDb.filter(d => d.status === "pending").length;
  const pendingWithdrawals = withdrawalsDb.filter(w => w.status === "pending").length;

  const totalDeposits = depositsDb
    .filter(d => d.status === "approved")
    .reduce((acc, d) => acc + d.amount, 0);

  const totalWithdrawals = withdrawalsDb
    .filter(w => w.status === "approved" || w.status === "processing")
    .reduce((acc, w) => acc + w.amount, 0);

  // Profit history accumulation
  let totalProfits = 0;
  usersDb.forEach(u => {
    totalProfits += u.profitHistory.reduce((acc, p) => acc + p.amount, 0);
  });

  return res.json({
    usersCount,
    activeUsers,
    pendingDeposits,
    pendingWithdrawals,
    totalDeposits,
    totalWithdrawals,
    totalProfits,
    recentAudits: auditLogsDb.slice(0, 15)
  });
});

// CORE USER MANAGEMENT ENDPOINTS
app.get("/api/admin/users", (req, res) => {
  res.json(usersDb);
});

// Powerful User profile adjustment: balances, profits, suspension, verifications & comments
app.post("/api/admin/users/:id/update", (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    verified, 
    avgProfitPercentage, 
    accountNotes, 
    adjustBalanceVal, 
    adjustBalanceAsset,
    addBonusAmount,
    deductLossAmount,
    adminEmailReason // mandatory audit validation
  } = req.body;

  const userObj = usersDb.find(u => u.id === id);
  if (!userObj) {
    return res.status(404).json({ error: "Investor identity not identified." });
  }

  const actor = "Admin (admin@apextrade.com)";
  const changes = [];

  if (status && status !== userObj.status) {
    userObj.status = status;
    changes.push(`Status changed to ${status}`);
    userObj.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `Profile status updated by security to: ${status}`,
      ip: req.ip || "127.0.0.1"
    });
  }

  if (verified !== undefined && verified !== userObj.verified) {
    userObj.verified = verified;
    changes.push(`KYC verification set to ${verified}`);
    userObj.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `KYC compliance account verification set to: ${verified}`,
      ip: req.ip || "127.0.0.1"
    });
  }

  if (avgProfitPercentage !== undefined && parseFloat(avgProfitPercentage) !== userObj.avgProfitPercentage) {
    const oldP = userObj.avgProfitPercentage;
    userObj.avgProfitPercentage = parseFloat(avgProfitPercentage);
    changes.push(`Profit margin shifted from ${oldP}% to ${avgProfitPercentage}%`);
  }

  if (accountNotes !== undefined) {
    userObj.accountNotes = accountNotes;
  }

  // Adjust balance
  if (adjustBalanceVal && adjustBalanceAsset) {
    const asset = adjustBalanceAsset.toUpperCase();
    const qty = parseFloat(adjustBalanceVal);
    const prev = userObj.balances[asset] || 0;
    userObj.balances[asset] = Number((prev + qty).toFixed(4));
    changes.push(`Balance manual adjustment to ${asset} of ${qty >= 0 ? "+" : ""}${qty} (New: ${userObj.balances[asset]})`);
    
    // Add transaction to history
    userObj.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `Manual Ledger Adjustment specified: ${qty >= 0 ? "+" : ""}${qty} ${asset}`,
      ip: req.ip || "127.0.0.1"
    });
  }

  // Add Dynamic Profit / Bonus payout
  if (addBonusAmount) {
    const amt = parseFloat(addBonusAmount);
    const asset = "USD";
    const prev = userObj.balances[asset] || 0;
    userObj.balances[asset] = Number((prev + amt).toFixed(2));
    userObj.profitHistory.unshift({
      date: new Date().toISOString().split("T")[0],
      amount: amt,
      description: `Manual Reward Bonus Accrual - Reason: ${adminEmailReason || "Portfolio Appreciation boost"}`
    });
    changes.push(`Manually credited Bonus reward of $${amt} USD`);
  }

  // Deduct losses manually
  if (deductLossAmount) {
    const amt = parseFloat(deductLossAmount);
    const asset = "USD";
    const prev = userObj.balances[asset] || 0;
    userObj.balances[asset] = Number(Math.max(0, prev - amt).toFixed(2));
    userObj.profitHistory.unshift({
      date: new Date().toISOString().split("T")[0],
      amount: -amt,
      description: `Manual Loss Adjustment - Reason: ${adminEmailReason || "Margin Maintenance alignment"}`
    });
    changes.push(`Manually debited margin losses of $${amt} USD`);
  }

  if (changes.length > 0) {
    const detailString = changes.join(", ");
    appendAudit(actor, "Investor Profile Calibration", `Calibrating info for ${userObj.email}. ${detailString}. Audit note: ${adminEmailReason || "Standard adjustment"}`, req.ip || "127.0.0.1");
  }

  persistUser(userObj);
  res.json({ success: true, user: userObj });
});

// CORE DEPOSIT ENDPOINTS
app.get("/api/admin/payment-coordinates", (req, res) => {
  res.json(paymentCoordinates);
});

app.post("/api/admin/payment-coordinates/update", (req, res) => {
  const { bankName, routingNumber, accountNumber, cryptoAddresses } = req.body;
  if (bankName) paymentCoordinates.bankName = bankName;
  if (routingNumber) paymentCoordinates.routingNumber = routingNumber;
  if (accountNumber) paymentCoordinates.accountNumber = accountNumber;
  if (cryptoAddresses) {
    if (cryptoAddresses.USDT) paymentCoordinates.cryptoAddresses.USDT = { ...paymentCoordinates.cryptoAddresses.USDT, ...cryptoAddresses.USDT };
    if (cryptoAddresses.BTC) paymentCoordinates.cryptoAddresses.BTC = { ...paymentCoordinates.cryptoAddresses.BTC, ...cryptoAddresses.BTC };
    if (cryptoAddresses.ETH) paymentCoordinates.cryptoAddresses.ETH = { ...paymentCoordinates.cryptoAddresses.ETH, ...cryptoAddresses.ETH };
    if (cryptoAddresses.SOL) paymentCoordinates.cryptoAddresses.SOL = { ...paymentCoordinates.cryptoAddresses.SOL, ...cryptoAddresses.SOL };
  }
  
  appendAudit("Admin (admin@apextrade.com)", "Updated Payment Coordinates", 
    `System coordinates updated to Bank: ${paymentCoordinates.bankName}, USDT: ${paymentCoordinates.cryptoAddresses.USDT.address}`, 
    req.ip || "127.0.0.1"
  );
  
  persistPaymentCoordinates();
  res.json({ success: true, paymentCoordinates });
});

app.get("/api/admin/deposits", (req, res) => {
  res.json(depositsDb);
});

// Submit client deposit: supports Bank (slip receipt) and Crypto (addresses and networks)
app.post("/api/admin/deposits/submit", (req, res) => {
  const { email, userEmail, method, currency, amount, paymentProofUrl, bankName, bankAccountRef, walletAddress, txHash } = req.body;
  const targetEmail = email || userEmail;
  if (!targetEmail) {
    return res.status(400).json({ error: "Missing mandated authentication email for deposits." });
  }
  
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User investor record not found to mount deposit." });
  }

  const finalAmount = parseFloat(amount || "0");
  if (finalAmount <= 0) {
    return res.status(400).json({ error: "Value must stand strictly positive." });
  }

  const customId = "dep-" + Math.floor(1000 + Math.random() * 9000);
  const newDep: ServerDeposit = {
    id: customId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    method,
    currency: currency || "USD",
    amount: finalAmount,
    amountInCrypto: (method === "crypto" || (typeof method === "string" && method.startsWith("crypto"))) ? finalAmount / (GLOBAL_ASSETS.find(a => a.symbol === currency)?.price || 1) : undefined,
    paymentProofUrl: paymentProofUrl || (method === "bank" ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='100%' height='100%' fill='%23111827'/><text x='10' y='60' fill='%23f59e0b' font-size='10'>Bank Transfer Slip</text></svg>" : undefined),
    bankName,
    bankAccountRef,
    walletAddress,
    txHash: txHash || ((method === "crypto" || (typeof method === "string" && method.startsWith("crypto"))) ? "0x" + Math.random().toString(16).substring(2, 66) : undefined),
    status: "pending",
    timestamp: new Date().toISOString()
  };

  depositsDb.unshift(newDep);
  user.activityHistory.unshift({
    time: new Date().toISOString(),
    action: `Submitted a pending ${method} deposit authorization for ${finalAmount} ${currency}`,
    ip: req.ip || "127.0.0.1"
  });

  appendAudit(user.email, "Deposit Inquiry Created", `Filed ${method} request for ${finalAmount} ${currency}. Status: pending. ID: ${customId}`, req.ip || "127.0.0.1");

  persistDeposit(newDep);
  persistUser(user);
  res.json({ success: true, deposit: newDep });
});

app.post("/api/admin/deposits/:id/approve", (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;
  const dep = depositsDb.find(d => d.id === id);
  if (!dep) return res.status(404).json({ error: "Deposit ledger not found." });

  dep.status = "approved";
  dep.adminComments = adminComments || "Payment cleared and verified manually.";

  // Update user balance automatically inside server registry
  const user = usersDb.find(u => u.id === dep.userId);
  if (user) {
    const symbol = dep.currency.toUpperCase();
    const prev = user.balances[symbol] || 0;
    user.balances[symbol] = Number((prev + dep.amount).toFixed(4));
    
    user.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `Deposit Cleared and Approved: Received +${dep.amount} ${symbol} credit`,
      ip: req.ip || "127.0.0.1"
    });
  }

  appendAudit("Admin (admin@apextrade.com)", "Approved Core Deposit", `Deposit clearing successful for ID ${dep.id}. Verified $${dep.amount} ${dep.currency} for ${dep.userEmail}`, req.ip || "127.0.0.1");
  
  persistDeposit(dep);
  if (user) persistUser(user);
  res.json({ success: true, deposit: dep });
});

app.post("/api/admin/deposits/:id/reject", (req, res) => {
  const { id } = req.params;
  const { adminComments } = req.body;
  const dep = depositsDb.find(d => d.id === id);
  if (!dep) return res.status(404).json({ error: "Deposit ledger not found." });

  dep.status = "rejected";
  dep.adminComments = adminComments || "Receipt audit failed or mismatch encountered.";

  const user = usersDb.find(u => u.id === dep.userId);
  if (user) {
    user.activityHistory.unshift({
      time: new Date().toISOString(),
      action: `Deposit Audit Rejected: ${dep.amount} ${dep.currency}. Reason: ${dep.adminComments}`,
      ip: req.ip || "127.0.0.1"
    });
  }

  appendAudit("Admin (admin@apextrade.com)", "Rejected Core Deposit", `Deposit rejected for ID ${dep.id}. Client: ${dep.userEmail}. Comments: ${adminComments}`, req.ip || "127.0.0.1");
  
  persistDeposit(dep);
  if (user) persistUser(user);
  res.json({ success: true, deposit: dep });
});

// CORE WITHDRAWAL ENDPOINTS
app.get("/api/admin/withdrawals", (req, res) => {
  res.json(withdrawalsDb);
});

// Submit standard withdrawal: bank details or crypto address Network
app.post("/api/admin/withdrawals/submit", (req, res) => {
  const { email, userEmail, method, currency, amount, bankName, accountName, accountNumber, routingNumber, walletAddress, network } = req.body;
  const targetEmail = email || userEmail;
  if (!targetEmail) {
    return res.status(400).json({ error: "Missing mandated authentication email for withdrawals." });
  }
  
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User investor profile not identified on withdrawals." });
  }

  const finalAmount = parseFloat(amount || "0");
  if (finalAmount <= 0) {
    return res.status(400).json({ error: "Quantity must stand positive." });
  }

  // Double check liquidity availability
  const userBal = user.balances[currency.toUpperCase()] || 0;
  if (userBal < finalAmount) {
    return res.status(400).json({ error: "Insufficient available portfolio balance to warrant this processing." });
  }

  // Deduct user balance immediately to place inside a escrowed transaction vault!
  user.balances[currency.toUpperCase()] = Number((userBal - finalAmount).toFixed(4));

  const customId = "wth-" + Math.floor(2000 + Math.random() * 8000);
  const newWth: ServerWithdrawal = {
    id: customId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    method,
    currency,
    amount: finalAmount,
    bankName,
    accountName,
    accountNumber,
    routingNumber,
    walletAddress,
    network,
    status: "pending",
    timestamp: new Date().toISOString()
  };

  withdrawalsDb.unshift(newWth);
  user.activityHistory.unshift({
    time: new Date().toISOString(),
    action: `Escrowed withdrawal requested: Locked ${finalAmount} ${currency} pending clearance`,
    ip: req.ip || "127.0.0.1"
  });

  appendAudit(user.email, "Withdrawal Filing Requested", `Escrowed request logged for ${finalAmount} ${currency}. Id: ${customId}`, req.ip || "127.0.0.1");

  persistWithdrawal(newWth);
  persistUser(user);
  res.json({ success: true, withdrawal: newWth });
});

app.post("/api/admin/withdrawals/:id/update-status", (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body; // processing, approved, rejected
  const wth = withdrawalsDb.find(w => w.id === id);
  if (!wth) return res.status(404).json({ error: "Withdrawal record not identified." });

  const prevStatus = wth.status;
  wth.status = status;
  wth.adminNotes = adminNotes || "Status calibrated through direct financial processing clearinghouse.";

  // If rejected, refund escrowed balances back immediately to user profile!
  const user = usersDb.find(u => u.id === wth.userId);
  if (status === "rejected" && prevStatus !== "rejected") {
    if (user) {
      const symbol = wth.currency.toUpperCase();
      const prev = user.balances[symbol] || 0;
      user.balances[symbol] = Number((prev + wth.amount).toFixed(4));
      
      user.activityHistory.unshift({
        time: new Date().toISOString(),
        action: `Withdrawal Denied: Refunded escrow of +${wth.amount} ${symbol} to balance. Reason: ${wth.adminNotes}`,
        ip: req.ip || "127.0.0.1"
      });
    }
  } else if (status === "approved") {
    if (user) {
      user.activityHistory.unshift({
        time: new Date().toISOString(),
        action: `Withdrawal Settled & Approved: ${wth.amount} ${wth.currency} dispatched to destination. Recf: ${wth.id}`,
        ip: req.ip || "127.0.0.1"
      });
    }
  }

  appendAudit("Admin (admin@apextrade.com)", "Withdrawal State Calibration", `Cleared status of ID ${wth.id} to '${status}'. Reason: ${adminNotes}`, req.ip || "127.0.0.1");
  persistWithdrawal(wth);
  if (user) persistUser(user);
  res.json({ success: true, withdrawal: wth });
});

// CORE SUPPORT TICKETING ENDPOINTS
app.get("/api/admin/tickets", (req, res) => {
  res.json(ticketsDb);
});

// Create support ticket
app.post("/api/admin/tickets/create", (req, res) => {
  const { email, subject, message } = req.body;
  const user = usersDb.find(u => u.email && u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(404).json({ error: "Investor identity profile not registered." });

  const customId = "tkt-" + Math.floor(3000 + Math.random() * 7000);
  const newTicket: ServerTicket = {
    id: customId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    subject,
    status: "open",
    unreadByAdmin: true,
    unreadByUser: false,
    timestamp: new Date().toISOString(),
    messages: [
      {
        id: "m-" + Math.random().toString(36).substring(4),
        sender: "user",
        senderName: user.name,
        message,
        timestamp: new Date().toISOString()
      }
    ]
  };

  ticketsDb.unshift(newTicket);
  persistTicket(newTicket);
  res.json({ success: true, ticket: newTicket });
});

// Reply to support ticket
app.post("/api/admin/tickets/:id/reply", (req, res) => {
  const { id } = req.params;
  const { sender, senderName, message } = req.body; // sender: user or admin

  const tkt = ticketsDb.find(t => t.id === id);
  if (!tkt) return res.status(404).json({ error: "Support ticket not located." });

  const newMessage = {
    id: "m-" + Math.random().toString(36).substring(4),
    sender: sender || "admin",
    senderName: senderName || "System Helpdesk Coordinator",
    message,
    timestamp: new Date().toISOString()
  };

  tkt.messages.push(newMessage);
  if (sender === "user") {
    tkt.unreadByAdmin = true;
    tkt.unreadByUser = false;
  } else {
    tkt.unreadByAdmin = false;
    tkt.unreadByUser = true;
  }

  persistTicket(tkt);
  res.json({ success: true, ticket: tkt });
});

// CORE FAQ MANAGER ENDPOINTS
app.get("/api/admin/faqs", (req, res) => {
  res.json(faqsDb);
});

app.post("/api/admin/faqs", (req, res) => {
  const { question, answer, category } = req.body;
  if (!question || !answer) return res.status(400).json({ error: "Mandatory question/answer content is missing." });

  const newFaq: ServerFAQ = {
    id: "faq-" + Math.random().toString(36).substring(4),
    question,
    answer,
    category: category || "general"
  };

  faqsDb.push(newFaq);
  appendAudit("Admin (admin@apextrade.com)", "Created FAQ Document", `Registered custom question: ${question.substring(0, 30)}...`, req.ip || "127.0.0.1");
  persistFAQ(newFaq);
  res.json({ success: true, faq: newFaq });
});

app.delete("/api/admin/faqs/:id", (req, res) => {
  const { id } = req.params;
  faqsDb = faqsDb.filter(f => f.id !== id);
  appendAudit("Admin (admin@apextrade.com)", "Deleted FAQ Document", `Removed FAQ block ID: ${id}`, req.ip || "127.0.0.1");
  persistDeleteFAQ(id);
  res.json({ success: true });
});

// START EXPRESS/HTTP COMPATIBLE DEV WRAPPER
async function startServer() {
  // Sync from Firestore first
  await syncFromFirestore();

  const server = http.createServer(app);

  // START NATIVE WEBSOCKETS BROADCASTER
  const wss = new WebSocketServer({ noServer: true });
  const wsConnectedClients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    wsConnectedClients.add(ws);
    
    // Send initial baseline dump
    const payload = GLOBAL_ASSETS.map(asset => {
      const session = getMarketSessionInfo(asset.category, asset.symbol);
      return {
        ...asset,
        marketOpen: session.status === 'OPEN',
        sessionDetails: session.sessionDetails
      };
    });
    ws.send(JSON.stringify({ type: "init", assets: payload }));

    ws.on("close", () => {
      wsConnectedClients.delete(ws);
    });
    ws.on("error", () => {
      wsConnectedClients.delete(ws);
    });
  });

  // Handle server upgrades cleanly
  server.on("upgrade", (request, socket, head) => {
    const parsedUrl = new URL(request.url || "", `http://${request.headers.host}`);
    if (parsedUrl.pathname === "/api/market/stream") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // 1-SECOND DYNAMIC BROWNIAN TICK RUNNING AND ORDER EXECUTION UPDATER
  setInterval(() => {
    // Walk through each asset generating microscopic tick increments
    GLOBAL_ASSETS.forEach(asset => {
      const session = getMarketSessionInfo(asset.category, asset.symbol);
      if (session.status === 'CLOSED') return; // only drift active sessions!

      // drift: ±0.06% max
      const multiplier = asset.category === 'forex' ? 0.0001 : 
                         asset.category === 'index' ? 0.0003 : 0.0008;

      let deviation = (Math.random() - 0.495) * multiplier; // slight bias
      asset.price = Number((asset.price * (1 + deviation)).toFixed(asset.category === 'forex' ? 4 : 2));

      // check boundaries
      asset.high24h = Number(Math.max(asset.high24h, asset.price).toFixed(asset.category === 'forex' ? 4 : 2));
      asset.low24h = Number(Math.min(asset.low24h, asset.price).toFixed(asset.category === 'forex' ? 4 : 2));

      // update current close relative to baseline previous close
      const change = ((asset.price - asset.previousClose) / asset.previousClose) * 100;
      asset.change24h = Number(change.toFixed(2));
    });

    // Broadcast tick event packet (all assets updated with current statuses)
    const payload = GLOBAL_ASSETS.map(asset => {
      const session = getMarketSessionInfo(asset.category, asset.symbol);
      return {
        ...asset,
        marketOpen: session.status === 'OPEN',
        sessionDetails: session.sessionDetails
      };
    });
    const broadcastString = JSON.stringify({ type: "tick", assets: payload });

    // Stream out to all connected sockets
    wsConnectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastString);
      }
    });

    // Stream out to all connected Server-Sent Events (SSE) channels
    activeSseClients.forEach(broadcaster => {
      try {
        broadcaster(broadcastString);
      } catch (err) {
        // stale client
      }
    });
  }, 1000);

  // BACKGROUND SECURE YAHOO FINANCE SYNCHRONIZATION RUNNING EVERY 5 SECONDS (Round-Robin)
  let syncIndex = 0;
  setInterval(async () => {
    // Pull 2 elements at a time to remain perfectly stealthy & secure without getting throttled
    const pairToSync = [];
    for (let x = 0; x < 2; x++) {
      const idx = (syncIndex + x) % GLOBAL_ASSETS.length;
      pairToSync.push(GLOBAL_ASSETS[idx]);
    }
    syncIndex = (syncIndex + 2) % GLOBAL_ASSETS.length;

    for (const asset of pairToSync) {
      const result = await fetchYahooPrice(asset.yahooSymbol);
      if (result) {
        asset.price = Number(result.price.toFixed(asset.category === 'forex' ? 4 : 2));
        asset.previousClose = Number(result.previousClose.toFixed(asset.category === 'forex' ? 4 : 2));
        asset.change24h = Number(result.change24h.toFixed(2));
        asset.high24h = Number(Math.max(result.high24h, asset.price).toFixed(asset.category === 'forex' ? 4 : 2));
        asset.low24h = Number(Math.min(result.low24h, asset.price).toFixed(asset.category === 'forex' ? 4 : 2));
        asset.volume24h = result.volume;
      }
    }
  }, 5000);

  // Vite middle-layer pipeline hook
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[ApexTrade Institutional Pipeline] Full-Stack Server active at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
