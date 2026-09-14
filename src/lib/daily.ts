/** Helpers for content that should change once per calendar day (local time). */

export function dayIndex(now = new Date()): number {
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000)
}

/** Pick `count` items starting at a day-based offset, wrapping around. */
export function rotateDaily<T>(items: readonly T[], count: number, day = dayIndex()): T[] {
  if (items.length === 0) return []
  const n = Math.min(count, items.length)
  const start = (day * n) % items.length
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(items[(start + i) % items.length])
  return out
}

export type PollQuestion = {
  question: string
  options: readonly [string, string, string]
  /** Result split shown after voting; adds up to 100. */
  results: readonly [number, number, number]
}

export const POLL_QUESTIONS: readonly PollQuestion[] = [
  { question: "What's the biggest money trap right now?", options: ['Subscriptions stacking silently', 'Impulse buys on "deals"', 'Trying to time the market'], results: [45, 30, 25] },
  { question: 'First $1,000 you ever save goes to?', options: ['Emergency fund', 'S&P 500 index fund', 'One stock I believe in'], results: [52, 33, 15] },
  { question: 'Bitcoin in 5 years?', options: ['Much higher', 'About the same', 'Much lower'], results: [58, 22, 20] },
  { question: 'Would you rather earn?', options: ['$50k a year, no stress', '$100k a year, 60-hour weeks', 'Unpredictable, own business'], results: [38, 27, 35] },
  { question: 'Biggest reason people stay broke?', options: ['Spending to impress others', 'Never learning how money works', 'Bad luck'], results: [41, 47, 12] },
  { question: 'Best first investment for a teen?', options: ['Index fund', 'Nvidia', 'Skills / a course'], results: [44, 21, 35] },
  { question: 'A stock you own drops 20% in a week. You?', options: ['Buy more', 'Hold and wait', 'Sell before it gets worse'], results: [36, 49, 15] },
  { question: 'Credit cards are?', options: ['A tool if paid in full', 'A trap, avoid them', 'Free money until the bill'], results: [61, 30, 9] },
  { question: 'Would you tell friends how much you have saved?', options: ['Yes, no big deal', 'Only close friends', 'Never'], results: [23, 40, 37] },
  { question: 'Most underrated money skill?', options: ['Saying no', 'Negotiating pay', 'Reading a chart'], results: [39, 44, 17] },
  { question: 'Tesla or Apple for the next 10 years?', options: ['Tesla', 'Apple', 'Neither, S&P 500'], results: [31, 34, 35] },
  { question: 'Biggest waste of money this month?', options: ['Food delivery', 'Clothes', 'In-game purchases'], results: [48, 27, 25] },
  { question: 'If you found $500 today?', options: ['Invest it', 'Save it', 'Spend some, save some'], results: [37, 24, 39] },
  { question: 'Inflation feels worst on?', options: ['Food', 'Rent', 'Going out'], results: [46, 32, 22] },
]
