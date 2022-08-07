function isEnd(context, ancestors) {
  // 当模板内容解析完毕后，停止
  if (!context.source) {
    return true;
  }
  // 与父级节点栈内所有节点作比较
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (context.source.startsWith(`</${ancestors[i].tag}>`)) {
      // 只要栈中存在与当前结束标签同名的节点，停止状态机
      return true;
    }
  }
  return false;
}

// TODO 实体类字符处理遗留
function decodeHtml(rawText, asAttr = false) {
  return rawText;
}

module.exports = { isEnd, decodeHtml };
