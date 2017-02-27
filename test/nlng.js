const helpers = require('./helpers.js');
const nlng = require('../lib/main');

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
    it('should return "console.log(Hello, world!)" when code is "hello"', H('hello'));

    it('should return "" when code is empty', H('empty'));
  });
});
