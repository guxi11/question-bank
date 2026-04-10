import { type AppState, type Question, type QuizSession, type QuizResult } from '../types'

export type Action =
  | { type: 'IMPORT_QUESTIONS'; questions: Question[] }
  | { type: 'REMOVE_SOURCE'; source: string }
  | { type: 'START_SESSION'; session: QuizSession }
  | { type: 'ANSWER'; questionId: string; answer: string }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'FINISH_QUIZ'; result: QuizResult }
  | { type: 'ABANDON_QUIZ' }
  | { type: 'TOGGLE_FAVORITE'; questionId: string }
  | { type: 'CLEAR_HISTORY' }

const mergeQuestions = (
  existing: readonly Question[],
  incoming: Question[],
): Question[] => {
  const ids = new Set(existing.map(q => q.id))
  const contents = new Set(existing.map(q => q.content))
  return [...existing, ...incoming.filter(q => !ids.has(q.id) && !contents.has(q.content))]
}

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'IMPORT_QUESTIONS':
      return { ...state, questions: mergeQuestions(state.questions, action.questions) }

    case 'REMOVE_SOURCE':
      return {
        ...state,
        questions: state.questions.filter(q => q.source !== action.source),
      }

    case 'START_SESSION':
      return { ...state, currentSession: action.session }

    case 'ANSWER':
      if (!state.currentSession) return state
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          answers: {
            ...state.currentSession.answers,
            [action.questionId]: action.answer,
          },
        },
      }

    case 'NEXT_QUESTION':
      if (!state.currentSession) return state
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentIndex: Math.min(
            state.currentSession.currentIndex + 1,
            state.currentSession.questionIds.length - 1,
          ),
        },
      }

    case 'PREV_QUESTION':
      if (!state.currentSession) return state
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentIndex: Math.max(state.currentSession.currentIndex - 1, 0),
        },
      }

    case 'FINISH_QUIZ':
      return {
        ...state,
        currentSession: null,
        history: [action.result, ...state.history],
      }

    case 'ABANDON_QUIZ':
      return { ...state, currentSession: null }

    case 'TOGGLE_FAVORITE': {
      const has = state.favorites.includes(action.questionId)
      return {
        ...state,
        favorites: has
          ? state.favorites.filter(id => id !== action.questionId)
          : [...state.favorites, action.questionId],
      }
    }

    case 'CLEAR_HISTORY':
      return { ...state, history: [] }

    default:
      return state
  }
}
