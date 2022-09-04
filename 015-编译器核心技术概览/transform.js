const {
  createCallExpression,
  createStringLiteral,
  createArrayExpression,
} = require('./jsExpression');
const { dump } = require('./utils');
/**
 * 批量
 *
 * 执行转换操作
 * @param {Object} ast
 * @param {Object} context
 */
function traverseNode(ast, context) {
  // 设置当前节点的转换信息
  context.currentNode = ast;
  // 回退方法数组
  const exitFns = [];
  const nodeTransforms = context.nodeTransforms;

  for (let i = 0, len = nodeTransforms.length; i < len; i++) {
    const onExit = nodeTransforms[i](context.currentNode, context);
    if (onExit) {
      // 将退出阶段的回调函数加到 exitFns
      exitFns.push(onExit);
    }
    nodeTransforms[i](context.currentNode, context);
    if (!context.currentNode) return;
  }

  const children = context.currentNode.children;
  if (children) {
    for (let i = 0, len = children.length; i < len; i++) {
      // 将当前节点设置为父节点
      context.parent = context.currentNode;
      // 设置索引
      context.childIndex = i;
      // 递归调用时将 context 透传
      traverseNode(children[i], context);
    }
  }
  // 在节点处理的最后阶段执行缓存到 exitFns 中的回调函数， 注意这里要倒序执行
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
/**
 * 转换 ast
 * @param {Object} ast
 */
function transform(ast) {
  // 在 transform 函数内创建 context 对象
  const context = {
    // 当前节点
    currentNode: null,
    // 在父节点 children 中的索引
    childIndex: 0,
    // 父节点
    parent: null,
    // 替换节点
    replaceNode(node) {
      // 将当前所在父节点的子节点位置context.childIndex的节点替换成新的节点
      context.parent.children[context.childIndex] = node;
      // 将当前节点替换为新节点
      context.currentNode = node;
    },
    removeNode() {
      if (context.parent) {
        // 根据当前节点的索引删除当前节点
        context.parent.children.splice(context.childIndex, 1);
        // 将当前节点置空
        context.currentNode = null;
      }
    },
    // 注册 nodeTransforms 函数
    nodeTransforms: [transformElement, transformText, transformRoot],
  };
  // 调用 traverseNode 完成转换
  traverseNode(ast, context);
  dump(ast);
}

function transformElement(node, context) {
  // 自定义内容
  if (node.type === 'Element' && node.tag == 'p') {
    node.tag = 'h1';
  }
  return () => {
    if (node.type !== 'Element') {
      return;
    }
    // 1. 创建 h 函数调用语句
    const callExp = createCallExpression('h', [createStringLiteral(node.tag)]);
    // 2. 处理 h 函数调用的参数
    node.children.length === 1
      ? // 如果只有一个子节点，则直接使用子节点的  jsNode 作为参数
        callExp.arguments.push(node.children[0].jsNode)
      : // 如果有多个子节点，则创建一个 ArrayExpression 节点作为参数
        callExp.arguments.push(
          createArrayExpression(
            // 数组的每个元素都是子节点的 jsNode
            node.children.map((c) => c.jsNode)
          )
        );
    // 3. 将当前表前对应的 JavaScript AST 添加到 jsNode 下
    node.jsNode = callExp;
    console.log('执行transformElement');
  };
}
function transformText(node, context) {
  if (node.type !== 'Text') return;
  // 根据 node.content 创建一个StringLiteral 类型的节点并放在 node.jsNode
  node.jsNode = createStringLiteral(node.content);
}
function transformRoot(node) {
  return () => {
    if (node.type !== 'Root') return;
    const vnodeJSAST = node.children[0].jsNode;
    node.jsNode = {
      type: 'FunctionDecl',
      id: {
        type: 'Identifier',
        name: 'render',
      },
      params: [],
      body: [{ type: 'ReturnStatement', return: vnodeJSAST }],
    };
  };
}
module.exports = transform;
