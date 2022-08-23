// 接口设计
defineAsyncComponent({
  // 设置加载器
  loader: () =>
    new Promise((r) => {
      /** */
    }),

  // 设置loading展示延时事件 200
  delay: 200,
  // loading 组件
  loadingComponent: {
    setup() {
      return () => {
        return { type: 'h2', children: 'loading' };
      };
    },
  },
  // 设置超时时长
  timeout: 2000,
  errorComponent: {
    setup() {
      return () => {
        return { type: 'div', children: 'Error' };
      };
    },
  },
});

function defineAsyncComponent(options) {
  // options 可以是加载器也可以是配置项
  if (typeof options === 'function') {
    options = {
      loader: options,
    };
  }
  const { loader } = options;
  // 存储异步加载的组件
  let InnerComp = null;
  let retries = 0;
  // 封装 load 函数用来加载异步组件
  function load() {
    return loader().catch((err) => {
      // 用户指定了 onError, 由用户控制
      if (options.onError) {
        return new Promise((resolve, reject) => {
          // 重试
          const retry = () => {
            resolve(load());
            retries++;
          };
          const fail = () => reject(err);
          // 作为 onError 回调函数的参数，让用户决定下一步
          options.onError(retry, fail, retries);
        });
      } else {
        throw error;
      }
    });
  }
  return {
    name: 'AsyncComponent',
    setup() {
      // 异步组件是否加载成功
      const loaded = ref(false);
      // 是否超时
      const timeout = ref(false);
      // 存储错误对象
      const error = shallowRef(null);
      // 是否正在加载
      const loading = ref(false);

      let loadingTimer = null;
      if (options.delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true;
        }, options.delay);
      } else {
        loading.value = true;
      }
      // 调用 load 函数加载组件
      load()
        .then((c) => {
          InnerComp = c;
          loaded.value = true;
        })
        .catch((err) => (error.value = err))
        .finally(() => {
          // 加载完毕后，无论成功与否，都需要清除定时器
          loading.value = false;
          clearTimeout(loadingTimer);
        });
      let timer = null;
      if (options.timeout) {
        // 如果指定了超时时长，则开启一个定时器计时
        timer = setTimeout(() => {
          const err = new Error(`Async component timed out after ${options.timeout}ms.`);
          // 超时后将 timeout 设置为 true
          error.value = err;
          timeout.value = true;
        }, options.timer);
      }
      // 包装组件被卸载时清除定时器
      // onUnmounted(clearTimeout(timer));
      // 占位内容
      const placeholder = { type: Text, children: '' };

      return () => {
        // 如果加载成功，渲染该组件，报错则渲染 errorComponent，否则渲染一个展位内容
        if (loaded.value) {
          return { type: InnerComp };
        } else if (error.value && options.errorComponent) {
          return { type: options.errorComponent, props: { error: error.value } };
        } else if (loading.value && options.loadingComponent) {
          return { type: options.loadingComponent };
        } else {
          return placeholder;
        }
      };
    },
  };
}
