const tokenize = require('./tokenize');

function parse(str) {
  const tokens = tokenize(str);
  // 创建根节点
  const root = {
    type: 'Root',
    children: [],
  };
  // 栈
  const elementStack = [root];

  while (tokens.length) {
    // 将栈顶元素作为父节点
    const parent = elementStack[elementStack.length - 1];
    const t = tokens[0];
    switch (t.type) {
      case 'tag':
        // 创建 Element 类型的 AST 节点
        const ElementNode = { type: 'Element', tag: t.name, children: [] };
        // push 到父节点的 children 里
        parent.children.push(ElementNode);
        // 入栈
        elementStack.push(ElementNode);
        break;
      case 'text':
        // 创建文本节点
        const textNode = { type: 'Text', content: t.content };
        // push 到父节点的 children 里
        parent.children.push(textNode);
        break;
      case 'tagEnd':
        // 遇到结束标签，将栈顶节点弹出
        elementStack.pop();
        break;
    }
    tokens.shift();
  }
  return root;
}
module.exports = parse;
