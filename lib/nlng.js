"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vm = require("vm");
var path = require("path");
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var yy = require("./nodes");
var helpers = require("./helpers");
var helpers_1 = require("./helpers");
var DEBUG = process.env.NODE_ENV === 'development';
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
parser_1.parser.yy = yy;
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
    options = helpers.extend({}, options);
    helpers_1.debug('nlng.compile :: enter');
    var tokens = lexer.tokenize(code, options);
    helpers_1.debug('nlng.compile :: tokens', tokens);
    var fragments = parser_1.parser.parse(tokens).compileToFragments(options);
    var currentLine = 0;
    code = "";
    for (var i = 0, len = fragments.length; i < len; i++) {
        code += fragments[i].code;
    }
    return code;
}
exports.compile = compile;
function tokens(code, options) {
    return lexer.tokenize(code, options);
}
exports.tokens = tokens;
function nodes(source, options) {
    if (typeof source === 'string') {
        return parser_1.parser.parse(lexer.tokenize(source, options));
    }
    else {
        return parser_1.parser.parse(source);
    }
}
exports.nodes = nodes;
function evalCode(code, options) {
    var Module, _module, _require, createContext, i, isContext, js, k, len, o, r, ref, ref1, ref2, ref3, sandbox, v;
    if (options == null) {
        options = {};
    }
    if (!(code = code.trim())) {
        return;
    }
    createContext = vm.createContext;
    isContext = (ref1 = vm.isContext) != null ? ref1 : function (ctx) {
        return options.sandbox instanceof createContext().constructor;
    };
    if (createContext) {
        if (options.sandbox != null) {
            if (isContext(options.sandbox)) {
                sandbox = options.sandbox;
            }
            else {
                sandbox = createContext();
                ref2 = options.sandbox;
                for (k in ref2) {
                    if (!{}.hasOwnProperty.call(ref2, k))
                        continue;
                    v = ref2[k];
                    sandbox[k] = v;
                }
            }
            sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
        }
        else {
            sandbox = global;
        }
        sandbox.__filename = options.filename || 'eval';
        sandbox.__dirname = path.dirname(sandbox.__filename);
        if (!(sandbox !== global || sandbox.module || sandbox.require)) {
            Module = require('module');
            sandbox.module = _module = new Module(options.modulename || 'eval');
            sandbox.require = _require = function (path) {
                return Module._load(path, _module, true);
            };
            _module.filename = sandbox.__filename;
            ref3 = Object.getOwnPropertyNames(require);
            for (i = 0, len = ref3.length; i < len; i++) {
                r = ref3[i];
                if (r !== 'paths' && r !== 'arguments' && r !== 'caller') {
                    _require[r] = require[r];
                }
            }
            _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
            _require.resolve = function (request) {
                return Module._resolveFilename(request, _module);
            };
        }
    }
    o = {};
    for (k in options) {
        if (!{}.hasOwnProperty.call(options, k))
            continue;
        v = options[k];
        o[k] = v;
    }
    o.bare = true;
    js = compile(code, o);
    if (sandbox === global) {
        return vm.runInThisContext(js);
    }
    else {
        return vm.runInContext(js, sandbox);
    }
}
exports.evalCode = evalCode;
