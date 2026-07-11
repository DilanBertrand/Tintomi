export type StoryLesson = {
  id: string
  title: string
  /** One-line teaser shown on the lesson card. */
  tagline: string
  /** Reading time hint shown on the card. */
  minutes: number
  /** Sequential pages of the story. Each page is one screen of text. */
  pages: string[]
}

export const storyLessons: StoryLesson[] = [
  {
    id: 'st-paycheck',
    title: 'Maya gets her first paycheck',
    tagline: 'Where money actually goes before you ever see it',
    minutes: 3,
    pages: [
      'Maya refreshed her banking app at 9:02 AM. There it was: her first paycheck from the coffee shop. But something was off. She had worked 60 hours at $15 an hour. That should be $900. The deposit said $761.',
      'She texted her manager, half convinced payroll had robbed her. The reply: "Welcome to taxes." Federal income tax, state tax, Social Security, Medicare. Every paycheck, a slice comes off the top before the money ever touches your account. The $900 was her gross pay. The $761 was her net pay — the number that is actually hers.',
      'That night Maya did the math. The gap was about 15% now, but she learned it grows as you earn more. The lesson stuck: when someone offers you a salary, the number they say is not the number you get to spend. Budget on net, never gross.',
      'Her coworker Dev shrugged it off: "Just numbers, whatever." Six months later Dev was short on rent, because he had mentally spent money that was never going to arrive. Maya was not, because she planned around $761, not $900.',
      'The takeaway: gross pay is the headline, net pay is reality. Know the difference before you spend a dollar. If you plan your life around the number after taxes, every surprise becomes a bonus instead of a hole.',
    ],
  },
  {
    id: 'st-emergency',
    title: 'The $400 flat tire',
    tagline: 'Why an emergency fund beats luck',
    minutes: 3,
    pages: [
      'Two friends, same street, same flat tire on the same pothole. Jordan and Sam both got the same quote: $400 for a new tire and alignment.',
      'Sam put it on a credit card that was already carrying a balance. At 24% interest, paying it off slowly, that tire quietly grew toward $500. Worse, next month the card minimum went up, so Sam cut back on groceries to cover it. One pothole, three months of stress.',
      'Jordan paid cash from a boring savings account labeled "emergencies" — money set aside automatically, $25 from every paycheck for the past year. The tire cost $400, exactly $400, and life went on. No interest, no domino effect, no stress spiral.',
      'Here is the trick: Jordan was not richer than Sam. They earned the same. Jordan had just decided, months earlier, that Future Jordan would have problems, and pre-paid for them a little at a time. An emergency fund is not savings for a goal. It is a shock absorber for life.',
      'The takeaway: start with a mini fund of $500, then grow it toward 3-6 months of expenses. Automate a small transfer every payday so it builds without willpower. Emergencies are not rare — they are scheduled events with unknown dates.',
    ],
  },
  {
    id: 'st-credit',
    title: 'Dev discovers his credit score',
    tagline: 'The invisible number that follows you around',
    minutes: 4,
    pages: [
      'Dev never thought about credit. Then he tried to rent his first apartment. The landlord ran a check and came back: "Your credit score is 580. I need a co-signer or three months deposit." Dev had the income. The score still blocked him.',
      'Where did 580 come from? A store card he opened for a discount and forgot. Two payments, 30 days late, from a semester when money was tight. A maxed-out card he paid the minimum on. None of it felt like a big deal at the time. All of it was being recorded.',
      'A credit score is basically a trust rating built from five things: whether you pay on time (the biggest factor), how much of your available credit you use, how long you have had credit, how recently you applied for new credit, and the mix of accounts. Pay on time and keep card balances low, and the score climbs. Miss payments and max out cards, and it sinks.',
      'Dev set up autopay for at least the minimum on everything, so a late payment became impossible. He paid the maxed card down below 30% of its limit. He stopped opening cards for discounts. Nothing fancy — just consistency. Eighteen months later: 705, and the next landlord did not blink.',
      'The takeaway: your credit score is not a judgment of your worth — it is a record of your habits, and habits can change. On-time payments and low balances fix most scores. Start now, because the timeline is measured in months, not days.',
    ],
  },
  {
    id: 'st-compound',
    title: 'Two sisters, one head start',
    tagline: 'Compound growth rewards the early, not the clever',
    minutes: 3,
    pages: [
      'Ana and Bella are sisters. At 22, Ana started investing $200 a month in a boring index fund. At 32, she stopped adding money entirely and just let it sit. Bella started at 32 — the exact year Ana stopped — and invested $200 every month until 60.',
      'Bella invested for 28 years. Ana invested for only 10. Bella put in almost three times as much of her own money. So Bella ends up richer, right?',
      'At 60, with average market growth, Ana has more. Her early money had almost four decades to double, and double again, and again. Growth on top of growth on top of growth — that is compounding. Bella’s later dollars were solid, but they simply had fewer doubling cycles left.',
      'This is the part people miss: compounding is not about the amount, it is about the runway. A dollar invested at 22 can outwork three dollars invested at 40. Time in the market beats timing the market, and it definitely beats waiting until you feel rich enough to start.',
      'The takeaway: start with whatever you have, even $25 a month, as early as you can. The habit matters more than the amount, and the calendar is doing most of the heavy lifting. The best day to start was yesterday; the second best is today.',
    ],
  },
  {
    id: 'st-risk',
    title: 'The hot stock tip',
    tagline: 'Risk, diversification, and the friend who "can’t lose"',
    minutes: 4,
    pages: [
      'At a barbecue, Maya’s cousin Leo could not stop talking about a stock. "It tripled in six months. My guy says it will 10x. I put in everything — my savings, my emergency fund, everything. You have to get in."',
      'Maya asked one question: "What does the company actually do?" Leo was not sure. That was the tell. He was not investing — he was gambling with a story attached. When the price is the only thing you know, you do not own an investment, you own a lottery ticket.',
      'Maya put money in the market too, but differently: an index fund holding hundreds of companies at once. Some of those companies will fail. It does not matter much, because no single one can sink her. That is diversification — never letting one bet decide your future. Boring on purpose.',
      'The stock Leo loved dropped 70% over the next year. Not because hot stocks always crash, but because concentrated bets swing hard both ways, and Leo had bet money he could not afford to lose. He sold at the bottom to cover rent. The loss was not just the money — it was that he was forced to sell at the worst time.',
      'The takeaway: risk is not just "can it go down" — it is "what happens to my life if it does." Diversify so no single failure can hurt you, and never invest money you will need soon. If you cannot explain what you are buying, you are not ready to buy it.',
    ],
  },
  {
    id: 'st-budget',
    title: 'Sam finds the leak',
    tagline: 'A budget is a map of where your money already goes',
    minutes: 3,
    pages: [
      'Sam earned decent money but ended every month at zero, and could not say why. "I do not buy anything big," Sam insisted. So Maya issued a challenge: do not change anything, just write down every expense for 30 days. Every single one.',
      'The list was humbling. $6 delivery fees that came with $4 tips. Three streaming services, one of them unused since spring. A gym membership from a New Year that did not stick. Daily "small" spends that added up to $340 a month. No single leak was dramatic. Together, they were a flood.',
      'Sam tried a simple frame: 50/30/20. Roughly 50% of net pay for needs like rent, groceries, and transport. 30% for wants — fun, guilt-free. 20% straight to savings and debt, moved automatically on payday so it never gets a vote.',
      'The surprise was that budgeting did not feel like punishment. Sam still ordered delivery — just on purpose, from the wants bucket, instead of by reflex. Cancelling two subscriptions nobody missed paid for the emergency fund transfer by itself. The plan did not shrink Sam’s life. It aimed it.',
      'The takeaway: you cannot steer money you do not see. Track it for one month, then give every dollar a job — needs, wants, future. A budget is not a diet. It is a map, and you are allowed to route some of it straight to fun.',
    ],
  },
]
