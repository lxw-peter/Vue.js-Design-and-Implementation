const parse = require('./parse');
const transform = require('./transform');
const generate = require('./generate');

function compile(template) {
  const ast = parse(template);
  transform(ast);
  const code = generate(ast.jsNode);
  return code;
}
