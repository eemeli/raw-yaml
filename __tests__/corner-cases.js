import Node, { Type } from '../src/Node'
import parse from '../src/index'
import { pretty } from './common'

test('folded block with chomp: keep', () => {
  const src = `>+\nblock\n\n`
  const doc = parse(src)[0]
  trace: 'PARSED', JSON.stringify(pretty(doc), null, '  ')
  expect(doc.contents[0].strValue).toBe('block\n\n')
})
