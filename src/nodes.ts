import {compact, flatten, extend, merge, del, starts, ends, some,
addLocationDataFn, locationDataToString} from './helpers';

// Functions required by parser
export {extend, addLocationDataFn} from './helpers';

const LEVEL_TOP    = 1;  // ...;
const LEVEL_PAREN  = 2;  // (...)
const LEVEL_LIST   = 3;  // [...]
const LEVEL_COND   = 4;  // ... ? x : y
const LEVEL_OP     = 5;  // !...
const LEVEL_ACCESS = 6;  // ...[0]

const TAB = '  ';

const SIMPLENUM = /^[+-]?\d+$/;

const YES     = function(o?) { return true };
const NO      = function(o?) { return false };
const THIS    = function(o?) { return this };
const NEGATE  = function(o?) { this.negated = !this.negated; return this };

// Helpers

function multident(code, tab) {
  code = code.replace(/\n/g, '$&' + tab);
  return code.replace(/\s+$/, '');
}



// The various nodes defined below all compile to a collection of **CodeFragment** objects.
// A CodeFragments is a block of generated code, and the location in the source file where the code
// came from. CodeFragments can be assembled together into working code just by catting together
// all the CodeFragments' `code` snippets, in order.
export class CodeFragment {
  code: string;
  locationData: any;
  type: string;

  constructor(parent, code) {
    this.code = `${code}`;
    this.locationData = (parent) ? parent.locationData : null;
    if (parent) {
      if (parent.constructor) {
        if (parent.constructor.name) {
          this.type = parent.constructor.name;
        }
      }
    } else {
      this.type = 'unknown';
    }
  }

  toString() {
    return `${this.code}${(this.locationData) ? ": " + locationDataToString(this.locationData) : ''}`;
  }
}

// Convert an array of CodeFragments into a string.
function fragmentsToText(fragments) {
  var fragment;
  return ((function() {
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
export abstract class Base {

  static name: any;
  soak: any;
  locationData: any;

  constructor() {
    this.isStatement      = false;
    this.jumps            = false;
    this.isComplex        = true;
    this.isChainable      = false;
    this.isAssignable     = false;
    this.isNumber         = false;
  }

  compile(o, lvl) {
    return fragmentsToText(this.compileToFragments(o, lvl));
  }

  // Common logic for determining whether to wrap this node in a closure before
  // compiling it, or to compile directly. We need to wrap if this node is a
  // *statement*, and it's not a *pureStatement*, and we're not at
  // the top level of a block (which would be unnecessary), and we haven't
  // already been asked to return the result (because statements know how to
  // return results).
  compileToFragments(o, lvl) {
    o        = extend({}, o);
    if (lvl) o.level = lvl;
    let node: any     = this.unfoldSoak(o) || this;
    node.tab = o.indent;
    if (o.level === LEVEL_TOP || !node.isStatement) {
      return node.compileNode(o)
    } else {
      return node.compileClosure(o)
    }
  }

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

  cacheToCodeFragments(cacheValues) {
    return [fragmentsToText(cacheValues[-1]), fragmentsToText(cacheValues[1])];
  }

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
  contains(pred) {
    let node = undefined;
    this.traverseChildren(false, (n) => {
      if (pred(n)) {
        node = n;
        return false;
      }
    });
    return node;
  }

  // Pull out the last non-comment node of a node list.
  lastNonComment(list) {
    let i = list.length;
    while (i--) {
      if (!(list[i] instanceof Comment)) {
        return list[i];
      }
    }
    return null;
  }

  // `toString` representation of the node, for inspecting the parse tree.
  // This is what `coffee --nodes` prints out.
  toString(idt = '', name = (this.constructor as typeof Base).name) {
    let tree = '\n' + idt + name;
    if (this.soak) tree += '?';
    this.eachChild((node) => tree += node.toString(idt + TAB));
    return tree;
  }

  // Passes each child to a function, breaking when the function returns `false`.
  eachChild(func) {
    if (!this.children) return this;
    // TODO: refactor
    let ref3 = this.children;
    for (let j = 0, len1 = ref3.length; j < len1; j++) {
      let attr = ref3[j];
      if (this[attr]) {
        let ref4 = flatten([this[attr]]);
        for (let k = 0, len2 = ref4.length; k < len2; k++) {
          let child = ref4[k];
          if (func(child) === false) {
            return this;
          }
        }
      }
    }
    return this;
  }

  traverseChildren(crossScope, func) {
    this.eachChild((child) => {
      let recur = func(child);
      if (recur !== false) child.traverseChildren(crossScope, func);
    });
  }
  
  /*
  invert() {
    return new Op('!', this);
  }
  */

  unwrapAll() {
    let node = this;
    while (node !== (node = node.unwrap())) {
      continue;
    }
    return node;
  }

  // Default implementations of the common node properties and methods. Nodes
  // will override these with custom logic, if needed.
  children = [];

  isStatement: boolean      = false;
  jumps: boolean            = false;
  isComplex: boolean        = true;
  isChainable: boolean      = false;
  isAssignable: boolean     = false;
  isNumber: boolean         = false;

  unwrap(): any       { return this };
  unfoldSoak(o?): boolean { return false };

  // Is this node used to assign a certain variable?
  assigns(name?): any { return false }

  // For this node and all descendents, set the location data to `locationData`
  // if the location data is not already set.
  updateLocationDataIfMissing(locationData) {
    if (this.locationData) return this;
    this.locationData = locationData;

    return this.eachChild((child) => child.updateLocationDataIfMissing(locationData));
  }

  makeCode(code) {
    return new CodeFragment(this, code);
  }

  wrapInBraces(fragments) {
    return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
  }

  // `fragmentsList` is an array of arrays of fragments. Each array in fragmentsList will be
  // concatonated together, with `joinStr` added in between each, to produce a final flat array
  // of fragments.
  joinFragmentArrays(fragmentsList, joinStr) {
    let answer = [];
    for (let i = 0, len = fragmentsList.length; i < len; ++i) {
      let fragments = fragmentsList[i];
      if (i) {
        answer.push(this.makeCode(joinStr));
      }
      answer = answer.concat(fragments);
    }
    return answer;
  }
}

export class Literal extends Base {
  value;

  constructor(value) {
    super();
    this.value = value;
  }

  static isComplex: boolean = false;

  assigns(name) {
    return name === this.value;
  }

  compileNode(o) {
    return [this.makeCode(this.value)];
  }

  toString() {
    return ` ${this.isStatement ? super.toString() : (this.constructor as typeof Literal).name}: ${this.value}`;
  }
}

export class LiteralHello extends Literal {
  constructor() {
    super('console.log("Hello, world!")');
  }
}

export class Comment extends Base {
  comment;
  tab;

  constructor(comment) {
    super();
    this.comment = comment;
  }

  isStatement: boolean     = false
  makeReturn()      { return this }

  compileNode(o, level) {
    let comment = this.comment.replace(/^(\s*)#(?=\s)/gm, "$1 *");
    let code = "/*" + (multident(comment, this.tab)) + ([].indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";

    if ((level || o.level) === LEVEL_TOP) {
      code = o.indent + code;
    }

    return [this.makeCode("\n"), this.makeCode(code)];
  }
}
