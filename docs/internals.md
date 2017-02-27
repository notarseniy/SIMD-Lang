# Internals

Here I describe how things should compile.

## Operators
```haskell
1 + 2   -- 1
5 - 2   -- 3
1 * 1.5 -- 3
14 / 2  -- 7

5 % 2   -- 1
2 ** 2  -- 4

1 == true  -- false, compiles to ===
1 != false -- false, that behaviour too
```

## Variables
**nlng**
```haskell
integer = 1
float = 1.0

bool = True
string = "omg i'm a string"

list = [1, 2, 3, 4]
listThatEqualToPrevious = [1..4]

simdList = &[1, 2, 3, 4] {- SIMD-powered lists (do i need it in special syntax?) -}

tuple = (1, True, "Hello")

record = { a: True, b: 1}
```

**javascript**
```javascript
let integer = 1;
let float = 1.0;

let bool = true;
let string = "omg i'm a string";

let list = [1, 2, 3, 4];
let listThatEqualToPrevious = [1, 2, 3, 4];

// Duck typing!
let simdList = SIMD.Int32x4(1, 2, 3, 4);

let tuple = [1, true, "Hello"];

let record = { a: true, b: 1 };
```

## Functions
Simple example.

**nlng code**
```haskell
double x = 2 * x
```
**javascript output**
```javascript
const double = function (x) {
  return 2 * x;
}
```

With pattern matching

**nlng**
```haskell
double x = 2 * x
double 0 = 0
double 1 = 2
double 2 = 4
```

**javascript**
```javascript
const double = function (x) {
  switch (x) {
   case 0:
      return 0;
    case 1:
      return 2;
    case 2:
      return 4;
    default:
      return 2 * x;
  }
}
```

## SIMD
Let talk about SIMD! Rewrite [first example](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SIMD) from MDN from JS to nlng:

**javascript**
```javascript
var a = SIMD.Float32x4(1, 2, 3, 4);
var b = SIMD.Float32x4(5, 6, 7, 8);
var c = SIMD.Float32x4.add(a,b); // Float32x4[6,8,10,12]
```

**nlng**
```haskell
a = &[1, 2, 3, 4]
b = &[5, 6, 7, 8]
c = a + b -- &[6, 8, 10, 12] :: Float32x4
```

*omg!* Shorter mlg pro sanic gotta go fast synax! Developer experience increased by 200%!

Of course, no. Noone needs this type of syntax, this lang is just for learning how to develop some something like programming language.

More examples. Numbers:
```haskell
a = &[6.0, 2.0]
b = &[3.0, 3.0]

addition = a + b -- &[9.0, 5.0] :: Float64x2
subtraction = a - b -- &[3.0, -1.0] :: Float64x2
division = a / b -- &[2.0, 0.66666666] :: Float64x2 — division is available only with floats
muliply = a * b -- &[18.0, 6.0] :: Float64x2
```

Booleans:
```haskell
a = &[True, False]
b = &[True, True]
```
On thinking about booleans operators, i started thinking about usefulness of implementing SIMD natievly. Maybe really should use it only as optimization. I dont know.
