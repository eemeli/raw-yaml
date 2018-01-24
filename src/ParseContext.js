import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowCollection from './FlowCollection'
import Node from './Node'
import PlainValue from './PlainValue'
import Range from './Range'
import Scalar from './Scalar'

/**
 * @param {boolean} atLineStart - Node starts at beginning of line
 * @param {boolean} inFlow - true if currently in a flow context
 * @param {boolean} inCollection - true if currently in a collection context
 * @param {number} indent - Current level of indentation
 * @param {number} lineStart - Start of the current line
 * @param {Node} parent - The parent of the node
 * @param {string} src - Source of the YAML document
 */
export default class ParseContext {
  static parseType (src, offset, inFlow) {
    switch (src[offset]) {
      case '*':
        return Node.Type.ALIAS
      case '>':
        return Node.Type.BLOCK_FOLDED
      case '|':
        return Node.Type.BLOCK_LITERAL
      case '{':
        return Node.Type.FLOW_MAP
      case '[':
        return Node.Type.FLOW_SEQ
      case '?':
        return !inFlow && Node.atBlank(src, offset + 1) ? Node.Type.MAP_KEY : Node.Type.PLAIN
      case ':':
        return !inFlow && Node.atBlank(src, offset + 1) ? Node.Type.MAP_VALUE : Node.Type.PLAIN
      case '-':
        return !inFlow && Node.atBlank(src, offset + 1) ? Node.Type.SEQ_ITEM : Node.Type.PLAIN
      case '"':
        return Node.Type.QUOTE_DOUBLE
      case "'":
        return Node.Type.QUOTE_SINGLE
      default:
        return Node.Type.PLAIN
    }
  }

  constructor (orig = {}, { atLineStart, inCollection, inFlow, indent, lineStart, parent } = {}) {
    this.atLineStart = atLineStart != null ? atLineStart : orig.lineStart || false
    this.inCollection = inCollection != null ? inCollection : orig.inCollection || false
    this.inFlow = inFlow != null ? inFlow : orig.inFlow || false
    this.indent = indent != null ? indent : orig.indent
    this.lineStart = lineStart != null ? lineStart : orig.lineStart
    this.parent = parent != null ? parent : orig.parent || {}
    this.src = orig.src
  }

  // for logging
  get pretty () {
    const obj = {
      start: `${this.lineStart} + ${this.indent}`,
      in: [],
      parent: this.parent.type
    }
    if (!this.atLineStart) obj.start += ' + N'
    if (this.inCollection) obj.in.push('collection')
    if (this.inFlow) obj.in.push('flow')
    return obj
  }

  nodeStartsCollection (node) {
    const { inCollection, inFlow, src } = this
    if (inCollection || inFlow) return false
    if (node instanceof CollectionItem) return true
    // check for implicit key
    let offset = node.range.end
    if (src[offset] === '\n' || src[offset - 1] === '\n') return false
    offset = Node.endOfWhiteSpace(src, offset)
    return src[offset] === ':'
  }

  // Anchor and tag are before type, which determines the node implementation
  // class; hence this intermediate step.
  parseProps (offset) {
    const { inFlow, src } = this
    const props = []
    offset = Node.endOfWhiteSpace(src, offset)
    let ch = src[offset]
    while (ch === Node.Prop.ANCHOR || ch === Node.Prop.COMMENT || ch === Node.Prop.TAG || ch === '\n') {
      if (ch === '\n') {
        const lineStart = offset + 1
        const inEnd = Node.endOfIndent(src, lineStart)
        if (!Node.nextNodeIsIndented(src[inEnd], inEnd - (lineStart + this.indent), true)) break
        this.atLineStart = true
        this.lineStart = lineStart
        offset = inEnd
      } else if (ch === Node.Prop.COMMENT) {
        const end = Node.endOfLine(src, offset + 1)
        props.push(new Range(offset, end))
        offset = end
      } else {
        const end = Node.endOfIdentifier(src, offset + 1)
        props.push(new Range(offset, end))
        offset = Node.endOfWhiteSpace(src, end)
      }
      ch = src[offset]
    }
    const type = ParseContext.parseType(src, offset, inFlow)
    return { props, type, valueStart: offset }
  }

  /**
   * Parses a node from the source
   * @param {ParseContext} overlay
   * @param {number} start - Index of first non-whitespace character for the node
   * @returns {?Node} - null if at a document boundary
   */
  parseNode = (overlay, start) => {
    if (Node.atDocumentBoundary(this.src, start)) return null
    const context = new ParseContext(this, overlay)
    const { props, type, valueStart } = context.parseProps(start)
    trace: 'START', valueStart, type, props, context.pretty
    let node
    switch (type) {
      case Node.Type.BLOCK_FOLDED:
      case Node.Type.BLOCK_LITERAL:
        node = new BlockValue(type, props)
        break
      case Node.Type.FLOW_MAP:
      case Node.Type.FLOW_SEQ:
        node = new FlowCollection(type, props)
        break
      case Node.Type.MAP_KEY:
      case Node.Type.MAP_VALUE:
      case Node.Type.SEQ_ITEM:
        node = new CollectionItem(type, props)
      break
      case Node.Type.COMMENT:
      case Node.Type.PLAIN:
        node = new PlainValue(type, props)
        break
      default:
        node = new Scalar(type, props)
    }
    let offset = node.parse(context, valueStart)
    let nodeEnd = this.src[offset] === '\n' ? offset + 1 : offset
    if (nodeEnd <= start) {
      node.error = new Error(`Node#parse consumed no characters`)
      node.error.parseEnd = nodeEnd
      nodeEnd = start + 1
    }
    node.range = new Range(start, nodeEnd)
    trace: node.type, node.range, JSON.stringify(node.rawValue)
    if (context.nodeStartsCollection(node)) {
      trace: 'collection-start'
      const collection = new Collection(node)
      offset = collection.parse(context, offset)
      collection.range = new Range(start, offset)
      trace: collection.type, collection.range, JSON.stringify(collection.rawValue)
      return collection
    }
    return node
  }
}
