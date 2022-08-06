function dump(node, indent = 0) {
  const type = node.type;
  const desc = type === 'Root' ? '' : type === 'Element' ? node.tag : node.content;
  // 打印节点信息和类型
  console.log(`${'-'.repeat(indent)}${type}: ${desc}`);
  if (node.children) {
    node.children.forEach((n) => dump(n, indent + 2));
  }
}
module.exports = { dump };
