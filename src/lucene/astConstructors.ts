import {
  NodeType,
  Query,
  LogicalAndOperator,
  LogicalNotOperator,
  LogicalOrOperator,
  UnaryExpression,
  BinaryExpression,
  FieldGroup,
  Phrase,
  Expression,
  Regex,
  UnquotedTerm,
  RangeLeftTerm,
  RangeRightTerm,
  RangeTerm,
  BinaryRange,
  UnaryRange,
  RangeOperator,
  TermAtom,
} from './parserTypes';

const implicit = '*';

export const createQuery = (body: Expression): Query => ({
  type: 'Query',
  body,
});

export const createLogicalOrOperator = (value: '||' | 'OR', implicit = false): LogicalOrOperator => ({
  type: NodeType.LogicalOr,
  value,
  implicit,
});

export const createLogicalAndOperator = (value: 'AND' | '&&'): LogicalAndOperator => ({
  type: NodeType.LogicalAnd,
  value,
});

export const createLogicalNotOperator = (): LogicalNotOperator => ({
  type: NodeType.LogicalNot,
  value: 'NOT',
});

export const createBinaryExpression = (
  left: Expression,
  right: Expression,
  operator: LogicalAndOperator | LogicalOrOperator,
): BinaryExpression => ({
  type: NodeType.BinaryExpression,
  operator,
  left,
  right,
});

export const createUnaryExpression = (operand: Expression, operator: LogicalNotOperator): UnaryExpression => ({
  type: NodeType.UnaryExpression,
  operator,
  operand,
});

export const createTerm = (value: string, field = implicit): UnquotedTerm => ({
  type: NodeType.UnquotedTerm,
  field,
  value,
});

export const createPhrase = (value: string, field = implicit): Phrase => ({
  type: NodeType.QuotedTerm,
  field,
  value,
});

export const createRegex = (value: string, field: string = implicit): Regex => ({
  type: NodeType.RegexTerm,
  field,
  value,
});

export const createUnaryRange = (operand: RangeTerm, field: string = implicit): UnaryRange => ({
  type: NodeType.UnaryRange,
  field,
  operand,
});

export const createBinaryRange = (
  left: RangeLeftTerm,
  right: RangeRightTerm,
  field: string = implicit,
): BinaryRange => ({
  type: NodeType.BinaryRange,
  field,
  left,
  right,
});

export const createRangeTerm = (operand: TermAtom, operator: RangeOperator): RangeTerm => {
  delete operand.field;

  return {
    type: NodeType.RangeTerm,
    operand,
    operator,
  };
};

export const createFieldGroup = (body: Expression, field: string): FieldGroup => ({
  type: NodeType.FieldGroup,
  field,
  body,
});
