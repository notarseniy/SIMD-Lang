# Concepts

## Types

*How about language without types? lol, jk. Not this time.*

* Boolean
* String
* Number
* null
* List (arrays)
* SIMD List (implementing [JavaScript SIMD](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SIMD))
* Tuple (untyped arrays)
* Record (objects)


## Functions

Here I trying to come up with functions syntax.

Well, two seconds ago i've googled about haskell and i think syntax can be something like this:
```haskell
double x = 2 * x
double 1 = 2
double 2 = 4

-- maybe even i can implement type checking:
triple :: Number -> Number
triple x = 3 * x
```

Functions are pure. I think it would be interesting to implement pattern-matching by default.

## Variables
```haskell
-- both are Number type
integer = 1
float = 1.0

bool = True
string = "omg i'm a string"

-- Lists
list = [1, 2, 3, 4]
listThatEqualToPrevious = [1..4]

simdList = &[1, 2, 3, 4] {- SIMD-powered lists (do i need it in special syntax?) -}

-- Tuple
tuple = (1, 2, 3, 4)

-- Record
record = {True, 1}
```
