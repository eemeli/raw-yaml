import Node from './Node'
import Range from './Range'

export default class PlainValue extends Node {
  static endOfLine (src, start, inFlow) {
    let ch = src[start]
    let offset = start
    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break
      const next = src[offset + 1]
      if (ch === ':' && (next === '\n' || next === '\t' || next === ' ' || next === ',')) break
      if ((ch === ' ' || ch === '\t') && next === '#') break
      offset += 1
      ch = next
    }
    return offset
  }

  get strValue () {
    if (!this.valueRange || !this.context) return null
    let { start, end } = this.valueRange
    const { src } = this.context
    let ch = src[end - 1]
    while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) ch = src[--end - 1]
    ch = src[start]
    while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) ch = src[++start]
    let str = ''
    for (let i = start; i < end; ++i) {
      let ch = src[i]
      if (ch === '\n') {
        // fold single newline into space, multiple newlines to just one
        let nlCount = 1
        ch = src[i + 1]
        while (ch === ' ' || ch === '\t' || ch === '\n') {
          if (ch === '\n') ++nlCount
          i += 1
          ch = src[i + 1]
        }
        str += nlCount > 1 ? '\n' : ' '
      } else if (ch === ' ' || ch === '\t') {
        // trim trailing whitespace
        const wsStart = i
        let next = src[i + 1]
        while (i < end && (next === ' ' || next === '\t')) {
          i += 1
          next = src[i + 1]
        }
        if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch
      } else {
        str += ch
      }
    }
    return str
  }

  parseBlockValue (start) {
    const { indent, inFlow, src } = this.context
    let offset = start
    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      if (Node.atDocumentBoundary(src, offset + 1)) break
      const end = Node.endOfBlockIndent(src, indent, offset + 1)
      if (end === null || src[end] === '#') break
      offset = PlainValue.endOfLine(src, end, inFlow)
    }
    if (this.valueRange.isEmpty) this.valueRange.start = start
    this.valueRange.end = offset
    trace: this.valueRange, JSON.stringify(this.rawValue)
    return offset
  }

  /**
   * Parses a plain value from the source
   *
   * Accepted forms are:
   * ```
   * #comment
   *
   * first line
   *
   * first line #comment
   *
   * first line
   * block
   * lines
   *
   * #comment
   * block
   * lines
   * ```
   * where block lines are empty or have an indent level greater than `indent`.
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar, may be `\n`
   */
  parse (context, start) {
    this.context = context
    trace: 'plain-start', context.pretty, { start }
    const { inFlow, src } = context
    let offset = start
    let ch = src[offset]
    if (ch && ch !== '#' && ch !== '\n') {
      offset = PlainValue.endOfLine(src, start, inFlow)
    }
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: 'first line', { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    if (!this.hasComment || this.valueRange.isEmpty) {
      offset = this.parseBlockValue(offset)
    }
    trace: this.type, { offset, valueRange: this.valueRange }, JSON.stringify(this.rawValue)
    return offset
  }
}
