import { supabase } from './supabase'

export type Notification = {
  id: string
  message: string
  link_tab: string | null
  read: boolean
  created_at: string
}

/** The signed-in user's notifications, newest first (RLS scopes to own rows). */
export async function fetchNotifications(limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, link_tab, read, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[notifications] fetch failed:', error.message)
    return []
  }
  return (data ?? []) as Notification[]
}

/** Mark every unread notification as read (called when the bell panel opens). */
export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
  if (error) console.warn('[notifications] mark read failed:', error.message)
}

/** Redeem a referral code via the redeem_referral RPC. Returns its status string. */
export async function redeemReferral(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_referral', { code })
  if (error) {
    console.warn('[referral] redeem failed:', error.message)
    return 'error'
  }
  return typeof data === 'string' ? data : 'error'
}
