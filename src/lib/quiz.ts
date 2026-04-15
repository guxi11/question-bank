import { type Question, type QuizConfig, type QuizSession, type QuizResult } from '../types'
import { shuffle, hashStr } from './utils'

export const getAttemptedIds = (history: readonly QuizResult[]): Set<string> =>
  new Set(history.flatMap(r => r.details.map(d => d.questionId)))

export const generateQuiz = (
  questions: readonly Question[],
  config: QuizConfig,
  history: readonly QuizResult[] = [],
): string[] => {
  const filtered = questions.filter(q => {
    if (config.types.length > 0 && !config.types.includes(q.type)) return false
    if (config.difficulties.length > 0 && !config.difficulties.includes(q.difficulty)) return false
    return true
  })
  const attempted = getAttemptedIds(history)
  const [undone, done] = filtered.reduce<[Question[], Question[]]>(
    ([u, d], q) => attempted.has(q.id) ? [u, [...d, q]] : [[...u, q], d],
    [[], []],
  )
  // prioritize undone, fill remainder with done
  const picked = shuffle(undone).slice(0, config.count)
  const remaining = config.count - picked.length
  if (remaining > 0) picked.push(...shuffle(done).slice(0, remaining))
  return picked.map(q => q.id)
}

const normalizeAnswer = (s: string) =>
  s.trim().replace(/\s+/g, '').toLowerCase()

const sortLetters = (s: string) =>
  [...s.toUpperCase()].filter(c => /[A-Z]/.test(c)).sort().join('')

export const checkAnswer = (question: Question, userAnswer: string): boolean => {
  const correct = question.answer.trim()
  const user = userAnswer.trim()
  if (!user) return false

  switch (question.type) {
    case 'single':
      return normalizeAnswer(user) === normalizeAnswer(correct)
    case 'multiple':
      return sortLetters(user) === sortLetters(correct)
    case 'judge':
      return normalizeAnswer(user) === normalizeAnswer(correct)
    case 'blank': {
      // alternatives separated by ；or ;
      const alts = correct.split(/[；;]/).map(normalizeAnswer)
      return alts.includes(normalizeAnswer(user))
    }
  }
}

export const createSession = (
  questionIds: string[],
  config: QuizConfig,
): QuizSession => ({
  id: hashStr(String(Date.now())).toString(),
  config,
  questionIds,
  answers: {},
  startedAt: Date.now(),
  finishedAt: null,
  currentIndex: 0,
})

export const gradeQuiz = (
  session: QuizSession,
  questions: readonly Question[],
): QuizResult => {
  const qMap = new Map(questions.map(q => [q.id, q]))
  const details = session.questionIds.map(id => {
    const q = qMap.get(id)
    const userAnswer = session.answers[id] ?? ''
    const correct = q ? checkAnswer(q, userAnswer) : false
    return { questionId: id, userAnswer, correct }
  })
  return {
    sessionId: session.id,
    score: details.filter(d => d.correct).length,
    total: details.length,
    details,
    finishedAt: Date.now(),
  }
}
