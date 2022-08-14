// 带有一个子节点
const vnode1 = {
  type: 'div',
  children: [
    {
      type: 'p',
      children: 'hello',
    },
  ],
};

// 带有属性 id
const vnode2 = {
  type: 'div',
  props: {
    id: 'foo',
  },
  children: 'hello',
};

// 带有属性 disabled
const vnode3 = {
  type: 'input',
  props: {
    disabled: '',
  },
};

const vnode31 = {
  type: 'input',
  props: {
    form: 'text',
  },
};

// 字符串形式的 class
const vnode4 = {
  type: 'div',
  props: {
    class: 'foo bar',
  },
  children: 'hello',
};

// 对象形式的 class
const vnode5 = {
  type: 'div',
  props: {
    class: { foo: true, bar: true },
  },
  children: 'hello',
};

// 数组形式的 class
const vnode6 = {
  type: 'div',
  props: {
    class: ['foo', { bar: true }, 'baz'],
    style: ['color: #fff', { 'font-size: 18px': true }],
  },
  children: 'hello',
};

// 文本节点
const Text = Symbol();
const vnode7 = {
  type: Text,
  children: '我是文本节点',
};

// 注释节点
const Comment = Symbol();
const vnode8 = {
  type: Comment,
  children: '我是注释节点',
};

// Fragment 节点
const Fragment = Symbol();
const vnode9 = {
  type: Fragment,
  children: [
    { type: 'li', children: '1' },
    { type: 'li', children: '2' },
    { type: 'li', children: '3' },
  ],
};

// 事件
const vnode10 = {
  type: 'p',
  props: {
    onClick: () => {
      alert('click');
    },
  },
  children: '事件1：一种事件',
};

const vnode11 = {
  type: 'p',
  props: {
    onClick: () => {
      alert('click');
    },
    onContextmenu: () => {
      alert('contextmenu');
    },
  },
  children: '事件2：两种不同的事件',
};

const vnode12 = {
  type: 'p',
  props: {
    onClick: [
      () => {
        alert('click1');
      },
      () => {
        alert('click2');
      },
    ],
  },
  children: '事件3：一次点击触发两次事件',
};
