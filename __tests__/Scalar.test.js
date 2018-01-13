import Scalar from '../src/Scalar'

describe('internals', () => {
  test('constructor', () => {
    const src = 'src'
    const s = new Scalar(src)
    expect(s.src).toBe(src)
  })
  test('endIndent', () => {
    const src = '  - value\n- other\n'
    const s = new Scalar(src)
    const in1 = s.endIndent(0)
    expect(in1).toBe(2)
    const offset = src.indexOf('\n') + 1
    const in2 = s.endIndent(offset)
    expect(in2).toBe(offset)
  })
})

const testScalarParse = ({ pre, post, str, comment, expected }) => {
  let body = str
  if (comment) {
    const lines = body.split('\n')
    lines[0] += ` #${comment}`
    body = lines.join('\n')
  }
  const scalar = new Scalar(pre + body + post)
  const indent = scalar.endIndent(0)
  const end = scalar.parse(pre.length, indent, false)
  const expectedEnd = scalar.endWhiteSpace(pre.length + body.length)
  expect(scalar.rawValue).toBe(expected || str)
  expect(end).toBe(expectedEnd)
  if (comment) expect(scalar.comment).toBe(comment)
  expect(scalar).toMatchSnapshot()
}

const commonTests = {
  'bare': { pre: '', post: '' },
  'newline before & after': { pre: '\n', post: '\n' },
  'complex mapping key': { pre: '? ', post: ' : ' },
  'seq value': { pre: '- ', post: '\n- ' },
  'indented block': { pre: '    - ', post: '\n  x' },
  'flow seq value': { pre: '[ ', post: ' ]' },
  'with comment': { pre: '\n  ', comment: 'comment # here!', post: '\n' }
}

describe('parse "quoted"', () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '"value"' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: '"value"', post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: '"value\nwith\nmore lines"', post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: '" #value\\\\\nwith \\"more\\" lines\\""', post: '\n' }))
})

describe("parse 'quoted'", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: "'value'" }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
  test('without spaces', () => testScalarParse({ pre: '{', str: "'value'", post: ',' }))
  test('multi-line', () => testScalarParse({ pre: '\n', str: "'value\nwith\nmore lines'", post: '\n' }))
  test('escaped', () => testScalarParse({ pre: '\n', str: "' #value\nwith ''more'' lines'''", post: '\n' }))
})

describe("parse *alias", () => {
  for (const name in commonTests) {
    const props = Object.assign({ str: '*alias', expected: 'alias' }, commonTests[name])
    test(name, () => testScalarParse(props))
  }
})

describe("parse >block", () => {
  const block = '      #multiline\n  \n      \tblock'
  for (const name in commonTests) {
    const props = Object.assign({ str: `>\n${block}`, expected: block }, commonTests[name])
    if (props.post && props.post[0] !== '\n') {
      props.pre = `  ${props.pre}`
      props.post = props.post.replace(/^\s?/, '\n')
    }
    test(name, () => testScalarParse(props))
  }
  test('literal with header', () => testScalarParse({ pre: '\n- ', str: `|+2\n${block}`, expected: block, post: '\n' }))
})
