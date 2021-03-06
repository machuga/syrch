# Syrch Parser

Writing parsers is fun, but not always conducive to delivering business value
quickly if you have to worry about all the edge cases yourself.

I get a kick out of writing parsers, and have been disappointed with parser
generators on `npm` becoming stale and vulnerable. As such I've opted to
hand-roll a parser for some common search languages.

This library is intended to allow for developers to quickly take a popular
search syntax and return a standardized AST that they can manipulate and work
with, compiling to their target language of choice. Some targets will be
provided as well.

Another goal of this library is for the parser to be readable and
understandable to developers who are curious about writing parsers or need to
learn how to manipulate the library to do what they need.

# Source Languages

## Available
- [Lucene](https://lucene.apache.org/core/3_5_0/queryparsersyntax.html)


## Planned
- [SCIM Filters](https://tools.ietf.org/html/rfc7644#section-3.4.2.2)


# License
MIT

## Things to Know
* Boolean expressions are currently right-associative

