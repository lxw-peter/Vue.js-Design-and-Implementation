let activeEffect;
// effect 栈
const effectStack = [];

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    // 入栈
    effectStack.push(effectFn);
    fn();
    // 出栈
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };
  // 将 options 挂载到 effectFn 上
  effectFn.options = options; // 新增
  effectFn.deps = [];
  effectFn();
}

const bucket = new WeakMap();
const data = { foo: 1 };

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal;
    trigger(target, key);
  },
});

/**
 *
 * 在 get 拦截函数内调用 track 函数追踪变化
 */
function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  // 如果不存在depsMap, 就新建一个 Map 并与 target 关联
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  // 根据 key 从 depsMap 中取得 deps, 这里将其定义为 Set 类型
  let deps = depsMap.get(key);
  // 如果 deps 不存在 就新建一个  Set 并与 key 关联
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  // 将 activeEffect 存入桶中
  deps.add(activeEffect);
  // deps 就是与当前副作用函数相关联的依赖集合
  activeEffect.deps.push(deps);
}

/**
 *
 * 在 set 拦截函数内调用 trigger 函数触发变化
 *  */
function trigger(target, key) {
  // 根据 target 从 桶中取出 depsMap, 它是 key -> effects
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  // 根据 key 取出所有副作用函数
  const effects = depsMap.get(key);
  // 将 effectsToRun 设为空 Set
  const effectsToRun = new Set();
  effects &&
    effects.forEach((fn) => {
      // 当 trigger 触发执行的副作用函数与当前正在执行的副作用不同时将其添加到 effectsToRun 上
      if (fn !== activeEffect) {
        effectsToRun.add(fn);
      }
    });
  effectsToRun.forEach((effectFn) => {
    // 新增
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn); // 新增
    } else {
      effectFn();
    }
  });
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

/* 测试 */

// 定义一个任务队列,实现去重
const jobQueue = new Set();
const p = Promise.resolve();
// 表示正在刷新队列
let isFlushing = false;

function flushJob() {
  // 如果队列正在刷新，则直接返回
  if (isFlushing) return;
  isFlushing = true;
  // 在微任务队列中刷新 jobQueue 队列
  p.then(() => {
    jobQueue.forEach((job) => job());
  }).finally(() => {
    // 结束后重置
    isFlushing = false;
  });
}

effect(
  () => {
    console.log(obj.foo);
  },
  {
    scheduler(fn) {
      jobQueue.add(fn);
      flushJob();
    },
  }
);

obj.foo++;
obj.foo--;
obj.foo++;
obj.foo--;
obj.foo++;

// 一共只执行了两次副作用函数
