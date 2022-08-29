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
    { type: 'li', children: '1', key: '1' },
    { type: 'li', children: '2', key: '2' },
    { type: 'li', children: '3', key: '3' },
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

const vnode13 = {
  type: 'ul',
  children: [
    { type: 'li', children: '1', key: '1' },
    { type: 'li', children: '2', key: '2' },
    { type: 'li', children: '3', key: '3' },
  ],
};
const vnode14 = {
  type: 'ul',
  children: [
    { type: 'li', children: '4', key: '3' },
    { type: 'li', children: '6', key: '5' },
    { type: 'li', children: '2', key: '2' },
    { type: 'li', children: '7', key: '4' },
  ],
};

/* 组件 */
const myComponent = {
  name: 'MyComponent',
  props: {
    title: String,
  },
  data() {
    return {
      foo: 'hello world',
    };
  },
  render() {
    return {
      type: 'div',
      children: `foo的值为：${this.foo}; count is: ${this.title}`,
    };
  },
};

// 用来描述组件的 VNode 对象，type 属性值为组件的选项对象
const CompVNode = {
  type: myComponent,
  props: {
    title: 'A big Title',
    other: this.val,
  },
};
/** setup 函数支持返回函数，该函数作为渲染函数使用 */
const setupComponent1 = {
  name: 'setupComponent1',
  setup() {
    return () => {
      return { type: 'div', children: 'hello' };
    };
  },
};
const setupVNode1 = {
  type: setupComponent1,
};
/** setup 函数支持返回对象 */
const setupComponent2 = {
  name: 'setupComponent2',
  setup() {
    const count = ref(4);
    return {
      count,
    };
  },
  render() {
    return { type: 'div', children: `总量为： ${this.count}` };
  },
};

const setupVNode2 = {
  type: setupComponent2,
};

/** setup 函数支持传参 */
const setupComponent3 = {
  name: 'setupComponent3',
  props: {
    foo: String,
  },
  setup(props, setupContext) {
    const { slots, emit, attrs, expose } = setupContext;
    emit('click', 1, 2);
    return () => {
      return { type: 'div', children: `hello ${props.foo}` };
    };
  },
};

const setupVNode3 = {
  type: setupComponent3,
  props: {
    foo: '你好',
    onClick: () => {
      alert('你好啊');
    },
  },
};

/* slots */
const slotsComponent = {
  name: 'slotsComponent',
  render() {
    return {
      type: Fragment,
      children: [
        {
          type: 'header',
          children: [this.$slots.header()],
        },
        {
          type: 'main',
          children: [this.$slots.main()],
        },
        {
          type: 'footer',
          children: [this.$slots.footer()],
        },
      ],
    };
  },
};

const slotsVNode = {
  type: slotsComponent,
  children: {
    header() {
      return { type: 'h1', children: '我是标题' };
    },
    main() {
      return { type: 'section', children: '我是内容' };
    },
    footer() {
      return { type: 'p', children: '我是注脚' };
    },
  },
};
/** 插槽在 setup 里的写法 */
const slotsComponent1 = {
  name: 'slotsComponent1',
  props: {
    foo: String,
  },
  setup(props, setupContext) {
    const { slots, emit, attrs, expose } = setupContext;
    onMounted(() => {
      console.log('onMounted:', 1);
    });
    return () => {
      return {
        type: Fragment,
        children: [
          {
            type: 'header',
            children: [slots.header(), { type: 'span', children: `foo的值为： ${props.foo}` }],
          },
          {
            type: 'main',
            children: [slots.main()],
          },
          {
            type: 'footer',
            children: [slots.footer()],
          },
        ],
      };
    };
  },
};

const slotsVNode1 = {
  type: slotsComponent1,
  props: {
    foo: '测试子组件刷新',
  },
  children: {
    header() {
      return { type: 'h1', children: '我是标题' };
    },
    main() {
      return { type: 'section', children: '我是内容' };
    },
    footer() {
      return { type: 'p', children: '我是注脚' };
    },
  },
};

const slotsVNode2 = {
  type: slotsComponent1,
  props: {
    foo: '传递给子组件的props已修改',
  },
  children: {
    header() {
      return { type: 'h1', children: '我是标题' };
    },
    main() {
      return { type: 'section', children: '我是内容' };
    },
    footer() {
      return { type: 'p', children: '我是注脚' };
    },
  },
};
/* 异步组件 */
let counter = 0;
const AsyncComponent = {
  name: 'AsyncComponent',
  props: {
    title: String,
  },
  setup(props, { emit, slots }) {
    return () => {
      return {
        type: 'div',
        children: [
          {
            type: defineAsyncComponent({
              loader: () =>
                new Promise((r, j) => {
                  setTimeout(() => {
                    counter > 2 ? r(InnerComp) : j('error...');
                  }, 1000);
                }),
              timeout: 0,
              errorComponent: {
                setup() {
                  return () => {
                    return { type: 'h2', children: 'Error - timeout' };
                  };
                },
              },
              delay: 500,
              loadingComponent: {
                setup() {
                  return () => {
                    return { type: 'h2', children: 'Loading...' };
                  };
                },
              },
              onError(retry, reject, retires) {
                counter = retires;
                retry();
              },
            }),
          },
        ],
      };
    };
  },
};

const InnerComp = {
  name: 'InnerComp',
  setup() {
    return () => ({
      type: 'div',
      children: '异步组件内容',
    });
  },
};
const asyncVNode = {
  type: AsyncComponent,
  props: {
    title: '传递给子组件的props已修改',
  },
};

/* keepalive 组件 */

const KeepAliveComponent = {
  name: 'KeepAliveComponent',
  props: {
    title: String,
  },
  setup(props, { emit, slots }) {
    const counter = ref(0);

    return () => {
      return {
        type: 'button',
        props: {
          onClick() {
            counter.value++;
          },
        },
        children: `count is ${counter.value}`,
      };
    };
  },
};

const KeepAliveCompVNode = {
  type: KeepAlive,
  props: {
    exclude: /^My/,
  },
  children: {
    default() {
      return { type: KeepAliveComponent };
    },
  },
};

/* Teleport 测试用例 */

const TeleportCompVNode = {
  type: Teleport,
  props: {
    to: 'body',
  },
  children: [
    { type: 'h1', children: 'Title' },
    { type: 'p', children: 'content' },
  ],
};

const TeleportCompVNode2 = {
  type: Teleport,
  props: {
    to: 'body',
  },
  children: [
    { type: 'h1', children: 'A big Title' },
    { type: 'p', children: 'a small content' },
  ],
};

// 动画组件
const TransitionCom = {
  name: 'TransitionCom',
  setup() {
    const toggle = ref(true);

    setTimeout(() => {
      // toggle.value = false;
    }, 2000);

    return () => {
      return {
        type: Transition,
        children: {
          default() {
            return toggle.value
              ? { type: 'div', props: { class: 'box' } }
              : { type: Text, children: '' };
          },
        },
      };
    };
  },
};
