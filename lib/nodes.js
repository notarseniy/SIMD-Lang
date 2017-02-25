"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
// Functions required by parser
var helpers_2 = require("./helpers");
exports.extend = helpers_2.extend;
exports.addLocationDataFn = helpers_2.addLocationDataFn;
var LEVEL_TOP = 1; // ...;
var LEVEL_PAREN = 2; // (...)
var LEVEL_LIST = 3; // [...]
var LEVEL_COND = 4; // ... ? x : y
var LEVEL_OP = 5; // !...
var LEVEL_ACCESS = 6; // ...[0]
var TAB = '  ';
var SIMPLENUM = /^[+-]?\d+$/;
var YES = function (o) { return true; };
var NO = function (o) { return false; };
var THIS = function (o) { return this; };
var NEGATE = function (o) { this.negated = !this.negated; return this; };
// The various nodes defined below all compile to a collection of **CodeFragment** objects.
// A CodeFragments is a block of generated code, and the location in the source file where the code
// came from. CodeFragments can be assembled together into working code just by catting together
// all the CodeFragments' `code` snippets, in order.
var CodeFragment = (function () {
    function CodeFragment(parent, code) {
        this.code = "" + code;
        this.locationData = (parent) ? parent.locationData : null;
        if (parent) {
            if (parent.constructor) {
                if (parent.constructor.name) {
                    this.type = parent.constructor.name;
                }
            }
        }
        else {
            this.type = 'unknown';
        }
    }
    CodeFragment.prototype.toString = function () {
        return "" + this.code + ((this.locationData) ? ": " + helpers_1.locationDataToString(this.locationData) : '');
    };
    return CodeFragment;
}());
exports.CodeFragment = CodeFragment;
// Convert an array of CodeFragments into a string.
function fragmentsToText(fragments) {
    var fragment;
    return ((function () {
        var j, len1, results;
        results = [];
        for (j = 0, len1 = fragments.length; j < len1; j++) {
            fragment = fragments[j];
            results.push(fragment.code);
        }
        return results;
    })()).join('');
}
// The **Base** is the abstract base class for all nodes in the syntax tree.
// Each subclass implements the `compileNode` method, which performs the
// code generation for that node. To compile a node to JavaScript,
// call `compile` on it, which wraps `compileNode` in some generic extra smarts,
// to know when the generated code needs to be wrapped up in a closure.
// An options hash is passed and cloned throughout, containing information about
// the environment from higher in the tree (such as if a returned value is
// being requested by the surrounding function), information about the current
// scope, and indentation level.
var Base = (function () {
    function Base() {
        // Default implementations of the common node properties and methods. Nodes
        // will override these with custom logic, if needed.
        this.children = [];
        this.isStatement = false;
        this.jumps = false;
        this.isComplex = true;
        this.isChainable = false;
        this.isAssignable = false;
        this.isNumber = false;
        this.isStatement = false;
        this.jumps = false;
        this.isComplex = true;
        this.isChainable = false;
        this.isAssignable = false;
        this.isNumber = false;
    }
    Base.prototype.compile = function (o, lvl) {
        return fragmentsToText(this.compileToFragments(o, lvl));
    };
    // Common logic for determining whether to wrap this node in a closure before
    // compiling it, or to compile directly. We need to wrap if this node is a
    // *statement*, and it's not a *pureStatement*, and we're not at
    // the top level of a block (which would be unnecessary), and we haven't
    // already been asked to return the result (because statements know how to
    // return results).
    Base.prototype.compileToFragments = function (o, lvl) {
        o = helpers_1.extend({}, o);
        if (lvl)
            o.level = lvl;
        var node = this.unfoldSoak(o) || this;
        node.tab = o.indent;
        if (o.level === LEVEL_TOP || !node.isStatement) {
            return node.compileNode(o);
        }
        else {
            return node.compileClosure(o);
        }
    };
    // If the code generation wishes to use the result of a complex expression
    // in multiple places, ensure that the expression is only ever evaluated once,
    // by assigning it to a temporary variable. Pass a level to precompile.
    // If `level` is passed, then returns `[val, ref]`, where `val` is the compiled value, and `ref`
    // is the compiled reference. If `level` is not passed, this returns `[val, ref]` where
    // the two values are raw nodes which have not been compiled.
    /*
    cache(o, level, isComplex) {
      let complex = (isComplex) ? isComplex(this) : this.isComplex();
      if (complex) {
        let ref = new IdentifierLiteral(o.scope.freeVariable('ref'));
        let sub = new Assign(ref, this);
        return (level) ? [sub.compileToFragments(o, level), [this.makeCode(ref.value)]] : [sub, ref];
      } else {
        let ref = (level) ? this.compileToFragments(o, level) : this;
        return [ref, ref];
      }
    }
    */
    Base.prototype.cacheToCodeFragments = function (cacheValues) {
        return [fragmentsToText(cacheValues[-1]), fragmentsToText(cacheValues[1])];
    };
    // Construct a node that returns the current node's result.
    // Note that this is overridden for smarter behavior for
    // many statement nodes (e.g. If, For)...
    /*
    makeReturn(res) {
      let me = this.unwrapAll();
      if (res) {
        return new Call(new Literal(`${res}.push`), [me]);
      } else {
        return new Return(me);
      }
    }
    */
    // Does this node, or any of its children, contain a node of a certain kind?
    // Recursively traverses down the *children* nodes and returns the first one
    // that verifies `pred`. Otherwise return undefined. `contains` does not cross
    // scope boundaries.
    Base.prototype.contains = function (pred) {
        var node = undefined;
        this.traverseChildren(false, function (n) {
            if (pred(n)) {
                node = n;
                return false;
            }
        });
        return node;
    };
    // Pull out the last non-comment node of a node list.
    Base.prototype.lastNonComment = function (list) {
        var i = list.length;
        while (i--) {
            if (!(list[i] instanceof Comment)) {
                return list[i];
            }
        }
        return null;
    };
    // `toString` representation of the node, for inspecting the parse tree.
    // This is what `coffee --nodes` prints out.
    Base.prototype.toString = function (idt, name) {
        if (idt === void 0) { idt = ''; }
        if (name === void 0) { name = this.constructor.name; }
        var tree = '\n' + idt + name;
        if (this.soak)
            tree += '?';
        this.eachChild(function (node) { return tree += node.toString(idt + TAB); });
        return tree;
    };
    // Passes each child to a function, breaking when the function returns `false`.
    Base.prototype.eachChild = function (func) {
        if (!this.children)
            return this;
        // TODO: refactor
        var ref3 = this.children;
        for (var j = 0, len1 = ref3.length; j < len1; j++) {
            var attr = ref3[j];
            if (this[attr]) {
                var ref4 = helpers_1.flatten([this[attr]]);
                for (var k = 0, len2 = ref4.length; k < len2; k++) {
                    var child = ref4[k];
                    if (func(child) === false) {
                        return this;
                    }
                }
            }
        }
        return this;
    };
    Base.prototype.traverseChildren = function (crossScope, func) {
        this.eachChild(function (child) {
            var recur = func(child);
            if (recur !== false)
                child.traverseChildren(crossScope, func);
        });
    };
    /*
    invert() {
      return new Op('!', this);
    }
    */
    Base.prototype.unwrapAll = function () {
        var node = this;
        while (node !== (node = node.unwrap())) {
            continue;
        }
        return node;
    };
    Base.prototype.unwrap = function () { return this; };
    ;
    Base.prototype.unfoldSoak = function (o) { return false; };
    ;
    // Is this node used to assign a certain variable?
    Base.prototype.assigns = function (name) { return false; };
    // For this node and all descendents, set the location data to `locationData`
    // if the location data is not already set.
    Base.prototype.updateLocationDataIfMissing = function (locationData) {
        if (this.locationData)
            return this;
        this.locationData = locationData;
        return this.eachChild(function (child) { return child.updateLocationDataIfMissing(locationData); });
    };
    Base.prototype.makeCode = function (code) {
        return new CodeFragment(this, code);
    };
    Base.prototype.wrapInBraces = function (fragments) {
        return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
    };
    // `fragmentsList` is an array of arrays of fragments. Each array in fragmentsList will be
    // concatonated together, with `joinStr` added in between each, to produce a final flat array
    // of fragments.
    Base.prototype.joinFragmentArrays = function (fragmentsList, joinStr) {
        var answer = [];
        for (var i = 0, len = fragmentsList.length; i < len; ++i) {
            var fragments = fragmentsList[i];
            if (i) {
                answer.push(this.makeCode(joinStr));
            }
            answer = answer.concat(fragments);
        }
        return answer;
    };
    return Base;
}());
exports.Base = Base;
var Literal = (function (_super) {
    __extends(Literal, _super);
    function Literal(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Literal.prototype.assigns = function (name) {
        return name === this.value;
    };
    Literal.prototype.compileNode = function (o) {
        return [this.makeCode(this.value)];
    };
    Literal.prototype.toString = function () {
        return " " + (this.isStatement ? _super.prototype.toString.call(this) : this.constructor.name) + ": " + this.value;
    };
    return Literal;
}(Base));
Literal.isComplex = false;
exports.Literal = Literal;
var LiteralHello = (function (_super) {
    __extends(LiteralHello, _super);
    function LiteralHello() {
        return _super.call(this, 'console.log("Hello, world!")') || this;
    }
    return LiteralHello;
}(Literal));
exports.LiteralHello = LiteralHello;
