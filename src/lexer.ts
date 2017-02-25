//import {Rewriter, INVERSES} from './rewriter';
import {count, starts, compact, repeat, invertLiterate,
locationDataToString} from './helpers';

const HELLO = /hello/;

const BOM = 65279;

const TRAILING_SPACES = /\s+$/;
const WHITESPACE = /^[^\n\S]+/;

export class Lexer {
  literate;  // Are we lexing literate CoffeeScript?
  indent: number;              // The current indentation level.
  baseIndent: number;              // The overall minimum indentation level
  indebt: number;;              // The over-indentation at the current level.
  outdebt: number;              // The under-outdentation at the current level.
  indents: Array<any>;             // The stack of all current indentation levels.
  ends: Array<any>;             // The stack for pairing up tokens.
  tokens: Array<any>;             // Stream of parsed tokens in the form `['TYPE', value, location data]`.
  seenFor: boolean;             // Used to recognize FORIN, FOROF and FORFROM tokens.
  seenImport: boolean;             // Used to recognize IMPORT FROM? AS? tokens.
  seenExport: boolean;             // Used to recognize EXPORT FROM? AS? tokens.
  exportSpecifierList: boolean;    // Used to identify when in an EXPORT {...} FROM? ...

  chunkLine: number;             // The start line for the current this.chunk.
  chunkColumn: number;           // The start column of the current this.chunk.

  chunk: string;

  constructor() {
    this.literate   = null;  // Are we lexing literate CoffeeScript?
    this.indent     = 0;              // The current indentation level.
    this.baseIndent = 0;              // The overall minimum indentation level
    this.indebt     = 0;              // The over-indentation at the current level.
    this.outdebt    = 0;              // The under-outdentation at the current level.
    this.indents    = [];             // The stack of all current indentation levels.
    this.ends       = [];             // The stack for pairing up tokens.
    this.tokens     = [];             // Stream of parsed tokens in the form `['TYPE', value, location data]`.
    this.seenFor    = false;             // Used to recognize FORIN, FOROF and FORFROM tokens.
    this.seenImport = false;             // Used to recognize IMPORT FROM? AS? tokens.
    this.seenExport = false;             // Used to recognize EXPORT FROM? AS? tokens.
    this.exportSpecifierList = false;    // Used to identify when in an EXPORT {...} FROM? ...

    this.chunkLine  = 0;             // The start line for the current this.chunk.
    this.chunkColumn = 0;
  }

  tokenize(code: string, opts: any = {}) {
    this.literate   = opts.literate;  // Are we lexing literate CoffeeScript?
    this.chunkLine  = opts.line || this.chunkLine;             // The start line for the current this.chunk.
    this.chunkColumn = opts.column || this.chunkColumn;           // The start column of the current this.chunk.

    code = this.clean(code);           // The stripped, cleaned original source code.
    
    let i = 0;


    while (this.chunk = code.slice(i)) {
      let consumed = this.helloToken();

      // Update position
      [this.chunkLine, this.chunkColumn] = this.getLineAndColumnFromChunk(consumed);

      i += consumed;
      
      if (opts.untilBalanced && this.ends.length === 0) return {tokens: this.tokens, index: i};
    }

    return this.tokens;
  }

  clean(code) {
    if (code.charCodeAt(0) === BOM) code = code.slice(1);
    code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');

    if (WHITESPACE.test(code)) {
      code = `\n${code}`;
      this.chunkLine--;
    }
    
    if (this.literate) code = invertLiterate(code);

    return code;
  }

  getLineAndColumnFromChunk(offset) {
    if (offset === 0) return [this.chunkLine, this.chunkColumn]

    let string;
    let lastLine;

    if (offset >= this.chunk.length) {
      string = this.chunk;
    } else {
      string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9); // FIXME: wtf
    }

    let lineCount = count(string, '\n');

    let column = this.chunkColumn;

    if (lineCount > 0) {
      [...lastLine] = string.split('\n');
      column = lastLine.length;
    } else {
      column += string.length
    }

    return [this.chunkLine + lineCount, column]
  }

  makeToken(tag, value, offsetInChunk = 0, length = value.length) {
    let locationData: any = {};
    [locationData.first_line, locationData.first_column] = this.getLineAndColumnFromChunk(offsetInChunk);

    // Use length - 1 for the final offset - we're supplying the last_line and the last_column,
    // so if last_column == first_column, then we're looking at a character of length 1.
    let lastCharacter: any = (length > 0) ? (length - 1) : 0;
    [locationData.last_line, locationData.last_column] = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter);

    let token = [tag, value, locationData];

    return token;
  }

  token(tag, value, offsetInChunk?, length?, origin?) {
    let token: any = this.makeToken(tag, value, offsetInChunk, length);
    if (origin) token.origin = origin;
    this.tokens.push(token);
    return token;
  }


  // TOKENS
  
  helloToken() {
    let match, input, id, colon;
    // if no
    if (!(match = HELLO.exec(this.chunk))) return 0;

    let token = this.makeToken('HELLO', 'hello');
    this.tokens.push(token);
    return match[0].length;
  }

}


