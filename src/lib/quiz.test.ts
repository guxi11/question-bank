import { describe, it, expect } from 'vitest'
import { checkAnswer } from './quiz'
import { type Question } from '../types'

const makeQ = (type: Question['type'], answer: string, opts: string[] = []): Question => ({
  id: '1', type, difficulty: 'easy', content: 'test',
  options: opts, answer, explanation: '', source: 'test',
})

describe('checkAnswer — multiple choice', () => {
  // Parser stores "A,B,C" but UI sends "ABC" (no commas)
  it('UI format "AB" matches parser format "A,B"', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B'), 'AB')).toBe(true)
  })

  it('UI format "ABC" matches parser format "A,B,C"', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B,C'), 'ABC')).toBe(true)
  })

  it('order does not matter', () => {
    expect(checkAnswer(makeQ('multiple', 'A,C,D'), 'DCA')).toBe(true)
  })

  it('comma-separated user input also works', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B,C,D'), 'A,B,C,D')).toBe(true)
  })

  it('wrong answer returns false', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B'), 'AC')).toBe(false)
  })

  it('subset returns false', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B,C'), 'AB')).toBe(false)
  })

  it('superset returns false', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B'), 'ABC')).toBe(false)
  })

  it('empty answer returns false', () => {
    expect(checkAnswer(makeQ('multiple', 'A,B'), '')).toBe(false)
  })
})

describe('checkAnswer — single choice', () => {
  it('exact match', () => {
    expect(checkAnswer(makeQ('single', 'B'), 'B')).toBe(true)
  })

  it('case insensitive', () => {
    expect(checkAnswer(makeQ('single', 'C'), 'c')).toBe(true)
  })

  it('wrong answer', () => {
    expect(checkAnswer(makeQ('single', 'A'), 'B')).toBe(false)
  })
})

describe('checkAnswer — judge', () => {
  it('正确 matches 正确', () => {
    expect(checkAnswer(makeQ('judge', '正确'), '正确')).toBe(true)
  })

  it('错误 matches 错误', () => {
    expect(checkAnswer(makeQ('judge', '错误'), '错误')).toBe(true)
  })

  it('wrong judge', () => {
    expect(checkAnswer(makeQ('judge', '正确'), '错误')).toBe(false)
  })
})

describe('checkAnswer — blank', () => {
  it('exact match', () => {
    expect(checkAnswer(makeQ('blank', '101'), '101')).toBe(true)
  })

  it('semicolon alternatives', () => {
    expect(checkAnswer(makeQ('blank', '6；六；6个'), '六')).toBe(true)
  })

  it('wrong answer', () => {
    expect(checkAnswer(makeQ('blank', '101'), '102')).toBe(false)
  })
})
