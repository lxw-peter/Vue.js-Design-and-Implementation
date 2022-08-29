// todo 当前是硬编码样式，应该使用 props 传递样式
const Transition = {
  name: 'Transition',
  setup(props, { slots }) {
    return () => {
      const innerVNode = slots.default();
      innerVNode.transition = {
        beforeEnter(el) {
          el.classList.add('enter-from');
          el.classList.add('enter-active');
        },
        enter(el) {
          // 在下一帧切换到结束状态
          nextFrame(() => {
            el.classList.remove('enter-from');
            el.classList.add('enter-to');
            el.addEventListener('transitionend', () => {
              el.classList.remove('enter-to');
              el.classList.remove('enter-active');
            });
          });
        },
        leave(el, perfromRemove) {
          // 设置离场过度的初始状态：添加 leave-from 和 leave-active 类
          el.classList.add('leave-from');
          el.classList.add('leave-active');
          // 强制 reflow ，是初始状态生效
          document.body.offsetHeight;
          nextFrame(() => {
            el.classList.remove('leave-from');
            el.classList.add('leave-to');
            el.addEventListener('transitionend', () => {
              el.classList.remove('leave-to');
              el.classList.remove('leave-active');
              // 调用 transition.leave 钩子函数的第二个参数，完成 DOM 元素的卸载
              perfromRemove();
            });
          });
        },
      };
      return innerVNode;
    };
  },
};
