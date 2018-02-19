"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Node2 = _interopRequireDefault(require("./Node"));

var _Range = _interopRequireDefault(require("./Range"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var parseCharCode = function parseCharCode(src, offset, length) {
  var cc = src.substr(offset, length);
  var ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
  var code = ok ? parseInt(cc, 16) : NaN;
  if (isNaN(code)) throw new SyntaxError("Invalid escape sequence ".concat(src.substr(offset - 2, length + 2)));
  return String.fromCodePoint(code);
};

var QuoteDouble =
/*#__PURE__*/
function (_Node) {
  _inherits(QuoteDouble, _Node);

  function QuoteDouble() {
    _classCallCheck(this, QuoteDouble);

    return _possibleConstructorReturn(this, (QuoteDouble.__proto__ || Object.getPrototypeOf(QuoteDouble)).apply(this, arguments));
  }

  _createClass(QuoteDouble, [{
    key: "parse",

    /**
     * Parses a "double quoted" value from the source
     *
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this scalar
     */
    value: function parse(context, start) {
      this.context = context;
      var src = context.src;
      var offset = QuoteDouble.endOfQuote(src, start + 1);
      this.valueRange = new _Range.default(start, offset);
      offset = _Node2.default.endOfWhiteSpace(src, offset);
      offset = this.parseComment(offset);
      return offset;
    }
  }, {
    key: "strValue",

    /** @throws {SyntaxError} on invalid \ escape */
    get: function get() {
      if (!this.valueRange || !this.context) return null;
      var _valueRange = this.valueRange,
          start = _valueRange.start,
          end = _valueRange.end;
      var src = this.context.src; // Using String#replace is too painful with escaped newlines preceded by
      // escaped backslashes; also, this should be faster.

      var str = '';

      for (var i = start + 1; i < end - 1; ++i) {
        var ch = src[i];

        if (ch === '\n') {
          // fold single newline into space, multiple newlines to just one
          var nlCount = 1;
          ch = src[i + 1];

          while (ch === ' ' || ch === '\t' || ch === '\n') {
            if (ch === '\n') ++nlCount;
            i += 1;
            ch = src[i + 1];
          }

          str += nlCount > 1 ? '\n' : ' ';
        } else if (ch === '\\') {
          i += 1;

          switch (src[i]) {
            case '0':
              str += '\0';
              break;
            // null character

            case 'a':
              str += '\x07';
              break;
            // bell character

            case 'b':
              str += '\b';
              break;
            // backspace

            case 'e':
              str += '\x1b';
              break;
            // escape character

            case 'f':
              str += '\f';
              break;
            // form feed

            case 'n':
              str += '\n';
              break;
            // line feed

            case 'r':
              str += '\r';
              break;
            // carriage return

            case 't':
              str += '\t';
              break;
            // horizontal tab

            case 'v':
              str += '\v';
              break;
            // vertical tab

            case 'N':
              str += "\x85";
              break;
            // Unicode next line

            case '_':
              str += "\xA0";
              break;
            // Unicode non-breaking space

            case 'L':
              str += "\u2028";
              break;
            // Unicode line separator

            case 'P':
              str += "\u2029";
              break;
            // Unicode paragraph separator

            case ' ':
              str += ' ';
              break;

            case '"':
              str += '"';
              break;

            case '/':
              str += '/';
              break;

            case '\\':
              str += '\\';
              break;

            case '\t':
              str += '\t';
              break;

            case 'x':
              str += parseCharCode(src, i + 1, 2);
              i += 2;
              break;

            case 'u':
              str += parseCharCode(src, i + 1, 4);
              i += 4;
              break;

            case 'U':
              str += parseCharCode(src, i + 1, 8);
              i += 8;
              break;

            case '\n':
              // skip escaped newlines, but still trim the following line
              while (src[i + 1] === ' ' || src[i + 1] === '\t') {
                i += 1;
              }

              break;

            default:
              throw new SyntaxError("Invalid escape sequence ".concat(src.substr(i - 1, 2)));
          }
        } else if (ch === ' ' || ch === '\t') {
          // trim trailing whitespace
          var wsStart = i;
          var next = src[i + 1];

          while (next === ' ' || next === '\t') {
            i += 1;
            next = src[i + 1];
          }

          if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch;
        } else {
          str += ch;
        }
      }

      return str;
    }
  }], [{
    key: "endOfQuote",
    value: function endOfQuote(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '"') {
        offset += ch === '\\' ? 2 : 1;
        ch = src[offset];
      }

      return offset + 1;
    }
  }]);

  return QuoteDouble;
}(_Node2.default);

exports.default = QuoteDouble;