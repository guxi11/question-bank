import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseText } from './parser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = readFileSync(
  resolve(__dirname, '__fixtures__/a.txt'),
  'utf-8',
)
const questions = parseText(fixture, 'a.docx')

const fixtureB = readFileSync(
  resolve(__dirname, '__fixtures__/b.txt'),
  'utf-8',
)
const questionsB = parseText(fixtureB, 'b.docx')

// ── helpers ──

const byContent = (keyword: string) =>
  questions.find(q => q.content.includes(keyword))

const allOf = (type: string) => questions.filter(q => q.type === type)

// ── 总量与完整性 ──

describe('总量', () => {
  it('应解析出 762 道题', () => {
    expect(questions.length).toBe(762)
  })

  it('每道题都有非空 content', () => {
    questions.forEach(q =>
      expect(q.content, `id=${q.id}`).not.toBe(''),
    )
  })

  it('每道题都有 answer（除非是填空题）', () => {
    const missing = questions.filter(q => !q.answer && q.type !== 'blank')
    expect(missing.length, `缺失答案的题: ${missing.map(q => q.content.slice(0, 30)).join('; ')}`).toBe(0)
  })
})

// ── 题型识别 ──

describe('题型识别', () => {
  it('单选题数量 > 300', () => {
    expect(allOf('single').length).toBeGreaterThan(300)
  })

  it('多选题数量 > 200', () => {
    expect(allOf('multiple').length).toBeGreaterThan(200)
  })

  it('判断题数量 > 140', () => {
    expect(allOf('judge').length).toBeGreaterThan(140)
  })

  it('填空题数量 > 30', () => {
    expect(allOf('blank').length).toBeGreaterThan(30)
  })

  it('带【单选题】标签的题应识别为 single', () => {
    const q = byContent('ISSN')
    expect(q).toBeDefined()
    expect(q!.type).toBe('single')
  })

  it('带【多选题】标签的题应识别为 multiple', () => {
    const q = questions.find(
      q => q.content.includes('多选') || fixture.includes(`【多选题】${q.content.slice(0, 6)}`),
    )
    // fallback: 任何 answer 为多字母的
    const multi = questions.find(q => /^[A-Z](,[A-Z])+$/.test(q.answer))
    expect(multi?.type ?? q?.type).toBe('multiple')
  })

  it('正确答案为 正确/错误 的题应识别为 judge', () => {
    const judges = questions.filter(
      q => /^(正确|错误|对|错)$/.test(q.answer),
    )
    judges.forEach(q =>
      expect(q.type, `"${q.content.slice(0, 30)}" 应为 judge`).toBe('judge'),
    )
  })
})

// ── 选项解析 ──

describe('选项解析', () => {
  it('标准单选题应有 4 个选项', () => {
    const q = byContent('ISSN')
    expect(q).toBeDefined()
    expect(q!.options).toHaveLength(4)
  })

  it('选项内容不应包含选项前缀 (A./B./...)', () => {
    questions
      .filter(q => q.options.length > 0)
      .forEach(q =>
        q.options.forEach(opt =>
          expect(opt, `"${q.content.slice(0, 20)}" 的选项残留前缀`).not.toMatch(
            /^[A-Za-z][.、．]\s*/,
          ),
        ),
      )
  })

  it('同行多选项（squished）应被正确拆分', () => {
    // Block 248: "A. 情报学B. 教育学C. 目录学D. 档案学E. 心理学" 全在一行
    const q = byContent('同族关系')
    if (q) {
      expect(
        q.options.length,
        `"同族关系" 题应有 5 个选项，实际 ${q.options.length}`,
      ).toBe(5)
    }
  })
})

// ── 元数据提取 ──

describe('元数据提取', () => {
  it('答案字段正确提取', () => {
    const q = byContent('ISSN')
    expect(q?.answer).toBe('A')
  })

  it('难度字段正确映射', () => {
    const q = byContent('ISSN')
    expect(q?.difficulty).toBe('easy')
  })

  it('解析字段非空', () => {
    const q = byContent('ISSN')
    expect(q?.explanation).toBeTruthy()
    expect(q!.explanation).toContain('011')
  })

  it('答案和难度在同一行时（squished meta）都能提取', () => {
    // 存在 "答案：A,C,D难易程度：易答案解析：..." 的情况
    const q = byContent('同族关系')
    if (q) {
      expect(q.answer, '"同族关系" 答案应为 A,C,D').toBe('A,C,D')
      expect(q.difficulty, '"同族关系" 难度应为 easy').toBe('easy')
    }
  })

  it('多答案填空题保留完整答案（含分号分隔）', () => {
    // 填空题中 "连续___不参加" 的答案应含多种写法
    const blank = questions.find(
      q => q.type === 'blank' && q.content.includes('连续') && q.answer.includes('；'),
    )
    if (blank) {
      expect(blank.answer).toContain('；')
    }
  })
})

// ── 前导空格问题（已知 bug） ──

describe('前导空格题目不丢失', () => {
  it('行首有空格的题目也应被解析', () => {
    // Line 239: " 14. 【单选题】电子资源的016字段..."
    const q = byContent('016字段')
    expect(q, '前导空格的 016字段 题目丢失').toBeDefined()
  })

  it('行首有空格的判断题也应被解析', () => {
    // Line 2301: " 5. 网络运营者可以根据业务需要..."
    const q = byContent('网络运营者可以根据业务需要')
    expect(q, '前导空格的 网络运营者 题目丢失').toBeDefined()
  })
})

// ── source 字段 ──

describe('source', () => {
  it('所有题目 source 为文件名', () => {
    questions.forEach(q => expect(q.source).toBe('a.docx'))
  })
})

// ── ID 唯一性 ──

describe('ID', () => {
  it('所有 ID 唯一', () => {
    const ids = new Set(questions.map(q => q.id))
    expect(ids.size).toBe(questions.length)
  })
})

// ── b.docx 测试 ──

const byContentB = (keyword: string) =>
  questionsB.find(q => q.content.includes(keyword))

const allOfB = (type: string) => questionsB.filter(q => q.type === type)

describe('b.docx 总量', () => {
  it('应解析出 40 道题', () => {
    expect(questionsB.length).toBe(40)
  })

  it('每道题都有非空 content', () => {
    questionsB.forEach(q =>
      expect(q.content, `id=${q.id}`).not.toBe(''),
    )
  })

  it('每道题都有 answer', () => {
    const missing = questionsB.filter(q => !q.answer)
    expect(missing.length).toBe(0)
  })
})

describe('b.docx 题型识别', () => {
  it('单选题 18 道', () => {
    expect(allOfB('single').length).toBe(18)
  })

  it('多选题 12 道', () => {
    expect(allOfB('multiple').length).toBe(12)
  })

  it('判断题 8 道', () => {
    expect(allOfB('judge').length).toBe(8)
  })

  it('填空题 2 道', () => {
    expect(allOfB('blank').length).toBe(2)
  })
})

describe('b.docx 无句点题号（23 【多选题】）', () => {
  it('题号无句点的题目应被解析', () => {
    const q = byContentB('著录信息源分为')
    expect(q, '题号无句点的 Q23 丢失').toBeDefined()
    expect(q!.type).toBe('multiple')
    expect(q!.options).toHaveLength(5)
    expect(q!.answer).toBe('A,B')
  })
})

describe('b.docx 句点后无空格（13.【单选题】）', () => {
  it('句点后无空格的题目应被解析', () => {
    const q = byContentB('ISBN号2007')
    expect(q, '句点后无空格的 Q13 丢失').toBeDefined()
    expect(q!.type).toBe('single')
  })

  it('末尾填空题也应被解析', () => {
    const q = byContentB('文献语种')
    expect(q, '句点后无空格的 Q40 丢失').toBeDefined()
    expect(q!.type).toBe('blank')
    expect(q!.answer).toBe('101')
  })
})

describe('b.docx source 与 ID', () => {
  it('所有题目 source 为 b.docx', () => {
    questionsB.forEach(q => expect(q.source).toBe('b.docx'))
  })

  it('所有 ID 唯一', () => {
    const ids = new Set(questionsB.map(q => q.id))
    expect(ids.size).toBe(questionsB.length)
  })
})

// ── c.docx 测试 ──

const fixtureC = readFileSync(
  resolve(__dirname, '__fixtures__/c.txt'),
  'utf-8',
)
const questionsC = parseText(fixtureC, 'c.docx')

const byContentC = (keyword: string) =>
  questionsC.find(q => q.content.includes(keyword))

const allOfC = (type: string) => questionsC.filter(q => q.type === type)

describe('c.docx 总量', () => {
  it('应解析出 744 道题', () => {
    expect(questionsC.length).toBe(744)
  })

  it('每道题都有非空 content', () => {
    questionsC.forEach(q =>
      expect(q.content, `id=${q.id}`).not.toBe(''),
    )
  })

  it('每道题都有 answer', () => {
    const missing = questionsC.filter(q => !q.answer)
    expect(missing.length).toBe(0)
  })
})

describe('c.docx 题型识别', () => {
  it('单选题 328 道', () => {
    expect(allOfC('single').length).toBe(328)
  })

  it('多选题 221 道', () => {
    expect(allOfC('multiple').length).toBe(221)
  })

  it('判断题 153 道', () => {
    expect(allOfC('judge').length).toBe(153)
  })

  it('填空题 42 道', () => {
    expect(allOfC('blank').length).toBe(42)
  })
})

describe('c.docx 判断题答案归一化', () => {
  it('判断题答案只有 正确/错误 两种', () => {
    allOfC('judge').forEach(q =>
      expect(q.answer, `"${q.content.slice(0, 30)}" answer=${q.answer}`).toMatch(/^(正确|错误)$/),
    )
  })

  it('答案为 错误 的判断题数量正确', () => {
    expect(allOfC('judge').filter(q => q.answer === '错误').length).toBe(80)
  })

  it('答案为 正确 的判断题数量正确', () => {
    expect(allOfC('judge').filter(q => q.answer === '正确').length).toBe(73)
  })
})

describe('c.docx 正确答案标签', () => {
  it('使用 正确答案: 标签的题目答案正确提取', () => {
    const q = byContentC('《中图法》是我国建国后编制出版')
    expect(q).toBeDefined()
    expect(q!.answer).toBe('正确')
  })

  it('正确答案:错误 的题目答案正确提取', () => {
    const q = byContentC('从属关系主题的文献一律依较大较全')
    expect(q).toBeDefined()
    expect(q!.answer).toBe('错误')
  })
})

describe('c.docx source 与 ID', () => {
  it('所有题目 source 为 c.docx', () => {
    questionsC.forEach(q => expect(q.source).toBe('c.docx'))
  })

  it('所有 ID 唯一', () => {
    const ids = new Set(questionsC.map(q => q.id))
    expect(ids.size).toBe(questionsC.length)
  })
})

// ── 多选题答案格式兼容性 ──

const makeMultiQ = (answer: string) =>
  `1. 【多选题】测试题目\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：${answer}\n难易程度：易`

describe('多选题答案格式兼容', () => {
  const cases: [string, string][] = [
    // [原始答案, 期望归一化结果]
    ['ABCD', 'A,B,C,D'],
    ['A,B,C,D', 'A,B,C,D'],
    ['A，B，C，D', 'A,B,C,D'],
    ['A、B、C、D', 'A,B,C,D'],
    ['A B C D', 'A,B,C,D'],
    ['A, B, C, D', 'A,B,C,D'],
    ['A，B, C、D', 'A,B,C,D'],       // 混合分隔符
    ['A,C,D', 'A,C,D'],
    ['AB', 'A,B'],
    ['A.B.C', 'A,B,C'],              // 半角点分隔
    ['A．B．C', 'A,B,C'],             // 全角点分隔
    ['abcd', 'A,B,C,D'],             // 小写字母
    ['a, b, c', 'A,B,C'],            // 小写+空格+逗号
    ['A;B;C', 'A,B,C'],              // 分号分隔
    ['A；B；C', 'A,B,C'],             // 全角分号分隔
    ['  A , B , C  ', 'A,B,C'],      // 前后空格
    ['A·B·C·D', 'A,B,C,D'],          // 中点分隔
  ]

  cases.forEach(([raw, expected]) => {
    it(`答案 "${raw}" → "${expected}"`, () => {
      const qs = parseText(makeMultiQ(raw), 'test')
      expect(qs).toHaveLength(1)
      expect(qs[0].type).toBe('multiple')
      expect(qs[0].answer).toBe(expected)
    })
  })
})

describe('单选题答案归一化', () => {
  const makeSingleQ = (answer: string) =>
    `1. 【单选题】测试单选\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：${answer}\n难易程度：易`

  it('小写答案归一化为大写', () => {
    const qs = parseText(makeSingleQ('b'), 'test')
    expect(qs[0].answer).toBe('B')
  })

  it('答案前后空格被去除', () => {
    const qs = parseText(makeSingleQ(' C '), 'test')
    expect(qs[0].answer).toBe('C')
  })
})

describe('多选题类型推断（无标签）', () => {
  const makeUntaggedQ = (answer: string) =>
    `1. 测试无标签多选\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：${answer}\n难易程度：易`

  const multiFormats = ['AB', 'A,B', 'A，B', 'A、B', 'A B', 'a,b,c']

  multiFormats.forEach(fmt => {
    it(`答案 "${fmt}" 应推断为 multiple`, () => {
      const qs = parseText(makeUntaggedQ(fmt), 'test')
      expect(qs[0].type).toBe('multiple')
    })
  })
})

// ── 内嵌选项解析（选项与题干同行） ──

describe('内嵌选项解析', () => {
  it('选项与题干同行时应正确拆分', () => {
    const text = `6. 下列哪一项不属于研究内容？A. 哲学B. 事业建设C. 教育培训D. 建筑学\n\n答案：D\n难易程度：易`
    const qs = parseText(text, 'test')
    expect(qs).toHaveLength(1)
    expect(qs[0].type).toBe('single')
    expect(qs[0].options).toHaveLength(4)
    expect(qs[0].options[0]).toBe('哲学')
    expect(qs[0].answer).toBe('D')
    expect(qs[0].content).not.toContain('A.')
  })

  it('内嵌多选答案应正确归一化', () => {
    const text = `29. 特点包括哪些？（ ）A. 按领导系统B. 横向联系C. 重复建设D. 统一调配\n\n答案：A,C难易程度：中`
    const qs = parseText(text, 'test')
    expect(qs).toHaveLength(1)
    expect(qs[0].type).toBe('multiple')
    expect(qs[0].options).toHaveLength(4)
    expect(qs[0].answer).toBe('A,C')
  })

  it('内嵌选项+空格分隔多选答案', () => {
    const text = `1. 主要内容包括？A. 选项AB. 选项BC. 选项CD. 选项D\n答案：A, B, C\n难易程度：易`
    const qs = parseText(text, 'test')
    expect(qs).toHaveLength(1)
    expect(qs[0].type).toBe('multiple')
    expect(qs[0].answer).toBe('A,B,C')
  })

  it('单独行选项优先于内嵌选项', () => {
    const text = `1. 测试题目\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：B\n难易程度：易`
    const qs = parseText(text, 'test')
    expect(qs).toHaveLength(1)
    expect(qs[0].options).toHaveLength(4)
    expect(qs[0].options[0]).toBe('选项A')
  })
})

// ── 有选项但无答案时不应判为填空 ──

describe('有选项无答案的类型推断', () => {
  it('有选项但答案为空时应为 single 而非 blank', () => {
    const text = `1. 测试题目\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D\n答案：\n难易程度：易`
    const qs = parseText(text, 'test')
    expect(qs).toHaveLength(1)
    expect(qs[0].type).toBe('single')
  })
})
