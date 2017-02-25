import {Parser} from 'jison';
import * as N from './nodes';

const unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;

// Ported from CoffeeScript:
// 
// Our handy DSL for Jison grammar generation, thanks to
// [Tim Caswell](http://github.com/creationix). For every rule in the grammar,
// we pass the pattern-defining string, the action to run, and extra options,
// optionally. If no action is specified, we simply pass the value of the
// previous nonterminal.
function o(patternString, action?, options?) {
  let match;
  patternString = patternString.replace(/\s{2,}/g, ' ');
  let patternCount = patternString.split(' ').length;

  if (!action) return [patternString, '$$ = $1;', options];
  action = (match = unwrap.exec(action)) ? match[1] : `(${action}())`;

  // Replace 'N.' to '' since by exporting nodes here i'm only
  // trying to cheat typescript compiler
  //console.log(action);
  action = action.replace(/N\./g, '');

  // All runtime functions we need are defined on "yy"
  action = action.replace(/\bnew /g, '$&yy.');
  //action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');

  // Returns a function which adds location data to the first parameter passed
  // in, and returns the parameter.  If the parameter is not a node, it will
  // just be passed through unaffected.
  const addLocationDataFn = (first, last?) => {
    if (!last) {
      return `yy.addLocationDataFn(@${first})`;
    } else {
      return `yy.addLocationDataFn(@${first}, @${last})`;
    }
  }

  action = action.replace(/LOC\(([0-9]*)\)/g, addLocationDataFn('$1'));
  action = action.replace(/LOC\(([0-9]*),\s*([0-9]*)\)/g, addLocationDataFn('$1', '$2'));

  return [patternString, `$$ = ${addLocationDataFn(1, patternCount)}(${action});`, options];
}

const grammar = {
  Hello: [
    o('', () => { }),
    o('HELLO', () => { return new N.LiteralHello })
  ]
};

const operators = [
  ['left', 'HELLO']
];

// Wrapping Up
// -----------

// Finally, now that we have our **grammar** and our **operators**, we can create
// our **Jison.Parser**. We do this by processing all of our rules, recording all
// terminals (every symbol which does not appear as the name of a rule above)
// as "tokens".
const tokens = [];
let name;
for (name in grammar) {
  let alternatives = grammar[name];
  grammar[name] = (function() {
    var i, j, len, len1, ref, results;
    results = [];
    for (i = 0, len = alternatives.length; i < len; i++) {
      let alt = alternatives[i];
      ref = alt[0].split(' ');
      for (j = 0, len1 = ref.length; j < len1; j++) {
        let token = ref[j];
        if (!grammar[token]) {
          tokens.push(token);
        }
      }
      if (name === 'Hello') {
        alt[1] = "return " + alt[1];
      }
      results.push(alt);
    }
    return results;
  })();
}

// Initialize the **Parser** with our list of terminal **tokens**, our **grammar**
// rules, and the name of the root. Reverse the operators because Jison orders
// precedence from low to high, and we have it high to low
// (as in [Yacc](http://dinosaur.compilertools.net/yacc/index.html)).
export const parser = new Parser({
  tokens      : tokens.join(' '),
  bnf         : grammar,
  operators   : operators.reverse()
});
