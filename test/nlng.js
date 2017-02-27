const helpers = require('./helpers.js');
const nlng = require('../lib/nlng');

function H(filename, excepted) {
  return function () {
    const str = __dirname + '/src/';
    const nlngFile = helpers.readFile(str + filename + '.nlng');
    const jsFile = helpers.readFile(str + filename + '.js');

    return helpers.mustStrictEqual(
      nlng.compile(nlngFile),
      jsFile
    );
  };
}

describe('nlng', function () {
  describe('#.compile()', function () {
    it('hello statement', H('hello'));

    it('empty code', H('empty'));

    it('comments', H('comments'))
  });
});
