import { useApp } from '../store/context'
import { TypeBadge } from '../components/TypeBadge'
import { DifficultyBadge } from '../components/DifficultyBadge'

export const Favorites = () => {
  const { state, dispatch } = useApp()
  const qMap = new Map(state.questions.map(q => [q.id, q]))
  const favs = state.favorites.map(id => qMap.get(id)).filter(Boolean)

  if (favs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pb-20">
        <p className="text-4xl mb-3">⭐</p>
        <p className="text-gray-500">暂无收藏题目</p>
      </div>
    )
  }

  return (
    <div className="pb-20 p-4">
      <h1 className="text-xl font-bold mb-4">收藏 ({favs.length})</h1>
      <div className="space-y-3">
        {favs.map(q => {
          if (!q) return null
          return (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex gap-1 flex-wrap">
                  <TypeBadge type={q.type} />
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', questionId: q.id })}
                  className="text-lg shrink-0"
                >
                  ⭐
                </button>
              </div>
              <p className="text-sm text-gray-800 mb-2">{q.content}</p>
              {q.options.length > 0 && (
                <div className="space-y-1 mb-2">
                  {q.options.map((opt, i) => (
                    <p key={i} className="text-xs text-gray-600">{'ABCDEF'[i]}. {opt}</p>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2 text-xs space-y-1">
                <p className="text-green-700 font-medium">答案：{q.answer}</p>
                {q.explanation && <p className="text-gray-500">{q.explanation}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
