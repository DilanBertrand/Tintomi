export type Stock = {
  id: string
  symbol: string
  /** TradingView widget symbol (exchange:ticker) */
  tvSymbol: string
  name: string
  basePrice: number
  changePercent: number
  blurb: string
}

export const stocks: Stock[] = [
  {
    id: 'aapl',
    symbol: 'AAPL',
    tvSymbol: 'NASDAQ:AAPL',
    name: 'Apple Inc.',
    basePrice: 228.5,
    changePercent: 0.42,
    blurb: 'Consumer hardware and services with recurring revenue.',
  },
  {
    id: 'tsla',
    symbol: 'TSLA',
    tvSymbol: 'NASDAQ:TSLA',
    name: 'Tesla Inc.',
    basePrice: 248.75,
    changePercent: -0.31,
    blurb: 'EV and energy; higher beta than mega-cap peers.',
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    tvSymbol: 'NASDAQ:NVDA',
    name: 'NVIDIA Corp.',
    basePrice: 138.25,
    changePercent: 0.88,
    blurb: 'Accelerated computing and AI infrastructure demand.',
  },
  {
    id: 'pltr',
    symbol: 'PLTR',
    tvSymbol: 'NYSE:PLTR',
    name: 'Palantir',
    basePrice: 26.4,
    changePercent: 0.19,
    blurb: 'Enterprise software for data integration and analytics.',
  },
  {
    id: 'rblx',
    symbol: 'RBLX',
    tvSymbol: 'NYSE:RBLX',
    name: 'Roblox Corp.',
    basePrice: 58.9,
    changePercent: -0.12,
    blurb: 'User-generated gaming platform and virtual economy.',
  },
]
