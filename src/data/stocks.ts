export type Stock = {
  id: string
  /** Ticker sent to /api/chart */
  symbol: string
  name: string
  /** Fallback quote while the first live fetch is in flight or if it fails */
  basePrice: number
  changePercent: number
  blurb: string
}

export const stocks: Stock[] = [
  {
    id: 'spy',
    symbol: 'SPY',
    name: 'S&P 500',
    basePrice: 764.29,
    changePercent: 0.85,
    blurb: 'Tracks the 500 largest US companies in one share (via the SPY ETF).',
  },
  {
    id: 'aapl',
    symbol: 'AAPL',
    name: 'Apple',
    basePrice: 228.5,
    changePercent: 0.42,
    blurb: 'Consumer hardware and services with recurring revenue.',
  },
  {
    id: 'tsla',
    symbol: 'TSLA',
    name: 'Tesla',
    basePrice: 248.75,
    changePercent: -0.31,
    blurb: 'EV and energy; higher beta than mega-cap peers.',
  },
  {
    id: 'pltr',
    symbol: 'PLTR',
    name: 'Palantir',
    basePrice: 26.4,
    changePercent: 0.19,
    blurb: 'Enterprise software for data integration and analytics.',
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    name: 'Nvidia',
    basePrice: 218.29,
    changePercent: -0.03,
    blurb: 'Accelerated computing and AI infrastructure demand.',
  },
  {
    id: 'amzn',
    symbol: 'AMZN',
    name: 'Amazon',
    basePrice: 230,
    changePercent: 0.1,
    blurb: 'E-commerce plus AWS, the largest cloud provider.',
  },
  {
    id: 'rblx',
    symbol: 'RBLX',
    name: 'Roblox',
    basePrice: 58.9,
    changePercent: -0.12,
    blurb: 'User-generated gaming platform and virtual economy.',
  },
]
