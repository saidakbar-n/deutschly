import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { User } from '../hooks/useApi'
import { getImageUrl } from '../hooks/useApi'

export type TabType = 'followers' | 'following'

interface FollowersFollowingModalProps {
  user: User
  currentUserId?: number
  isOpen: boolean
  onClose: () => void
  initialTab?: TabType
  followers: User[]
  following: User[]
  followersLoading: boolean
  followingLoading: boolean
  viewerFollowingIds?: Set<number>
  onFollow: (targetUserId: number) => Promise<void>
  onViewUser?: (userId: number) => void
}

export function FollowersFollowingModal({
  user,
  currentUserId: viewerId,
  isOpen,
  onClose,
  initialTab = 'followers',
  followers,
  following,
  followersLoading,
  followingLoading,
  viewerFollowingIds,
  onFollow,
  onViewUser,
}: FollowersFollowingModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null
  const displayUsers = activeTab === 'followers' ? followers : following
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading
  const count = activeTab === 'followers' ? followers.length : following.length
  const title = activeTab === 'followers' ? 'Followers' : 'Following'

  const isFollowingUser = (userId: number) => {
    return viewerFollowingIds ? viewerFollowingIds.has(userId) : following.some(u => u.id === userId)
  }

  const isProfileOwner = (targetUserId: number) => {
    return viewerId === targetUserId
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-all ${
              activeTab === 'followers'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('followers')}
          >
            <span className="mr-1">{followers.length}</span>
            Followers
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-semibold text-sm transition-all ${
              activeTab === 'following'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('following')}
          >
            <span className="mr-1">{following.length}</span>
            Following
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-qaw-spin mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Loading...</p>
            </div>
          ) : displayUsers.length > 0 ? (
            <div className="space-y-3">
              {displayUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => {
                      if (u.id === user.id || u.id === viewerId) {
                        onClose()
                      } else {
                        onClose()
                        onViewUser?.(u.id)
                      }
                    }}
                  >
                    {u.profile_photo ? (
                      <img
                        src={getImageUrl(u.profile_photo)}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {u.username}
                        {u.is_premium && u.premium_status && (
                          <span className="text-sm ml-0.5">{u.premium_status}</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {u.full_name || u.city || 'German Learner'}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`level-badge level-${u.level?.toLowerCase() || ''}`}>
                      {u.level}
                    </span>
                    {u.id !== user.id && (
                      <button
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          isFollowingUser(u.id)
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                        onClick={async (e) => {
                          e.stopPropagation()
                          await onFollow(u.id)
                        }}
                      >
                        {isFollowingUser(u.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-lg">No {title.toLowerCase()} yet.</p>
              {activeTab === 'followers' ? (
                <p className="text-slate-500 text-sm mt-2">
                  Share your learning journey to attract followers!
                </p>
              ) : (
                <p className="text-slate-500 text-sm mt-2">
                  Start following other learners to see their posts!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">{displayUsers.length} {title.toLowerCase()}</p>
        </div>
      </div>
    </div>
  )
}
