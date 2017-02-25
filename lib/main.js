"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var nodes = require("./nodes");
var helpers_1 = require("./helpers");
var lexer = new lexer_1.Lexer();
parser_1.parser.lexer = {
    lex: function () {
        var tag, token;
        token = parser_1.parser.tokens[this.pos++];
        if (token) {
            tag = token[0], this.yytext = token[1], this.yylloc = token[2];
            parser_1.parser.errorToken = token.origin || token;
            this.yylineno = this.yylloc.first_line;
        }
        else {
            tag = '';
        }
        return tag;
    },
    setInput: function (tokens) {
        parser_1.parser.tokens = tokens;
        return this.pos = 0;
    },
    upcomingInput: function () {
        return "";
    }
};
parser_1.parser.yy = nodes;
parser_1.parser.yy.parseError = function (message, arg) {
    var errorLoc, errorTag, errorText, errorToken, token, tokens;
    token = arg.token;
    errorToken = parser_1.parser.errorToken, tokens = parser_1.parser.tokens;
    errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
    errorText = (function () {
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
};
function compile(code, options) {
    if (code === void 0) { code = 'hello'; }
    options = helpers_1.extend({}, options);
    var tokens = lexer.tokenize(code, options);
    var fragments = parser_1.parser.parse(tokens).compileToFragments(options);
    var currentLine = 0;
    code = "";
    for (var i = 0, len = fragments.length; i < len; i++) {
        code += fragments[i].code;
    }
    return code;
}
exports.compile = compile;
