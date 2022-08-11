function createRenderer(options) {
  const { insert, createElement, setElementText } = options;
  function mountElement(vnode, container) {
    const el = createElement(vnode.type);
    // 子节点为string类型，则该节点为文本节点
    if (typeof vnode.children == 'string') {
      setElementText(el, vnode.children);
    }
    insert(el, container);
  }
  function patch(n1, n2, container) {
    if (!n1) {
      mountElement(n2, container);
    } else {
      // n1 旧节点存在，意味着需要打补丁
    }
  }
  function render(vnode, container) {
    // 新节点存在
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      // 新节点不存在，旧节点存在，置空
      if (container._vnode) {
        container.innerHTML = '';
      }
    }
    container._vnode = vnode;
  }
  return { render };
}
