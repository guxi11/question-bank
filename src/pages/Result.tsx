import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/context'
import { TypeBadge } from '../components/TypeBadge'
import { DifficultyBadge } from '../components/DifficultyBadge'

const ScoreCircle = ({ score, total }: { score: number; total: number }) => {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const r = 45
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center py-6">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-2 text-center">
        <p className="text-3xl font-bold" style={{ color }}>{pct}%</p>
        <p className="text-gray-500 text-sm">{score} / {total} 题正确</p>
      </div>
    </div>
  )
}

export const Result = () => {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const result = state.history.find(r => r.sessionId === id)
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pb-20">
        <p className="text-gray-500">结果不存在</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600">返回</button>
      </div>
    )
  }

  const qMap = new Map(state.questions.map(q => [q.id, q]))

  return (
    <div className="pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="text-gray-500">←</button>
        <h1 className="font-bold text-lg">练习结果</h1>
      </div>

      <ScoreCircle score={result.score} total={result.total} />

      <div className="px-4 space-y-3">
        {result.details.map((detail, i) => {
          const q = qMap.get(detail.questionId)
          if (!q) return null
          return (
            <div
              key={detail.questionId}
              className={`rounded-xl p-4 ${detail.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex gap-1 flex-wrap">
                  <span className="text-xs text-gray-500">#{i + 1}</span>
                  <TypeBadge type={q.type} />
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', questionId: q.id })}
                  className="text-base shrink-0"
                >
                  {state.favorites.includes(q.id) ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-gray-800 mb-2 line-clamp-2">{q.content}</p>
              <div className="text-xs space-y-0.5">
                {!detail.correct && (
                  <p className="text-red-600">你的答案：{detail.userAnswer || '未作答'}</p>
                )}
                <p className={detail.correct ? 'text-green-700' : 'text-gray-600'}>
                  正确答案：{q.answer}
                </p>
                {q.explanation && (
                  <p className="text-gray-500 mt-1">{q.explanation}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
