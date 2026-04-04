import { useRef, useState } from 'react'
import { parseDocx } from '../lib/parser'
import { type Question } from '../types'
import { useApp } from '../store/context'
import { TypeBadge } from '../components/TypeBadge'
import { DifficultyBadge } from '../components/DifficultyBadge'

export const Import = () => {
  const { state, dispatch } = useApp()
  const [parsed, setParsed] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      setError('请选择 .docx 文件')
      return
    }
    setLoading(true)
    setError('')
    try {
      const questions = await parseDocx(file)
      if (questions.length === 0) {
        setError('未解析到题目，请检查文件格式')
      } else {
        setParsed(questions)
      }
    } catch (e) {
      setError('解析失败：' + String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = () => {
    dispatch({ type: 'IMPORT_QUESTIONS', questions: parsed })
    setParsed([])
  }

  // Sources already imported
  const sources = [...new Set(state.questions.map(q => q.source))]

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">导入题库</h1>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-4xl mb-2">📄</div>
        <p className="text-gray-600">点击或拖入 .docx 文件</p>
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && <p className="text-blue-500 text-center">解析中...</p>}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-700 font-medium">解析到 {parsed.length} 题</p>
            <button
              onClick={handleImport}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              确认导入
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {parsed.slice(0, 5).map(q => (
              <div key={q.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex gap-1 mb-1">
                  <TypeBadge type={q.type} />
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <p className="text-gray-800 line-clamp-2">{q.content}</p>
              </div>
            ))}
            {parsed.length > 5 && (
              <p className="text-gray-500 text-sm text-center">... 共 {parsed.length} 题</p>
            )}
          </div>
        </div>
      )}

      {/* Imported sources */}
      {sources.length > 0 && (
        <div>
          <h2 className="font-medium text-gray-700 mb-2">已导入题库</h2>
          <div className="space-y-2">
            {sources.map(src => {
              const count = state.questions.filter(q => q.source === src).length
              return (
                <div key={src} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{src}</p>
                    <p className="text-xs text-gray-500">{count} 题</p>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SOURCE', source: src })}
                    className="text-red-500 text-sm"
                  >
                    删除
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {state.questions.length === 0 && parsed.length === 0 && !loading && (
        <p className="text-gray-400 text-center mt-8">暂无题库，请先导入文件</p>
      )}
    </div>
  )
}
