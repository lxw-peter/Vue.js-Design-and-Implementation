// 动态节点栈
const dynamicChildrenStack = [];

// 当前动态节点集合
let currentDynamicChildren = null;

// 创建新的动态节点集合，并将其压入栈中
function openBlock() {
  dynamicChildrenStack.push((currentDynamicChildren = []));
}

// 出栈并赋值给 currentDynamicChildren
function closeBlock() {
  currentDynamicChildren = dynamicChildrenStack.pop();
}

function createVNode(tag, props, children, flags) {
  const key = props && props.key;
  props && delete props.key;

  const vnode = {
    tag,
    props,
    children,
    key,
    patchFlags: flags,
  };

  if (typeof flags !== 'undefined' && currentDynamicChildren) {
    // 动态节点，将其添加到当前动态节点集合中
    currentDynamicChildren.push(vnode);
  }
  return vnode;
}

function createBlock(tag, props, children) {
  // block 本质也是一个 vnode
  const block = createVNode(tag, props, children);
  // 将当前动态节点集合作为 block.dynamicChildren
  block.dynamicChildren = currentDynamicChildren;
  closeBlock();
  return block;
}
