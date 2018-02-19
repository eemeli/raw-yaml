import Node, { Type } from '../src/Node'
import parse from '../src/index'
import { pretty } from './common'

describe('folded block with chomp: keep', () => {
  test('nl + nl', () => {
    const src = `>+\nblock\n\n`
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('block\n\n')
  })

  test('nl + nl + sp + nl', () => {
    const src = ">+\nab\n\n \n"
    const doc = parse(src)[0]
    expect(doc.contents[0].strValue).toBe('ab\n\n \n')
  })
})

test('multiple linebreaks in plain scalar', () => {
  const src = `trimmed\n\n\n\nlines\n`
  const doc = parse(src)[0]
  expect(doc.contents[0].strValue).toBe('trimmed\n\n\nlines')
})

test('no null document for document-end marker', () => {
  const src = '---\nx\n...\n'
  const stream = parse(src)
  expect(stream).toHaveLength(1)
})

test('explicit key after empty value', () => {
  const src = 'one:\n? two\n'
  const doc = parse(src)[0]
  const raw = doc.contents[0].items.map(it => it.rawValue)
  expect(raw).toMatchObject([
    'one', ':',
    '? two'
  ])
})

test('seq with anchor as explicit key', () => {
  const src = '? &key\n- a\n'
  const doc = parse(src)[0]
  expect(doc.contents).toHaveLength(1)
  expect(doc.contents[0].items[0].node.rawValue).toBe('- a')
})
