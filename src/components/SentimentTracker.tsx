/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Activity, 
  Sparkles,
  RefreshCw,
  Globe,
  TrendingUp,
  TrendingDown,
  Newspaper,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { Asset } from '../types';

interface SentimentTrackerProps {
  selectedAsset: Asset;
}

interface SourceGauge {
  positive: number;
  neutral: number;
  negative: number;
}

interface FeedItem {
  id: string;
  source: 'X / Twitter' | 'Reddit / Forums' | 'Telegram Chat' | 'Bloomberg News' | 'Reuters Finance' | 'CNBC Market';
  type: 'social' | 'news';
  userOrAuthor: string;
  avatarText: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  replies: number;
  time: string;
}

// 1. High-fidelity custom dataset of platform sentiment ratios and live posts/headlines per symbol
const SENTIMENT_DATABASE: Record<string, { gauges: Record<string, SourceGauge>; feeds: FeedItem[] }> = {
  BTC: {
    gauges: {
      social_x: { positive: 78, neutral: 14, negative: 8 },
      social_reddit: { positive: 70, neutral: 20, negative: 10 },
      social_telegram: { positive: 85, neutral: 10, negative: 5 },
      financial_news: { positive: 65, neutral: 25, negative: 10 }
    },
    feeds: [
      {
        id: 'btc-1',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@CryptoBull_Alpha',
        avatarText: 'CB',
        text: 'Accumulating more #BTC spots here. Volume is consolidating perfectly. EMA golden crossover printing on the 4H charts. Send it! 🚀',
        sentiment: 'positive',
        likes: 184,
        replies: 24,
        time: '4m'
      },
      {
        id: 'btc-2',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Macro Analyst Team',
        avatarText: 'BB',
        text: 'Fidelity and BlackRock spot Bitcoin ETFs record largest daily inflows in 5 weeks, totaling $342M, signaling strong institutional backing.',
        sentiment: 'positive',
        likes: 245,
        replies: 18,
        time: '12m'
      },
      {
        id: 'btc-3',
        source: 'Reddit / Forums',
        type: 'social',
        userOrAuthor: 'u/HODL_Commander',
        avatarText: 'HC',
        text: 'We are officially testing the critical support line at $68K. Historically, consolidation at these levels precedes an explosive supply shock. Put on your seatbelts.',
        sentiment: 'positive',
        likes: 92,
        replies: 12,
        time: '18m'
      },
      {
        id: 'btc-4',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Regulatory Monitor',
        avatarText: 'RT',
        text: 'US SEC delays decision on spot options listings, prompting debate among institutional liquidity providers on near-term derivatives hedging costs.',
        sentiment: 'neutral',
        likes: 54,
        replies: 7,
        time: '45m'
      }
    ]
  },
  ETH: {
    gauges: {
      social_x: { positive: 64, neutral: 24, negative: 12 },
      social_reddit: { positive: 58, neutral: 30, negative: 12 },
      social_telegram: { positive: 68, neutral: 22, negative: 10 },
      financial_news: { positive: 60, neutral: 32, negative: 8 }
    },
    feeds: [
      {
        id: 'eth-1',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@DeFi_Sage_Ethereum',
        avatarText: 'DS',
        text: 'Ethereum gas fees hit multi-year lows. L2 networks are consuming peak transactions while mainnet remains cheap. Absolute goldmine for DApp developers! 💎',
        sentiment: 'positive',
        likes: 142,
        replies: 31,
        time: '6m'
      },
      {
        id: 'eth-2',
        source: 'CNBC Market',
        type: 'news',
        userOrAuthor: 'Ecosystem Desk',
        avatarText: 'CN',
        text: 'Over 27.5% of total Ethereum supply is now locked inside smart contract staking validation, locking float supply against institutional futures demand.',
        sentiment: 'positive',
        likes: 112,
        replies: 9,
        time: '24m'
      },
      {
        id: 'eth-3',
        source: 'Reddit / Forums',
        type: 'social',
        userOrAuthor: 'u/Gwei_Watcher',
        avatarText: 'GW',
        text: 'L2 volume rollup summaries are outstanding, but bloat fees on base layer remain lower than expected due to Blob space excess. Staking yields are stable though.',
        sentiment: 'neutral',
        likes: 47,
        replies: 15,
        time: '1h'
      },
      {
        id: 'eth-4',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Regulatory Division',
        avatarText: 'BB',
        text: 'Consensys claims legal clarity on spot ETH ecosystem status after SEC terminates its secondary investigation. Bullish momentum expected.',
        sentiment: 'positive',
        likes: 312,
        replies: 41,
        time: '2h'
      }
    ]
  },
  SOL: {
    gauges: {
      social_x: { positive: 88, neutral: 8, negative: 4 },
      social_reddit: { positive: 82, neutral: 12, negative: 6 },
      social_telegram: { positive: 90, neutral: 7, negative: 3 },
      financial_news: { positive: 75, neutral: 20, negative: 5 }
    },
    feeds: [
      {
        id: 'sol-1',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@SolanaBreakout',
        avatarText: 'SB',
        text: 'DEX trading volume on Solana is officially flipping Ethereum mainnet regularly. Low transaction latency and sub-penny fees are attracting 90%+ of active retail traders. $SOL to $250 is inevitable! 🔥📊',
        sentiment: 'positive',
        likes: 412,
        replies: 62,
        time: '2m'
      },
      {
        id: 'sol-2',
        source: 'Telegram Chat',
        type: 'social',
        userOrAuthor: '@SolAlpha_Callers',
        avatarText: 'SA',
        text: 'Solana developers deploy hotfix v1.18 to address local congestion. Validators report instant 25% throughput optimization. Dev activities are booming.',
        sentiment: 'positive',
        likes: 198,
        replies: 28,
        time: '11m'
      },
      {
        id: 'sol-3',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Fintech Monitor',
        avatarText: 'BB',
        text: 'Several investment syndicates file initial S-1 proposals for spot Solana ETFs, raising immediate optimism despite regulatory headwinds.',
        sentiment: 'positive',
        likes: 350,
        replies: 48,
        time: '34m'
      },
      {
        id: 'sol-4',
        source: 'Reddit / Forums',
        type: 'social',
        userOrAuthor: 'u/Degen_Scout',
        avatarText: 'DS',
        text: 'Crazy volume in liquidity pools on Raydium. Meme token surges might feel chaotic, but the sheer transaction gas burnt proves Solana network utility is a titan.',
        sentiment: 'positive',
        likes: 85,
        replies: 23,
        time: '50m'
      }
    ]
  },
  BNB: {
    gauges: {
      social_x: { positive: 58, neutral: 35, negative: 7 },
      social_reddit: { positive: 60, neutral: 30, negative: 10 },
      social_telegram: { positive: 65, neutral: 28, negative: 7 },
      financial_news: { positive: 50, neutral: 40, negative: 10 }
    },
    feeds: [
      {
        id: 'bnb-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Web3 Analyst Desk',
        avatarText: 'BB',
        text: 'Binance announces its 62nd sequential Launchpool project, encouraging BNB staking locking parameters. Historically, BNB rises 4-6% leading into snapshot hours.',
        sentiment: 'positive',
        likes: 154,
        replies: 12,
        time: '15m'
      },
      {
        id: 'bnb-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@BinanceEcosystem',
        avatarText: 'BE',
        text: 'BNB Chain active daily addresses climb +14% week-on-week, fueled by cheap layer-2 opBNB gas scaling structures. Staking is a fortress of utility.',
        sentiment: 'positive',
        likes: 210,
        replies: 19,
        time: '30m'
      },
      {
        id: 'bnb-3',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Legal & Markets Monitor',
        avatarText: 'RT',
        text: 'Regulators verify compliance structure revisions at Binance Holdings, clarifying the operating runway for utility staking elements.',
        sentiment: 'neutral',
        likes: 92,
        replies: 11,
        time: '2h'
      }
    ]
  },
  AAPL: {
    gauges: {
      social_x: { positive: 68, neutral: 25, negative: 7 },
      social_reddit: { positive: 65, neutral: 28, negative: 7 },
      social_telegram: { positive: 55, neutral: 38, negative: 7 },
      financial_news: { positive: 72, neutral: 22, negative: 6 }
    },
    feeds: [
      {
        id: 'aapl-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Tech Hardware Lead',
        avatarText: 'BB',
        text: 'Apple is in advanced partner talks with top-tier generative AI providers to integrate secure on-device neural processing models inside iOS 18 systems.',
        sentiment: 'positive',
        likes: 310,
        replies: 24,
        time: '8m'
      },
      {
        id: 'aapl-2',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Consumer Market Index',
        avatarText: 'RT',
        text: 'China smartphone retail shipments rebound +5.2% in April, alleviating intermediate concerns of Apple hardware market shares erosion.',
        sentiment: 'positive',
        likes: 178,
        replies: 14,
        time: '25m'
      },
      {
        id: 'aapl-3',
        source: 'Reddit / Forums',
        type: 'social',
        userOrAuthor: 'u/ValueLineTrader',
        avatarText: 'VL',
        text: 'AAPL continues to maintain a defensive powerhouse profile. With custom software releases this fall, it might run to fresh highs. Under-allocated portfolio warning!',
        sentiment: 'positive',
        likes: 64,
        replies: 12,
        time: '1h'
      }
    ]
  },
  TSLA: {
    gauges: {
      social_x: { positive: 38, neutral: 32, negative: 30 },
      social_reddit: { positive: 25, neutral: 35, negative: 40 },
      social_telegram: { positive: 40, neutral: 30, negative: 30 },
      financial_news: { positive: 28, neutral: 42, negative: 30 }
    },
    feeds: [
      {
        id: 'tsla-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Automotive Sector Chief',
        avatarText: 'BB',
        text: 'Tesla global delivery estimates dip amid supply-chain bottlenecks and elevated interest rates across core Western EV markets.',
        sentiment: 'negative',
        likes: 195,
        replies: 42,
        time: '14m'
      },
      {
        id: 'tsla-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@TeslaMacroTrend',
        avatarText: 'TM',
        text: 'Elon Musk announces acceleration of the sub-$25K next-gen EV compact platform design. Production timeline pulled forward to late 2025. Massive capacity gamechanger! ⚡🚗',
        sentiment: 'positive',
        likes: 489,
        replies: 112,
        time: '20m'
      },
      {
        id: 'tsla-3',
        source: 'CNBC Market',
        type: 'news',
        userOrAuthor: 'Equities Strategy',
        avatarText: 'CN',
        text: 'Multiple Wall Street firms adjust TSLA price targets down to $170 ahead of margins audits, citing intense price competitions from Chinese EV peers.',
        sentiment: 'negative',
        likes: 124,
        replies: 31,
        time: '55m'
      },
      {
        id: 'tsla-4',
        source: 'Reddit / Forums',
        type: 'social',
        userOrAuthor: 'u/Bullish_Elonist',
        avatarText: 'BE',
        text: 'Do not ignore Tesla Energy division. Utility megapack storage deployments are growing at a 130% CAGR. EV margin contraction is just short term noise.',
        sentiment: 'positive',
        likes: 110,
        replies: 19,
        time: '2h'
      }
    ]
  },
  NVDA: {
    gauges: {
      social_x: { positive: 93, neutral: 5, negative: 2 },
      social_reddit: { positive: 90, neutral: 8, negative: 2 },
      social_telegram: { positive: 94, neutral: 4, negative: 2 },
      financial_news: { positive: 88, neutral: 10, negative: 2 }
    },
    feeds: [
      {
        id: 'nvda-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Semiconductor Lead',
        avatarText: 'BB',
        text: 'Hyperscalers (Google, Microsoft, Meta) prepare record $150B capital expenditure budgets to purchase next-gen Blackwell GPU series, proving AI hardware demand is non-stop.',
        sentiment: 'positive',
        likes: 512,
        replies: 55,
        time: '5m'
      },
      {
        id: 'nvda-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@Nvidia_HyperGrowth',
        avatarText: 'NH',
        text: 'Another blowout analyst consensus! NVDA is target rated $1,050. The gross operational margins are sitting high at 76%. Absolute money-printing machine! 💸🔥🚀',
        sentiment: 'positive',
        likes: 384,
        replies: 41,
        time: '18m'
      },
      {
        id: 'nvda-3',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Tech Industry Desk',
        avatarText: 'RT',
        text: 'Sovereign nations initiate dedicated domestic AI cloud builds, creating a localized secondary source of multi-billion purchase agreements for Hopper hardware.',
        sentiment: 'positive',
        likes: 167,
        replies: 11,
        time: '40m'
      }
    ]
  },
  MSFT: {
    gauges: {
      social_x: { positive: 75, neutral: 21, negative: 4 },
      social_reddit: { positive: 72, neutral: 24, negative: 4 },
      social_telegram: { positive: 70, neutral: 26, negative: 4 },
      financial_news: { positive: 78, neutral: 18, negative: 4 }
    },
    feeds: [
      {
        id: 'msft-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Enterprise Tech Analyst',
        avatarText: 'BB',
        text: 'Microsoft Copilot enterprise subscriptions exceed projections by 18%, displaying immense monetization capabilities inside Office suite products.',
        sentiment: 'positive',
        likes: 210,
        replies: 16,
        time: '10m'
      },
      {
        id: 'msft-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@Azure_CloudScale',
        avatarText: 'AC',
        text: 'Azure cloud growth is picking up speed (+31% YoY). Consistently taking market shares away from AWS as commercial enterprise workloads run on Microsoft clusters. MSFT is bulletproof.',
        sentiment: 'positive',
        likes: 147,
        replies: 12,
        time: '35m'
      }
    ]
  },
  SPACE: {
    gauges: {
      social_x: { positive: 92, neutral: 6, negative: 2 },
      social_reddit: { positive: 88, neutral: 10, negative: 2 },
      social_telegram: { positive: 90, neutral: 8, negative: 2 },
      financial_news: { positive: 85, neutral: 12, negative: 3 }
    },
    feeds: [
      {
        id: 'space-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Aerospace Ledger',
        avatarText: 'BB',
        text: 'SpaceX pre-IPO trading surges on secondary markets as valuation crosses $180B. Investors are expecting a public listing IPO price of $195.00 before year-end.',
        sentiment: 'positive',
        likes: 312,
        replies: 45,
        time: '5m'
      },
      {
        id: 'space-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@Starship_Hype',
        avatarText: 'SH',
        text: 'The private pricing for SpaceX stock at $135.20 is a steal! Multiple brokerage firms report massive queues. Once this goes public, underwriters expect a retail premium push above $200.',
        sentiment: 'positive',
        likes: 521,
        replies: 89,
        time: '14m'
      },
      {
        id: 'space-3',
        source: 'CNBC Market',
        type: 'news',
        userOrAuthor: 'IPO Desk Reporter',
        avatarText: 'CN',
        text: 'SpaceX institutional tenders allow secondary liquid clearance. High interest from sovereign wealth funds keeps pre-IPO allocations under tight lock.',
        sentiment: 'positive',
        likes: 188,
        replies: 24,
        time: '40m'
      }
    ]
  },
  OPENAI: {
    gauges: {
      social_x: { positive: 89, neutral: 7, negative: 4 },
      social_reddit: { positive: 81, neutral: 12, negative: 7 },
      social_telegram: { positive: 84, neutral: 11, negative: 5 },
      financial_news: { positive: 88, neutral: 8, negative: 4 }
    },
    feeds: [
      {
        id: 'openai-1',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Frontier Tech Bureau',
        avatarText: 'RT',
        text: 'OpenAI targets a massive $150 Billion valuation step in upcoming pre-IPO tender. Anticipated public listing targets are rumored strictly in the $210.00 area.',
        sentiment: 'positive',
        likes: 294,
        replies: 38,
        time: '8m'
      },
      {
        id: 'openai-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@GPT_Innovator',
        avatarText: 'GI',
        text: 'OpenAI has secondary trading volume rivaling established tech public equities. Pricing at $154.50 reflects a minor premium but wait until GPT-5 triggers the institutional board approval!',
        sentiment: 'positive',
        likes: 412,
        replies: 62,
        time: '23m'
      },
      {
        id: 'openai-3',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Venture Capital Monitor',
        avatarText: 'BB',
        text: 'Anthropic and OpenAI tender offers attract record capital. Tech analysts maintain that private shares are heavily supply-constrained relative to global demand pools.',
        sentiment: 'positive',
        likes: 195,
        replies: 15,
        time: '1h'
      }
    ]
  },
  STRIP: {
    gauges: {
      social_x: { positive: 82, neutral: 14, negative: 4 },
      social_reddit: { positive: 79, neutral: 16, negative: 5 },
      social_telegram: { positive: 75, neutral: 20, negative: 5 },
      financial_news: { positive: 85, neutral: 12, negative: 3 }
    },
    feeds: [
      {
        id: 'strip-1',
        source: 'CNBC Market',
        type: 'news',
        userOrAuthor: 'Fintech Monitor',
        avatarText: 'CN',
        text: 'Stripe Co-founders express neutral stance on scheduling immediate listing, but secondary market transactions steady at $28.40 per share with an expected listing reference tag of $38.50.',
        sentiment: 'positive',
        likes: 140,
        replies: 12,
        time: '15m'
      },
      {
        id: 'strip-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@Fintech_Watcher',
        avatarText: 'FW',
        text: 'Stripe processing $1 Trillion in total payment volume makes its pre-IPO valuation at $65B seem unbelievably attractive. Secondary allocations are trading with heavy buy pressure.',
        sentiment: 'positive',
        likes: 198,
        replies: 23,
        time: '50m'
      }
    ]
  },
  XAU: {
    gauges: {
      social_x: { positive: 82, neutral: 15, negative: 3 },
      social_reddit: { positive: 80, neutral: 17, negative: 3 },
      social_telegram: { positive: 75, neutral: 22, negative: 3 },
      financial_news: { positive: 82, neutral: 16, negative: 2 }
    },
    feeds: [
      {
        id: 'xau-1',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'Precious Metals Desk',
        avatarText: 'RT',
        text: 'Global central banks record historically high physical gold acquisitions, seeking defensive hedges against geopolitical escalations and hyper-liquidity expansions.',
        sentiment: 'positive',
        likes: 312,
        replies: 24,
        time: '20m'
      },
      {
        id: 'xau-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@GoldMacroBull',
        avatarText: 'GM',
        text: 'Gold spot levels holding $2,420 key support beautifully during treasury yield corrections. Defending purchasing power against state fiat debasement. $2,600 is next! 🪙📈',
        sentiment: 'positive',
        likes: 254,
        replies: 33,
        time: '1h'
      }
    ]
  },
  XAG: {
    gauges: {
      social_x: { positive: 72, neutral: 22, negative: 6 },
      social_reddit: { positive: 75, neutral: 20, negative: 5 },
      social_telegram: { positive: 70, neutral: 25, negative: 5 },
      financial_news: { positive: 70, neutral: 24, negative: 6 }
    },
    feeds: [
      {
        id: 'xag-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Industrial Commodities',
        avatarText: 'BB',
        text: 'Solar photovoltaic sector reports record manufacturing capacity additions, boosting global industrial silver paste demand by +18% year-on-year.',
        sentiment: 'positive',
        likes: 134,
        replies: 15,
        time: '45m'
      },
      {
        id: 'xag-2',
        source: 'X / Twitter',
        type: 'social',
        userOrAuthor: '@SilverSqueeze_Index',
        avatarText: 'SS',
        text: 'Silver inventories inside registered COMEX vaults drop to lowest level since 2018. Pure physical supply deficit is real. Silver is heavily undervalued relative to gold historical ratio of 80:1.',
        sentiment: 'positive',
        likes: 284,
        replies: 50,
        time: '2h'
      }
    ]
  },
  WTI: {
    gauges: {
      social_x: { positive: 40, neutral: 45, negative: 15 },
      social_reddit: { positive: 35, neutral: 50, negative: 15 },
      social_telegram: { positive: 45, neutral: 45, negative: 10 },
      financial_news: { positive: 32, neutral: 53, negative: 15 }
    },
    feeds: [
      {
        id: 'wti-1',
        source: 'Bloomberg News',
        type: 'news',
        userOrAuthor: 'Energy Intelligence Desk',
        avatarText: 'BB',
        text: 'Oil prices ease near $78.40 following an unexpected surge in domestic crude stocks reporting in US energy inventory sheets.',
        sentiment: 'neutral',
        likes: 98,
        replies: 12,
        time: '30m'
      },
      {
        id: 'wti-2',
        source: 'Reuters Finance',
        type: 'news',
        userOrAuthor: 'OPEC Reporter Team',
        avatarText: 'RT',
        text: 'OPEC members discuss potential timeline extension on current voluntary production supply cuts of 2.2M bpd, attempting to stabilize crude benchmarks.',
        sentiment: 'neutral',
        likes: 112,
        replies: 14,
        time: '1h'
      }
    ]
  }
};

export default function SentimentTracker({ selectedAsset }: SentimentTrackerProps) {
  // Navigation Source Filter Tab
  const [activeSourceFilter, setActiveSourceFilter] = useState<'ALL' | 'SOCIAL' | 'NEWS'>('ALL');

  // Voting states
  const [voteType, setVoteType] = useState<'UP' | 'DOWN' | null>(null);
  const [bullCount, setBullCount] = useState(selectedAsset.communityPollBullish);
  const [bearCount, setBearCount] = useState(100 - selectedAsset.communityPollBullish);
  
  // Gemini sentiment states
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiReport, setGeminiReport] = useState<string>('');

  // Auto-reset state when active asset symbol shifts
  useEffect(() => {
    setVoteType(null);
    setBullCount(selectedAsset.communityPollBullish);
    setBearCount(100 - selectedAsset.communityPollBullish);
    setGeminiReport('');
  }, [selectedAsset.symbol, selectedAsset.communityPollBullish]);

  const triggerGeminiSentiment = async () => {
    setIsLoadingGemini(true);
    setGeminiReport('');

    try {
      const response = await fetch("/api/gemini/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          category: selectedAsset.category
        })
      });

      const data = await response.json();
      setGeminiReport(data.sentimentDetails || 'No dynamic sentiment summarized.');
    } catch (error) {
      console.error(error);
      setGeminiReport("Failed to contact the remote Gemini Cognitive API. Check server console or secrets configurations.");
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const handleVote = (v: 'UP' | 'DOWN') => {
    if (voteType) return; // already voted
    setVoteType(v);
    if (v === 'UP') {
      setBullCount(prev => prev + 1);
    } else {
      setBearCount(prev => prev + 1);
    }
  };

  // Get active asset's customized sentiment profile
  const assetProfile = SENTIMENT_DATABASE[selectedAsset.symbol] || {
    gauges: {
      social_x: { positive: 65, neutral: 25, negative: 10 },
      social_reddit: { positive: 60, neutral: 25, negative: 15 },
      social_telegram: { positive: 70, neutral: 20, negative: 10 },
      financial_news: { positive: 55, neutral: 35, negative: 10 }
    },
    feeds: [
      {
        id: `gen-1`,
        source: 'X / Twitter' as const,
        type: 'social' as const,
        userOrAuthor: '@GlobalCapital_Signals',
        avatarText: 'GC',
        text: `Social mentions and order-book depth for #${selectedAsset.symbol} consolidating cleanly in positive support structures before macro triggers.`,
        sentiment: 'positive' as const,
        likes: 64,
        replies: 8,
        time: '5m'
      },
      {
        id: `gen-2`,
        source: 'Bloomberg News' as const,
        type: 'news' as const,
        userOrAuthor: 'Asset Valuation Team',
        avatarText: 'BB',
        text: `Market liquidity report suggests consistent spot purchasing velocity for ${selectedAsset.name} index contracts.`,
        sentiment: 'neutral' as const,
        likes: 121,
        replies: 10,
        time: '20m'
      }
    ]
  };

  // Filter the customized high density news/social feeds
  const filteredFeeds = assetProfile.feeds.filter(item => {
    if (activeSourceFilter === 'SOCIAL') return item.type === 'social';
    if (activeSourceFilter === 'NEWS') return item.type === 'news';
    return true; // ALL
  });

  return (
    <div id="sentiment-matrix-card" className="bg-[#181A20] border border-[#2B2F36] rounded-xl p-4 shadow-xl space-y-5">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2B2F36] pb-3 gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block mb-0.5 font-mono uppercase tracking-wider">Apex Mentality Matrix</span>
          <span className="text-base font-extrabold text-[#EAECEF] flex items-center gap-2 font-sans">
            <Activity size={18} className="text-[#FCD535] animate-pulse" />
            Social Sentiment Analyst Radar
          </span>
        </div>

        {/* Query server-side Gemini API for instant comprehensive report */}
        <button
          onClick={triggerGeminiSentiment}
          disabled={isLoadingGemini}
          className="px-3.5 py-1.5 bg-gradient-to-r from-[#FCD535] to-[#E0C02E] hover:from-[#E0C02E] hover:to-[#FCD535] disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-lg tracking-tight shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isLoadingGemini ? (
            <>
              <RefreshCw size={12} className="animate-spin text-slate-950" /> Auditing Channels...
            </>
          ) : (
            <>
              <Sparkles size={12} className="text-slate-950 animate-pulse" /> Query Gemini Sentiment AI
            </>
          )}
        </button>
      </div>

      {/* EXPANDED GEMINI RESPONSE BLOCK */}
      {geminiReport && (
        <div className="bg-[#0B0E11] border border-[#2B2F36] rounded-xl p-4 space-y-2 font-mono text-xs text-slate-300 animate-slide-up">
          <div className="flex justify-between items-center text-[10px] text-[#FCD535] border-b border-[#2B2F36] pb-2 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles size={11} /> REAL-TIME COGNITIVE INTELLIGENCE REPORT
            </span>
            <span className="text-slate-500 font-normal">Provider: Gemini AI 3.5</span>
          </div>
          <div className="space-y-2 leading-relaxed whitespace-pre-line text-slate-200">
            {geminiReport}
          </div>
        </div>
      )}

      {/* GAUGES BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Gauge 1: Public Sentiment Index Score */}
        <div className="bg-[#0B0E11]/40 p-3.5 rounded-xl border border-[#2B2F36] flex flex-col justify-between h-full gap-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-500 block uppercase text-[9px] font-bold font-mono">GLOBAL SENTIMENT SCORE</span>
              <span className="text-[#EAECEF] text-sm font-extrabold">{selectedAsset.sentimentLabel}</span>
            </div>
            {/* Index Trend indicator */}
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
              selectedAsset.sentimentScore >= 70 ? 'bg-[#02C076]/10 text-[#02C076]' :
              selectedAsset.sentimentScore >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-[#F84960]/10 text-[#F84960]'
            }`}>
              {selectedAsset.sentimentScore >= 50 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {selectedAsset.sentimentScore >= 70 ? 'Upward Trend' : selectedAsset.sentimentScore >= 50 ? 'Steady' : 'Downward risk'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular progress simulated visual bar */}
            <div className="relative w-16 h-16 flex-shrink-0 flex justify-center items-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-500 ${
                    selectedAsset.sentimentScore >= 70 ? 'text-[#02C076]' :
                    selectedAsset.sentimentScore >= 50 ? 'text-[#FCD535]' : 'text-[#F84960]'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray={`${selectedAsset.sentimentScore}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-black text-white font-mono">{selectedAsset.sentimentScore}</span>
            </div>
            
            <div className="font-mono text-[10px] text-slate-400 leading-snug space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#02C076]"></span>
                <span>Positive momentum signal</span>
              </div>
              <p>Aggregated indices of Bloomberg reports and direct platform chatter models.</p>
            </div>
          </div>
        </div>

        {/* Gauge 2: Community Starcraft Voting Poll */}
        <div className="bg-[#0B0E11]/40 p-3.5 rounded-xl border border-[#2B2F36] flex flex-col justify-between h-full gap-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-500 uppercase text-[9px] font-bold">COMMUNITY VOTE MARKET INDEX</span>
            <span className="text-white font-bold">{Math.round((bullCount / (bullCount + bearCount)) * 100)}% Bull</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div 
                className="bg-[#02C076] h-full transition-all duration-300" 
                style={{ width: `${(bullCount / (bullCount + bearCount)) * 100}%` }} 
              />
              <div 
                className="bg-[#F84960] h-full transition-all duration-300" 
                style={{ width: `${(bearCount / (bullCount + bearCount)) * 100}%` }} 
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><ThumbsUp size={10} className="text-[#02C076]" /> {bullCount} Bulls</span>
              <span className="flex items-center gap-1"><ThumbsDown size={10} className="text-[#F84960]" /> {bearCount} Bears</span>
            </div>
          </div>

          {voteType ? (
            <div className="text-[10px] text-[#02C076] text-center font-bold bg-[#02C076]/10 py-1 rounded border border-[#02C076]/10 font-mono">
              ✓ Registered. Thank you for voting!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                id="vote-bullish"
                onClick={() => handleVote('UP')}
                className="py-1 px-2.5 bg-[#02C076]/10 hover:bg-[#02C076]/25 text-[#02C076] border border-[#02C076]/10 hover:border-[#02C076]/30 rounded font-mono text-[10px] cursor-pointer transition-colors"
              >
                ▲ Bully Up
              </button>
              <button
                type="button"
                id="vote-bearish"
                onClick={() => handleVote('DOWN')}
                className="py-1 px-2.5 bg-[#F84960]/10 hover:bg-[#F84960]/25 text-[#F84960] border border-[#F84960]/10 hover:border-[#F84960]/30 rounded font-mono text-[10px] cursor-pointer transition-colors"
              >
                ▼ Beary Down
              </button>
            </div>
          )}
        </div>

        {/* Gauge 3: Cross-Channel Analytically Aggregated Percentages */}
        <div className="bg-[#0B0E11]/40 p-3.5 rounded-xl border border-[#2B2F36] space-y-2 text-xs font-mono">
          <span className="text-slate-500 uppercase text-[9px] font-bold block">CROSS-CHANNEL ACCURACY GAUGE</span>
          
          <div className="space-y-1.5 text-[10px]">
            {/* X */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-400">
                <span>X / Twitter</span>
                <span className="text-[#02C076]">{assetProfile.gauges.social_x.positive}% Positive</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#02C076] h-full" style={{ width: `${assetProfile.gauges.social_x.positive}%` }} />
                <div className="bg-slate-600 h-full" style={{ width: `${assetProfile.gauges.social_x.neutral}%` }} />
                <div className="bg-[#F84960] h-full" style={{ width: `${assetProfile.gauges.social_x.negative}%` }} />
              </div>
            </div>

            {/* Reddit */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-400">
                <span>Reddit / Forums</span>
                <span className="text-[#02C076]">{assetProfile.gauges.social_reddit.positive}% Positive</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#02C076] h-full" style={{ width: `${assetProfile.gauges.social_reddit.positive}%` }} />
                <div className="bg-slate-600 h-full" style={{ width: `${assetProfile.gauges.social_reddit.neutral}%` }} />
                <div className="bg-[#F84960] h-full" style={{ width: `${assetProfile.gauges.social_reddit.negative}%` }} />
              </div>
            </div>

            {/* Financial News */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-slate-400">
                <span>Financial News outlets</span>
                <span className="text-[#02C076]">{assetProfile.gauges.financial_news.positive}% Positive</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#02C076] h-full" style={{ width: `${assetProfile.gauges.financial_news.positive}%` }} />
                <div className="bg-slate-600 h-full" style={{ width: `${assetProfile.gauges.financial_news.neutral}%` }} />
                <div className="bg-[#F84960] h-full" style={{ width: `${assetProfile.gauges.financial_news.negative}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHATTER FEED & HEADLINES */}
      <div className="space-y-3.5 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs font-bold text-slate-300 block font-mono">
            Analyzed Channels Intel Feed (#{selectedAsset.symbol})
          </span>

          {/* Source Tabs selectors */}
          <div className="bg-[#0B0E11] rounded-lg border border-[#2B2F36] p-0.5 flex">
            {[
              { id: 'ALL', label: 'All Channels', icon: Globe },
              { id: 'SOCIAL', label: 'Social Networks', icon: MessageCircle },
              { id: 'NEWS', label: 'Financial Media', icon: Newspaper }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSourceFilter(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                  activeSourceFilter === tab.id 
                    ? 'bg-[#FCD535] text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={11} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FEED LIST SCROLLER */}
        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {filteredFeeds.length > 0 ? (
            filteredFeeds.map((feed) => (
              <div 
                key={feed.id} 
                className="bg-[#0B0E11] border border-[#2B2F36] p-3.5 rounded-xl space-y-2 hover:border-slate-700 transition-all text-xs"
              >
                {/* Header detail */}
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-2">
                    {/* Source Tag Badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      feed.type === 'social' ? 'bg-[#FCD535]/15 text-[#FCD535]' : 'bg-cyan-500/15 text-cyan-400'
                    }`}>
                      {feed.source}
                    </span>
                    <span className="font-bold text-slate-300">{feed.userOrAuthor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Individual Sentiment tag */}
                    <span className={`px-1.5 py-0.5 rounded-[3px] text-[8px] font-mono uppercase font-black ${
                      feed.sentiment === 'positive' ? 'bg-[#02C076]/10 text-[#02C076]' :
                      feed.sentiment === 'negative' ? 'bg-[#F84960]/10 text-[#F84960]' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {feed.sentiment}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] italic">{feed.time} ago</span>
                  </div>
                </div>

                {/* Content body */}
                <p className="text-slate-200 leading-relaxed font-sans mt-1 text-[11px]">
                  {feed.text}
                </p>

                {/* Footer interactive actions */}
                <div className="flex gap-4 text-slate-500 font-mono text-[10px] pt-1 items-center">
                  <div className="flex items-center gap-1 hover:text-[#02C076] transition-colors cursor-pointer">
                    <Heart size={11} className="text-slate-500 hover:text-[#02C076]" /> {feed.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={11} /> {feed.replies}
                  </div>
                  <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer">
                    <Share2 size={11} /> Pin & Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-500 font-mono border border-dashed border-[#2B2F36] rounded-xl">
              <Info size={18} className="mx-auto mb-2 text-slate-600" />
              No analyzed articles match the "{activeSourceFilter}" filter for #{selectedAsset.symbol}.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
