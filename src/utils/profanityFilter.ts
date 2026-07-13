// Impersonation guards: only relevant to USERNAMES (nobody should be able to
// register as "admin" or "tintomi_official"). These are ordinary words in
// normal conversation, so they must NOT be applied to post/reply content.
const IMPERSONATION_WORDS = ['fundish', 'fundis', 'funda', 'admin', 'mod', 'tintomi', 'official'] as const

const PROFANITY_WORDS = [
  // English profanity / sexual / abusive terms
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'shitty',
  'bullshit',
  'bitch',
  'bitches',
  'asshole',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'whore',
  'slut',
  'nude',
  'nudes',
  'naked',
  'porn',
  'porno',
  'sex',
  'sexy',
  'horny',
  'milf',
  'blowjob',
  'handjob',
  'anal',
  'cum',
  'ejaculate',
  'orgasm',
  'rape',
  'rapist',
  'incest',
  'pedo',
  'paedo',
  'molest',
  'dildo',
  // Turkish profanity / sexual / abusive terms
  'amk',
  'aq',
  'amina',
  'amcik',
  'amcık',
  'orospu',
  'orospuçocuğu',
  'orospu cocugu',
  'oc',
  'sik',
  'sikerim',
  'sikik',
  'siktir',
  'got',
  'göt',
  'götveren',
  'ibne',
  'pic',
  'piç',
  'yarrak',
  'yarak',
  'pezevenk',
  'kahpe',
  'sokuk',
  'tecavuz',
  'tecavüz',
  'porno',
  'seks',
  // French profanity / sexual / abusive terms
  'merde',
  'putain',
  'pute',
  'salope',
  'encule',
  'enculé',
  'connard',
  'connasse',
  'batard',
  'bâtard',
  'nique',
  'niquer',
  'bite',
  'chatte',
  'cul',
  'branleur',
  'porn',
  'porno',
  'sexe',
  'viol',
  'violeur',
  'pd',
] as const

const BANNED_WORDS = [...IMPERSONATION_WORDS, ...PROFANITY_WORDS] as const

const USERNAME_ALLOWED_REGEX = /^[a-zA-Z0-9_]+$/

function normalizeForComparison(value: string): string {
  return value.trim().toLowerCase()
}

export function isUsernameAllowed(username: string): boolean {
  const normalized = normalizeForComparison(username)
  if (!normalized) return true
  if (!USERNAME_ALLOWED_REGEX.test(normalized)) return false
  return !BANNED_WORDS.some((word) => normalized.includes(word))
}

export function isUsernameRestricted(username: string): boolean {
  return !isUsernameAllowed(username)
}

/** Strips everything but letters/digits so spaced-out or symbol-broken
 * profanity ("f u c k", "f.u.c.k") still gets caught, then checks each
 * profanity word on a word boundary to avoid flagging normal words that
 * merely contain a banned substring (e.g. "classic" vs "ass"). Only checks
 * PROFANITY_WORDS — impersonation guards like "admin"/"tintomi" are fine to
 * say in normal conversation. */
export function containsBannedContent(text: string): boolean {
  const normalized = normalizeForComparison(text)
  if (!normalized) return false
  const stripped = normalized.replace(/[^a-z0-9]+/g, '')
  return PROFANITY_WORDS.some((word) => {
    const re = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i')
    return re.test(normalized) || stripped.includes(word)
  })
}

export { BANNED_WORDS }
