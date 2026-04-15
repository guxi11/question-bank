import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/context'
import { checkAnswer, gradeQuiz } from '../lib/quiz'
import { ProgressBar } from '../components/ProgressBar'
import { TypeBadge } from '../components/TypeBadge'
import { DifficultyBadge } from '../components/DifficultyBadge'
import { type Question } from '../types'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const ChoiceQuestion = ({
  question,
  selected,
  revealed,
  onSelect,
}: {
  question: Question
  selected: string
  revealed: boolean
  onSelect: (v: string) => void
}) => {
  const isMultiple = question.type === 'multiple'

  const toggleLetter = (letter: string) => {
    if (revealed) return
    if (isMultiple) {
      const letters = selected.split('').filter(Boolean)
      const next = letters.includes(letter)
        ? letters.filter(l => l !== letter).sort().join('')
        : [...letters, letter].sort().join('')
      onSelect(next)
    } else {
      onSelect(letter)
    }
  }

  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => {
        const letter = LETTERS[i]
        const isSelected = selected.includes(letter)
        const isCorrect = question.answer.split(',').includes(letter)
        let cls = 'border border-gray-200 bg-white text-gray-800'
        if (revealed) {
          if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800'
          else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-700'
        } else if (isSelected) {
          cls = 'border-blue-500 bg-blue-50 text-blue-800'
        }
        return (
          <button
            key={letter}
            onClick={() => toggleLetter(letter)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${cls}`}
          >
            <span className="font-medium mr-2">{letter}.</span>{opt}
          </button>
        )
      })}
      {isMultiple && !revealed && selected && (
        <p className="text-xs text-gray-500 text-right">已选: {selected}</p>
      )}
    </div>
  )
}

const JudgeQuestion = ({
  selected,
  revealed,
  answer,
  onSelect,
}: {
  selected: string
  revealed: boolean
  answer: string
  onSelect: (v: string) => void
}) => {
  const opts = ['正确', '错误']
  return (
    <div className="flex gap-3">
      {opts.map(opt => {
        const isSelected = selected === opt
        const isCorrect = answer === opt || answer === '对' && opt === '正确' || answer === '错' && opt === '错误'
        let cls = 'border border-gray-200 bg-white text-gray-800'
        if (revealed) {
          if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800'
          else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-700'
        } else if (isSelected) {
          cls = 'border-blue-500 bg-blue-50 text-blue-800'
        }
        return (
          <button
            key={opt}
            onClick={() => !revealed && onSelect(opt)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${cls}`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const BlankQuestion = ({
  value,
  revealed,
  onChange,
}: {
  value: string
  revealed: boolean
  onChange: (v: string) => void
}) => (
  <input
    type="text"
    value={value}
    onChange={e => !revealed && onChange(e.target.value)}
    disabled={revealed}
    placeholder="请输入答案..."
    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
  />
)

export const Quiz = () => {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)
  const session = state.currentSession

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen pb-20">
        <p className="text-gray-500">没有进行中的练习</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600">
          返回首页
        </button>
      </div>
    )
  }

  const qMap = new Map(state.questions.map(q => [q.id, q]))
  const currentId = session.questionIds[session.currentIndex]
  const question = qMap.get(currentId)

  if (!question) {
    return <div className="p-4">题目加载失败</div>
  }

  const userAnswer = session.answers[currentId] ?? ''
  const isLast = session.currentIndex === session.questionIds.length - 1
  const correct = revealed ? checkAnswer(question, userAnswer) : null

  const handleAnswer = (value: string) => {
    dispatch({ type: 'ANSWER', questionId: currentId, answer: value })
    // Auto-reveal for single/judge on selection
    if (question.type === 'single' || question.type === 'judge') {
      setRevealed(true)
    }
  }

  const handleConfirm = () => setRevealed(true)

  const handleNext = () => {
    setRevealed(false)
    if (isLast) {
      const result = gradeQuiz(session, state.questions)
      dispatch({ type: 'FINISH_QUIZ', result })
      navigate(`/result/${result.sessionId}`)
    } else {
      dispatch({ type: 'NEXT_QUESTION' })
    }
  }

  const handlePrev = () => {
    setRevealed(false)
    dispatch({ type: 'PREV_QUESTION' })
  }

  return (
    <div className="flex flex-col min-h-screen pb-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              if (confirm('确定放弃本次练习？')) {
                dispatch({ type: 'ABANDON_QUIZ' })
                navigate('/')
              }
            }}
            className="text-gray-500 text-sm"
          >
            ✕ 退出
          </button>
          <span className="text-sm text-gray-500">
            {session.currentIndex + 1} / {session.questionIds.length}
          </span>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', questionId: currentId })}
            className="text-lg"
          >
            {state.favorites.includes(currentId) ? '⭐' : '☆'}
          </button>
        </div>
        <ProgressBar current={session.currentIndex} total={session.questionIds.length} />
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="flex gap-1 mb-3">
          <TypeBadge type={question.type} />
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <p className="text-base text-gray-900 mb-4 leading-relaxed">{question.content}</p>

        {(question.type === 'single' || question.type === 'multiple') && (
          <ChoiceQuestion
            question={question}
            selected={userAnswer}
            revealed={revealed}
            onSelect={handleAnswer}
          />
        )}
        {question.type === 'judge' && (
          <JudgeQuestion
            selected={userAnswer}
            revealed={revealed}
            answer={question.answer}
            onSelect={handleAnswer}
          />
        )}
        {question.type === 'blank' && (
          <BlankQuestion
            value={userAnswer}
            revealed={revealed}
            onChange={v => dispatch({ type: 'ANSWER', questionId: currentId, answer: v })}
          />
        )}

        {/* Answer feedback */}
        {revealed && (
          <div className={`mt-4 rounded-xl p-4 ${correct ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`font-medium mb-1 ${correct ? 'text-green-700' : 'text-red-700'}`}>
              {correct ? '✓ 回答正确' : `✗ 正确答案：${question.answer}`}
            </p>
            {question.explanation && (
              <p className="text-sm text-gray-600">{question.explanation}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-6 flex gap-3">
        {session.currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium"
          >
            上一题
          </button>
        )}
        {question.type === 'multiple' && !revealed && userAnswer && (
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
          >
            确认
          </button>
        )}
        {question.type === 'blank' && !revealed && (
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
          >
            确认
          </button>
        )}
        {revealed && (
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium"
          >
            {isLast ? '查看结果' : '下一题'}
          </button>
        )}
      </div>
    </div>
  )
}
