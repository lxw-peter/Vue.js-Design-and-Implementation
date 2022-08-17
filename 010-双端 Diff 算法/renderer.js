function createRenderer(options) {
  const { insert, createElement, setElementText, patchProps, createText, setText, createComment } =
    options;
  function render(vnode, container) {
    // 新节点存在
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      // 新节点不存在，旧节点存在，卸载旧节点
      if (container._vnode) {
        // container.innerHTML = '';
        unmount(container._vnode);
      }
    }
    // 将当前节点挂载到 _vnode，也是下一次渲染的旧节点
    container._vnode = vnode;
  }
  function patch(n1, n2, container, anchor) {
    // 新旧节点不一致，卸载旧节点
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
    }
    const { type } = n2;

    if (typeof type === 'string') {
      if (n1) {
        // n1 旧节点存在，意味着需要打补丁
        patchElement(n1, n2);
      } else {
        mountElement(n2, container, anchor);
      }
    } else if (type === Text) {
      if (n1) {
        const el = (n2.el = n1.el);
        if (n2.children !== n1.children) {
          // 更新文本、注释节点
          setText(el, n2.children);
        }
      } else {
        const el = createText(n2.children);
        insert(el, container);
      }
    } else if (type === Comment) {
      if (n1) {
        const el = (n2.el = n1.el);
        if (n2.children !== n1.children) {
          // 更新文本、注释节点
          setText(el, n2.children);
        }
      } else {
        const el = createComment(n2.children);
        insert(el, container);
      }
    } else if (type === Fragment) {
      if (n1) {
        patchChildren(n1, n2, container);
      } else {
        n2.children.forEach((c) => patch(null, c, container));
      }
    }
  }
  function mountElement(vnode, container, anchor) {
    const el = (vnode.el = createElement(vnode.type));
    // 子节点为string类型，则该节点为文本节点
    if (typeof vnode.children == 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      // 渲染子节点
      vnode.children.forEach((child) => {
        patch(null, child, el);
      });
    }
    if (vnode.props) {
      for (const key in vnode.props) {
        if (!Object.hasOwnProperty.call(vnode.props, key)) {
          continue;
        }
        // 解析属性
        patchProps(null, vnode.props[key], key, el);
      }
    }
    insert(el, container, anchor);
  }

  function patchElement(n1, n2) {
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    //  第一步：更新props
    for (const key in newProps) {
      if (!Object.hasOwnProperty.call(newProps, key)) continue;
      if (newProps[key] !== oldProps[key]) {
        patchProps(oldProps[key], newProps[key], key, el);
      }
    }
    for (const key in oldProps) {
      if (!Object.hasOwnProperty.call(oldProps, key)) continue;
      if (!key in newProps) {
        patchProps(oldProps[key], null, key, el);
      }
    }
    // 第二步：更新子节点
    patchChildren(n1, n2, el);
  }
  function patchChildren(n1, n2, container) {
    // 新节点类型：字符串，数组，null
    // 旧节点类型：字符串，数组，null
    if (typeof n2.children === 'string') {
      // 当旧节点为数组类型时，逐个卸载子节点
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      }
      setElementText(container, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        // 新旧子节点 diff，这里先暴力卸载，再逐个加载新节点
        // n1.children.forEach((c) => unmount(c));
        // n2.children.forEach((c) => patch(null, c, container));
        diffArrayChildren(n1, n2, container);
      } else {
        // 无论旧节点是字符类型还是null，都需要先清空容器，然后将新的一组节点逐个挂载
        setElementText(container, '');
        n2.children.forEach((c) => patch(null, c, container));
      }
    } else {
      // 当前表示新节点不存在
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === 'string') {
        setElementText(container, '');
      }
    }
  }
  function unmount(vnode) {
    // 如果卸载的节点类型是 fragment，则需要卸载其children
    if (vnode.type === Fragment) {
      vnode.children.forEach((c) => unmount(c));
      return;
    }
    // 获取 el 的父元素
    const parent = vnode.el.parentNode;
    if (parent) {
      console.log(`从父元素${parent.tagName.toLowerCase()}卸载${vnode.el.tagName.toLowerCase()}`);
      parent.removeChild(vnode.el);
    }
  }
  function diffArrayChildren(n1, n2, container) {
    // 1. 在新旧节点的四个端点之间分别进行比较，并试图找到可复用的节点
    // 2. 新节点包含旧节点不存在的子节点，需要新增；旧节点的某些子节点不存在于新节点，则需要卸载这些子节点；
    // 3. 新旧节点的同一子节点的子节点不一样，则需要修改操作
    // 4. 新旧节点的同一子节点位置不同，则需要移动位置
    // 5. 通过节点绑定的 key 值提高 DOM 复用，和减少 DOM 操作
    const oldChildren = n1.children;
    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];

    const newChildren = n2.children;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (!oldEndVNode) {
        oldEndVNode = oldChildren[--oldEndIdx];
      } else if (oldStartVNode.key === newStartVNode.key) {
        patch(oldStartVNode, newStartVNode, container);
        oldStartVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        patch(oldStartVNode, newEndVNode, container);
        // 将旧的第一个节点移动到最后
        insert(oldStartVNode.el, container);
        oldStartVNode = oldChildren[++oldStartIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        // 打补丁
        patch(oldEndVNode, newStartVNode, container);
        // 将旧的最后一个节点移动到旧的第一个节点前
        insert(oldEndVNode.el, container, oldStartVNode.el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        patch(oldEndVNode, newEndVNode, container);
        oldEndVNode = oldChildren[--oldEndIdx];
        newEndVNode = newChildren[--newEndIdx];
      } else {
        const idxInOld = oldChildren.findIndex((node) => node.key === newStartVNode.key);
        if (idxInOld > 0) {
          patch(oldChildren[idxInOld], newStartVNode, container);
          // 将找到的旧节点移动到第一个旧节点前
          insert(oldChildren[idxInOld].el, container, oldStartVNode);
          // 该位置节点已经移动，设为 undefined
          oldChildren[idxInOld] = undefined;
        } else {
          // 找不到说明该节点是新增的，将 newStartVNode作为新节点挂载到头部，并将旧节点头部作为锚点
          patch(null, newStartVNode, container, oldStartVNode.el);
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }

    // 判断新增还是卸载
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      // 如果满足条件，说明有新节点未挂载
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        // 将旧节点头部作为锚点
        patch(null, newChildren[i], container, oldStartVNode.el);
      }
    } else if (newEndIdx <= newStartIdx && oldStartIdx <= oldEndIdx) {
      // 卸载多余的旧节点
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
      }
    }
  }
  return { render };
}

function shouldSetAsProps(el, key) {
  // 特殊处理， input 元素的 form 属性是只读的，只能用setAttribute
  if (key === 'form' && el.tagName === 'INPUT') return false;
  return key in el;
}

// class ,style 也可以用该方法序列化
function normalizeProp(params, type = 'class') {
  let delimiter = type === 'style' ? ';' : ' ';
  if (typeof params === 'string') {
    return params;
  } else if (Array.isArray(params)) {
    return params.reduce((last, cur) => {
      return last ? last + delimiter + normalizeProp(cur) : normalizeProp(cur);
    }, '');
  } else if (getType(params) === 'Object') {
    let result = '';
    for (const key in params) {
      if (!Object.hasOwnProperty.call(params, key)) continue;
      if (params[key]) {
        result = result ? result + delimiter + key : key;
      }
    }
    return result;
  }
  return '';
}

/** 获取数据类型 */
function getType(params) {
  return Object.prototype.toString.call(params).slice(8, -1);
}
