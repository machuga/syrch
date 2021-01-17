import { TokenType, Token, Tokenizer } from './types';

const reservedChars = ['.', '?', '+', '*', '|', '{', '}', '[', ']', '(', ')', '"', '\\', '#', '@', '&', '<', '>', '~', ':'];
const reservedCharsForRegex = '.?+*|{}[\]()"\\#@&<>~:';
const rules : [RegExp, TokenType][] = [
  //[/^\d+/, TokenType.Number],
  [/^\s+/, TokenType.Whitespace],
  [/^"[^"]*"/, TokenType.QuotedString],
  [/^'[^']*'/, TokenType.QuotedString],
  [/^\/[^\/]*\//, TokenType.Regex],
  [/^(AND|&&)/, TokenType.LogicalAnd],
  [/^(OR|\|\|)/, TokenType.LogicalOr],
  [/^(NOT|!)/, TokenType.LogicalNot],
  [/^[+\-!]/, TokenType.PrefixOperator],
  [/^:/, TokenType.FieldSeparator],
  [/^~/, TokenType.Tilde],
  [/^\(/, TokenType.GroupOpen],
  [/^\)/, TokenType.GroupClose],
  [/^(\[|\{)/, TokenType.RangeOpen],
  [/^(\]|\})/, TokenType.RangeClose],
  [/^TO/, TokenType.RangeTo],
  [/^(>|<)=?/, TokenType.RelationalOperator],
  [/^(.[^.?+*|{}[\]()"\\#@&<>~:\s]+)/, TokenType.Identifier], // does not handle escaped tokens
]

export const createTokenizer = (input : string) : Tokenizer => {
  const inputLength = input.length;
  let cursor = 0;

  const location = () => cursor;
  const isEOF = () => cursor >= inputLength;
  const match = (regex : RegExp, str: string) => {
    const [result = null] = regex.exec(str) || [];

    if (result === null) {
      return null;
    }

    cursor = cursor + result.length;

    return result;
  };

  const next = () : Token | null => {
    if (isEOF()) {
      return null;
    }

    const str = input.slice(cursor);

    for (const [regex, tokenType] of rules) {
      const value = match(regex, str);

      if (value !== null) {
        if (tokenType === null || tokenType === TokenType.Whitespace) {
          return next();
        }

        return {
          type: tokenType,
          value,
        };
      }
    }

    throw new Error(`Unexpected token "${cursor}" at location "${location()}"`);
  };

  return { isEOF, location, next };
};
