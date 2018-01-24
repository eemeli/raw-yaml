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

var Scalar =
/*#__PURE__*/
function (_Node) {
  _inherits(Scalar, _Node);

  function Scalar() {
    _classCallCheck(this, Scalar);

    return _possibleConstructorReturn(this, (Scalar.__proto__ || Object.getPrototypeOf(Scalar)).apply(this, arguments));
  }

  _createClass(Scalar, [{
    key: "parse",

    /**
     * Parses a scalar value from the source
     *
     * Accepted forms are:
     * ```
     * @alias
     *
     * "double \"quoted\" string"
     *
     * 'single ''quoted'' string'
     * ```
     * where both forms of quoted string may extend across multiple rows
     * regardless of indentation, and each form may be followed by a
     * whitespace-separated #comment.
     *
     * @param {ParseContext} context
     * @param {number} start - Index of first character
     * @returns {number} - Index of the character after this scalar
     */
    value: function parse(context, start) {
      this.context = context;
      var src = context.src;
      var offset;

      switch (this.type) {
        case _Node2.default.Type.ALIAS:
          start += 1;
          offset = _Node2.default.endOfIdentifier(src, start);
          break;

        case _Node2.default.Type.QUOTE_DOUBLE:
          offset = Scalar.endOfDoubleQuote(src, start + 1);
          break;

        case _Node2.default.Type.QUOTE_SINGLE:
          offset = Scalar.endOfSingleQuote(src, start + 1);
          break;

        default:
          this.error = new Error("Unknown node type: ".concat(JSON.stringify(this.type)));
          offset = start + 1;
      }

      this.valueRange = new _Range.default(start, offset);
      offset = _Node2.default.endOfWhiteSpace(src, offset);
      offset = this.parseComment(offset);
      return offset;
    }
  }], [{
    key: "endOfDoubleQuote",
    value: function endOfDoubleQuote(src, offset) {
      var ch = src[offset];

      while (ch && ch !== '"') {
        offset += ch === '\\' ? 2 : 1;
        ch = src[offset];
      }

      return offset + 1;
    }
  }, {
    key: "endOfSingleQuote",
    value: function endOfSingleQuote(src, offset) {
      var ch = src[offset];

      while (ch) {
        if (ch === "'") {
          if (src[offset + 1] !== "'") break;
          ch = src[offset += 2];
        } else {
          ch = src[offset += 1];
        }
      }

      return offset + 1;
    }
  }]);

  return Scalar;
}(_Node2.default);

exports.default = Scalar;