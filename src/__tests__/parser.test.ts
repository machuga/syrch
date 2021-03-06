import { parse } from '../parser';

describe('The parser', function() {
  it('identifies fielded terms', function() {
    expect(parse('foo:bar')).toEqual({
      type: 'Query',
      body: {
        type: 'UnquotedTerm',
        field: 'foo',
        value: 'bar',
      }
    });
  });

  it('identifies fielded groups with one element term', function() {
    expect(parse('foo:(bar)')).toEqual({
      type: 'Query',
      body: {
        type: 'FieldGroup',
        field: 'foo',
        body: {
          type: 'UnquotedTerm',
          field: '*',
          value: 'bar',
        }
      }
    });
  });

  it('identifies fielded groups with multiple terms', function() {
    expect(parse('foo:(bar AND baz)')).toEqual({
      type: 'Query',
      body: {
        type: 'FieldGroup',
        field: 'foo',
        body: {
          type: 'BinaryExpression',
          operator: {
            type: 'LogicalAnd',
            value: 'AND'
          },
          left: {
            type: 'UnquotedTerm',
            field: '*',
            value: 'bar',
          },
          right: {
            type: 'UnquotedTerm',
            field: '*',
            value: 'baz',
          }
        }
      }
    });
  });

  it('identifies fielded binary range terms', function() {
    expect(parse('foo:[bar TO "baz"}')).toEqual({
      type: 'Query',
      body: {
        type: 'BinaryRange',
        field: 'foo',
        left: {
          type: 'RangeTerm',
          operand: {
            type: 'UnquotedTerm',
            value: 'bar',
          },
          operator: 'ge'
        },
        right: {
          type: 'RangeTerm',
          operator: 'lt',
          operand: {
            type: 'QuotedTerm',
            value: 'baz',
          },
        }
      }
    });
  });

  it('identifies fielded unary range terms', function() {
    expect(parse('foo:>=bar')).toEqual({
      type: 'Query',
      body: {
        type: 'UnaryRange',
        field: 'foo',
        operand: {
          type: 'RangeTerm',
          operand: {
            type: 'UnquotedTerm',
            value: 'bar'
          },
          operator: 'ge'
        }
      }
    });
  });

  it('identifies fielded regex terms', function() {
    expect(parse('foo:/bar/')).toEqual({
      type: 'Query',
      body: {
        type: 'RegexTerm',
        field: 'foo',
        value: '/bar/',
      }
    });
  });

  it('identity', function() {
    expect(parse('42')).toEqual({
      type: 'Query',
      body: {
        type: 'UnquotedTerm',
        field: '*',
        value: '42'
      }
    });
  });

  it('processes implicit OR clauses', function() {
    expect(simpleTree(parse('foo bar'))).toEqual({
      left: 'foo',
      right: 'bar',
      operator: 'OR'
    });
  });

  it('processes AND clauses', function() {
    expect(parse('foo AND bar')).toEqual({
      type: 'Query',
      body: {
        type: 'BinaryExpression',
        operator: {
          type: 'LogicalAnd',
          value: 'AND'
        },
        left: {
          type: 'UnquotedTerm',
          field: '*',
          value: 'foo',
        },
        right: {
          type: 'UnquotedTerm',
          field: '*',
          value: 'bar',
        }
      }
    });
  });

  it('processes multiple AND clauses', function() {
    expect(simpleTree(parse('foo AND bar AND baz'))).toEqual({
      operator: 'AND',
      right: {
        operator: 'AND',
        left: 'bar',
        right: 'baz',
      },
      left: 'foo',
    });
  });

  it('processes logical clauses', function() {
    expect(simpleTree(parse('foo AND bar OR baz'))).toEqual({
      operator: 'OR',
      left: {
        operator: 'AND',
        left: 'foo',
        right: 'bar',
      },
      right: 'baz',
    });
  });

  it('processes mixed logical clauses', function() {
    expect(simpleTree(parse('foo AND bar || baz AND biz'))).toEqual({
      operator: '||',
      left: {
        operator: 'AND',
        left: 'foo',
        right: 'bar',
      },
      right: {
        operator: 'AND',
        left: 'baz',
        right: 'biz',
      }
    });
  });

  it('processes parenthesized groups', function() {
    expect(parse('foo AND (bar OR baz) AND field:biz')).toEqual({
      type: 'Query',
      body: {
        type: 'BinaryExpression',
        operator: {
          type: 'LogicalAnd',
          value: 'AND'
        },
        left: {
          type: 'UnquotedTerm',
          field: '*',
          value: 'foo',
        },
        right: {
          type: 'BinaryExpression',
          operator: {
            type: 'LogicalAnd',
            value: 'AND'
          },
          left: {
            type: 'BinaryExpression',
            operator: {
              type: 'LogicalOr',
              implicit: false,
              value: 'OR'
            },
            left: {
              type: 'UnquotedTerm',
              field: '*',
              value: 'bar',
            },
            right: {
              type: 'UnquotedTerm',
              field: '*',
              value: 'baz',
            }
          },
          right: {
            type: 'UnquotedTerm',
            field: 'field',
            value: 'biz'
          },
        },
      }
    });
  });

  it('processes NOT and mixed clauses groups', function() {
    expect(simpleTree(parse('foo AND NOT (bar OR baz) OR buz AND biz'))).toEqual({
      left: {
        left: "foo",
        operator: "AND",
        right: {
          operand: {
            left: "bar",
            operator: "OR",
            right: "baz",
          },
          operator: "NOT",
        },
      },
      operator: "OR",
      right: {
        left: "buz",
        operator: "AND",
        right: "biz",
      },
    });
  });

  it('processes basic NOT clauses', function() {
    expect(simpleTree(parse('NOT foo'))).toEqual({
      operator: 'NOT',
      operand: 'foo',
    });
  });

  it('processes complex and nested groupings (right associative)', function() {
    expect(simpleTree(parse('foo AND (bar OR (baz AND biz)) AND buz byz'))).toEqual({
      left: {
        left: "foo",
        operator: "AND",
        right: {
          left: {
            left: "bar",
            operator: "OR",
            right: {
              left: "baz",
              operator: "AND",
              right: "biz"
            }
          },
          operator: "AND",
          right: "buz"
        }
      },
      operator: "OR",
      right: "byz"
    });
  });
});

const simpleTree = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === 'Query') {
    return simpleTree(node.body);
  }

  if (node.type.startsWith('BinaryRange') || node.left) {
    return {
      left: simpleTree(node.left),
      operator: node.operator.value,
      right: simpleTree(node.right),
    };
  }

  if (node.type === 'UnaryRange') {
    let operator = node.direction === 'gt' ? '>' : '<';
    operator += node.operand.inclusive ? '=' : '';

    return {
      operand: simpleTree(node.operand),
      operator: operator
    };
  }

  if (node.type === 'UnaryExpression') {
    return {
      operand: simpleTree(node.operand),
      operator: node.operator.value
    };
  }

  if (node.body && node.body.value) {
    if (node.type.startsWith("Quoted")) {
      return `"${node.body.value}"`;
    }

    return node.body.value;
  }

  if (node.value) {
    if (node.type.startsWith("Quoted")) {
      return `"${node.value}"`;
    }

    return node.value;
  }

  return node;
};


