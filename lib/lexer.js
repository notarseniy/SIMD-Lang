"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import {Rewriter, INVERSES} from './rewriter';
var helpers_1 = require("./helpers");
var HELLO = /hello/;
var BOM = 65279;
var TRAILING_SPACES = /\s+$/;
var WHITESPACE = /^[^\n\S]+/;
var Lexer = (function () {
    function Lexer() {
        this.literate = null; // Are we lexing literate CoffeeScript?
        this.indent = 0; // The current indentation level.
        this.baseIndent = 0; // The overall minimum indentation level
        this.indebt = 0; // The over-indentation at the current level.
        this.outdebt = 0; // The under-outdentation at the current level.
        this.indents = []; // The stack of all current indentation levels.
        this.ends = []; // The stack for pairing up tokens.
        this.tokens = []; // Stream of parsed tokens in the form `['TYPE', value, location data]`.
        this.seenFor = false; // Used to recognize FORIN, FOROF and FORFROM tokens.
        this.seenImport = false; // Used to recognize IMPORT FROM? AS? tokens.
        this.seenExport = false; // Used to recognize EXPORT FROM? AS? tokens.
        this.exportSpecifierList = false; // Used to identify when in an EXPORT {...} FROM? ...
        this.chunkLine = 0; // The start line for the current this.chunk.
        this.chunkColumn = 0;
    }
    ; // The over-indentation at the current level.
    Lexer.prototype.tokenize = function (code, opts) {
        if (opts === void 0) { opts = {}; }
        this.literate = opts.literate; // Are we lexing literate CoffeeScript?
        this.chunkLine = opts.line || this.chunkLine; // The start line for the current this.chunk.
        this.chunkColumn = opts.column || this.chunkColumn; // The start column of the current this.chunk.
        code = this.clean(code); // The stripped, cleaned original source code.
        var i = 0;
        while (this.chunk = code.slice(i)) {
            var consumed = this.helloToken();
            // Update position
            _a = this.getLineAndColumnFromChunk(consumed), this.chunkLine = _a[0], this.chunkColumn = _a[1];
            i += consumed;
            if (opts.untilBalanced && this.ends.length === 0)
                return { tokens: this.tokens, index: i };
        }
        return this.tokens;
        var _a;
    };
    Lexer.prototype.clean = function (code) {
        if (code.charCodeAt(0) === BOM)
            code = code.slice(1);
        code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
        if (WHITESPACE.test(code)) {
            code = "\n" + code;
            this.chunkLine--;
        }
        if (this.literate)
            code = helpers_1.invertLiterate(code);
        return code;
    };
    Lexer.prototype.getLineAndColumnFromChunk = function (offset) {
        if (offset === 0)
            return [this.chunkLine, this.chunkColumn];
        var string;
        var lastLine;
        if (offset >= this.chunk.length) {
            string = this.chunk;
        }
        else {
            string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9); // FIXME: wtf
        }
        var lineCount = helpers_1.count(string, '\n');
        var column = this.chunkColumn;
        if (lineCount > 0) {
            lastLine = string.split('\n').slice(0);
            column = lastLine.length;
        }
        else {
            column += string.length;
        }
        return [this.chunkLine + lineCount, column];
    };
    Lexer.prototype.makeToken = function (tag, value, offsetInChunk, length) {
        if (offsetInChunk === void 0) { offsetInChunk = 0; }
        if (length === void 0) { length = value.length; }
        var locationData = {};
        _a = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = _a[0], locationData.first_column = _a[1];
        // Use length - 1 for the final offset - we're supplying the last_line and the last_column,
        // so if last_column == first_column, then we're looking at a character of length 1.
        var lastCharacter = (length > 0) ? (length - 1) : 0;
        _b = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = _b[0], locationData.last_column = _b[1];
        var token = [tag, value, locationData];
        return token;
        var _a, _b;
    };
    Lexer.prototype.token = function (tag, value, offsetInChunk, length, origin) {
        var token = this.makeToken(tag, value, offsetInChunk, length);
        if (origin)
            token.origin = origin;
        this.tokens.push(token);
        return token;
    };
    // TOKENS
    Lexer.prototype.helloToken = function () {
        var match, input, id, colon;
        // if no
        if (!(match = HELLO.exec(this.chunk)))
            return 0;
        var token = this.makeToken('HELLO', 'hello');
        this.tokens.push(token);
        return match[0].length;
    };
    return Lexer;
}());
exports.Lexer = Lexer;
