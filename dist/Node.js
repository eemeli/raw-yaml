"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/** Root class of all nodes */
var Node =
/*#__PURE__*/
function () {
  _createClass(Node, null, [{
    key: "addStringTerminator",
    value: function addStringTerminator(src, offset, str) {
      if (str[str.length - 1] === '\n') return str;
      var next = Node.endOfWhiteSpace(src, offset);
      return next >= src.length || src[next] === '\n' ? str + '\n' : str;
    } // ^(---|...)

  }, {
    key: "atDocumentBoundary",
    value: function atDocumentBoundary(src, offset) {
      var prev = src[offset - 1];
      if (prev && prev !== '\n') return false;
      var ch0 = src[offset];
      if (!ch0) return true;
      if (ch0 !== '-' && ch0 !== '.') return false;
      var ch1 = src[offset + 1];
      var ch2 = src[offset + 2];
      return ch1 === ch0 && ch2 === ch0;
    }
  }, {
    key: "endOfIdentifier",
    value: function endOfIdentifier(src, offset) {
      var ch = src[offset];
      var isVerbatim = ch === '<';
      var notOk = isVerbatim ? ['\n', '\t', ' ', '>'] : ['\n', '\t', ' ', '[', ']', '{', '}', ','];

      while (ch && notOk.indexOf(ch) === -1) {
        ch = src[offset += 1];
      }

      if (isVerbatim && ch === '>') offset += 1;
      return offset;
    }
  }, {
    key: "endOfIndent",
    value: function endOfIndent(src, offset) {
      var ch = src[offset];

      while (ch === ' ') {
        ch = src[offset += 1];
      }

      return offset;
    }
  }, {
    key: "endOfLine",
    value: function endOfLine(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '\n') {
        ch = src[offset += 1];
      }

      return offset;
    }
  }, {
    key: "endOfWhiteSpace",
    value: function endOfWhiteSpace(src, offset) {
      var ch = src[offset];

      while (ch === '\t' || ch === ' ') {
        ch = src[offset += 1];
      }

      return offset;
    }
    /**
     * End of indentation, or null if the line's indent level is not more
     * than `indent`
     *
     * @param {string} src
     * @param {number} indent
     * @param {number} lineStart
     * @returns {?number}
     */

  }, {
    key: "endOfBlockIndent",
    value: function endOfBlockIndent(src, indent, lineStart) {
      var inEnd = Node.endOfIndent(src, lineStart);

      if (inEnd > lineStart + indent) {
        return inEnd;
      } else {
        var wsEnd = Node.endOfWhiteSpace(src, inEnd);
        var ch = src[wsEnd];
        if (!ch || ch === '\n') return wsEnd;
      }

      return null;
    }
  }, {
    key: "atBlank",
    value: function atBlank(src, offset) {
      var ch = src[offset];
      return ch === '\n' || ch === '\t' || ch === ' ';
    }
  }, {
    key: "atCollectionItem",
    value: function atCollectionItem(src, offset) {
      var ch = src[offset];
      return (ch === '?' || ch === ':' || ch === '-') && Node.atBlank(src, offset + 1);
    }
  }, {
    key: "nextNodeIsIndented",
    value: function nextNodeIsIndented(ch, indentDiff, indicatorAsIndent) {
      if (!ch || indentDiff < 0) return false;
      if (indentDiff > 0) return true;
      return indicatorAsIndent && (ch === '-' || ch === '?' || ch === ':');
    } // should be at line or string end, or at next non-whitespace char

  }, {
    key: "normalizeOffset",
    value: function normalizeOffset(src, offset) {
      var ch = src[offset];
      return !ch ? offset : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1 : Node.endOfWhiteSpace(src, offset);
    }
  }]);

  function Node(type, props, context) {
    _classCallCheck(this, Node);

    this.context = context || null;
    this.error = null;
    this.range = null;
    this.valueRange = null;
    this.props = props || [];
    this.type = type;
    this.value = null;
  }

  _createClass(Node, [{
    key: "getPropValue",
    value: function getPropValue(idx, key) {
      if (!this.context) return null;
      var src = this.context.src;
      var prop = this.props[idx];
      return prop && src[prop.start] === key ? src.slice(prop.start + 1, prop.end) : null;
    }
  }, {
    key: "parseComment",
    value: function parseComment(start) {
      var src = this.context.src;

      if (src[start] === Node.Prop.COMMENT) {
        var end = Node.endOfLine(src, start + 1);
        var commentRange = new _Range.default(start, end);
        this.props.push(commentRange);
        return end;
      }

      return start;
    }
  }, {
    key: "toString",
    value: function toString() {
      var src = this.context.src,
          range = this.range,
          value = this.value;
      if (value != null) return value;
      var str = src.slice(range.start, range.end);
      return Node.addStringTerminator(src, range.end, str);
    }
  }, {
    key: "anchor",
    get: function get() {
      for (var i = 0; i < this.props.length; ++i) {
        var anchor = this.getPropValue(i, Node.Prop.ANCHOR);
        if (anchor != null) return anchor;
      }

      return null;
    }
  }, {
    key: "comment",
    get: function get() {
      var comments = [];

      for (var i = 0; i < this.props.length; ++i) {
        var comment = this.getPropValue(i, Node.Prop.COMMENT);
        if (comment != null) comments.push(comment);
      }

      return comments.length > 0 ? comments.join('\n') : null;
    }
  }, {
    key: "hasComment",
    get: function get() {
      if (this.context) {
        var src = this.context.src;

        for (var i = 0; i < this.props.length; ++i) {
          if (src[this.props[i].start] === Node.Prop.COMMENT) return true;
        }
      }

      return false;
    }
  }, {
    key: "jsonLike",
    get: function get() {
      var jsonLikeTypes = [Node.Type.FLOW_MAP, Node.Type.FLOW_SEQ, Node.Type.QUOTE_DOUBLE, Node.Type.QUOTE_SINGLE];
      return jsonLikeTypes.indexOf(this.type) !== -1;
    }
  }, {
    key: "rawValue",
    get: function get() {
      if (!this.valueRange || !this.context) return null;
      var _valueRange = this.valueRange,
          start = _valueRange.start,
          end = _valueRange.end;
      return this.context.src.slice(start, end);
    }
  }, {
    key: "tag",
    get: function get() {
      for (var i = 0; i < this.props.length; ++i) {
        var tag = this.getPropValue(i, Node.Prop.TAG);
        if (tag != null) return tag;
      }

      return null;
    }
  }]);

  return Node;
}();

exports.default = Node;
Object.defineProperty(Node, "Prop", {
  configurable: true,
  enumerable: true,
  writable: true,
  value: {
    ANCHOR: '&',
    COMMENT: '#',
    TAG: '!'
  }
});
Object.defineProperty(Node, "Type", {
  configurable: true,
  enumerable: true,
  writable: true,
  value: {
    ALIAS: 'ALIAS',
    BLOCK_FOLDED: 'BLOCK_FOLDED',
    BLOCK_LITERAL: 'BLOCK_LITERAL',
    COLLECTION: 'COLLECTION',
    COMMENT: 'COMMENT',
    DIRECTIVE: 'DIRECTIVE',
    DOCUMENT: 'DOCUMENT',
    FLOW_MAP: 'FLOW_MAP',
    FLOW_SEQ: 'FLOW_SEQ',
    MAP_KEY: 'MAP_KEY',
    MAP_VALUE: 'MAP_VALUE',
    PLAIN: 'PLAIN',
    QUOTE_DOUBLE: 'QUOTE_DOUBLE',
    QUOTE_SINGLE: 'QUOTE_SINGLE',
    SEQ_ITEM: 'SEQ_ITEM'
  }
});