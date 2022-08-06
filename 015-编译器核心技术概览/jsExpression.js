// 使用对象描述 JavaScript 节点

// 字符串
const createStringLiteral = (value) => {
  return { type: 'StringLiteral', value };
};

// 数组
const createArrayExpression = (elements) => {
  return {
    type: 'ArrayExpression',
    elements,
  };
};

const createIdentifier = (name) => {
  return {
    type: 'Identifier',
    name,
  };
};

// 回调
const createCallExpression = (callee, arguments) => {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments,
  };
};

module.exports = {
  createStringLiteral,
  createArrayExpression,
  createIdentifier,
  createCallExpression,
};
