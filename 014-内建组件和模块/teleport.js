const Teleport = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    // 处理渲染逻辑
    const { patch, patchChildren, move } = internals;
    // 旧节点不存在，子组件逐一挂载
    if (!n1) {
      const target =
        typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to;
      n2.children.forEach((c) => patch(null, c, target, anchor));
    } else {
      // 旧节点存在，更新子组件
      patchChildren(n1, n2, container);
      if (n1.props.to !== n2.props.to) {
        const newTarget =
          typeof n2.props.to === 'string' ? document.querySelector(n2.props.to) : n2.props.to;
        n2.children.forEach((c) => move(c, newTarget));
      }
    }
  },
};
