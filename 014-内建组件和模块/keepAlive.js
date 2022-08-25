/**
 * 创建一个缓存对象
 * key: vnode.type
 * value: vnode
 */
const cache = new Map();
const KeepAlive = {
  // 标记是否为 Keepalive 组件标志
  __isKeepAlive: true,
  props: {
    include: RegExp,
    exclude: RegExp,
  },
  setup(props, { slots }) {
    const instance = currentInstance;
    // move 移动 DOM 的方法
    const { move, createElement } = instance.keepAliveCtx;

    // 创建隐藏容器
    const storageContainer = createElement('div');
    // KeepAlive组件会被添加上两个方法，会在渲染器中用到
    instance._deActivate = (vnode) => {
      move(vnode, storageContainer);
    };
    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor);
    };
    return () => {
      // KeepAlive 的默认插槽就是需要被缓存起来的组件
      let rawVNode = slots.default();
      // 如果不是组件，直接渲染即可，因为非组件的虚拟节点无法被 keeplive
      if (typeof rawVNode.type !== 'object') {
        return rawVNode;
      }
      // 获取内部组件的 name 缓存特定组件
      const name = rawVNode.type.name;
      // 匹配 name
      if (
        (name &&
          // 如果 name 无法被 include 匹配
          props.include &&
          !props.include.test(name)) ||
        // 或者被 exclude 匹配
        (props.exclude && props.exclude.test(name))
      ) {
        // 直接渲染 ‘内部组件’，不对其进行后续的缓存操作
        return rawVNode;
      }
      // 挂在前获取缓存的组件 vnode
      const cachedVNode = cache.get(rawVNode.type);
      if (cachedVNode) {
        // 如果有缓存的内容，则说明不应该执行挂载，而是激活
        rawVNode.component = cachedVNode.component;
        rawVNode.keptAlive = true;
      } else {
        // 如果没有缓存，则将其添加到缓存中
        cache.set(rawVNode.type, rawVNode);
      }
      // 在组建 vnode 上添加 shouldKeepAlive 属性，并标记为 true，避免真的被卸载
      rawVNode.shouldKeepAlive = true;
      // 将 KeepAlive 组件的实例也添加到 vnode 上，以便在渲染器中访问
      rawVNode.keepAliveInstance = instance;
      return rawVNode;
    };
  },
};
