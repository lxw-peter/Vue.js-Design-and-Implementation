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
      console.log(`从父元素${parent.tagName.toLowerCase()}
        卸载${vnode.el.tagName.toLowerCase()}`);
      parent.removeChild(vnode.el);
    }
  }
  function diffArrayChildren(n1, n2, container) {
    /* 
     主要逻辑： 借鉴文本diff算法，预处理前置节点和后置节点，预处理后剩余的部分节点通过最长递增子序列辅助完成DOM移动
     难点：
     1. 判断是否为新增节点
     2. 判断是否需要卸载旧节点
     3. 判断是否为新增节点
     4. 判断是否需要移动
     5. 如何移动
     6. 最长递增子序列算术实现
    */

    const oldChildren = n1.children;
    const newChildren = n2.children;

    let j = 0; // 指向节点开头

    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    // 处理前置节点，直到前置节点 key 值不等
    while (oldVNode.key === newVNode.key) {
      // 调用patch 更新
      patch(oldVNode, newVNode, container);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }

    // 处理后置节点
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;

    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    // 直到后置节点 key 值不等
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container);
      oldEnd--;
      newEnd--;
      oldVNode = oldChildren[oldEnd];
      newVNode = newChildren[newEnd];
    }

    // 预处理完毕， 满足以下条件，则说明 j-->newEnd 之间的节点为新节点
    if (j > oldEnd && j <= newEnd) {
      // 锚点的索引
      const anchorIndex = newEnd + 1;
      // 锚点元素
      const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
      // 采用while循环，调用 patch 函数逐个挂载新节点
      while (j <= newEnd) {
        patch(null, newChildren[j++], container, anchor);
      }
    } else if (j > newEnd && j <= oldEnd) {
      // 当前区间的旧节点需要卸载
      while (j <= oldEnd) {
        unmount(oldChildren[j++]);
      }
    } else {
      //  构造 source 数组，个数为剩余未处理节点的数量
      const count = newEnd - j + 1;
      const source = new Array(count);
      source.fill(-1);

      // oldStart 和 newStart 分别为起始索引，即 j
      const oldStart = j;
      const newStart = j;

      // 遍历旧的一组子节点，双重循环复杂度 O(n)
      /* for (let i = oldStart; i <= oldEnd; i++) {
        const oldVNode = oldChildren[i];
        // 遍历新的一组子节点
        for (let k = newStart; k <= newEnd; k++) {
          const newVNode = newChildren[k];
          //  找到相同 key 值的可复用节点
          if (oldVNode.key === newVNode.key) {
            //  更新节点
            patch(oldVNode, newVNode, container);
            // 填充 source 数组
            source[k - newStart] = i;
          }
        }
      } */
      // 构建索引表
      const keyIndex = {};
      // 是否需要移动
      let moved = false;
      // 遍历旧节点过程中遇到的最大索引值
      let pos = 0;
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i;
      }
      // 更新过的节点数量
      let patched = 0;
      // 遍历旧的一组子节点中剩余未处理的节点
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i];
        // 如果更新过的节点数量小于等于需要更新的节点数量，执行更新
        if (patched <= count) {
          // 通过索引表快速找到新的一组子节点具有相同 key 值得节点位置
          const k = keyIndex[oldVNode.key];
          if (typeof k !== 'undefined') {
            newVNode = newChildren[k];
            patch(oldVNode, newVNode, container);
            // 每更新一个节点 patched 自增1
            patched++;
            source[k - newStart] = i;
            // 判断节点是否需要移动
            if (k < pos) {
              moved = true;
            } else {
              pos = k;
            }
          } else {
            unmount(oldVNode);
          }
        } else {
          // 更新过的节点数量大于需要更新的节点数量，卸载多余节点
          unmount(oldVNode);
        }
      }
      if (moved) {
        // 如果moved 为真，则需要进行 DOM 移动操作
        // 计算最长递增子序列
        const seq = getSequence(source);
        // 最长子序列的最后一个元素
        let s = seq.length - 1;
        // i 指向新的一组节点的最后一个元素
        let i = count - 1;
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            // 说明索引为 i 的节点是全新的节点，应该将其挂载，该节点在新的 children 中的真实位置索引
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            const nextPos = pos + 1;
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
            patch(null, newVNode, container, anchor);
          } else if (i !== seq[s]) {
            // 如果节点的索引 i 不等于 seq[s] 的值，说明该节点需要移动
            // 该节点在新的 children 中的真实位置索引
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            // 该节点的下一个节点索引
            const nextPos = pos + 1;
            // 锚点
            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
            insert(newVNode.el, container, anchor);
          } else {
            // 当 i === seq[s] 时，说明该位置的节点不需要移动
            s--;
          }
        }
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
