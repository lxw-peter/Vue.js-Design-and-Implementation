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

function watch(source, cb) {
  // 定义 getter
  let getter = typeof source === 'function' ? source : () => traverse(source);
  // 定义旧值与新值
  let oldVal, newVal;
  // 使用 effect 注册作用函数时，开启 lazy 选项， 并把返回值存储存储到 effectFn 上以便后续手动调用
  const effectFn = effect(
    // 触发读取操作
    () => getter(),
    {
      lazy: true,
      scheduler() {
        // 在 scheduler 中重新执行副作用函数，得到的是新值
        newVal = effectFn();
        // 将旧值和新值作为回调函数的参数
        cb(newVal, oldVal);
        // 更新旧值
        oldVal = newVal;
      },
    }
  );
  // 手动调用副作用函数，拿到的值就是旧值
  oldVal = effectFn();
}

function traverse(value, seen = new Set()) {
  // 若读取的数据原始值，或者已经被读取过，那么什么都不做
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  // 将数据添加到seen中， 代表遍历地读取过了，避免循环引用引起死循环
  seen.add(value);
  // 暂不考虑数组等结构
  // 假设 value 就是一个对象，使用 for ... in 读取对象的每一个值，并递归的调用traverse进行处理
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
}

/* 测试 */
// 直接监听对像
watch(obj, () => {
  console.log('数据变了');
});

// 监听 getter
watch(
  () => obj.foo,
  (newVal, oldVal) => {
    console.log('数据又变了', newVal, oldVal);
  }
);
obj.foo++;
