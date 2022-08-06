const { dump } = require('./utils.js');
const parse = require('./parse.js');
const transform = require('./transform.js');
const generate = require('./generate.js');

const ast = parse(`<div><p>Vue</p><p>Template</p></div>`);

dump(ast);
transform(ast);
const code = generate(ast.jsNode);
console.log(code);
const result = `function render() {
  return h('div', [h('h1', 'Vue'), h('h1', 'Template')])
}`;
if (code === result) {
  console.log('success');
} else {
  console.log('error');
}
