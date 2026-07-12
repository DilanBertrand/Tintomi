import { AnimatePresence, motion } from 'framer-motion'
import { Check, ImagePlus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from './Card'
import {
  createPost,
  deletePost,
  fetchApprovedPosts,
  fetchMyPosts,
  fetchPendingPosts,
  reviewPost,
  type Post,
} from '../lib/posts'

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

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#232b25] text-sm font-semibold text-[#e9ece8]">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function PostRow({
  post,
  you,
  isAdmin,
  onReview,
  onDelete,
}: {
  post: Post
  you: boolean
  isAdmin: boolean
  onReview?: (id: string, status: 'approved' | 'rejected') => void
  onDelete?: (id: string) => void
}) {
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
            {post.status === 'pending' ? (
              <span className="rounded-full border border-[#8a6d1d]/50 bg-[#e5c76b]/10 px-2 py-0.5 text-[10px] font-semibold text-[#e5c76b]">
                An admin is checking your post
              </span>
            ) : null}
            {post.status === 'rejected' ? (
              <span className="rounded-full border border-[#7a2e27]/60 bg-[#ff6b5e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff6b5e]">
                Not approved
              </span>
            ) : null}
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
          {isAdmin && post.status === 'pending' && onReview ? (
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
        </div>
      </div>
    </motion.article>
  )
}

/**
 * Threads-style community feed. Posts submit as 'pending'; only the founder
 * (is_admin) sees and reviews the queue. Authors see their own pending and
 * rejected posts inline with a status badge; everyone else only sees approved.
 */
export function CommunityFeed({ userId, isAdmin }: CommunityFeedProps) {
  const [approved, setApproved] = useState<Post[]>([])
  const [mine, setMine] = useState<Post[]>([])
  const [pendingQueue, setPendingQueue] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const [a, m, q] = await Promise.all([
      fetchApprovedPosts(),
      fetchMyPosts(userId),
      isAdmin ? fetchPendingPosts() : Promise.resolve([]),
    ])
    setApproved(a)
    setMine(m)
    setPendingQueue(q)
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

  // Shared feed = approved posts; splice the author's own pending/rejected on
  // top so they can see where their post stands. Dedupe own approved posts.
  const ownExtras = mine.filter((p) => p.status !== 'approved')
  const feed = [...ownExtras, ...approved]

  return (
    <div className="space-y-6">
      <Card title="New post" subtitle="Wins, questions, ideas — reviewed before they go live">
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
      </Card>

      {isAdmin && pendingQueue.length > 0 ? (
        <div className="rounded-xl border border-[#8a6d1d]/40 bg-[#e5c76b]/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5c76b]">
            Awaiting your review · {pendingQueue.length}
          </p>
          <AnimatePresence initial={false}>
            {pendingQueue.map((p) => (
              <PostRow key={p.id} post={p} you={p.user_id === userId} isAdmin onReview={handleReview} />
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
                isAdmin={false}
                onDelete={p.user_id === userId ? handleDelete : undefined}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
