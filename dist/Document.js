"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Comment = _interopRequireDefault(require("./Comment"));

var _Node2 = _interopRequireWildcard(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Document =
/*#__PURE__*/
function (_Node) {
  _inherits(Document, _Node);

  _createClass(Document, null, [{
    key: "endOfDirective",
    value: function endOfDirective(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '\n' && ch !== '#') {
        ch = src[offset += 1];
      } // last char can't be whitespace


      ch = src[offset - 1];

      while (ch === ' ' || ch === '\t') {
        offset -= 1;
        ch = src[offset - 1];
      }

      return offset;
    }
  }, {
    key: "startCommentOrEndBlankLine",
    value: function startCommentOrEndBlankLine(src, start) {
      var offset = _Node2.default.endOfWhiteSpace(src, start);

      var ch = src[offset];
      return ch === '#' || ch === '\n' ? offset : start;
    }
  }, {
    key: "atDirectivesEnd",
    value: function atDirectivesEnd(src, offset) {
      return src[offset] === '-' && src[offset + 1] === '-' && src[offset + 2] === '-';
    }
  }, {
    key: "atDocumentEnd",
    value: function atDocumentEnd(src, offset) {
      return !src[offset] || src[offset] === '.' && src[offset + 1] === '.' && src[offset + 2] === '.';
    }
  }]);

  function Document() {
    var _this;

    _classCallCheck(this, Document);

    _this = _possibleConstructorReturn(this, (Document.__proto__ || Object.getPrototypeOf(Document)).call(this, _Node2.Type.DOCUMENT));
    _this.directives = null;
    _this.contents = null;
    return _this;
  }

  _createClass(Document, [{
    key: "parseDirectives",
    value: function parseDirectives(start) {
      var src = this.context.src;
      this.directives = [];
      var offset = start;

      while (!Document.atDirectivesEnd(src, offset)) {
        offset = Document.startCommentOrEndBlankLine(src, offset);
        var dirStart = offset;

        switch (src[offset]) {
          case '\n':
            offset += 1;
            break;

          case '#':
            {
              var comment = new _Comment.default();
              offset = comment.parse({
                src: src
              }, offset);
              this.directives.push(comment);
            }
            break;

          case '%':
            {
              var directive = new _Node2.default(_Node2.Type.DIRECTIVE, null, {
                parent: this,
                src: src
              });
              offset = Document.endOfDirective(src, offset + 1);
              directive.valueRange = new _Range.default(dirStart + 1, offset);
              offset = _Node2.default.endOfWhiteSpace(src, offset);
              offset = directive.parseComment(offset);
              directive.range = new _Range.default(dirStart, offset);
              this.directives.push(directive);
            }
            break;

          default:
            return offset;
        }
      }

      return offset + 3;
    }
  }, {
    key: "parseContents",
    value: function parseContents(start) {
      var _context = this.context,
          parseNode = _context.parseNode,
          src = _context.src;
      this.contents = [];
      var lineStart = start;

      while (src[lineStart - 1] === '-') {
        lineStart -= 1;
      }

      var offset = _Node2.default.endOfWhiteSpace(src, start);

      var atLineStart = lineStart === start;
      this.valueRange = new _Range.default(offset);

      while (!Document.atDocumentEnd(src, offset)) {
        switch (src[offset]) {
          case '\n':
            offset += 1;
            lineStart = offset;
            atLineStart = true;
            break;

          case '#':
            {
              var comment = new _Comment.default();
              offset = comment.parse({
                src: src
              }, offset);
              this.contents.push(comment);
            }
            break;

          default:
            {
              var iEnd = _Node2.default.endOfIndent(src, offset);

              var context = {
                atLineStart: atLineStart,
                indent: -1,
                inFlow: false,
                inCollection: false,
                lineStart: lineStart,
                parent: this
              };
              var node = parseNode(context, iEnd);
              if (!node) return iEnd; // at next document start

              this.contents.push(node);
              this.valueRange.end = node.valueRange.end;
              offset = node.range.end;
              atLineStart = false;
            }
        }

        offset = Document.startCommentOrEndBlankLine(src, offset);
      }

      return src[offset] ? offset + 3 : offset;
    }
    /**
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this
     */

  }, {
    key: "parse",
    value: function parse(context, start) {
      this.context = context;
      var src = context.src;
      var offset = src.charCodeAt(start) === 0xFEFF ? start + 1 : start; // skip BOM

      offset = this.parseDirectives(offset);
      offset = this.parseContents(offset);
      return offset;
    }
  }, {
    key: "toString",
    value: function toString() {
      var contents = this.contents,
          src = this.context.src,
          directives = this.directives,
          value = this.value;
      if (value != null) return value;
      var str = directives.join('');

      if (contents.length > 0) {
        if (directives.length > 0 || contents[0].type === _Node2.Type.COMMENT) str += '---\n';
        str += contents.join('');
      }

      if (str[str.length - 1] !== '\n') str += '\n';
      return str;
    }
  }]);

  return Document;
}(_Node2.default);

exports.default = Document;