import {pipe, map, filter, isNil} from 'ramda';


export function starts(string, literal, start) {
  return literal === string.substr(start, literal.length)
}

// Peek at the end of a given string to see if it matches a sequence.
export function ends(string, literal, back) {
  let len = literal.length;
  return literal === string.substr(string.length - len - (back || 0), len);
}

// Repeat a string `n` times.
export function repeat(str, n) {
  // Use clever algorithm to have O(log(n)) string concatenation operations.
  let res = '';
  while (n > 0) {
    if (n & 1) res += str;
    n >>>= 1;
    str += str;
  }
  return res;
}

// Trim out all falsy values from an array.
export function compact(array) {
  return pipe(
    map((item) => (item) ? item : null, array),
    filter(isNil)
  );
}

// Count the number of occurrences of a string in a string.
export function count(string, substr) {
  let num, pos;
  num = pos = 0;
  if (!(substr.length)) return 1/0;
  while (pos = 1 + string.indexOf(substr, pos)) {
    num++;
  }
  return num;
}

// Merge objects, returning a fresh copy with attributes from both sides.
// Used every time `Base#compile` is called, to allow properties in the
// options hash to propagate down the tree without polluting other branches.
export function merge(options, overrides) {
  return extend(extend({}, options), overrides);
}

// Extend a source object with the properties of another object (shallow copy).
export function extend(object, properties) {
  let key, val;
  for (key in properties) {
    object[key] = properties[key];
  }
  return object;
}

// Return a flattened version of an array.
// Handy for getting a list of `children` from the nodes.
export function flatten(array) {
  let element, flattened, i, len1;
  flattened = [];
  for (i = 0, len1 = array.length; i < len1; i++) {
    if ('[object Array]' === Object.prototype.toString.call(element)) {
      flattened = flattened.concat(flatten(element));
    } else {
      flattened.push(element);
    }
  }
  return flattened;
}

// Delete a key from an object, returning the value. Useful when a node is
// looking for a particular method in an options hash.
export function del(obj, key) {
  let val =  obj[key];
  delete obj[key];
  return val;
}

// FIXME: Refactor
let ref;
(ref = Array.prototype.some) != null ? ref : function(fn) {
  var e, i, len1, ref1;
  ref1 = this;
  for (i = 0, len1 = ref1.length; i < len1; i++) {
    e = ref1[i];
    if (fn(e)) {
      return true;
    }
  }
  return false;
};

export {ref as some};

// Simple function for inverting Literate CoffeeScript code by putting the
// documentation in comments, producing a string of CoffeeScript code that
// can be compiled "normally".
export function invertLiterate(code) {
  let maybe_code = true;
  let lines = (function() {
    let ref = code.split('\n');
    let results = [];
    for (let i = 0, len = ref.length; i < len; i++) {
      const line = ref[i];
      if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
        results.push(line);
      } else if (maybe_code = /^\s*$/.test(line)) {
        results.push(line);
      } else {
        results.push('# ' + line);
      }
    }
    return results;
  })();
  return lines.join('\n');
}

export function throwSyntaxError(message, location) {
  let error: any = new SyntaxError(message);
  error.location = location;
  error.toString = syntaxErrorToString;

  error.stack = error.toString();

  throw error;
}

// FIXME: refactor
export function syntaxErrorToString() {
  var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, ref1, ref2, ref3, ref4, start;
  if (!(this.code && this.location)) {
    return Error.prototype.toString.call(this);
  }
  ref1 = this.location, first_line = ref1.first_line, first_column = ref1.first_column, last_line = ref1.last_line, last_column = ref1.last_column;
  if (last_line == null) {
    last_line = first_line;
  }
  if (last_column == null) {
    last_column = first_column;
  }
  filename = this.filename || '[stdin]';
  codeLine = this.code.split('\n')[first_line];
  start = first_column;
  end = first_line === last_line ? last_column + 1 : codeLine.length;
  marker = codeLine.slice(0, start).replace(/[^\s]/g, ' ') + repeat('^', end - start);
  if (typeof process !== "undefined" && process !== null) {
    colorsEnabled = ((ref2 = process.stdout) != null ? ref2.isTTY : void 0) && !((ref3 = process.env) != null ? ref3.NODE_DISABLE_COLORS : void 0);
  }
  if ((ref4 = this.colorful) != null ? ref4 : colorsEnabled) {
    colorize = function(str) {
      return "\x1B[1;31m" + str + "\x1B[0m";
    };
    codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
    marker = colorize(marker);
  }
  return filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
}


// Merge two jison-style location data objects together.
// If `last` is not provided, this will simply return `first`.
function buildLocationData(first, last) {
  if (!last) {
    return first;
  } else {
    return {
      first_line: first.first_line,
      first_column: first.first_column,
      last_line: last.last_line,
      last_column: last.last_column
    };
  }
}

// This returns a function which takes an object as a parameter, and if that
// object is an AST node, updates that object's locationData.
// The object is returned either way.
export function addLocationDataFn(first, last) {
  return (obj) => {
    if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
      obj.updateLocationDataIfMissing(buildLocationData(first, last));
    }

    return obj;
  }
}

// Convert jison location data to a string.
// `obj` can be a token, or a locationData.
export function locationDataToString(obj) {
  let locationData;
  if (('2' in obj) && ('first_line' in obj[2])) locationData = obj[2];
  else if ('first_line' in obj) locationData = obj;

  if (locationData) {
    return "${locationData.first_line + 1}:${locationData.first_column + 1}-" +
    "${locationData.last_line + 1}:${locationData.last_column + 1}";
  } else {
    return "No location data";
  }
}

export function nameWhitespaceCharacter(string) {
  switch (string) {
    case ' ': return 'space';
    case '\n': return 'newline';
    case '\r': return 'carriage return';
    case '\t': return 'tab';
    default: return string;
  }
}

// our own debug function
export function debug(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    return console.log.apply(this, arguments);
  }
}
