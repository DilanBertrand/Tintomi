/** Helpers for content that should change once per calendar day (local time). */

export function dayIndex(now = new Date()): number {
  // Date.UTC on the local calendar date: no timezone shift, whole days only.
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000)
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

/** ISO-style week index: increments every Monday (local time). */
export function weekIndex(now = new Date()): number {
  const day = dayIndex(now)
  // dayIndex 0 = 1970-01-01, a Thursday; shift so weeks start on Monday.
  return Math.floor((day + 3) / 7)
}

export type WeeklyChallenge = { title: string; detail: string }

export const WEEKLY_CHALLENGES: readonly WeeklyChallenge[] = [
  { title: 'Save $20 this week.', detail: 'Track one no-spend day. Build the habit without the noise.' },
  { title: 'No food delivery for 7 days.', detail: 'Cook or grab from the store. Write down what you would have spent.' },
  { title: 'Finish 3 lessons before Sunday.', detail: 'Pick any track. Three short reads, three quizzes, done.' },
  { title: 'Hold every position all week.', detail: 'No panic selling. Watch the chart move without touching it.' },
  { title: 'Cancel one subscription you forgot about.', detail: 'Check your phone settings. There is always one.' },
  { title: 'Beat the S&P 500 this week.', detail: 'Your paper portfolio vs the index. Check Sunday\'s recap.' },
  { title: 'Track every dollar for 7 days.', detail: 'Notes app is fine. Seeing the list is the whole lesson.' },
  { title: 'Sell the top of your losses.', detail: 'Pick your worst holding. Decide: hold with a reason, or sell.' },
  { title: 'Skip one impulse buy over $15.', detail: 'Wait 24 hours. If you still want it Sunday, fine.' },
  { title: 'Read one story lesson to the end.', detail: 'Three minutes. It sticks better than a quiz.' },
  { title: 'Add $5 to your fake portfolio wisely.', detail: 'Buy 0.001 BTC or one share of something you have researched.' },
  { title: 'Learn what one holding actually does.', detail: 'Pick a stock you own. Explain its business in one sentence.' },
]
