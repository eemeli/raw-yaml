import Node from './Node'
import Range from './Range'

export default class FlowCollection extends Node {
  constructor (type, props) {
    super(type, props)
    this.items = null
  }

  prevNodeIsJsonLike (idx = this.items.length) {
    const node = this.items[idx - 1]
    return !!node && (
      node.jsonLike || (
        node.type === Node.Type.COMMENT && this.nodeIsJsonLike(idx - 1)
      )
    )
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse (context, start) {
    trace: 'flow-start', context.pretty, { start }
    this.context = context
    const { parseNode, src } = context
    let { lineStart } = context
    let ch = src[start] // { or [
    this.items = [ch]
    let offset = Node.endOfWhiteSpace(src, start + 1)
    ch = src[offset]
    while (ch && ch !== ']' && ch !== '}') {
      trace: 'item-start', this.items.length, ch
      switch (ch) {
        case '\n': {
          lineStart = offset + 1
          offset = Node.endOfIndent(src, lineStart)
        } break
        case ',': {
          this.items.push(ch)
          offset += 1
        } break
        case '#': {
          const comment = new Node(Node.Type.COMMENT, null, { src })
          const cEnd = comment.parseComment(offset)
          comment.range = new Range(offset, cEnd)
          this.items.push(comment)
          offset = cEnd
        } break
        case '?':
        case ':': {
          const next = src[offset + 1]
          if (next === '\n' || next === '\t' || next === ' ' || next === ',' || (
            // in-flow : after JSON-like key does not need to be followed by whitespace
            ch === ':' && this.prevNodeIsJsonLike()
          )) {
            this.items.push(ch)
            offset += 1
            break
          }
          // fallthrough
        }
        default: {
          const node = parseNode({ atLineStart: false, inCollection: false, inFlow: true, indent: -1, lineStart, parent: this }, offset)
          if (!node) {
            // at next document start
            this.valueRange = new Range(start, offset)
            return offset
          }
          this.items.push(node)
          // FIXME: prevents infinite loop
          if (node.range.end <= offset) throw new Error(`empty node ${node.type} ${JSON.stringify(node.range)}`)
          offset = Node.normalizeOffset(src, node.range.end)
        }
      }
      offset = Node.endOfWhiteSpace(src, offset)
      ch = src[offset]
    }
    this.valueRange = new Range(start, offset + 1)
    if (ch) {
      this.items.push(ch)
      offset = Node.endOfWhiteSpace(src, offset + 1)
      offset = this.parseComment(offset)
    }
    trace: 'items', this.items, JSON.stringify(this.comment)
    return offset
  }

  toString () {
    const { context: { src }, items, range, value } = this
    if (value != null) return value
    const nodes = items.filter(item => item instanceof Node)
    let str = ''
    let prevEnd = range.start
    nodes.forEach((node) => {
      const prefix = src.slice(prevEnd, node.range.start)
      prevEnd = node.range.end
      str += prefix + String(node)
    })
    return str + src.slice(prevEnd, range.end)
  }
}
