import { type Difficulty } from '../types'
import { difficultyLabel } from '../lib/utils'

const colors: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => (
  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[difficulty]}`}>
    {difficultyLabel[difficulty]}
  </span>
)
