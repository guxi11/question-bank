// Fisher-Yates shuffle — returns new array
export const shuffle = <T>(arr: readonly T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Simple deterministic hash for content-based IDs
export const hashStr = (s: string): string => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

export const formatDate = (ts: number): string =>
  new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export const difficultyLabel: Record<string, string> = {
  easy: '易',
  medium: '中',
  hard: '难',
}

export const typeLabel: Record<string, string> = {
  single: '单选',
  multiple: '多选',
  judge: '判断',
  blank: '填空',
}
