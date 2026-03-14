import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1' })

export const useApi = () => api

export type UserProfile = {
  telegram_id: number
  username: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  city?: string
  interests?: Record<string, unknown>
  profile_photo?: string
}

export type PostPayload = {
  user_id: number
  type: 'story' | 'achievement' | 'tip'
  text?: string
  image_url?: string
  level_tag?: string
}

export async function upsertProfile(data: UserProfile) {
  const res = await api.post('/users/profile', data)
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
