import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/context'
import { formatDate } from '../lib/utils'

export const History = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  if (state.history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pb-20">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-500">暂无练习记录</p>
      </div>
    )
  }

  return (
    <div className="pb-20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">历史记录</h1>
        <button
          onClick={() => {
            if (confirm('确定清除所有历史？')) dispatch({ type: 'CLEAR_HISTORY' })
          }}
          className="text-red-500 text-sm"
        >
          清除
        </button>
      </div>
      <div className="space-y-3">
        {state.history.map(result => {
          const pct = Math.round((result.score / result.total) * 100)
          const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'
          return (
            <button
              key={result.sessionId}
              onClick={() => navigate(`/result/${result.sessionId}`)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between text-left hover:border-blue-300 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-800">{result.total} 题练习</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(result.finishedAt)}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${color}`}>{pct}%</p>
                <p className="text-xs text-gray-500">{result.score}/{result.total}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
