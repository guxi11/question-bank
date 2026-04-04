import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/context'
import { generateQuiz, createSession } from '../lib/quiz'
import { type QuizConfig, type QuestionType, type Difficulty } from '../types'

const COUNTS = [10, 20, 50, 100]
const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single', label: '单选' },
  { value: 'multiple', label: '多选' },
  { value: 'judge', label: '判断' },
  { value: 'blank', label: '填空' },
]
const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '易' },
  { value: 'medium', label: '中' },
  { value: 'hard', label: '难' },
]

const toggle = <T,>(arr: T[], v: T): T[] =>
  arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

export const Home = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const [count, setCount] = useState(20)
  const [types, setTypes] = useState<QuestionType[]>([])
  const [difficulties, setDifficulties] = useState<Difficulty[]>([])
  const [showConfig, setShowConfig] = useState(false)

  const total = state.questions.length
  const hasSession = !!state.currentSession

  const startQuiz = () => {
    const config: QuizConfig = { count, types, difficulties }
    const ids = generateQuiz(state.questions, config)
    if (ids.length === 0) {
      alert('没有符合条件的题目')
      return
    }
    const session = createSession(ids, { ...config, count: ids.length })
    dispatch({ type: 'START_SESSION', session })
    navigate('/quiz')
  }

  const resumeQuiz = () => navigate('/quiz')

  // Stats
  const typeStats = ['single', 'multiple', 'judge', 'blank'] as const
  const diffStats = ['easy', 'medium', 'hard'] as const

  return (
    <div className="pb-20 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">题库训练</h1>
        {total > 0 ? (
          <p className="text-gray-500 text-sm mt-1">共 {total} 道题</p>
        ) : (
          <p className="text-gray-400 text-sm mt-1">请先在「导入」页面添加题库</p>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-600 mb-1">按题型</p>
            {typeStats.map(t => {
              const n = state.questions.filter(q => q.type === t).length
              if (!n) return null
              return (
                <div key={t} className="flex justify-between text-xs text-gray-700">
                  <span>{{ single: '单选', multiple: '多选', judge: '判断', blank: '填空' }[t]}</span>
                  <span className="font-medium">{n}</span>
                </div>
              )
            })}
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-green-600 mb-1">按难度</p>
            {diffStats.map(d => {
              const n = state.questions.filter(q => q.difficulty === d).length
              if (!n) return null
              return (
                <div key={d} className="flex justify-between text-xs text-gray-700">
                  <span>{{ easy: '易', medium: '中', hard: '难' }[d]}</span>
                  <span className="font-medium">{n}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resume */}
      {hasSession && (
        <button
          onClick={resumeQuiz}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium mb-3"
        >
          继续上次练习（第 {(state.currentSession!.currentIndex + 1)}/{state.currentSession!.questionIds.length} 题）
        </button>
      )}

      {/* Start */}
      {total > 0 && (
        <>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium"
          >
            开始练习
          </button>

          {showConfig && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-4">
              {/* Count */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">题数</p>
                <div className="flex gap-2">
                  {COUNTS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCount(c)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        count === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    onClick={() => setCount(total)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      count === total ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    全部
                  </button>
                </div>
              </div>

              {/* Types */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">题型（不选=全部）</p>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTypes(toggle(types, value))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        types.includes(value) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulties */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">难度（不选=全部）</p>
                <div className="flex gap-2">
                  {DIFF_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDifficulties(toggle(difficulties, value))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        difficulties.includes(value) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startQuiz}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium"
              >
                开始 {Math.min(count, total)} 题
              </button>
            </div>
          )}
        </>
      )}

      {total === 0 && (
        <div className="text-center mt-12">
          <p className="text-6xl mb-4">📚</p>
          <p className="text-gray-500">导入题库后即可开始练习</p>
        </div>
      )}
    </div>
  )
}
