const BANNED_WORDS = [
  'fundish',
  'fundis',
  'funda',
  'admin',
  'mod',
  'tintomi',
  'official',
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

export { BANNED_WORDS }
