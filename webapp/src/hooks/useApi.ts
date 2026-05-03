import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
})

export const useApi = () => api

export type User = {
  id: number
  username: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  city?: string
  interests?: Record<string, unknown>
  profile_photo?: string
  full_name?: string
  about?: string
  age?: number
  words_count: number
  notify_likes: number
  notify_follows: number
  notify_comments: number
  recovery_codes?: number[]
  created_at: string
}

export type WebSignupPayload = {
  username: string
  level: User['level']
  city?: string
  interests?: Record<string, unknown>
  profile_photo?: string
  password: string
  recovery_codes?: number[]
}

export type UpdateUserPayload = Partial<Omit<WebSignupPayload, 'username'>> &
  Partial<Pick<User, 'username' | 'words_count' | 'full_name' | 'about' | 'age'>>

export async function login(payload: { username: string; password: string }): Promise<User> {
  const res = await api.post('/auth/login', payload)
  return res.data
}

export async function checkUsername(username: string): Promise<{ exists: boolean }> {
  const res = await api.get('/auth/check', { params: { username } })
  return res.data
}


export type PostPayload = {
  user_id: number
  type: 'story' | 'achievement' | 'tip' | 'word'
  text?: string
  image_url?: string
  level_tag?: string
}

export async function signup(data: WebSignupPayload): Promise<User> {
  const res = await api.post('/auth/signup', data)
  return res.data
}

export async function getUser(userId: number): Promise<User> {
  const res = await api.get(`/users/${userId}`)
  return res.data
}

export async function updateUser(userId: number, data: UpdateUserPayload): Promise<User> {
  const res = await api.put(`/users/${userId}`, data)
  return res.data
}

export async function fetchFeed(userId: number, limit = 10, offset = 0) {
  const res = await api.get(`/feed/${userId}?limit=${limit}&offset=${offset}`)
  return res.data
}

export async function createPost(payload: PostPayload) {
  const res = await api.post('/posts', payload)
  return res.data
}

export async function createWord(payload: { user_id: number; term: string; meaning: string; note?: string }) {
  const res = await api.post('/words', payload)
  return res.data
}

export async function listWords(userId: number, limit = 50, offset = 0) {
  const res = await api.get(`/words/${userId}`, { params: { limit, offset } })
  return res.data
}

export async function listWordsFeed(limit = 50, offset = 0) {
  const res = await api.get(`/words/feed`, { params: { limit, offset } })
  return res.data
}

export async function searchUsers(query: string, level?: string) {
  const res = await api.get(`/users/search`, { params: { q: query, level } })
  return res.data
}

export async function followUser(targetId: number, followerId: number) {
  const res = await api.post(`/follow/${targetId}`, null, { params: { follower_id: followerId } })
  return res.data
}

export async function likePost(postId: number, userId: number) {
  const res = await api.post(`/posts/${postId}/like`, null, { params: { user_id: userId } })
  return res.data
}

export async function commentPost(postId: number, payload: { user_id: number; text: string }) {
  const res = await api.post(`/posts/${postId}/comment`, payload)
  return res.data
}

export async function listUserPosts(userId: number, limit = 50, offset = 0) {
  const res = await api.get(`/posts/user/${userId}`, { params: { limit, offset } })
  return res.data
}

export async function deletePost(postId: number, userId: number) {
  const res = await api.delete(`/posts/${postId}`, { params: { user_id: userId } })
  return res.data
}

export async function listComments(postId: number, limit = 50, offset = 0) {
  const res = await api.get(`/posts/${postId}/comments`, { params: { limit, offset } })
  return res.data
}

export type Notification = {
  id: number
  user_id: number
  from_user_id: number | null
  type: string
  text: string | null
  post_id: number | null
  is_read: number
  created_at: string
}

export type NotificationsResponse = {
  notifications: Notification[]
  unread_count: number
}

export async function fetchNotifications(userId: number, limit = 20, offset = 0): Promise<NotificationsResponse> {
  const res = await api.get(`/notifications/${userId}`, { params: { limit, offset } })
  return res.data
}

export async function markNotificationRead(notificationId: number) {
  const res = await api.post(`/notifications/${notificationId}/read`)
  return res.data
}

export async function markAllNotificationsRead(userId: number) {
  const res = await api.post(`/notifications/read-all/${userId}`)
  return res.data
}

// File upload for profile photos
export async function uploadProfilePhoto(userId: number, file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData()
  formData.append('user_id', userId.toString())
  formData.append('file', file)
  
  const res = await api.post('/upload/profile-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export async function deleteProfilePhoto(userId: number): Promise<{ message: string }> {
  const res = await api.delete('/upload/profile-photo', { params: { user_id: userId } })
  return res.data
}
