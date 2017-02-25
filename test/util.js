const assert = require('assert');

module.exports = function (actually, excepted) {
  /*
  console.log(
    'actually: ', actually,
    '\nexcepted: ', excepted);
  */
  return () => assert.strictEqual(actually, excepted);
};
