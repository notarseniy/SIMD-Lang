import {pipe, map, filter, isNil} from 'ramda';

import {Lexer} from './lexer';
//import {parser} from './parser';
//import nodes from './nodes';
import {merge, extend} from './helpers';

const lexer = new Lexer();

/*parser.lexer = {
  lex: () => {
    let tag;
    let token = parser.tokens[this.pos++];

    if (token) {
      [tag, this.yytext, this.yylloc] = token;
      parser.errorToken = token.origin || token;
      this.yylineno = this.yylloc.first_line;
    } else {
      tag = '';
    }
    
    return tag;
  },
  setInput: (tokens) => {
    parser.tokens = tokens;
    return this.pos = 0;
  },
  upcomingInput: () => ""
};

parser.yy = nodes;*/

export function compile(code = 'hello', options) {
  options = extend({}, options);

  let tokens = lexer.tokenize(code, options);

  console.log('FINAL', tokens);
  /*let fragments = parser.parse(tokens).compileToFragments(options);

  let currentLine = 0;
  code = "";

  for (let i = 0, len = fragments.length; i < len; i++) {
    code += fragments[i][0].code;
  }
    
  return code;*/
}
