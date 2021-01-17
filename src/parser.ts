import { createTokenizer } from './tokenizer';
import { Query, Phrase, Expression, Term, Token, Regex, TokenType, UnquotedTerm, BinaryRange, UnaryRange, TermAtom, RangeTerm, Tokenizer } from './types';

const implicit = '*';

export const parseFromTokenizer = (tokenizer : Tokenizer) : Query => {
  let lookahead = tokenizer.next();

  const getLookahead = () : Token | undefined => lookahead;

  const consume = (expectedToken : TokenType) => {
    if (lookahead === null) {
      throw new Error(`Unexpected end of input; expected: ${expectedToken}`);
    }

    if (lookahead.type !== expectedToken) {
      throw new Error(`Unexpected token at location "${tokenizer.location()}"; expected: "${expectedToken}", actual: "${lookahead.type}"`);
    }

    const token = lookahead;

    lookahead = tokenizer.next();

    return token;
  };

  const basicExpression = () => {
    if (lookahead && lookahead.type === TokenType.GroupOpen) {
      return parenExpr();
    }

    return orClause();
  };

  // This logic may be in wrong spot
  const expression = () => {
    return basicExpression();
  };

  const parenExpr = () => {
    consume(TokenType.GroupOpen);
    const token = basicExpression();
    consume(TokenType.GroupClose);

    return token;//{ ...token, parenthesized: true };
  };

  const orClause = () => {
    let left : any = andClause();

    while (lookahead && lookahead.type !== TokenType.GroupClose) {
      let operator = { type: 'LogicalOr', value: 'OR', implicit: true };

      if (lookahead.type === TokenType.LogicalOr) {
        operator = { ...consume(TokenType.LogicalOr), implicit: false };
      }

      const right = andClause();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const andClause = () => {
    let left = notClause();

    while (lookahead && lookahead.type === TokenType.LogicalAnd) {
      const operator = consume(TokenType.LogicalAnd);
      const right = andClause();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      };
    }

    return left;
  }

  const notClause = () => {
    if (lookahead && lookahead.type === TokenType.LogicalNot) {
      const operator = consume(TokenType.LogicalNot);
      const operand = basicExpression();

      return {
        type: "UnaryExpression",
        operator,
        operand,
      }
    }

    if (lookahead && lookahead.type === TokenType.GroupOpen) {
      return parenExpr();
    }

    return expr();

  }

  //const unaryExpression = (type) => { };
  const binaryRangeTerm = (field) : BinaryRange => {
    const openToken = consume(TokenType.RangeOpen);
    const left = rangeTerm();
    consume(TokenType.RangeTo);
    const right = rangeTerm();
    const closeToken = consume(TokenType.RangeClose);

    return {
      type: 'BinaryRange',
      field,
      left: { ...left, inclusive: openToken.value === '[' },
      right: { ...right, inclusive: closeToken.value === ']' },
    };
  };

  const unaryRangeTerm = (field) : UnaryRange => {
    const { value: operator } = consume(TokenType.RelationalOperator);
    // Need to parse for unquotedTerm

    return {
      type: 'UnaryRange',
      field,
      operand: {...rangeTerm(), inclusive: operator.length > 1 },
      direction: operator.startsWith('>') ? 'gt' : 'lt',
    };
  };

  const rangeTerm = () : Omit<RangeTerm, 'inclusive'> => {
    const term : TermAtom = termExpr();

    if (lookahead && lookahead.type === TokenType.FieldSeparator) {
      throw new Error('Fielded term detected inside of range');
    }

    return {
      type: 'RangeTerm',
      quoted: term.type === 'QuotedTerm',
      value: term.value
    };
  }

  const termExpr = (field = undefined) : TermAtom => {
    switch(lookahead.type) {
      case TokenType.QuotedString: return quotedTerm();
      case TokenType.Identifier: return unquotedTerm();
    }
  };

  const expr = () : Expression => {
    const token = consume(TokenType.Identifier);
    const field = <string>token.value;

    if (lookahead && lookahead.type === TokenType.FieldSeparator) {
      consume(TokenType.FieldSeparator);

      if (!lookahead) {
        throw new Error('Fielded term detected, but no term provided');
      }

      switch(getLookahead().type) {
        case TokenType.RangeOpen: return binaryRangeTerm(field);
        case TokenType.RelationalOperator: return unaryRangeTerm(field);
        case TokenType.Regex: return regexTerm(field);
        case TokenType.QuotedString: return quotedTerm(field);
        case TokenType.Identifier: return unquotedTerm(field);
        case TokenType.GroupOpen: return { type: 'FieldGroup', field, body: parenExpr() };
      }
    }

    return {
      type: TokenType.QuotedString === token.type ? 'QuotedTerm' : 'UnquotedTerm',
      field: implicit,
      value: token.value
    }
  };

  const regexTerm = (field = implicit) : Regex => {
    const token = consume(TokenType.Regex);

    return {
      type: 'RegexTerm',
      field,
      value: token.value
    }
  };
  const unquotedTerm = (field = undefined) : UnquotedTerm => {
    const token = consume(TokenType.Identifier);

    return {
      type: 'UnquotedTerm',
      field,
      value: token.value
    }
  };

  const quotedTerm = (field = undefined) : Phrase => {
    const token = consume(TokenType.QuotedString);

    return {
      type: 'QuotedTerm',
      field,
      value: token.value.slice(1, -1)
    }
  };

  const query = () : Query => {
    return {
      type: 'Query',
      body: expression()
    }
  };

  return query();
}

export const parse = (input : string) => {
  const tokenizer = createTokenizer(input);

  return parseFromTokenizer(tokenizer);
};

