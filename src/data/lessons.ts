export type QuizQuestion = {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export type Lesson = {
  id: string
  title: string
  explanation: string
  questions: [QuizQuestion, QuizQuestion, QuizQuestion]
}

export type Level = {
  id: string
  title: string
  /** XP required (cumulative) to unlock this level if previous not fully done — used for copy only */
  xpToUnlock: number
  lessons: Lesson[]
}

export const XP_PER_LESSON = 50

export const levels: Level[] = [
  {
    id: 'money-basics',
    title: 'Money Basics',
    xpToUnlock: 0,
    lessons: [
      {
        id: 'mb-1',
        title: 'What even is money?',
        explanation:
          'Money is trust in a number. Inflation means that number buys less over time — your money is losing power unless it grows.',
        questions: [
          {
            id: 'mb-1-q1',
            question: 'Inflation mostly means…',
            options: [
              'Prices drift up over time',
              'You get taller',
              'Stocks always go up',
              'Taxes disappear',
            ],
            correctIndex: 0,
          },
          {
            id: 'mb-1-q2',
            question: 'A dollar today vs next year — usually…',
            options: [
              'Buys more stuff',
              'Buys less stuff',
              'Is always gold',
              'Is illegal',
            ],
            correctIndex: 1,
          },
          {
            id: 'mb-1-q3',
            question: '“Real” return means…',
            options: [
              'Return after inflation',
              'Return in dreams',
              'Return without math',
              'Return of the king',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'mb-2',
        title: 'Income vs wealth',
        explanation:
          'Income is the flow. Wealth is the pool. You can have high income and low wealth if you spend it all. Vibes ≠ net worth.',
        questions: [
          {
            id: 'mb-2-q1',
            question: 'Wealth is closest to…',
            options: [
              'What you keep and grow',
              'Your mood',
              'Your follower count',
              'Your screen time',
            ],
            correctIndex: 0,
          },
          {
            id: 'mb-2-q2',
            question: 'Lifestyle creep is when…',
            options: [
              'Spending rises with income',
              'You learn to cook',
              'You delete apps',
              'You sleep more',
            ],
            correctIndex: 0,
          },
          {
            id: 'mb-2-q3',
            question: 'Net worth is basically…',
            options: [
              'Assets minus debts',
              'Vibes minus drama',
              'Likes minus comments',
              'Hours minus sleep',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'mb-3',
        title: 'Compound interest hits different',
        explanation:
          'Earnings on earnings. Start early, stay consistent. Time is the cheat code.',
        questions: [
          {
            id: 'mb-3-q1',
            question: 'Compounding needs time mostly because…',
            options: [
              'Growth builds on past growth',
              'Banks are slow',
              'Charts look cooler',
              'Taxes vanish',
            ],
            correctIndex: 0,
          },
          {
            id: 'mb-3-q2',
            question: 'Starting earlier usually helps because…',
            options: [
              'More cycles of growth',
              'Wi‑Fi is faster',
              'Stocks are cheaper',
              'Inflation stops',
            ],
            correctIndex: 0,
          },
          {
            id: 'mb-3-q3',
            question: 'Risk reminder: returns are…',
            options: [
              'Not guaranteed',
              'Always 10%',
              'Tax-free always',
              'A personality trait',
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'saving',
    title: 'Saving',
    xpToUnlock: 100,
    lessons: [
      {
        id: 'sv-1',
        title: 'Emergency fund = peace',
        explanation:
          'Cash for chaos. Aim for a cushion so a bad week doesn’t become a bad year.',
        questions: [
          {
            id: 'sv-1-q1',
            question: 'An emergency fund is mainly for…',
            options: [
              'Surprises you didn’t plan',
              'Impulse shopping',
              'Crypto moonshots',
              'Concert tickets',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-1-q2',
            question: 'Liquidity means…',
            options: [
              'Easy to access quickly',
              'Only water',
              'Locked forever',
              'A TikTok trend',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-1-q3',
            question: 'High-yield savings usually beats…',
            options: [
              'A checking account for idle cash',
              'Breathing',
              'Friendships',
              'Sleep',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'sv-2',
        title: 'Budgets without the cringe',
        explanation:
          'A budget is a plan, not a punishment. Name your priorities, then fund them.',
        questions: [
          {
            id: 'sv-2-q1',
            question: 'A simple budget starts with…',
            options: [
              'Income and fixed costs',
              'Aesthetic folders',
              'Random guesses',
              'Manifesting',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-2-q2',
            question: '“Pay yourself first” means…',
            options: [
              'Save/invest before you splurge',
              'Buy snacks first',
              'Tip yourself daily',
              'Ignore bills',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-2-q3',
            question: 'Subscriptions sneak because…',
            options: [
              'Small charges add up',
              'They’re all free',
              'Banks block them',
              'Wi‑Fi stops them',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'sv-3',
        title: 'Debt strategy (no shame)',
        explanation:
          'Know your interest rates. Attack high-cost debt first. Progress > perfection.',
        questions: [
          {
            id: 'sv-3-q1',
            question: 'APR tells you…',
            options: [
              'Yearly borrowing cost',
              'Your zodiac',
              'Stock price',
              'Phone battery',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-3-q2',
            question: 'Minimum payments mostly…',
            options: [
              'Stretch debt longer',
              'Delete debt instantly',
              'Lower APR always',
              'Boost credit magically',
            ],
            correctIndex: 0,
          },
          {
            id: 'sv-3-q3',
            question: 'A common payoff strategy is…',
            options: [
              'Highest interest first (often)',
              'Ignore statements',
              'Only pay in memes',
              'Borrow more to invest always',
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'investing',
    title: 'Investing',
    xpToUnlock: 250,
    lessons: [
      {
        id: 'inv-1',
        title: 'Stocks = tiny company slices',
        explanation:
          'You own a piece. Price moves with vibes + earnings + macro chaos. This stock is popping… until it isn’t.',
        questions: [
          {
            id: 'inv-1-q1',
            question: 'A share represents…',
            options: [
              'Ownership in a company',
              'A coupon for pizza',
              'A bank guarantee',
              'A music genre',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-1-q2',
            question: 'Diversification helps because…',
            options: [
              'You’re not all-in on one bet',
              'Charts look rainbow',
              'Taxes stop',
              'You trade faster',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-1-q3',
            question: 'Long-term investing is not…',
            options: [
              'A promise of no losses',
              'A time horizon thing',
              'About patience',
              'About habits',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'inv-2',
        title: 'ETFs hit different',
        explanation:
          'Bundles of stocks. Less drama than picking one name. Still risky — markets swing.',
        questions: [
          {
            id: 'inv-2-q1',
            question: 'An ETF is basically…',
            options: [
              'A basket you can trade',
              'A bank account',
              'A loan',
              'A playlist only',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-2-q2',
            question: 'Expense ratio is…',
            options: [
              'Fund fees over time',
              'Your rent',
              'A meme metric',
              'Phone storage',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-2-q3',
            question: 'Index funds often aim to…',
            options: [
              'Track a market index',
              'Predict your texts',
              'Remove all risk',
              'Replace savings',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'inv-3',
        title: 'Risk check (real talk)',
        explanation:
          'Volatility is normal. Panic-selling turns a dip into a loss. Chill beats chaos.',
        questions: [
          {
            id: 'inv-3-q1',
            question: 'Volatility means…',
            options: [
              'Prices bounce around',
              'You’re immune to risk',
              'You never lose',
              'Stocks are fake',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-3-q2',
            question: 'Time horizon matters because…',
            options: [
              'Short-term needs ≠ risky bets',
              'Longer always wins',
              'Days don’t exist',
              'Charts lie always',
            ],
            correctIndex: 0,
          },
          {
            id: 'inv-3-q3',
            question: 'Past performance…',
            options: [
              'Doesn’t guarantee future results',
              'Guarantees repeats',
              'Is irrelevant',
              'Is a horoscope',
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    xpToUnlock: 400,
    lessons: [
      {
        id: 'biz-1',
        title: 'Revenue vs profit',
        explanation:
          'Revenue is loud. Profit is what’s left after costs. Businesses flex revenue; smart people watch margins.',
        questions: [
          {
            id: 'biz-1-q1',
            question: 'Profit is closest to…',
            options: [
              'Revenue minus expenses',
              'Followers minus likes',
              'Hours minus sleep',
              'Vibes minus tax',
            ],
            correctIndex: 0,
          },
          {
            id: 'biz-1-q2',
            question: 'A margin is basically…',
            options: [
              'Profit as % of revenue (often)',
              'A page margin',
              'A haircut',
              'A stock ticker',
            ],
            correctIndex: 0,
          },
          {
            id: 'biz-1-q3',
            question: 'Burn rate matters because…',
            options: [
              'Cash runway is finite',
              'Fire is cool',
              'Ads are free',
              'Servers are infinite',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'biz-2',
        title: 'Side hustle math',
        explanation:
          'Time is a cost. If you earn more but you’re fried, that’s not a flex — it’s a trade.',
        questions: [
          {
            id: 'biz-2-q1',
            question: 'Opportunity cost is…',
            options: [
              'What you give up to choose something',
              'A tax refund',
              'A free lunch',
              'Wi‑Fi speed',
            ],
            correctIndex: 0,
          },
          {
            id: 'biz-2-q2',
            question: 'Pricing too low can…',
            options: [
              'Hide your real costs',
              'Guarantee fame',
              'Stop inflation',
              'Delete competitors',
            ],
            correctIndex: 0,
          },
          {
            id: 'biz-2-q3',
            question: 'A simple sanity check is…',
            options: [
              'Track hours + expenses',
              'Guess randomly',
              'Only post receipts',
              'Ignore taxes',
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'economy',
    title: 'Economy',
    xpToUnlock: 550,
    lessons: [
      {
        id: 'eco-1',
        title: 'Fed rates: the main character',
        explanation:
          'Rates influence borrowing costs. When money’s expensive, growth can chill. Macro is messy — stay curious.',
        questions: [
          {
            id: 'eco-1-q1',
            question: 'Higher rates often…',
            options: [
              'Make borrowing pricier',
              'Make loans free',
              'Delete inflation',
              'Guarantee stock gains',
            ],
            correctIndex: 0,
          },
          {
            id: 'eco-1-q2',
            question: 'GDP is basically…',
            options: [
              'A broad measure of economic output',
              'Your GPA',
              'A phone setting',
              'A crypto wallet',
            ],
            correctIndex: 0,
          },
          {
            id: 'eco-1-q3',
            question: 'Unemployment data can signal…',
            options: [
              'Labor market heat/cool',
              'Your sleep schedule',
              'Wi‑Fi quality',
              'Shoe sizes',
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: 'eco-2',
        title: 'Inflation vs jobs (macro beef)',
        explanation:
          'Prices and paychecks don’t always move together. Real life is sticker shock + wage growth drama.',
        questions: [
          {
            id: 'eco-2-q1',
            question: 'CPI tracks…',
            options: [
              'Consumer price trends',
              'Creator payouts',
              'CPU speed',
              'Car paint',
            ],
            correctIndex: 0,
          },
          {
            id: 'eco-2-q2',
            question: 'If wages lag inflation…',
            options: [
              'Purchasing power can dip',
              'You automatically get richer',
              'Taxes stop',
              'Stocks freeze',
            ],
            correctIndex: 0,
          },
          {
            id: 'eco-2-q3',
            question: 'Macro news is useful because…',
            options: [
              'It explains the backdrop',
              'It predicts your texts',
              'It removes risk',
              'It replaces budgeting',
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  },
]
