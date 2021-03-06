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


export type Operator = TokenType.LogicalAnd | TokenType.LogicalOr;

export type RelationalOperator = '>=' | '>' | '<' | '<=';

export type Token = {
  type: TokenType;
  value: string;
}
