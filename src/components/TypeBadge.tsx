import { type QuestionType } from '../types'
import { typeLabel } from '../lib/utils'

const colors: Record<QuestionType, string> = {
  single: 'bg-blue-100 text-blue-700',
  multiple: 'bg-purple-100 text-purple-700',
  judge: 'bg-orange-100 text-orange-700',
  blank: 'bg-teal-100 text-teal-700',
}

export const TypeBadge = ({ type }: { type: QuestionType }) => (
  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[type]}`}>
    {typeLabel[type]}
  </span>
)
