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
        return n.slice(label.length + 1).trim()
      }
    }
  }
  return ''
}

// Extract multi-line explanation (may span several lines until end of block)
const extractExplanation = (lines: string[]): string => {
  const idx = lines.findIndex(l => /^答案解析[：:]/.test(l))
  if (idx === -1) return ''
  const first = norm(lines[idx]).replace(/^答案解析:/, '').trim()
  const rest = lines.slice(idx + 1).join('').trim()
  return rest ? first + rest : first
}

const isOptionLine = (line: string) => /^[A-Za-z][.、．]\s*\S/.test(line.trim())

const parseOptions = (lines: string[]): string[] =>
  lines
    .filter(isOptionLine)
    .map(l => l.trim().replace(/^[A-Za-z][.、．]\s*/, ''))

// Detect question type from content signals
const detectType = (
  block: string,
  answer: string,
  optionCount: number,
): QuestionType => {
  if (/正确答案[：:]\s*(正确|错误|对|错)/.test(block)) return 'judge'
  if (/【多选题】/.test(block)) return 'multiple'
  if (/【单选题】/.test(block)) return 'single'
  if (/_{2,}/.test(block)) return 'blank'
  if (optionCount === 0) return 'blank'
  // Infer from answer: 2+ letters = multiple
  if (/^[A-Za-z]{2,}$/.test(answer)) return 'multiple'
  if (/^[A-Za-z]$/.test(answer)) return 'single'
  return 'blank'
}

const parseBlock = (block: string, source: string): Question | null => {
  if (!block.trim()) return null

  const rawLines = block.split('\n').map(l => l.trim()).filter(Boolean)
  if (rawLines.length < 2) return null

  // Question content: first line, strip leading number and type tag
  const content = rawLines[0]
    .replace(/^\d+[.、．]\s*/, '')
    .replace(/【[^】]+】/, '')
    .trim()

  if (!content) return null

  // Collect option lines
  const options = parseOptions(rawLines.slice(1))

  // Extract metadata
  const answerRaw = extractField(rawLines, '答案', '正确答案')
  const difficulty = parseDifficulty(
    extractField(rawLines, '难易程度', '难度') || ''
  )
  const explanation = extractExplanation(rawLines)

  const type = detectType(block, answerRaw, options.length)

  const id = hashStr(source + content)

  return {
    id: id.toString(),
    type,
    difficulty,
    content,
    options,
    answer: answerRaw,
    explanation,
    source,
  }
}

// Split raw text into per-question blocks by numbered prefixes
const splitBlocks = (text: string): string[] =>
  text
    .split(/(?=^\d+[.、．]\s)/m)
    .map(b => b.trim())
    .filter(b => b.length > 0 && /^\d+/.test(b))

export const parseText = (text: string, source: string): Question[] =>
  splitBlocks(text)
    .map(block => parseBlock(block, source))
    .filter((q): q is Question => q !== null)

export const parseDocx = async (
  file: File,
): Promise<Question[]> => {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return parseText(result.value, file.name)
}
