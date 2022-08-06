function generate(node) {
  const context = {
    // 存储最终生成的渲染函数代码
    code: '',
    // 拼接代码
    push(code) {
      context.code += code;
    },
    currentIndent: '',
    newline() {
      context.code += '\n' + `  `.repeat(context.currentIndent);
    },
    // 用来缩进，
    indent() {
      context.currentIndent++;
      context.newline();
    },
    deIndent() {
      context.currentIndent--;
      context.newline();
    },
  };
  // 调用 genNode 函数完成代码生成的工作
  genNode(node, context);
  return context.code;
}

function genNode(node, context) {
  switch (node.type) {
    case 'FunctionDecl':
      genFunctionDecl(node, context);
      break;
    case 'ReturnStatement':
      genReturnStatement(node, context);
      break;
    case 'CallExpression':
      genCallExpression(node, context);
      break;
    case 'StringLiteral':
      genStringLiteral(node, context);
      break;
    case 'ArrayExpression':
      genArrayExpression(node, context);
      break;
  }
}

function genFunctionDecl(node, context) {
  // 从 context 对象中取出工具函数
  const { push, indent, deIndent } = context;
  // 方法名
  push(`function ${node.id.name}`);
  push(`(`);
  // 参数
  genNodeList(node.params, context);
  push(`) `);
  push(`{`);
  indent();
  // 方法体
  node.body.forEach((n) => genNode(n, context));
  deIndent();
  push(`}`);
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    genNode(node, context);
    if (i < nodes.length - 1) {
      push(', ');
    }
  }
}
function genStringLiteral(node, context) {
  const { push } = context;
  push(`'${node.value}'`);
}
function genArrayExpression(node, context) {
  const { push } = context;
  push('[');
  genNodeList(node.elements, context);
  push(']');
}

function genReturnStatement(node, context) {
  const { push } = context;
  push('return ');
  genNode(node.return, context);
}

function genCallExpression(node, context) {
  const { push } = context;
  const { callee, arguments: args } = node;
  push(`${callee.name}(`);
  genNodeList(args, context);
  push(`)`);
}

module.exports = generate;
