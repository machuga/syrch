import { createTokenizer } from '../tokenizer';

describe('The tokenizer/lexer', function() {
  describe('iterating over tokens', function() {
    it('detects fielded terms', function() {
      const tokenizer = createTokenizer('foo:bar');
      expect(tokenizer.next()).toEqual({
        type: 'Identifier',
        value: 'foo'
      });
      expect(tokenizer.next()).toEqual({
        type: 'FieldSeparator',
        value: ':'
      });
      expect(tokenizer.next()).toEqual({
        type: 'Identifier',
        value: 'bar'
      });
    });

    it.only('detects fielded binary ranges', function() {
      const tokenizer = createTokenizer('foo:[bar TO "baz"}');
      expect(tokenizer.next()).toEqual({
        type: 'Identifier',
        value: 'foo'
      });
      expect(tokenizer.next()).toEqual({
        type: 'FieldSeparator',
        value: ':'
      });
      expect(tokenizer.next()).toEqual({
        type: 'RangeOpen',
        value: '['
      });
      expect(tokenizer.next()).toEqual({
        type: 'Identifier',
        value: 'bar'
      });
      expect(tokenizer.next()).toEqual({
        type: 'RangeTo',
        value: 'TO'
      });
      expect(tokenizer.next()).toEqual({
        type: 'QuotedString',
        value: '"baz"'
      });
      expect(tokenizer.next()).toEqual({
        type: 'RangeClose',
        value: '}'
      });
    });

    it('detects fielded phrases', function() {
      const tokenizer = createTokenizer('foo:"bar"');
      expect(tokenizer.next()).toEqual({
        type: 'Identifier',
        value: 'foo'
      });
      expect(tokenizer.next()).toEqual({
        type: 'FieldSeparator',
        value: ':'
      });
      expect(tokenizer.next()).toEqual({
        type: 'QuotedString',
        value: '"bar"'
      });
    });
  });

  it('identifies numbers as identifiers', function() {
    const tokenizer = createTokenizer('42');

    expect(tokenizer.next()).toEqual({
      type: 'Identifier',
      value: '42'
    });
  });

  it('finds field separators', function() {
    const tokenizer = createTokenizer(':');

    expect(tokenizer.next()).toEqual({
      type: 'FieldSeparator',
      value: ':'
    });
  });

  describe('Logical Operators', function() {
    it('identifies word form logical operators', function() {
      const tokenizer = createTokenizer('AND');

      expect(tokenizer.next()).toEqual({
        type: 'LogicalAnd',
        value: 'AND'
      });
    });

    it('identifies symbol form logical operators', function() {
      const tokenizer = createTokenizer('||');

      expect(tokenizer.next()).toEqual({
        type: 'LogicalOr',
        value: '||'
      });
    });
  });

  it('identifies quoted strings', function() {
    const tokenizer = createTokenizer('"foobar"');

    expect(tokenizer.next()).toEqual({
      type: 'QuotedString',
      value: '"foobar"'
    });
  });

  it('identifies prefix operators', function() {
    const tokenizer = createTokenizer('+');

    expect(tokenizer.next()).toEqual({
      type: 'PrefixOperator',
      value: '+'
    });
  });

  it('finds identifiers', function() {
    const tokenizer = createTokenizer('foo42');

    expect(tokenizer.next()).toEqual({
      type: 'Identifier',
      value: 'foo42'
    });
  });

  it('identifies fuzzy/proximity operator', function() {
    const tokenizer = createTokenizer('~');

    expect(tokenizer.next()).toEqual({
      type: 'Tilde',
      value: '~'
    });
  });
});
