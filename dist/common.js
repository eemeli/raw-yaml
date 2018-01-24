"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testSpec = exports.pretty = void 0;

var _Node = _interopRequireDefault(require("../src/Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var pretty = function pretty(node) {
  if (!node || _typeof(node) !== 'object') return node;
  if (Array.isArray(node)) return node.map(pretty);
  var res = {};
  if (node.anchor) res.anchor = node.anchor;
  if (typeof node.tag === 'string') res.tag = node.tag;
  if (node.comment) res.comment = node.comment;

  if (node.contents) {
    if (node.directives.length > 0) res.directives = node.directives.map(pretty);
    if (node.contents.length > 0) res.contents = node.contents.map(pretty);
  } else if (node.items) {
    res.items = node.items.map(pretty);
  } else if (typeof node.item !== 'undefined') {
    res.indicator = node.indicator;
    res.item = pretty(node.item);
  } else if (node.rawValue) {
    res.rawValue = node.rawValue;
  }

  if (Object.keys(res).every(function (key) {
    return key === 'rawValue';
  })) return res.rawValue;
  return res;
};

exports.pretty = pretty;

var testSpec = function testSpec(res, exp) {
  if (typeof exp === 'string') {
    var value = res instanceof _Node.default ? res.rawValue : res;
    expect(value).toBe(exp);
  } else if (Array.isArray(exp)) {
    expect(res).toBeInstanceOf(Array);
    exp.forEach(function (e, i) {
      return testSpec(res[i], e);
    });
  } else if (exp) {
    expect(res).toBeInstanceOf(Object);

    for (var key in exp) {
      testSpec(res[key], exp[key]);
    }
  } else {
    expect(res).toBeNull();
  }
};

exports.testSpec = testSpec;