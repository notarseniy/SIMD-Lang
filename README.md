# SIMD Lang

*Fun playing with [jison](http://jison.org/).*

The purpose of this "language" is to implement [JavaScript SIMD](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SIMD) into some unnecessary syntax and to learn jison. And also for fun.

Or probably, make my own Haskell!

## Proposed syntax
**Comments**
```
-- inline comment
{- block comment -}
```
**Types**
```
let integer = 1
let float = 1.0
let bool = True
let string = "omg i'm a string"

let genericList = [1, 2, 3, 4] {- Lists -}
let simdList = &[1, 2, 3, 4] {- SIMD-powered lists (do i need it in special syntax?) -}

let tuple = (True, 1)
```
**Functions**
```
double x = 2 * x
```

ok. that enough for now.


[Arseniy Maximov](http://notarseniy.ru), 2017 ©
