export enum NodeType {
  QuotedTerm = 'QuotedTerm', // Switch to Phrase
  UnquotedTerm = 'UnquotedTerm',
  RegexTerm = 'RegexTerm',
  BinaryExpression = 'BinaryExpression',
  LogicalAnd = 'LogicalAnd',
  LogicalOr = 'LogicalOr',
  LogicalNot = 'LogicalNot',
  UnaryExpression = 'UnaryExpression',
  UnaryRange = 'UnaryRange',
  BinaryRange = 'BinaryRange',
  FieldGroup = 'FieldGroup',
  RangeTerm = 'RangeTerm',
}

export type Expression = BinaryExpression | UnaryExpression | BinaryRange | UnaryRange | Term;

export type Query = {
  type: 'Query';
  body: Expression;
};

export type LogicalOrValue = 'OR' | '||';
export type LogicalAndValue = 'AND' | '&&';
export type LogicalOrOperator = {
  type: NodeType.LogicalOr;
  value: LogicalOrValue;
  implicit: boolean;
};

export type LogicalAndOperator = {
  type: NodeType.LogicalAnd;
  value: LogicalAndValue;
};

export type LogicalNotOperator = {
  type: NodeType.LogicalNot;
  value: 'NOT';
};

export type BinaryExpression = {
  type: NodeType.BinaryExpression;
  operator: LogicalAndOperator | LogicalOrOperator;
  left: Expression;
  right: Expression;
};

export type UnaryExpression = {
  type: NodeType.UnaryExpression;
  operator: LogicalNotOperator;
  operand: Expression;
};

export type RangeOperator = 'ge' | 'gt' | 'le' | 'lt';

export type Term = UnquotedTerm | Phrase | Regex | FieldGroup;
export type TermAtom = UnquotedTerm | Phrase;

export type Fielded<T> = T & {
  field: boolean;
};

export type UnaryRange = {
  type: NodeType.UnaryRange;
  field: string;
  operand: RangeTerm;
};

export type RangeTerm = RangeLeftTerm | RangeRightTerm;

export type RangeLeftTerm = {
  type: NodeType.RangeTerm;
  operand: Omit<TermAtom, 'field'>;
  operator: RangeOperator;
};

export type RangeRightTerm = {
  type: NodeType.RangeTerm;
  operand: Omit<TermAtom, 'field'>;
  operator: RangeOperator;
};

export type BinaryRange = {
  type: NodeType.BinaryRange;
  field: string;
  left: RangeTerm;
  right: RangeTerm;
};

export type UnquotedTerm = {
  type: NodeType.UnquotedTerm;
  field: string;
  value: unknown;
};

export type Phrase = {
  type: NodeType.QuotedTerm;
  field: string;
  value: unknown;
};

export type Regex = {
  type: NodeType.RegexTerm;
  field: string;
  value: unknown;
};

export type FieldGroup = {
  type: NodeType.FieldGroup;
  field: string;
  body: Expression;
};
