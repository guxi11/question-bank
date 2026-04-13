import mammoth from 'mammoth'
import { type Question, type QuestionType, type Difficulty } from '../types'
import { hashStr } from './utils'

// Normalize both fullwidth and halfwidth colons/punctuation
const norm = (s: string) =>
  s.replace(/：/g, ':').replace(/。/g, '.').trim()

const diffMap: Record<string, Difficulty> = {
  易: 'easy', 简单: 'easy',
  中: 'medium', 一般: 'medium', 较难: 'medium',
  难: 'hard', 困难: 'hard',
}

const parseDifficulty = (text: string): Difficulty => {
  for (const [k, v] of Object.entries(diffMap)) {
    if (text.includes(k)) return v
  }
  return 'medium'
}

// Extract value after a label like 答案: or 难易程度:
const extractField = (lines: string[], ...labels: string[]): string => {
  for (const line of lines) {
    const n = norm(line)
    for (const label of labels) {
      if (n.startsWith(label + ':')) {
        let value = n.slice(label.length + 1)
        // Truncate at next known label (handles squished metadata)
        value = value.replace(/(难易程度|难度|答案解析|答案|正确答案):.*$/, '').trim()
        return value
      }
    }
  }
  return ''
}

// Extract multi-line explanation (may span several lines until end of block)
const extractExplanation = (lines: string[]): string => {
  const idx = lines.findIndex(l => /^答案解析[：:]/.test(l))
  if (idx === -1) {
    // Also handle squished case where 答案解析 is mid-line
    for (const line of lines) {
      const m = norm(line).match(/答案解析:(.+)$/)
      if (m) return m[1].trim()
    }
    return ''
  }
  const first = norm(lines[idx]).replace(/^答案解析:/, '').trim()
  const rest = lines.slice(idx + 1).join('').trim()
  return rest ? first + rest : first
}

const isOptionLine = (line: string) => /^[A-Za-z][.、．]\s*\S/.test(line.trim())

// Split squished option lines like "A. fooB. barC. baz" into separate options
const expandOptionLines = (lines: string[]): string[] =>
  lines.flatMap(line => {
    const trimmed = line.trim()
    // Check if this line has multiple options squished together
    const parts = trimmed.split(/(?=[A-Za-z][.、．]\s*)/).filter(Boolean)
    return parts.length > 1 && parts.every(p => /^[A-Za-z][.、．]/.test(p))
      ? parts.map(p => p.trim())
      : [trimmed]
  })

const parseOptions = (lines: string[]): string[] =>
  expandOptionLines(lines)
    .filter(isOptionLine)
    .map(l => l.trim().replace(/^[A-Za-z][.、．]\s*/, ''))

// Detect question type from content signals
const detectType = (
  block: string,
  answer: string,
  optionCount: number,
): QuestionType => {
  // Judge: check answer value or tag
  if (/^(正确|错误|对|错)$/.test(answer.trim())) return 'judge'
  if (/【判断题】/.test(block)) return 'judge'
  if (/【多选题】/.test(block)) return 'multiple'
  if (/【单选题】/.test(block)) return 'single'
  if (/【填空题】/.test(block)) return 'blank'
  if (/_{2,}/.test(block)) return 'blank'
  if (optionCount === 0) return 'blank'
  // Infer from answer: 2+ letters (with or without comma/space separators) = multiple
  const letters = answer.replace(/[,，、\s]/g, '')
  if (/^[A-Za-z]{2,}$/.test(letters)) return 'multiple'
  if (/^[A-Za-z]$/.test(answer)) return 'single'
  return 'blank'
}

// Split squished metadata lines into separate lines
// e.g. "答案：A,C,D难易程度：易答案解析：..." → 3 separate lines
const expandMetaLines = (lines: string[]): string[] =>
  lines.flatMap(line => {
    const n = line.trim()
    // Split at known label boundaries (lookahead keeps the label with its value)
    const parts = n.split(/(?=(?:难易程度|难度|答案解析|正确答案|(?<!正确)答案(?!解析))[：:])/)
    return parts.length > 1 ? parts.map(p => p.trim()).filter(Boolean) : [n]
  })

const parseBlock = (block: string, source: string, index: number): Question | null => {
  if (!block.trim()) return null

  const rawLines = expandMetaLines(
    block.split('\n').map(l => l.trim()).filter(Boolean),
  )
  if (rawLines.length < 2) return null

  // Question content: first line, strip leading number and type tag
  const content = rawLines[0]
    .replace(/^\d+[.、．]?\s*/, '')
    .replace(/【[^】]+】/, '')
    .trim()

  if (!content) return null

  // Collect option lines (with squished expansion)
  const options = parseOptions(rawLines.slice(1))

  // Extract metadata
  const answerRaw = extractField(rawLines, '答案', '正确答案')
  const difficulty = parseDifficulty(
    extractField(rawLines, '难易程度', '难度') || ''
  )
  const explanation = extractExplanation(rawLines)

  const type = detectType(block, answerRaw, options.length)

  // Normalize judge answers: 对→正确, 错→错误
  const answer = type === 'judge'
    ? (/^(错误|错)$/.test(answerRaw.trim()) ? '错误' : '正确')
    : answerRaw

  const id = hashStr(source + content + answer + index)

  return {
    id: id.toString(),
    type,
    difficulty,
    content,
    options,
    answer,
    explanation,
    source,
  }
}

// Split raw text into per-question blocks by numbered prefixes
// Allow optional leading whitespace before the number
const splitBlocks = (text: string): string[] =>
  text
    .split(/(?=^\s*\d+[.、．\s])/m)
    .map(b => b.trim())
    .filter(b => b.length > 0 && /^\d+/.test(b))

export const parseText = (text: string, source: string): Question[] =>
  splitBlocks(text)
    .map((block, i) => parseBlock(block, source, i))
    .filter((q): q is Question => q !== null)

export const parseDocx = async (
  file: File,
): Promise<Question[]> => {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return parseText(result.value, file.name)
}
