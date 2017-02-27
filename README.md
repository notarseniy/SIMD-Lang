# nlng

*Fun playing with [jison](http://jison.org/).*

The purpose of this "language" is to implement [JavaScript SIMD](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SIMD) into some unnecessary syntax and to learn jison. And also for fun.

Or probably, make my own Haskell! (nope, this is really bad joke)

## TODO
- [x] Basic learning of CoffeeScript parser
- [x] Make proof-of-concept compiler
- [ ] Scope system
- [ ] Implement basic syntax from 'Proposed syntax'
- [ ] Type system
- [ ] File loader
- [ ] REPL
- [ ] Conquer the world

## Proposed syntax
**Comments**
```
-- inline comment
{- block comment -}
```
**Types**
```
-- both are Number type
integer = 1
float = 1.0

bool = True
string = "omg i'm a string"

-- Lists
list = [1, 2, 3, 4]
simdList = &[1, 2, 3, 4] {- SIMD-powered lists (do i need it in special syntax?) -}

-- Tuple
tuple = (1, 2, 3, 4)

-- Record
record = {True, 1}
```
**Functions**
```
double x = 2 * x

-- how about pattern matching?
double 1 = 2
double 2 = 4
```

See `docs` folder for more info about syntax.

some parts of realization is based on [coffeescript](https://github.com/jashkenas/coffeescript) code (really, not bad refference).

[Arseniy Maximov](http://notarseniy.ru), 2017 ©
