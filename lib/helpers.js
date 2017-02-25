"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ramda_1 = require("ramda");
function starts(string, literal, start) {
    return literal === string.substr(start, literal.length);
}
exports.starts = starts;
// Peek at the end of a given string to see if it matches a sequence.
function ends(string, literal, back) {
    var len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
}
exports.ends = ends;
// Repeat a string `n` times.
function repeat(str, n) {
    // Use clever algorithm to have O(log(n)) string concatenation operations.
    var res = '';
    while (n > 0) {
        if (n & 1)
            res += str;
        n >>>= 1;
        str += str;
    }
    return res;
}
exports.repeat = repeat;
// Trim out all falsy values from an array.
function compact(array) {
    return ramda_1.pipe(ramda_1.map(function (item) { return (item) ? item : null; }, array), ramda_1.filter(ramda_1.isNil));
}
exports.compact = compact;
// Count the number of occurrences of a string in a string.
function count(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!(substr.length))
        return 1 / 0;
    while (pos = 1 + string.indexOf(substr, pos)) {
        num++;
    }
    return num;
}
exports.count = count;
// Merge objects, returning a fresh copy with attributes from both sides.
// Used every time `Base#compile` is called, to allow properties in the
// options hash to propagate down the tree without polluting other branches.
function merge(options, overrides) {
    return extend(extend({}, options), overrides);
}
exports.merge = merge;
// Extend a source object with the properties of another object (shallow copy).
function extend(object, properties) {
    var key, val;
    for (key in properties) {
        object[key] = properties[key];
    }
    return object;
}
exports.extend = extend;
// Return a flattened version of an array.
// Handy for getting a list of `children` from the nodes.
function flatten(array) {
    var element, flattened, i, len1;
    flattened = [];
    for (i = 0, len1 = array.length; i < len1; i++) {
        if ('[object Array]' === Object.prototype.toString.call(element)) {
            flattened = flattened.concat(flatten(element));
        }
        else {
            flattened.push(element);
        }
    }
    return flattened;
}
exports.flatten = flatten;
// Delete a key from an object, returning the value. Useful when a node is
// looking for a particular method in an options hash.
function del(obj, key) {
    var val = obj[key];
    delete obj[key];
    return val;
}
exports.del = del;
// FIXME: Refactor
var ref;
exports.some = ref;
(exports.some = ref = Array.prototype.some) != null ? ref : function (fn) {
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
// Simple function for inverting Literate CoffeeScript code by putting the
// documentation in comments, producing a string of CoffeeScript code that
// can be compiled "normally".
function invertLiterate(code) {
    var maybe_code = true;
    var lines = (function () {
        var ref = code.split('\n');
        var results = [];
        for (var i = 0, len = ref.length; i < len; i++) {
            var line = ref[i];
            if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
                results.push(line);
            }
            else if (maybe_code = /^\s*$/.test(line)) {
                results.push(line);
            }
            else {
                results.push('# ' + line);
            }
        }
        return results;
    })();
    return lines.join('\n');
}
exports.invertLiterate = invertLiterate;
// Merge two jison-style location data objects together.
// If `last` is not provided, this will simply return `first`.
function buildLocationData(first, last) {
    if (!last) {
        return first;
    }
    else {
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
function addLocationDataFn(first, last) {
    return function (obj) {
        if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
            obj.updateLocationDataIfMissing(buildLocationData(first, last));
        }
        return obj;
    };
}
exports.addLocationDataFn = addLocationDataFn;
// Convert jison location data to a string.
// `obj` can be a token, or a locationData.
function locationDataToString(obj) {
    var locationData;
    if (('2' in obj) && ('first_line' in obj[2]))
        locationData = obj[2];
    else if ('first_line' in obj)
        locationData = obj;
    if (locationData) {
        return "${locationData.first_line + 1}:${locationData.first_column + 1}-" +
            "${locationData.last_line + 1}:${locationData.last_column + 1}";
    }
    else {
        return "No location data";
    }
}
exports.locationDataToString = locationDataToString;
function nameWhitespaceCharacter(string) {
    switch (string) {
        case ' ': return 'space';
        case '\n': return 'newline';
        case '\r': return 'carriage return';
        case '\t': return 'tab';
        default: return string;
    }
}
exports.nameWhitespaceCharacter = nameWhitespaceCharacter;
