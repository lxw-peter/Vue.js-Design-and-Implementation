/** 希望effect 下的回调在期望的时间节点执行 */
let activeEffect;
// effect 栈
const effectStack = [];
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    // 入栈
    effectStack.push(effectFn);
    // 将 res 执行的结果存储在res中
    const res = fn(); // 新增
    // 出栈
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    // 将 res 作为 effect 的返回值
    return res; // 新增
  };
  // 将 options 挂载到 effectFn 上
  effectFn.options = options; // 新增
  effectFn.deps = [];
  // 只有非 lazy 的时候，才执行
  if (!options.lazy) {
    // 新增
    effectFn();
  }
  return effectFn; // 新增
}
const bucket = new WeakMap();
const data = { foo: 1, bar: 2 };

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

// 实现计算属性
function computed(getter) {
  // 用 value 缓存上一次计算的值
  let value;
  // 用来标志是否需要重新计算值，为 true 则意味着 ‘脏’，需要计算
  let dirty = true;
  // 将 getter 作为副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    // 添加调度器，在调度器中将 dirty 重置为 true
    scheduler() {
      if (!dirty) {
        dirty = true;
        // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
        trigger(obj, 'value');
      }
    },
  });
  const obj = {
    // 当读取 value 时 才执行 effectFn
    get value() {
      // 只有脏了才计算值，并将得到的值缓存到 value 中
      if (dirty) {
        value = effectFn();
        // 将 dirty 设置为 false，下一次访问直接使用缓存到 value 中的值
        dirty = false;
      }
      // 当读取 value 时，手动调用track函数进行追踪
      track(obj, 'value');
      return value;
    },
  };
  return obj;
}

/** 测试 */
const sumRes = computed(() => obj.foo + obj.bar);

console.log(sumRes.value); // 3
console.log(sumRes.value); // 3
console.log(sumRes.value); // 3

obj.foo++;

console.log(sumRes.value); // 4

effect(() => {
  // 再副作用函数中 读取 sumRes.value
  console.log(sumRes.value); // 4
});

obj.bar++; // 会触发发上面的副作用函数重新执行 5
