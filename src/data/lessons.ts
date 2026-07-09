export type QuizQuestion = {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  /** One-line explanation shown after answering, right or wrong. */
  why: string
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
/** Extra XP for a perfect 3/3 quiz. */
export const XP_PERFECT_BONUS = 10
/** Extra XP per correct answer given in under 5 seconds. */
export const XP_SPEED_BONUS = 5

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
              'Prices swing up and down daily',
              'Stocks always go up',
              'Wages always keep pace with prices',
            ],
            correctIndex: 0,
            why: 'Inflation is the general upward drift of prices. Daily swings are volatility, and wages often lag prices — that gap is what hurts.',
          },
          {
            id: 'mb-1-q2',
            question: 'A dollar today vs next year — usually…',
            options: [
              'Buys more stuff',
              'Buys less stuff',
              'Buys exactly the same',
              'Depends only on your bank',
            ],
            correctIndex: 1,
            why: 'With ~2-3% inflation, the same dollar buys a little less each year. That is why parking all cash long-term quietly loses.',
          },
          {
            id: 'mb-1-q3',
            question: '"Real" return means…',
            options: [
              'Return after inflation',
              'Return before fees',
              'Return in cash only',
              'Return of the king',
            ],
            correctIndex: 0,
            why: 'Earn 7% while inflation runs 3% and your real return is ~4%. "Real" always means inflation-adjusted.',
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
              'What you earn each month',
              'What you spend on visible stuff',
              'Your follower count',
            ],
            correctIndex: 0,
            why: 'Income is a flow; wealth is the stock that survives spending. High earners with zero savings have income, not wealth.',
          },
          {
            id: 'mb-2-q2',
            question:
              'You get a raise and immediately upgrade your phone, your shoes, and your food delivery habit. Same savings as before. That is…',
            options: [
              'Lifestyle creep',
              'Compound interest',
              'Diversification',
              'A high real return',
            ],
            correctIndex: 0,
            why: 'Spending rising in lockstep with income is lifestyle creep — the raise disappears and your wealth curve stays flat.',
          },
          {
            id: 'mb-2-q3',
            question: 'Net worth is basically…',
            options: [
              'Assets minus debts',
              'Income minus taxes',
              'Savings plus income',
              'Whatever your bank app shows',
            ],
            correctIndex: 0,
            why: 'Everything you own minus everything you owe. A big bank balance with bigger loans can still be negative net worth.',
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
              'Banks process slowly',
              'Rates rise every year',
              'Taxes shrink over time',
            ],
            correctIndex: 0,
            why: 'Each cycle earns on everything before it. The curve starts flat and bends upward — the bend is where the magic lives.',
          },
          {
            id: 'mb-3-q2',
            question: 'Starting earlier usually helps because…',
            options: [
              'More cycles of growth',
              'Stocks are cheaper when you are young',
              'Early accounts pay higher rates',
              'Inflation skips small accounts',
            ],
            correctIndex: 0,
            why: 'Ten extra years means ten extra rounds of earnings-on-earnings. Time in beats timing.',
          },
          {
            id: 'mb-3-q3',
            question: 'Risk reminder: returns are…',
            options: [
              'Not guaranteed',
              'Always about 10%',
              'Guaranteed after 10 years',
              'Higher if you check daily',
            ],
            correctIndex: 0,
            why: 'Average long-run returns exist, but no year is promised. Compounding math only works on money you leave invested through the swings.',
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
            question:
              'Your phone screen shatters the same week your bike needs a repair. The money that should cover this is…',
            options: [
              'Your emergency fund',
              'Next month’s savings goal',
              'A quick loan from a friend',
              'Whatever is left on a credit card',
            ],
            correctIndex: 0,
            why: 'This is exactly what the emergency fund is for: surprise costs that cannot wait. Cards and loans turn a bad week into months of interest.',
          },
          {
            id: 'sv-1-q2',
            question: 'Liquidity means…',
            options: [
              'Easy to access quickly',
              'Invested for the long run',
              'Protected from inflation',
              'Locked until a set date',
            ],
            correctIndex: 0,
            why: 'Liquid money converts to spendable cash fast, without penalty. Emergency funds must be liquid — a locked CD cannot fix a broken phone today.',
          },
          {
            id: 'sv-1-q3',
            question: 'High-yield savings usually beats…',
            options: [
              'A checking account for idle cash',
              'The stock market long-term',
              'Paying off credit card debt',
              'Every other use of money',
            ],
            correctIndex: 0,
            why: 'For cash you must keep safe and reachable, high-yield savings earns more than checking. It does not beat long-run investing or killing 25% APR debt.',
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
              'Cutting every fun expense',
              'Guessing what you spend',
              'Copying someone else’s plan',
            ],
            correctIndex: 0,
            why: 'Know what comes in and what must go out. Whatever remains is what you actually control — that is the budget.',
          },
          {
            id: 'sv-2-q2',
            question: '"Pay yourself first" means…',
            options: [
              'Save/invest before you splurge',
              'Spend on fun first, save the rest',
              'Pay your bills before anyone else’s',
              'Take a salary from your allowance',
            ],
            correctIndex: 0,
            why: 'Move money to savings the moment income lands. What you never see, you never spend — leftovers-based saving mostly leaves nothing over.',
          },
          {
            id: 'sv-2-q3',
            question: 'Subscriptions sneak because…',
            options: [
              'Small charges add up',
              'They raise prices secretly',
              'They are impossible to cancel',
              'Banks hide them from statements',
            ],
            correctIndex: 0,
            why: 'Five "small" $10 charges is $600 a year. Each one feels trivial; the total is a real bill you never decided to pay.',
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
              'Monthly payment amount',
              'How long the loan lasts',
              'The lender’s profit margin',
            ],
            correctIndex: 0,
            why: 'APR is the annual price of borrowing, as a percentage. It is the single fastest way to compare two debts.',
          },
          {
            id: 'sv-3-q2',
            question: 'Minimum payments mostly…',
            options: [
              'Stretch debt longer',
              'Clear debt at a steady pace',
              'Freeze the interest',
              'Improve your rate over time',
            ],
            correctIndex: 0,
            why: 'Minimums are sized so interest keeps accruing for years. They keep the account current, not cheap.',
          },
          {
            id: 'sv-3-q3',
            question: 'A common payoff strategy is…',
            options: [
              'Highest interest first (often)',
              'Largest balance first, always',
              'Newest debt first, always',
              'All debts equally, always',
            ],
            correctIndex: 0,
            why: 'Highest-APR-first ("avalanche") minimizes total interest. Smallest-balance-first ("snowball") trades some math for motivation — both beat minimums.',
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
              'A loan to a company',
              'A guaranteed dividend',
              'A bet with the exchange',
            ],
            correctIndex: 0,
            why: 'A share is a slice of the business itself. Loans to companies are bonds; dividends exist only if the company chooses to pay them.',
          },
          {
            id: 'inv-1-q2',
            question: 'Diversification helps because…',
            options: [
              'You’re not all-in on one bet',
              'It raises your average return',
              'It removes market risk entirely',
              'It guarantees beating the index',
            ],
            correctIndex: 0,
            why: 'Spreading bets means one blowup cannot sink you. It smooths the ride; it does not delete risk or promise higher returns.',
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
            why: 'Long horizons improve the odds, but nothing promises a profit. Markets can stay down for years — patience is the strategy, not a guarantee.',
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
              'A single company’s stock',
              'A savings account with stocks',
              'A broker’s subscription plan',
            ],
            correctIndex: 0,
            why: 'One ETF share holds a whole basket of assets and trades like a stock. Instant diversification in a single ticker.',
          },
          {
            id: 'inv-2-q2',
            question: 'Expense ratio is…',
            options: [
              'Fund fees over time',
              'The tax on each trade',
              'Your profit percentage',
              'The fund’s risk score',
            ],
            correctIndex: 0,
            why: 'It is the yearly slice the fund keeps, e.g. 0.05% vs 1%. Small-looking differences compound into serious money over decades.',
          },
          {
            id: 'inv-2-q3',
            question: 'Index funds often aim to…',
            options: [
              'Track a market index',
              'Beat the market every year',
              'Avoid every downturn',
              'Pick tomorrow’s winners',
            ],
            correctIndex: 0,
            why: 'Index funds copy the market instead of trying to outsmart it. Boring by design — and that usually beats most active pickers after fees.',
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
              'Prices only fall',
              'The market is broken',
              'Your order failed',
            ],
            correctIndex: 0,
            why: 'Swings in both directions are the market’s normal heartbeat. A dip on paper only becomes a real loss when you sell into it.',
          },
          {
            id: 'inv-3-q2',
            question:
              'You’ll need your money in 6 months for a laptop. That cash should probably be…',
            options: [
              'In savings, not risky bets',
              'All in one hot stock',
              'In whatever is trending',
              'Invested with max leverage',
            ],
            correctIndex: 0,
            why: 'Short horizon means no time to recover from a dip. Money with a near-term job belongs in cash; investing is for money that can wait.',
          },
          {
            id: 'inv-3-q3',
            question: 'Past performance…',
            options: [
              'Doesn’t guarantee future results',
              'Repeats on a schedule',
              'Is the best predictor there is',
              'Only matters for crypto',
            ],
            correctIndex: 0,
            why: 'Last year’s winner is often next year’s laggard. History informs; it does not promise.',
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
              'Total sales for the year',
              'Cash sitting in the bank',
              'Revenue plus investment',
            ],
            correctIndex: 0,
            why: 'A shop can sell $1M (revenue) and still lose money if costs run $1.1M. Profit is what actually stays.',
          },
          {
            id: 'biz-1-q2',
            question: 'A margin is basically…',
            options: [
              'Profit as % of revenue (often)',
              'The markup on one item',
              'Revenue growth per year',
              'The founder’s salary',
            ],
            correctIndex: 0,
            why: 'Margin says how much of each sales dollar survives as profit. Two businesses with equal revenue can have wildly different margins.',
          },
          {
            id: 'biz-1-q3',
            question: 'Burn rate matters because…',
            options: [
              'Cash runway is finite',
              'It sets the tax bill',
              'Investors love spending',
              'It boosts revenue',
            ],
            correctIndex: 0,
            why: 'Burn is how fast a company eats its cash. Divide cash by burn and you get the runway — the countdown to profitable-or-dead.',
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
              'The startup cost of a hustle',
              'A fee for missed deadlines',
              'The cost of borrowing money',
            ],
            correctIndex: 0,
            why: 'Every yes is a no to something else. Ten hours of gig work is also ten hours not studying, building, or resting — count both sides.',
          },
          {
            id: 'biz-2-q2',
            question: 'Pricing too low can…',
            options: [
              'Hide your real costs',
              'Always win you the market',
              'Lower your taxes',
              'Make quality irrelevant',
            ],
            correctIndex: 0,
            why: 'Cheap prices that ignore your time and materials mean every sale quietly loses money. Volume cannot fix a negative margin.',
          },
          {
            id: 'biz-2-q3',
            question: 'A simple sanity check is…',
            options: [
              'Track hours + expenses',
              'Compare yourself to influencers',
              'Count revenue only',
              'Wait a year and hope',
            ],
            correctIndex: 0,
            why: 'Divide what you cleared by hours worked. If your hustle pays $4/hour, that is a hobby with receipts — decide on purpose.',
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
              'Make loans cheaper',
              'Erase inflation instantly',
              'Guarantee stock gains',
            ],
            correctIndex: 0,
            why: 'Rate hikes raise the cost of loans and credit everywhere, cooling spending. It works slowly and hits markets on the way.',
          },
          {
            id: 'eco-1-q2',
            question: 'GDP is basically…',
            options: [
              'A broad measure of economic output',
              'The government’s bank balance',
              'The stock market’s total value',
              'Average national salary',
            ],
            correctIndex: 0,
            why: 'GDP totals the value of everything an economy produces. Growing GDP usually means more jobs and spending; shrinking GDP is recession territory.',
          },
          {
            id: 'eco-1-q3',
            question: 'Unemployment data can signal…',
            options: [
              'Labor market heat/cool',
              'Next month’s stock prices',
              'Which careers pay best',
              'Nothing useful',
            ],
            correctIndex: 0,
            why: 'Low unemployment = hot job market, often with wage pressure. Rising unemployment = cooling economy. The Fed watches this number obsessively.',
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
              'Company profit indexes',
              'Central bank reserves',
              'Credit scores nationally',
            ],
            correctIndex: 0,
            why: 'CPI prices a fixed basket of everyday stuff over time. When headlines say "inflation hit 4%", CPI is usually the number behind it.',
          },
          {
            id: 'eco-2-q2',
            question: 'If wages lag inflation…',
            options: [
              'Purchasing power can dip',
              'Everyone gets richer slowly',
              'Prices must come back down',
              'Savings rates rise to match',
            ],
            correctIndex: 0,
            why: 'A 3% raise during 6% inflation is a real-terms pay cut. You earn more numbers and afford less stuff.',
          },
          {
            id: 'eco-2-q3',
            question: 'Macro news is useful because…',
            options: [
              'It explains the backdrop',
              'It tells you what to buy',
              'It removes uncertainty',
              'It replaces budgeting',
            ],
            correctIndex: 0,
            why: 'Macro sets the weather your money lives in — rates, prices, jobs. It will not pick stocks for you, but it explains why everything feels expensive.',
          },
        ],
      },
    ],
  },
]
