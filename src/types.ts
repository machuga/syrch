export enum TokenType {
  LogicalAnd = "LogicalAnd",
  LogicalOr = "LogicalOr",
  LogicalNot = "LogicalNot",
  Identifier = "Identifier",
  QuotedString = "QuotedString",
  FieldSeparator = "FieldSeparator",
  PrefixOperator = "PrefixOperator",
  Tilde = "Tilde",
  Regex = "Regex",
  Whitespace = "Whitespace",
  GroupOpen = "GroupOpen",
  GroupClose = "GroupClose",
  RangeOpen = "RangeOpen",
  RangeClose = "RangeClose",
  RangeTo = "RangeTo",
  RelationalOperator = "RelationalOperator",
}

export type LocationInfo = number;

export type Tokenizer = {
  isEOF(): boolean;
  location(): LocationInfo;
  next(): Token;
}

export type Expression = BinaryExpression | UnaryExpression | BinaryRange | UnaryRange | Term;

export type Operator = TokenType.LogicalAnd | TokenType.LogicalOr;

export type RelationalOperator = '>=' | '>' | '<' | '<=';

export type Query = {
  type: 'Query';
  body: Expression;
};

export type LogicalOrOperator = {
  type: 'LogicalOr';
  value: 'OR' | '||';
  implicit: boolean;
};

export type LogicalAndOperator = {
  type: 'LogicalAnd';
  value: 'AND' | '&&';
};

export type LogicalNotOperator = {
  type: 'LogicalNot';
  value: 'NOT';
};

export type BinaryExpression = {
  type: 'BinaryExpression';
  operator: TokenType.LogicalAnd | TokenType.LogicalOr;
  left: Expression;
  right: Expression;
}

export type UnaryExpression = {
  type: 'UnaryExpression';
  operator: TokenType.LogicalNot;
  operand: Expression;
}

export type Term = UnquotedTerm | Phrase | Regex | FieldGroup;
export type TermAtom = UnquotedTerm | Phrase;

export type RangeTerm = {
  type: 'RangeTerm';
  value: unknown;
  quoted: boolean;
  inclusive: boolean
};

export type Fielded<T> = T & {
  field: boolean
}

export type UnaryRange = {
  type: 'UnaryRange';
  field: string;
  operand: RangeTerm;
  direction: 'gt' | 'lt';
}

export type BinaryRange = {
  type: 'BinaryRange';
  field: string;
  left: RangeTerm;
  right: RangeTerm;
}

export type UnquotedTerm = {
  type: 'UnquotedTerm';
  field: string;
  value: unknown;
};

export type Phrase = {
  type: 'QuotedTerm';
  field: string;
  value: unknown;
};

export type Regex = {
  type: 'RegexTerm';
  field: string;
  value: unknown;
};

export type FieldGroup = {
  type: 'FieldGroup';
  field: string;
  body: Expression;
};

export type Token = {
  type: TokenType;
  value: string;
}
