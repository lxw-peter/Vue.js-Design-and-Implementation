/**
 * 解决上一节遗留问题
 * obj: 被操作的代理对象
 * text：被操作的字段名
 * effectFn: 使用 effect 函数注册的副作用函数
 *
 * 对象 字段 副作用函数对应关系如下：
 * target
 *    |- key
 *        |- effectFn
 *
 * 两个副作用函数对应同一个对象的同一个属性
 * target
 *   |- key
 *      |- effectFn1
 *      |- effectFn2
 *
 * 一个副作用函数对应同一个对象的两个不同属性
 * target
 *   |- key1
 *      |- effectFn
 *   |- key2
 *      |- effectFn
 *
 * 不同的副作用函数中对应两个不同对象的不同属性
 * target1
 *   |- key1
 *      |- effectFn1
 * target2
 *   |- key2
 *      |- effectFn2
 */
let activeEffect;
const bucket = new WeakMap();
const data = { text: 'hello world' };

function effect(fn) {
  activeEffect = fn;
  fn();
}
const obj = new Proxy(data, {
  get(target, key) {
    /*  
      if (!activeEffect) return target[key];
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
    */
    // 将上面的逻辑封装层 track 函数
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal;
    /*
      // 根据 target 从 桶中取出 depsMap, 它是 key -> effects
      const depsMap = bucket.get(target);
      if (!depsMap) return;
      // 根据 key 取出所有副作用函数
      const effects = depsMap.get(key);
      // 从桶中取出 effect 并执行
      effects && effects.forEach((fn) => fn()); 
   */
    // 将上面的逻辑封装层 trigger 函数
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
effect(() => {
  globalStr = obj.text;
  console.log('effect:', globalStr);
});

setTimeout(() => {
  // 副作用函数中没有读取 noExist 属性的值，不会再执行副作用函数
  obj.noExist = 'hello vue3';
}, 3000);
