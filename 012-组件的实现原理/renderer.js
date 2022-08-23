// 存储当前正在被初始化的组件实例
let currentInstance = null;
function setCurrentInstance(instance) {
  const prev = currentInstance;
  currentInstance = instance;
  return prev;
}
// 同样的，这里可以注册其它生命周期函数
function onMounted(fn) {
  if (currentInstance) {
    currentInstance.mounted.push(fn);
  } else {
    console.error('onMounted 函数只能在 setup 中调用');
  }
}

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
    } else if (typeof type === 'object') {
      // vnode.type 的值是选项对象，作为组件来处理
      if (!n1) {
        mountComponent(n2, container, anchor);
      } else {
        patchComponent(n1, n2, anchor);
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
  function mountComponent(vnode, container, anchor) {
    const componentOptions = vnode.type;
    // 注意，这里用let，后面存在修改
    let {
      render,
      data,
      props: propsOptions,
      setup,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions;
    // 创建前
    beforeCreate && beforeCreate();
    // 调用 data 函数得到原始数据，并调用 reactive 函数将其包装为响应式数据
    const state = data ? reactive(data()) : null;
    const [props, attrs] = resolveProps(propsOptions, vnode.props);
    const slots = vnode.children || {};
    // 组件实例
    const instance = {
      // 组件自身的状态数据
      state,
      props: shallowReactive(props),
      // 表示组件是否加载
      isMounted: false,
      // 组件渲染的内容，即子树
      subTree: null,
      // 将插槽添加到组件实例上
      slots,
      // 用来存储通过 onMounted 函数注册的生命周期钩子函数
      mounted: [],
    };

    /**
     *
     * @param {String} event 事件命
     * @param  {...any} payload 传递给事件处理函数的参数
     */
    function emit(event, ...payload) {
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
      // 根据处理后的事件名称去 props 中寻找对应的事件处理函数
      const handler = instance.props[eventName];
      if (handler) {
        //  TODO 这里直接调用了，并非是手动触发事件
        // 调用事件处理函数并传参
        handler(...payload);
      } else {
        console.error('事件不存在');
      }
    }

    const setupContext = { attrs, emit, slots };
    // setup 返回的数据
    let setupState = null;
    if (setup) {
      // 在setup函数之前设置当前组件实例
      const prevInstance = setCurrentInstance(instance);
      // 调用setup 函数，将只读版本的props作为第一个参数传递，避免用户意外修改 props 的值
      const setupResult = setup(shallowReadonly(instance.props), setupContext);
      // 在setup函数执行完毕之后，重置当前组件实例
      setCurrentInstance(prevInstance);

      if (typeof setupResult === 'function') {
        if (render) {
          console.error('setup 函数返回渲染函数，render选项将被忽略');
        }
        render = setupResult;
      } else {
        setupState = setupResult;
      }
    }
    // 将组件实例设置到 vnode 上，用于后期更新
    vnode.component = instance;
    // 创建渲染上下文对象，本质上是组件示例的代理
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        const { state, props, slots } = t;
        // 当 k 为 $slots时，直接返回组件实例上的slots
        if (k === '$slots') {
          return slots;
        }
        if (state && k in state) {
          return state[k];
        } else if (k in props) {
          return props[k];
        } else if (setupState && k in setupState) {
          // 这里需要判断是否为ref
          return isRef(setupState[k]) ? setupState[k].value : setupState[k];
        } else {
          console.error('不存在');
        }
      },
      set(t, k, v, r) {
        const { state, props } = t;
        if (state && k in state) {
          state[k] = v;
        } else if (k in props) {
          props[k] = v;
        } else if (setupState && k in setupState) {
          setupState[k] = v;
        } else {
          console.error('不存在');
        }
      },
    });
    // 生命周期函数调用时需要绑定渲染上下文对象
    created && created.call(renderContext);
    effect(
      () => {
        // 执行渲染函数，并将其 this 设置为 state, 函数内部可以通过 this 访问自身状态数据
        // 获取组件要渲染的内容，即render函数返回的虚拟DOM，
        const subTree = render.call(renderContext, renderContext);
        // 最后调用 patch 函数来挂载组件所描述的内容，即 subTree
        if (!instance.isMounted) {
          beforeMount && beforeMount.call(renderContext);
          // 初次挂载，调用 patch 函数，第一个参数传 null
          patch(null, subTree, container, anchor);
          instance.isMounted = true;
          // 将el挂载至vnode中的操作，el用于之后的unmount和diff
          vnode.el = subTree.el;
          // 选项式 api 内定义的
          mounted && mounted.call(renderContext);
          // 组合式api内定义的 onMounted，遍历 instance.mounted 数组并逐个执行即可
          instance.mounted && instance.mounted.forEach((hook) => hook.call(renderContext));
        } else {
          beforeUpdate && beforeUpdate.call(renderContext);
          // 组件已加载，使用新的子树与上一次渲染的子树打补丁操作
          patch(instance.subTree, subTree, container, anchor);
          updated && updated.call(renderContext);
        }
        instance.subTree = subTree;
      },
      {
        // 指定该副作用函数的调度器为 queueJob()
        scheduler: queueJob(),
      }
    );
  }
  function patchComponent(n1, n2, anchor) {
    const instance = (n2.component = n1.component);
    const { props } = instance;
    // 检测为子组件传递的 props 是否发生变化
    if (hasPropsChanged(n1.props, n2.props)) {
      const [nextProps] = resolveProps(n2.type.props, n2.props);
      for (const k in nextProps) {
        props[k] = nextProps[k];
      }
      for (const k in props) {
        if (!(k in nextProps)) delete props[k];
      }
    }
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

    /*  补充key不存在的情况 */
    while ((oldVNode && !oldVNode.key) || (newVNode && !newVNode.key)) {
      // 调用patch 更新
      patch(oldVNode, newVNode, container);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }
    if (!oldVNode || !newVNode) {
      return;
    }
    /* end */

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
