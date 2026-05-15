import { useEffect, useState, useCallback } from 'react'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, getUser, type Notification as NotificationType } from '../hooks/useApi'
import { User } from '../hooks/useApi'

// Helper function to format time
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Helper function to generate notification text
function getNotificationText(notif: NotificationType, fromUserUsername?: string): string {
  switch (notif.type) {
    case 'follow':
      return `${fromUserUsername || 'Someone'} followed you`
    case 'like':
      return `${fromUserUsername || 'Someone'} liked your post`
    case 'comment':
      return `${fromUserUsername || 'Someone'} commented on your post`
    case 'story':
      return `New story from ${fromUserUsername || 'someone'}`
    case 'grammar_reminder':
      return notif.text || 'Ready for your grammar check?'
    case 'grammar_review':
      return notif.text || 'Let\'s review those tricky German cases!'
    default:
      return notif.text || `New notification: ${notif.type}`
  }
}

export function Notifications({ user }: { user: User }) {
  const userId = user.id
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromUserNames, setFromUserNames] = useState<Record<number, string>>({})

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNotifications(userId, 50, 0)
      setNotifications(data.notifications || [])
      
      // Fetch usernames for from_user_id
      const nameMap: Record<number, string> = {}
      const userIdsToFetch = new Set<number>()
      for (const notif of data.notifications || []) {
        if (notif.from_user_id && !nameMap[notif.from_user_id]) {
          userIdsToFetch.add(notif.from_user_id)
        }
      }
      
      // Fetch all needed usernames
      const namePromises = Array.from(userIdsToFetch).map(async (uid) => {
        try {
          const userData = await getUser(uid)
          nameMap[uid] = userData.username
        } catch (e) {
          nameMap[uid] = 'User'
        }
      })
      await Promise.all(namePromises)
      setFromUserNames(nameMap)
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markNotificationRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(userId)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1 }))
      )
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  if (loading) {
    return (
      <div className="card space-y-2 animate-qaw-fade-in-up">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="text-center py-8 text-slate-500">
          <div className="loading-spinner mx-auto" />
          <p className="mt-2 text-sm">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card space-y-2 animate-qaw-fade-in-up">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="text-center py-8 text-red-500">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadNotifications}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const hasUnread = notifications.some((n) => n.is_read === 0)

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
        {hasUnread && notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No notifications yet</p>
          <p className="text-xs mt-1">Stay active to receive updates</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const fromUserUsername = n.from_user_id ? fromUserNames[n.from_user_id] : null
            const text = getNotificationText(n, fromUserUsername)
            const isUnread = n.is_read === 0
            
            return (
              <button
                key={n.id}
                onClick={() => isUnread && handleMarkRead(n.id)}
                className={`flex justify-between items-center w-full p-3 py-3.5 rounded-xl text-left transition-colors min-h-[52px]
                  ${isUnread ? 'bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50' : 'border border-transparent hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  {isUnread && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                  )}
                  <p className={`text-sm ${isUnread ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                    {text}
                  </p>
                </div>
                <span className={`text-xs ${isUnread ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {formatTimeAgo(n.created_at)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
