import axios from 'axios'

export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
})

export const backendUrl = apiUrl.replace('/api/v1', '')
export const wsUrl = apiUrl.replace('/api/v1', '').replace('http', 'ws')

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
  is_online?: boolean
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

export async function deleteComment(postId: number, commentId: number, userId: number) {
  const res = await api.delete(`/posts/${postId}/comment/${commentId}`, { params: { user_id: userId } })
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

export type UserGrammarProgressRich = {
  id: number
  rule_id: number
  rule_name: string
  rule_category: string | null
  rule_level: string | null
  correct_attempts: number
  total_attempts: number
  accuracy: number
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

export async function fetchGrammarProgress(userId: number): Promise<UserGrammarProgressRich[]> {
  const res = await api.get(`/grammar/progress/${userId}`)
  return res.data
}

export async function generateGrammarExercise(
  ruleId: number,
  exerciseType: string
): Promise<GrammarExercise> {
  const res = await api.post('/grammar/generate-exercise', null, {
    params: { rule_id: ruleId, exercise_type: exerciseType }
  })
  return res.data
}

export async function fetchMistakeReplayQuiz(userId: number): Promise<GrammarExercise[]> {
  const res = await api.get(`/grammar/mistake-replay/${userId}`)
  return res.data
}

export type GrammarBook = {
  id: number
  level: string
  title: string
  description: string | null
  sort_order: number
  chapter_count: number
}

export type ChapterProgress = {
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
  exercises_done: number
  exercises_total: number
  score_pct: number
}

export type GrammarChapter = {
  id: number
  book_id: number
  number: number
  title: string
  topic: string | null
  sort_order: number
  exercise_count: number
  progress: ChapterProgress
}

export async function fetchGrammarBooks(): Promise<GrammarBook[]> {
  const res = await api.get('/grammar/books')
  return res.data
}

export async function fetchChapters(bookId: number, userId: number): Promise<GrammarChapter[]> {
  const res = await api.get(`/grammar/books/${bookId}/chapters`, { params: { user_id: userId } })
  return res.data
}

export async function fetchChapterExercises(chapterId: number, userId: number, limit = 5): Promise<GrammarExercise[]> {
  const res = await api.get(`/grammar/chapters/${chapterId}/exercises`, { params: { user_id: userId, limit } })
  return res.data
}

export async function fetchChapterProgress(chapterId: number, userId: number): Promise<ChapterProgress & { id: number }> {
  const res = await api.get(`/grammar/chapters/${chapterId}/progress/${userId}`)
  return res.data
}

export async function syncChapterProgress(chapterId: number, userId: number): Promise<ChapterProgress> {
  const res = await api.post(`/grammar/chapters/${chapterId}/sync-progress/${userId}`)
  return res.data
}

export async function resetChapterProgress(chapterId: number, userId: number): Promise<void> {
  await api.post(`/grammar/chapters/${chapterId}/reset-progress/${userId}`)
}

export type QuickStartResult = {
  book: { id: number; level: string; title: string }
  chapter: { id: number; number: number; title: string; topic: string | null; exercise_count: number }
  progress: ChapterProgress
} | null

export async function quickStartGrammar(userId: number, level?: string): Promise<QuickStartResult> {
  const res = await api.get(`/grammar/quick-start/${userId}`, {
    params: level ? { level } : {}
  })
  return res.data
}

export type Conversation = {
  id: number
  other_user: {
    id: number
    username: string
    full_name?: string
    profile_photo?: string
    level?: string
    last_active_date?: string
    is_online?: boolean
  }
  last_message?: {
    id: number
    sender_id: number
    text: string
    created_at: string
  }
  unread_count: number
  created_at: string
  is_pending?: boolean
}

export type Message = {
  id: number
  conversation_id: number
  sender_id: number
  text: string
  created_at: string
}

export async function listConversations(userId: number): Promise<Conversation[]> {
  const res = await api.get('/conversations', { params: { user_id: userId } })
  return res.data
}

export async function createConversation(userId: number, participantId: number): Promise<Conversation> {
  const res = await api.post('/conversations', { user_id: userId, participant_id: participantId })
  return res.data
}

export async function listMessages(conversationId: number, userId: number, limit = 50, offset = 0): Promise<Message[]> {
  const res = await api.get(`/conversations/${conversationId}/messages`, { params: { user_id: userId, limit, offset } })
  return res.data
}

export async function sendMessage(conversationId: number, senderId: number, text: string): Promise<Message> {
  const res = await api.post(`/conversations/${conversationId}/messages`, { sender_id: senderId, text })
  return res.data
}

export async function fetchUnreadChatCount(userId: number): Promise<{ unread_count: number }> {
  const res = await api.get('/conversations/unread-count', { params: { user_id: userId } })
  return res.data
}

export async function acceptChatRequest(conversationId: number, userId: number): Promise<void> {
  await api.post(`/conversations/${conversationId}/accept`, null, { params: { user_id: userId } })
}

export async function deleteConversation(conversationId: number, userId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`, { params: { user_id: userId } })
}

export async function transcribeVoice(audioBlob: Blob, language = 'de'): Promise<{ text: string; confidence: number }> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.wav')
  const res = await api.post('/grammar/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { language }
  })
  return res.data
}

// ===== Translation =====

export type TranslationResult = {
  original: string
  translated: string
  detected_language: string | null
  alternatives: string[]
  article: string | null
  term_with_article: string | null
}

export async function translateText(
  text: string,
  sourceLang: string = 'de',
  targetLang: string = 'en'
): Promise<TranslationResult> {
  const res = await api.get('/translate', {
    params: { q: text, source: sourceLang, target: targetLang }
  })
  return res.data
}

export type ArticleDetectionResult = {
  article: string | null
  term_with_article: string | null
  method: string | null
}

export async function detectArticle(word: string, englishHint?: string): Promise<ArticleDetectionResult> {
  const res = await api.get('/translate/detect-article', {
    params: { word, english_hint: englishHint }
  })
  return res.data
}

// ===== Sticky Notes =====

export type StickyNote = {
  id: number
  user_id: number
  title: string | null
  content: string
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  is_pinned: boolean
  reminder_at: string | null
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

export async function listStickyNotes(userId: number): Promise<StickyNote[]> {
  const res = await api.get('/sticky-notes', { params: { user_id: userId } })
  return res.data
}

export async function createStickyNote(payload: {
  user_id: number
  title?: string
  content: string
  color?: string
  is_pinned?: boolean
  reminder_at?: string
}): Promise<StickyNote> {
  const res = await api.post('/sticky-notes', payload)
  return res.data
}

export async function updateStickyNote(noteId: number, userId: number, payload: Partial<{
  title: string
  content: string
  color: string
  is_pinned: boolean
  reminder_at: string | null
}>): Promise<StickyNote> {
  const res = await api.put(`/sticky-notes/${noteId}`, payload, { params: { user_id: userId } })
  return res.data
}

export async function deleteStickyNote(noteId: number, userId: number): Promise<void> {
  await api.delete(`/sticky-notes/${noteId}`, { params: { user_id: userId } })
}

export async function markConversationRead(conversationId: number, userId: number): Promise<void> {
  await api.post(`/conversations/${conversationId}/mark-read`, null, { params: { user_id: userId } })
}

// ===== Flashcards & Batch Words =====

export type WordReview = {
  id: number
  word_id: number
  user_id: number
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  last_reviewed: string | null
  created_at: string
}

export type DueCard = {
  id: number
  word_id: number
  term: string
  meaning: string
  note: string | null
  is_singular: boolean
  folder_id: number | null
  review: WordReview
}

export type FlashcardStats = {
  total: number
  due: number
  reviewed: number
}

export async function createWordsBatch(payload: {
  user_id: number
  folder_id?: number
  words: { term: string; meaning: string; note?: string; is_singular?: boolean }[]
}): Promise<{ created: number; words: any[] }> {
  const res = await api.post('/words/batch', payload)
  return res.data
}

export async function getDueFlashcards(userId: number, folderId?: number, limit = 20): Promise<DueCard[]> {
  const params: any = {}
  if (folderId) params.folder_id = folderId
  if (limit) params.limit = limit
  const res = await api.get(`/flashcards/due/${userId}`, { params })
  return res.data
}

export async function getFlashcardStats(userId: number): Promise<FlashcardStats> {
  const res = await api.get(`/flashcards/stats/${userId}`)
  return res.data
}

export async function submitFlashcardReview(reviewId: number, userId: number, rating: number): Promise<{ status: string; next_review: string }> {
  const res = await api.post(`/flashcards/review/${reviewId}`, { user_id: userId, rating })
  return res.data
}

export async function setupFlashcardReview(userId: number, wordId: number): Promise<{ status: string; review_id: number }> {
  const res = await api.post(`/flashcards/setup/${userId}/${wordId}`)
  return res.data
}

export async function setupFolderFlashcards(userId: number, folderId: number): Promise<{ status: string; created: number; total: number }> {
  const res = await api.post(`/flashcards/setup-folder/${userId}/${folderId}`)
  return res.data
}
