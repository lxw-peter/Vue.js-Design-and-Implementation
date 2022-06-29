let activeEffect;
const bucket = new WeakMap();
const data = { ok: true, text: 'hello world' };

function effect(fn) {
  activeEffect = fn;
  fn();
}
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
  // 从桶中取出 effect 并执行
  effects && effects.forEach((fn) => fn());
}

/* 测试 */

// @1 立即执行一次副作用函数
effect(() => {
  console.log('effect: done');
  globalStr = obj.ok ? obj.text : 'not';
});

setTimeout(() => {
  obj.ok = false; // @2 执行副作用函数
}, 3000);

setTimeout(() => {
  obj.text = 'hello vue3'; // @3 即使 obj.ok 为false，globalStr的值没有变化， 但仍然会执行副作用函数
}, 5000);
