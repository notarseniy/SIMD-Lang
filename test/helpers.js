const assert = require('assert');
const fs = require('fs');

module.exports.mustStrictEqual = function (actually, excepted) {
  /*
  console.log(
    'actually: ', actually,
    '\nexcepted: ', excepted);
  */
  return assert.strictEqual(actually, excepted);
};

module.exports.readFile = function (filename) {
  const result = fs.readFileSync(filename, 'utf8');

  // editors adding '\n'
  if (result.substr(-1) === '\n') {
    return result.slice(0, result.length - 1);
  } else {
    return result;
  }
}
