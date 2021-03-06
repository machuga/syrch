import { createTokenizer } from './tokenizer';
import { Tokenizer, TokenType, Token, RelationalOperator } from './tokenizerTypes';
import {
  RangeOperator,
  Query,
  Phrase,
  Expression,
  Regex,
  UnquotedTerm,
  LogicalOrValue,
  LogicalAndValue,
  BinaryRange,
  UnaryRange,
  TermAtom,
} from './parserTypes';

import {
  createUnaryExpression,
  createQuery,
  createRegex,
  createPhrase,
  createTerm,
  createFieldGroup,
  createBinaryRange,
  createUnaryRange,
  createRangeTerm,
  createBinaryExpression,
  createLogicalAndOperator,
  createLogicalNotOperator,
  createLogicalOrOperator,
} from './astConstructors';

const implicit = '*';

export const parseFromTokenizer = (tokenizer: Tokenizer): Query => {
  let lookahead = tokenizer.next();

  const getLookahead = (): Token | undefined => lookahead;

  const consume = (expectedToken: TokenType) => {
    if (lookahead === null) {
      throw new Error(`Unexpected end of input; expected: ${expectedToken}`);
    }

    if (lookahead.type !== expectedToken) {
      throw new Error(
        `Unexpected token at location "${tokenizer.location()}"; expected: "${expectedToken}", actual: "${
          lookahead.type
        }"`,
      );
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

    return token; //{ ...token, parenthesized: true };
  };

  const orClause = () => {
    let left: any = andClause();

    while (lookahead && lookahead.type !== TokenType.GroupClose) {
      let operator = createLogicalOrOperator('OR', true);

      if (lookahead.type === TokenType.LogicalOr) {
        operator = createLogicalOrOperator(<LogicalOrValue>consume(TokenType.LogicalOr).value);
      }

      const right = andClause();

      left = createBinaryExpression(left, right, operator);
    }

    return left;
  };

  const andClause = () => {
    let left = notClause();

    while (lookahead && lookahead.type === TokenType.LogicalAnd) {
      const operator = createLogicalAndOperator(<LogicalAndValue>consume(TokenType.LogicalAnd).value);
      const right = andClause();

      left = createBinaryExpression(left, right, operator);
    }

    return left;
  };

  const notClause = () => {
    if (lookahead && lookahead.type === TokenType.LogicalNot) {
      consume(TokenType.LogicalNot); // throwaway for now
      const operand = basicExpression();

      return createUnaryExpression(operand, createLogicalNotOperator());
    }

    if (lookahead && lookahead.type === TokenType.GroupOpen) {
      return parenExpr();
    }

    return expr();
  };

  //const unaryExpression = (type) => { };
  const binaryRangeTerm = (field): BinaryRange => {
    const openToken = consume(TokenType.RangeOpen);
    const left: TermAtom = termInRange();
    consume(TokenType.RangeTo);
    const right: TermAtom = termInRange();
    const closeToken = consume(TokenType.RangeClose);

    return createBinaryRange(
      createRangeTerm(left, openToken.value === '[' ? 'ge' : 'gt'),
      createRangeTerm(right, closeToken.value === ']' ? 'le' : 'lt'),
      field,
    );
  };

  const relationalOperatorMap = new Map<RelationalOperator, RangeOperator>([
    ['>', 'gt'],
    ['>=', 'ge'],
    ['<', 'lt'],
    ['<=', 'le'],
  ]);

  const unaryRangeTerm = (field): UnaryRange => {
    const { value } = consume(TokenType.RelationalOperator);

    return createUnaryRange(
      createRangeTerm(termInRange(), relationalOperatorMap.get(<RelationalOperator>value)),
      field,
    );
  };

  const termInRange = (): TermAtom => {
    const term: TermAtom = termExpr();

    if (lookahead && lookahead.type === TokenType.FieldSeparator) {
      throw new Error('Fielded term detected inside of range');
    }

    return term;
  };

  const termExpr = (): TermAtom => {
    switch (lookahead.type) {
      case TokenType.QuotedString:
        return quotedTerm();
      case TokenType.Identifier:
        return unquotedTerm();
    }
  };

  const expr = (): Expression => {
    const token = consume(TokenType.Identifier);
    const field = <string>token.value;

    if (lookahead && lookahead.type === TokenType.FieldSeparator) {
      consume(TokenType.FieldSeparator);

      if (!lookahead) {
        throw new Error('Fielded term detected, but no term provided');
      }

      switch (getLookahead().type) {
        case TokenType.RangeOpen:
          return binaryRangeTerm(field);
        case TokenType.RelationalOperator:
          return unaryRangeTerm(field);
        case TokenType.Regex:
          return regexTerm(field);
        case TokenType.QuotedString:
          return quotedTerm(field);
        case TokenType.Identifier:
          return unquotedTerm(field);
        case TokenType.GroupOpen:
          return createFieldGroup(parenExpr(), field);
      }
    }

    return TokenType.QuotedString === token.type ? createPhrase(token.value) : createTerm(token.value);
  };

  const regexTerm = (field = implicit): Regex => {
    const token = consume(TokenType.Regex);

    return createRegex(token.value, field);
  };

  const unquotedTerm = (field = undefined): UnquotedTerm => {
    const token = consume(TokenType.Identifier);

    return createTerm(token.value, field);
  };

  const quotedTerm = (field = undefined): Phrase => {
    const token = consume(TokenType.QuotedString);

    return createPhrase(token.value.slice(1, -1), field);
  };

  const query = (): Query => createQuery(expression());

  return query();
};

export const parse = (input: string): Query => {
  const tokenizer = createTokenizer(input);

  return parseFromTokenizer(tokenizer);
};
