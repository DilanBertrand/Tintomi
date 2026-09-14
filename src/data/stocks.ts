export type Stock = {
  id: string
  /** Ticker sent to /api/chart */
  symbol: string
  name: string
  /** Fallback quote while the first live fetch is in flight or if it fails */
  basePrice: number
  changePercent: number
  blurb: string
  /**
   * Amount of the asset one "share" in the wallet represents. Stocks are 1;
   * Bitcoin is 0.001 so a $1,000 wallet can actually buy some.
   */
  lot?: number
  /** Trades around the clock (crypto), so the market-closed banner doesn't apply. */
  alwaysOpen?: boolean
  /** Short unit name for lot-based assets, e.g. BTC */
  unitName?: string
}

/** Price of one wallet unit (share or lot) for a stock. */
export function lotPrice(stock: Stock, assetPrice: number): number {
  return assetPrice * (stock.lot ?? 1)
}

/** Human label for a number of wallet units, e.g. "3 shares" or "0.003 BTC". */
export function holdingLabel(stock: Stock, units: number): string {
  if (stock.lot && stock.lot !== 1) {
    const amount = units * stock.lot
    return `${amount.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${stock.unitName ?? stock.symbol}`
  }
  return `${units} ${units === 1 ? 'share' : 'shares'}`
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
  {
    id: 'btc',
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    basePrice: 79075,
    changePercent: 2.95,
    blurb: 'The largest cryptocurrency. Trades 24/7 and swings far more than stocks.',
    lot: 0.001,
    unitName: 'BTC',
    alwaysOpen: true,
  },
]
