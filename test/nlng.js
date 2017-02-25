const H = require('./util.js');
const nlng = require('../lib/main');

describe('nlng', function () {
  describe('#.compile()', function () {
    it('should return "console.log(Hello, world!)" when code is "hello"', H(
      nlng.compile('hello'),
      'console.log("Hello, world!")'
    ));

    it('should return "" when code is empty', H(
      nlng.compile(''),
      ''
    ));
  });
});
