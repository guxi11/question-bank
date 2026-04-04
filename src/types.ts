export type QuestionType = 'single' | 'multiple' | 'judge' | 'blank'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  readonly id: string
  readonly type: QuestionType
  readonly difficulty: Difficulty
  readonly content: string
  readonly options: readonly string[]
  readonly answer: string
  readonly explanation: string
  readonly source: string
}

export interface QuizConfig {
  readonly count: number
  readonly types: readonly QuestionType[]
  readonly difficulties: readonly Difficulty[]
}

export interface QuizSession {
  readonly id: string
  readonly config: QuizConfig
  readonly questionIds: readonly string[]
  readonly answers: Readonly<Record<string, string>>
  readonly startedAt: number
  readonly finishedAt: number | null
  readonly currentIndex: number
}

export interface QuestionResult {
  readonly questionId: string
  readonly userAnswer: string
  readonly correct: boolean
}

export interface QuizResult {
  readonly sessionId: string
  readonly score: number
  readonly total: number
  readonly details: readonly QuestionResult[]
  readonly finishedAt: number
}

export interface AppState {
  readonly questions: readonly Question[]
  readonly currentSession: QuizSession | null
  readonly history: readonly QuizResult[]
  readonly favorites: readonly string[]
}
