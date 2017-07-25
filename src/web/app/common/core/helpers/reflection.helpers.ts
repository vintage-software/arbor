const instrumentationRegex = /\+\+cov_[a-z0-9.$_]+\['?[0-9]+'?\];/ig;

export function getThisPropertyName(expression: () => any): string {
  const thisExpressionRegEx = /^\s*function\s*\(\)\s*{\s*(?:"use strict";)?\s*return\s+[a-z_]+.((?:(?:[a-z]+))+);?\s*}\s*$/i;

  let funcStr = expression.toString().replace(/\n/g, ' ');

  if (typeof (describe) === 'function' && typeof (it) === 'function') {
    funcStr = funcStr.replace(instrumentationRegex, '');
  }

  const funcStrMatch = funcStr.match(thisExpressionRegEx);

  if (!funcStrMatch) {
    throw new Error(`'${funcStr}' is not a valid this expression.`);
  }

  return funcStrMatch[1];
}
