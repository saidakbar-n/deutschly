import { useEffect, useState } from 'react'
import { fetchFeed, followUser, likePost, commentPost } from '../hooks/useApi'
import { PostCard } from '../components/PostCard'
import { CreatePostModal } from '../components/CreatePostModal'
import { Header } from '../components/Header'
import { useTelegram } from '../hooks/useTelegram'
import { useUserId } from '../hooks/useUserId'

export function Feed() {
  const userId = useUserId(1)
  const [items, setItems] = useState<any[]>([])
  const { theme } = useTelegram()

  useEffect(() => {
    fetchFeed(userId, 20, 0).then((data) => {
      setItems(data.items || [])
    })
  }, [userId])

  const handleLike = async (postId: number) => {
    await likePost(postId, userId)
    setItems((prev) =>
      prev.map((it) =>
        it.post.id === postId ? { ...it, post: { ...it.post, likes: (it.post.likes || 0) + 1 } } : it
      )
    )
  }

  const handleComment = async (postId: number) => {
    await commentPost(postId, { user_id: userId, text: '👍' })
  }

  const handleFollow = async (targetId: number) => {
    await followUser(targetId, userId)
  }

  const stories = items.filter((it) => it.post.type === 'story')

  return (
    <div className="space-y-4" id="app" data-theme={theme}>
      <Header />
      {stories.length > 0 && (
        <div className="card overflow-x-auto flex gap-3">
          {stories.map((it) => (
            <div key={it.post.id} className="flex-shrink-0 w-24 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-2"></div>
              <p className="text-xs font-semibold truncate">{it.author.username}</p>
            </div>
          ))}
        </div>
      )}
      <CreatePostModal userId={userId} />
      <div className="space-y-3">
        {items.map((it) => (
          <PostCard
            key={it.post.id}
            id={it.post.id}
            author={{ username: it.author.username, level: it.author.level, city: it.author.city }}
            text={it.post.text}
            image_url={it.post.image_url}
            type={it.post.type}
            likes={it.post.likes}
            comments_count={it.post.comments_count}
            onFollow={() => handleFollow(it.author.id)}
            onLike={() => handleLike(it.post.id)}
            onComment={() => handleComment(it.post.id)}
          />
        ))}
      </div>
    </div>
  )
}
