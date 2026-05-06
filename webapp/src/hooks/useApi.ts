import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
})

export const backendUrl = apiUrl.replace('/api/v1', '')

export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path
  return `${backendUrl}${path}`
}

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
  streak?: number
  last_active_date?: string
  posts_count?: number
  followers_count?: number
  following_count?: number
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
  type: 'story' | 'achievement' | 'tip' | 'question'
  text?: string
  image_url?: string
  level_tag?: string
  word_id?: number
}

export type PostWord = {
  id: number
  term: string
  meaning: string
  note?: string
  is_singular?: boolean
}

export type PostOut = {
  id: number
  user_id: number
  type: string
  text?: string
  image_url?: string
  level_tag?: string
  likes: number
  timestamp: string
  comments_count: number
  liked_by_me: boolean
  word_id?: number
  word?: PostWord
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

export async function fetchDiscoverFeed(userId: number, limit = 20, offset = 0) {
  const res = await api.get(`/feed/${userId}/discover?limit=${limit}&offset=${offset}`)
  return res.data
}

export async function fetchWordOfTheDay() {
  const res = await api.get('/words/word-of-the-day')
  return res.data
}

export async function createPost(payload: PostPayload) {
  const res = await api.post('/posts', payload)
  return res.data
}

export async function createWord(payload: { user_id: number; term: string; meaning: string; note?: string; is_singular?: boolean; folder_id?: number }) {
  const res = await api.post('/words', payload)
  return res.data
}

export async function listWords(userId: number, limit = 50, offset = 0, folderId?: number) {
  const res = await api.get(`/words/${userId}`, { params: { limit, offset, folder_id: folderId } })
  return res.data
}

export async function listWordsByFolder(userId: number) {
  const res = await api.get(`/words/${userId}/by-folder`)
  return res.data
}

export async function updateWord(wordId: number, userId: number, data: { folder_id?: number; term?: string; meaning?: string; note?: string; is_singular?: boolean }) {
  const res = await api.put(`/words/${wordId}`, data, { params: { user_id: userId } })
  return res.data
}

export async function saveWord(wordId: number, userId: number) {
  const res = await api.post(`/words/${wordId}/save`, null, { params: { user_id: userId } })
  return res.data
}

export async function deleteWord(wordId: number, userId: number) {
  const res = await api.delete(`/words/${wordId}`, { params: { user_id: userId } })
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

export async function listFollowers(userId: number) {
  const res = await api.get(`/follow/${userId}/followers`)
  return res.data
}

export async function listFollowing(userId: number) {
  const res = await api.get(`/follow/${userId}/following`)
  return res.data
}

export async function unfollowUser(targetId: number, followerId: number) {
  const res = await api.delete(`/follow/${targetId}`, { params: { follower_id: followerId } })
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

export async function uploadPostImage(userId: number, file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('user_id', String(userId))
  formData.append('file', file)
  const res = await api.post('/upload/post-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteProfilePhoto(userId: number): Promise<{ message: string }> {
  const res = await api.delete('/upload/profile-photo', { params: { user_id: userId } })
  return res.data
}

export type Quiz = {
  id: number
  user_id: number
  total_questions: number
  correct_answers: number
  score_percentage: number
  word_ids?: number[]
  duration_seconds?: number
  created_at: string
}

export type QuizCreatePayload = {
  user_id: number
  total_questions: number
  correct_answers: number
  score_percentage: number
  word_ids?: number[]
  duration_seconds?: number
}

export async function createQuiz(payload: QuizCreatePayload): Promise<Quiz> {
  const res = await api.post('/quizzes', payload)
  return res.data
}

export async function listQuizzes(userId: number, limit = 50, offset = 0): Promise<Quiz[]> {
  const res = await api.get(`/quizzes/${userId}`, { params: { limit, offset } })
  return res.data
}

export async function getLatestQuiz(userId: number): Promise<Quiz | null> {
  const res = await api.get(`/quizzes/${userId}/latest`)
  return res.data
}

// Word Folder types
export type WordFolder = {
  id: number
  user_id: number
  name: string
  description: string | null
  color: string
  icon: string | null
  sort_order: number
  words_count?: number
  created_at: string
  updated_at: string
}

export type WordFolderCreatePayload = {
  user_id: number
  name: string
  description?: string
  color?: string
  icon?: string
}

export type WordFolderUpdatePayload = {
  name?: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
}

// Word Folder API endpoints
export async function createWordFolder(payload: WordFolderCreatePayload): Promise<WordFolder> {
  const res = await api.post('/folders', payload)
  return res.data
}

export async function listWordFolders(userId: number): Promise<WordFolder[]> {
  const res = await api.get(`/folders/user/${userId}`)
  return res.data
}

export async function updateWordFolder(folderId: number, payload: WordFolderUpdatePayload): Promise<WordFolder> {
  const res = await api.put(`/folders/${folderId}`, payload)
  return res.data
}

export async function deleteWordFolder(folderId: number, userId: number): Promise<{ detail: string }> {
  const res = await api.delete(`/folders/${folderId}`, { params: { user_id: userId } })
  return res.data
}

export async function reorderWordFolders(folders: { id: number; sort_order: number }[]): Promise<{ detail: string }> {
  const res = await api.post('/folders/reorder', folders)
  return res.data
}

// Grammar Practicer types and API functions
export type GrammarRule = {
  id: number
  name: string
  description: string | null
  level: string | null
  category: string | null
}

export type GrammarExercise = {
  id: number
  rule_id: number
  type: string
  prompt_text: string
  expected_answer: string
  native_sentence: string | null
  infinitive_verb: string | null
  difficulty: number | null
  llm_prompt_used: string | null
  created_at: string
}

export type UserGrammarAttempt = {
  id: number
  user_id: number
  exercise_id: number
  user_input: string
  is_correct: boolean
  feedback_explanation: string | null
  rule_missed_id: number | null
  attempt_timestamp: string
}

export type UserGrammarProgress = {
  id: number
  user_id: number
  rule_id: number
  correct_attempts: number
  total_attempts: number
  last_practiced_at: string
  streak_eligible_today: boolean
}

export async function fetchGrammarRules(): Promise<GrammarRule[]> {
  const res = await api.get('/grammar/rules')
  return res.data
}

export async function fetchGrammarExercises(
  userId: number,
  options?: {
    rule_id?: number
    type?: string
    difficulty?: number
    limit?: number
  }
): Promise<GrammarExercise[]> {
  const res = await api.get(`/grammar/exercises/${userId}`, { params: options })
  return res.data
}

export async function submitGrammarAnswer(
  exerciseId: number,
  userId: number,
  userInput: string
): Promise<UserGrammarAttempt> {
  const res = await api.post(`/grammar/submit/${exerciseId}`, {
    user_id: userId,
    user_input: userInput
  })
  return res.data
}

export async function submitShadowingAnswer(
  exerciseId: number,
  userId: number,
  userInput: string
): Promise<UserGrammarAttempt> {
  const res = await api.post(`/grammar/shadowing-feedback/${exerciseId}`, {
    user_id: userId,
    user_input: userInput
  })
  return res.data
}

export async function fetchGrammarProgress(userId: number): Promise<UserGrammarProgress[]> {
  const res = await api.get(`/grammar/progress/${userId}`)
  return res.data
}

export async function fetchMistakeReplayQuiz(userId: number): Promise<GrammarExercise[]> {
  const res = await api.get(`/grammar/mistake-replay/${userId}`)
  return res.data
}
