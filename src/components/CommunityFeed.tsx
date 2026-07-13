import { AnimatePresence, motion } from 'framer-motion'
import { Check, Heart, ImagePlus, MessageCircle, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from './Card'
import { useAuth } from '../contexts/AuthContext'
import {
  createPost,
  createReply,
  deletePost,
  fetchApprovedPosts,
  fetchApprovedReplies,
  fetchLikes,
  fetchMyPosts,
  fetchPendingPosts,
  reviewPost,
  toggleLike,
  type LikeInfo,
  type Post,
} from '../lib/posts'
import { updateProfileFields } from '../lib/profiles'
import { isUsernameRestricted } from '../utils/profanityFilter'

const MAX_POST_LENGTH = 1000

type CommunityFeedProps = {
  userId: string
  isAdmin: boolean
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ url, name, small }: { url: string | null; name: string; small?: boolean }) {
  const size = small ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  if (url) {
    return <img src={url} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  }
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#232b25] font-semibold text-[#e9ece8]`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: Post['status'] }) {
  if (status === 'pending') {
    return (
      <span className="rounded-full border border-[#8a6d1d]/50 bg-[#e5c76b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#e5c76b]">
        An admin is checking your post
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="rounded-full border border-[#7a2e27]/60 bg-[#ff6b5e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff6b5e]">
        Not approved
      </span>
    )
  }
  return null
}

function ReplyRow({
  reply,
  you,
  onDelete,
}: {
  reply: Post
  you: boolean
  onDelete?: (id: string) => void
}) {
  return (
    <div className="flex gap-2.5 py-2">
      <Avatar url={reply.author_avatar_url} name={reply.author_name} small />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-semibold text-[#e9ece8]">{reply.author_name}</p>
          {you ? <span className="text-[10px] text-[#5c665e]">you</span> : null}
          <span className="text-[10px] text-[#5c665e]">· {timeAgo(reply.created_at)}</span>
          <StatusBadge status={reply.status} />
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-[#d4d9d2]">{reply.content}</p>
        {you && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(reply.id)}
            className="mt-1 flex items-center gap-1 text-[11px] text-[#5c665e] transition-colors hover:text-[#ff6b5e]"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  )
}

function PostRow({
  post,
  you,
  userId,
  isAdmin,
  like,
  replies,
  myReplies,
  needsUsername,
  onReview,
  onDelete,
  onDeleteReply,
  onToggleLike,
  onReply,
  onRequestUsername,
}: {
  post: Post
  you: boolean
  userId: string
  isAdmin: boolean
  like?: LikeInfo
  replies?: Post[]
  myReplies?: Post[]
  needsUsername?: boolean
  onReview?: (id: string, status: 'approved' | 'rejected') => void
  onDelete?: (id: string) => void
  onDeleteReply?: (id: string) => void
  onToggleLike?: (id: string, liked: boolean) => void
  onReply?: (parentId: string, text: string) => Promise<void>
  onRequestUsername?: () => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [repliesOpen, setRepliesOpen] = useState(false)
  const inQueue = isAdmin && post.status === 'pending'

  // Approved replies plus the viewer's own pending/rejected replies to this post.
  const shownReplies = [
    ...(replies ?? []),
    ...(myReplies ?? []).filter((r) => r.status !== 'approved'),
  ]
  // Auto-expand when the viewer has a pending/rejected reply so they can see
  // its moderation status without hunting for it.
  const hasMyPending = (myReplies ?? []).some((r) => r.status !== 'approved')
  const repliesVisible = repliesOpen || hasMyPending

  const submitReply = async () => {
    if (!onReply || sending || replyText.trim().length === 0) return
    setSending(true)
    await onReply(post.id, replyText.trim())
    setReplyText('')
    setReplyOpen(false)
    setSending(false)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border-b border-[#232b25] px-4 py-4 last:border-b-0"
    >
      <div className="flex gap-3">
        <Avatar url={post.author_avatar_url} name={post.author_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-[#e9ece8]">{post.author_name}</p>
            {you ? <span className="text-xs text-[#5c665e]">you</span> : null}
            <span className="text-xs text-[#5c665e]">· {timeAgo(post.created_at)}</span>
            <StatusBadge status={post.status} />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#e9ece8]">{post.content}</p>
          {post.image_url ? (
            <img
              src={post.image_url}
              alt=""
              loading="lazy"
              className="mt-3 max-h-96 w-full rounded-xl border border-[#232b25] object-cover"
            />
          ) : null}

          {inQueue && onReview ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onReview(post.id, 'approved')}
                className="flex min-h-10 items-center gap-1.5 rounded-full bg-[#e9ece8] px-4 py-2 text-xs font-semibold text-[#0f1412] transition-opacity hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Approve
              </button>
              <button
                type="button"
                onClick={() => onReview(post.id, 'rejected')}
                className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#232b25] bg-transparent px-4 py-2 text-xs font-medium text-[#ff6b5e] transition-colors hover:bg-[#1a221c]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                Reject
              </button>
            </div>
          ) : null}

          {/* Actions only on live (approved) posts in the feed. */}
          {post.status === 'approved' && !isAdmin ? (
            <div className="mt-2.5 flex items-center gap-5 text-[#5c665e]">
              <button
                type="button"
                onClick={() => onToggleLike?.(post.id, like?.likedByMe ?? false)}
                className={`flex items-center gap-1.5 text-xs transition-colors hover:text-[#ff5e8a] ${
                  like?.likedByMe ? 'text-[#ff5e8a]' : ''
                }`}
              >
                <Heart className="h-4 w-4" fill={like?.likedByMe ? 'currentColor' : 'none'} aria-hidden />
                {like?.count ? like.count : ''}
                <span className="sr-only">like</span>
              </button>
              <button
                type="button"
                onClick={() => (needsUsername ? onRequestUsername?.() : setReplyOpen((v) => !v))}
                className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#2979ff]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Reply
              </button>
            </div>
          ) : null}

          {you && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="mt-2 flex items-center gap-1 text-xs text-[#5c665e] transition-colors hover:text-[#ff6b5e]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </button>
          ) : null}

          {replyOpen ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value.slice(0, MAX_POST_LENGTH))}
                placeholder="Write a reply…"
                autoFocus
                className="min-h-10 flex-1 rounded-lg border border-[#232b25] bg-[#0f1412] px-3 text-sm text-[#e9ece8] placeholder-[#5c665e] outline-none focus:border-[#2979ff]"
              />
              <button
                type="button"
                onClick={() => void submitReply()}
                disabled={sending || replyText.trim().length === 0}
                className="min-h-10 rounded-full bg-[#e9ece8] px-5 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Reply'}
              </button>
            </div>
          ) : null}

          {shownReplies.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setRepliesOpen((v) => !v)}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[#5c665e] transition-colors hover:text-[#a7b0a8]"
              >
                <span className="h-px w-6 bg-[#232b25]" aria-hidden />
                {repliesVisible
                  ? 'Hide replies'
                  : `View ${shownReplies.length} ${shownReplies.length === 1 ? 'reply' : 'replies'}`}
              </button>
              {repliesVisible ? (
                <div className="mt-2 border-l-2 border-[#232b25] pl-3">
                  {shownReplies.map((r) => (
                    <ReplyRow
                      key={r.id}
                      reply={r}
                      you={r.user_id === userId}
                      onDelete={r.user_id === userId ? onDeleteReply : undefined}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}

/**
 * Threads-style community feed with approve-first moderation. Posts and replies
 * both submit as 'pending' and only go public after founder approval. Authors
 * see their own pending/rejected items inline; others only see approved.
 */
export function CommunityFeed({ userId, isAdmin }: CommunityFeedProps) {
  const { profile, refreshProfile } = useAuth()
  const [approved, setApproved] = useState<Post[]>([])
  const [mine, setMine] = useState<Post[]>([])
  const [pendingQueue, setPendingQueue] = useState<Post[]>([])
  const [replies, setReplies] = useState<Post[]>([])
  const [likes, setLikes] = useState<Record<string, LikeInfo>>({})
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // A username is required before posting or replying, so every message in
  // the feed has a real handle attached (not the generic "member" fallback).
  const hasUsername = !!profile?.username?.trim()
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const requestUsername = () => {
    usernameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    usernameInputRef.current?.focus()
  }

  const saveUsername = async () => {
    const trimmed = usernameInput.trim()
    if (!trimmed) {
      setUsernameError('Choose a username first.')
      return
    }
    if (isUsernameRestricted(trimmed)) {
      setUsernameError('That username contains restricted language or symbols.')
      return
    }
    setUsernameSaving(true)
    setUsernameError('')
    const { error: err } = await updateProfileFields(userId, {
      full_name: profile?.full_name ?? null,
      username: trimmed,
    })
    if (err) {
      const msg = String(err).toLowerCase()
      setUsernameError(msg.includes('duplicate') || msg.includes('23505') ? 'That username is already taken.' : err)
      setUsernameSaving(false)
      return
    }
    await refreshProfile()
    setUsernameSaving(false)
  }

  const refresh = useCallback(async () => {
    const [a, m, q] = await Promise.all([
      fetchApprovedPosts(),
      fetchMyPosts(userId),
      isAdmin ? fetchPendingPosts() : Promise.resolve([]),
    ])
    setApproved(a)
    setMine(m)
    setPendingQueue(q)

    const parentIds = a.map((p) => p.id)
    const [reps, likeMap] = await Promise.all([
      fetchApprovedReplies(parentIds),
      fetchLikes(parentIds, userId),
    ])
    setReplies(reps)
    setLikes(likeMap)
    setLoading(false)
  }, [userId, isAdmin])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refresh()
    })()
  }, [refresh])

  const attachImage = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const submit = async () => {
    if (posting) return
    setPosting(true)
    setError('')
    setNotice('')
    const err = await createPost(userId, draft, imageFile)
    if (err) {
      setError(err)
    } else {
      setDraft('')
      attachImage(null)
      setNotice('Submitted. An admin will check your post before it goes live.')
      await refresh()
    }
    setPosting(false)
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setPendingQueue((q) => q.filter((p) => p.id !== id))
    const err = await reviewPost(id, status)
    if (err) setError(err)
    await refresh()
  }

  const handleDelete = async (id: string) => {
    const err = await deletePost(id)
    if (err) setError(err)
    await refresh()
  }

  const handleToggleLike = async (id: string, liked: boolean) => {
    // Optimistic flip.
    setLikes((prev) => {
      const cur = prev[id] ?? { count: 0, likedByMe: false }
      return {
        ...prev,
        [id]: { count: Math.max(0, cur.count + (liked ? -1 : 1)), likedByMe: !liked },
      }
    })
    const err = await toggleLike(id, userId, liked)
    if (err) await refresh()
  }

  const handleReply = async (parentId: string, text: string) => {
    const err = await createReply(userId, parentId, text)
    if (err) {
      setError(err)
    } else {
      setNotice('Reply submitted. An admin will check it before it goes live.')
      await refresh()
    }
  }

  const ownExtras = mine.filter((p) => p.status !== 'approved' && p.parent_id === null)
  const feed = [...ownExtras, ...approved]
  const repliesByParent = (parentId: string) => replies.filter((r) => r.parent_id === parentId)
  const myRepliesByParent = (parentId: string) =>
    mine.filter((r) => r.parent_id === parentId)

  return (
    <div className="space-y-6">
      <Card title="New post" subtitle="Wins, questions, ideas — reviewed before they go live">
        {hasUsername ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_POST_LENGTH))}
              placeholder="Share a win, a question, or a money lesson…"
              rows={3}
              className="w-full resize-y rounded-lg border border-[#232b25] bg-[#0f1412] p-3 text-sm text-[#e9ece8] placeholder-[#5c665e] outline-none transition-colors focus:border-[#2979ff]"
            />
            {imagePreview ? (
              <div className="relative mt-2 w-fit">
                <img src={imagePreview} alt="" className="max-h-48 rounded-xl border border-[#232b25]" />
                <button
                  type="button"
                  onClick={() => attachImage(null)}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f1412] text-[#e9ece8] shadow"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => attachImage(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach an image"
                  className="flex min-h-10 items-center gap-1.5 rounded-lg border border-[#232b25] bg-transparent px-3 py-2 text-xs font-medium text-[#a7b0a8] transition-colors hover:bg-[#1a221c]"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  Photo
                </button>
                <p className="text-xs text-[#5c665e]">
                  {draft.length} / {MAX_POST_LENGTH}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={posting || draft.trim().length === 0}
                className="min-h-10 rounded-full bg-[#e9ece8] px-6 py-2 text-sm font-semibold text-[#0f1412] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
            {notice ? <p className="mt-2 text-xs text-[#2979ff]">{notice}</p> : null}
            {error ? <p className="mt-2 text-xs text-[#ff6b5e]">{error}</p> : null}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#a7b0a8]">Choose a username before you can post or reply.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={usernameInputRef}
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value.replace(/\s/g, ''))
                  setUsernameError('')
                }}
                placeholder="unique_handle"
                className="min-h-10 flex-1 rounded-lg border border-[#232b25] bg-[#0f1412] px-3 text-sm text-[#e9ece8] placeholder-[#5c665e] outline-none focus:border-[#2979ff]"
              />
              <button
                type="button"
                onClick={() => void saveUsername()}
                disabled={usernameSaving || usernameInput.trim().length === 0}
                className="min-h-10 rounded-full bg-[#e9ece8] px-5 text-sm font-semibold text-[#0f1412] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {usernameSaving ? 'Saving…' : 'Save username'}
              </button>
            </div>
            {usernameError ? <p className="text-xs text-[#ff6b5e]">{usernameError}</p> : null}
          </div>
        )}
      </Card>

      {isAdmin && pendingQueue.length > 0 ? (
        <div className="rounded-xl border border-[#8a6d1d]/40 bg-[#e5c76b]/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5c76b]">
            Awaiting your review · {pendingQueue.length}
          </p>
          <AnimatePresence initial={false}>
            {pendingQueue.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                you={p.user_id === userId}
                userId={userId}
                isAdmin
                onReview={handleReview}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#232b25] bg-[#121a15]">
        {loading ? (
          <p className="px-4 py-6 text-center text-sm text-[#5c665e]">Loading the feed…</p>
        ) : feed.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#5c665e]">
            Nothing here yet. Be the first to share a win.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {feed.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                you={p.user_id === userId}
                userId={userId}
                isAdmin={false}
                like={likes[p.id]}
                replies={repliesByParent(p.id)}
                myReplies={myRepliesByParent(p.id)}
                needsUsername={!hasUsername}
                onDelete={p.user_id === userId ? handleDelete : undefined}
                onDeleteReply={handleDelete}
                onToggleLike={handleToggleLike}
                onReply={handleReply}
                onRequestUsername={requestUsername}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
