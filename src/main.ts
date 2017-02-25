import {pipe, map, filter, isNil} from 'ramda';

import {Lexer} from './lexer';
import {parser} from './parser';
import * as nodes from './nodes';
import {merge, extend} from './helpers';

const lexer = new Lexer();

parser.lexer = {
  lex: function() {
    var tag, token;
    token = parser.tokens[this.pos++];
    if (token) {
      tag = token[0], this.yytext = token[1], this.yylloc = token[2];
      parser.errorToken = token.origin || token;
      this.yylineno = this.yylloc.first_line;
    } else {
      tag = '';
    }
    return tag;
  },
  setInput: function(tokens) {
    parser.tokens = tokens;
    return this.pos = 0;
  },
  upcomingInput: function() {
    return "";
  }
}

parser.yy = nodes;

parser.yy.parseError = function(message, arg) {
  var errorLoc, errorTag, errorText, errorToken, token, tokens;
  token = arg.token;
  errorToken = parser.errorToken, tokens = parser.tokens;
  errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
  errorText = (function() {
    switch (false) {
      case errorToken !== tokens[tokens.length - 1]:
        return 'end of input';
      case errorTag !== 'INDENT' && errorTag !== 'OUTDENT':
        return 'indentation';
      case errorTag !== 'IDENTIFIER' && errorTag !== 'NUMBER' && errorTag !== 'INFINITY' && errorTag !== 'STRING' && errorTag !== 'STRING_START' && errorTag !== 'REGEX' && errorTag !== 'REGEX_START':
        return errorTag.replace(/_START$/, '').toLowerCase();
      default:
        return helpers.nameWhitespaceCharacter(errorText);
    }
  })();
  return helpers.throwSyntaxError("unexpected " + errorText, errorLoc);
}


export function compile(code = 'hello', options) {
  options = extend({}, options);

  let tokens = lexer.tokenize(code, options);

  let fragments = parser.parse(tokens).compileToFragments(options);
  let currentLine = 0;
  code = "";

  for (let i = 0, len = fragments.length; i < len; i++) {
    code += fragments[i].code;
  }
   
  return code;
}
