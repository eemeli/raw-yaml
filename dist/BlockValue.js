"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Chomp = void 0;

var _Node2 = _interopRequireWildcard(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Chomp = {
  CLIP: 'CLIP',
  KEEP: 'KEEP',
  STRIP: 'STRIP'
};
exports.Chomp = Chomp;

var BlockValue =
/*#__PURE__*/
function (_Node) {
  _inherits(BlockValue, _Node);

  function BlockValue(type, props) {
    var _this;

    _classCallCheck(this, BlockValue);

    _this = _possibleConstructorReturn(this, (BlockValue.__proto__ || Object.getPrototypeOf(BlockValue)).call(this, type, props));
    _this.blockIndent = null;
    _this.chomping = Chomp.CLIP;
    return _this;
  }

  _createClass(BlockValue, [{
    key: "parseBlockHeader",
    value: function parseBlockHeader(start) {
      var src = this.context.src;
      var offset = start + 1;
      var bi = '';

      while (true) {
        var ch = src[offset];

        switch (ch) {
          case '-':
            this.chomping = Chomp.STRIP;
            break;

          case '+':
            this.chomping = Chomp.KEEP;
            break;

          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            bi += ch;
            break;

          default:
            this.blockIndent = Number(bi) || null;
            return offset;
        }

        offset += 1;
      }
    }
  }, {
    key: "parseBlockValue",
    value: function parseBlockValue(start) {
      var _context = this.context,
          indent = _context.indent,
          inFlow = _context.inFlow,
          src = _context.src;
      var offset = start;
      var bi = this.blockIndent ? indent + this.blockIndent - 1 : indent;

      for (var ch = src[offset]; ch === '\n'; ch = src[offset]) {
        offset += 1;
        if (_Node2.default.atDocumentBoundary(src, offset)) break;

        var end = _Node2.default.endOfBlockIndent(src, bi, offset);

        if (end === null) break;

        if (!this.blockIndent && src[end] !== '\n') {
          // at first line, without explicit block indent
          this.blockIndent = end - (offset + indent);
          bi = indent + this.blockIndent - 1;
        }

        offset = _Node2.default.endOfLine(src, end);
      }

      this.valueRange = new _Range.default(start + 1, offset);
      return offset;
    }
    /**
     * Parses a block value from the source
     *
     * Accepted forms are:
     * ```
     * BS
     * block
     * lines
     *
     * BS #comment
     * block
     * lines
     * ```
     * where the block style BS matches the regexp `[|>][-+1-9]*` and block lines
     * are empty or have an indent level greater than `indent`.
     *
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this block
     */

  }, {
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var src = context.src;
      var offset = this.parseBlockHeader(start);
      offset = _Node2.default.endOfWhiteSpace(src, offset);
      offset = this.parseComment(offset);
      offset = this.parseBlockValue(offset);
      return offset;
    }
  }, {
    key: "strValue",
    get: function get() {
      if (!this.valueRange || !this.context) return null;
      var _valueRange = this.valueRange,
          start = _valueRange.start,
          end = _valueRange.end;
      var _context2 = this.context,
          indent = _context2.indent,
          src = _context2.src;

      if (this.chomping !== Chomp.KEEP) {
        var lastNewLine = null;
        var ch = src[end - 1];

        while (start < end && (ch === '\n' || ch === '\t' || ch === ' ')) {
          end -= 1;
          if (ch === '\n') lastNewLine = end;
          ch = src[end - 1];
        }

        if (lastNewLine) end = this.chomping === Chomp.STRIP ? lastNewLine : lastNewLine + 1;
      }

      var bi = indent + this.blockIndent;
      var folded = this.type === _Node2.Type.BLOCK_FOLDED;
      var str = '';
      var sep = '';
      var prevMoreIndented = false;

      for (var i = start; i < end; ++i) {
        for (var j = 0; j < bi; ++j) {
          if (src[i] !== ' ') break;
          i += 1;
        }

        var _ch = src[i];

        if (_ch === '\n') {
          if (sep === '\n') str += '\n';else sep = '\n';
        } else {
          var lineEnd = _Node2.default.endOfLine(src, i);

          var line = src.slice(i, lineEnd);
          i = lineEnd;

          if (folded && (_ch === ' ' || _ch === '\t')) {
            if (sep === ' ') sep = '\n';else if (!prevMoreIndented && sep === '\n') sep = '\n\n';
            str += sep + line; //+ ((lineEnd < end && src[lineEnd]) || '')

            sep = lineEnd < end && src[lineEnd] || '';
            prevMoreIndented = true;
          } else {
            str += sep + line;
            sep = folded ? ' ' : '\n';
            prevMoreIndented = false;
          }
        }
      }

      if (this.chomping !== Chomp.STRIP && (sep === '\n' || str[str.length - 1] !== '\n')) {
        return str + '\n'; // against spec, but only way to maintain consistency
      }

      return str;
    }
  }]);

  return BlockValue;
}(_Node2.default);

exports.default = BlockValue;