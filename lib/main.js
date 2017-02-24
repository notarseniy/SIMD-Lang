"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexer_1 = require("./lexer");
//import {parser} from './parser';
//import nodes from './nodes';
var helpers_1 = require("./helpers");
var lexer = new lexer_1.Lexer();
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
function compile(code, options) {
    if (code === void 0) { code = 'hello'; }
    options = helpers_1.extend({}, options);
    var tokens = lexer.tokenize(code, options);
    console.log('FINAL', tokens);
    /*let fragments = parser.parse(tokens).compileToFragments(options);
  
    let currentLine = 0;
    code = "";
  
    for (let i = 0, len = fragments.length; i < len; i++) {
      code += fragments[i][0].code;
    }
      
    return code;*/
}
exports.compile = compile;
