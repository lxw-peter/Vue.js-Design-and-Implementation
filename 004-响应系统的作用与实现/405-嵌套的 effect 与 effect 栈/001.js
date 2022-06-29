let activeEffect;
const bucket = new WeakMap();
const data = { foo: true, bar: true };

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn);
    // effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    fn();
  };
  // activeEffect.deps 用来存储所有与其相关联的依赖集合
  effectFn.deps = [];
  effectFn();
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
  // 这会导致无限循环
  // effects && effects.forEach((fn) => fn());
  const effectsToRun = new Set(effects);
  effectsToRun.forEach((effectFn) => effectFn());
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

/*  测试 嵌套副作用函数  */

effect(function effectFn1() {
  console.log('effectFn1 执行');
  effect(function effectFn2() {
    console.log('effectFn2 执行');
    // 在 effectFn2 中读取 obj.bar
    temp2 = obj.bar;
  });
  // 在 effectFn1 中读取 obj.foo
  temp1 = obj.foo;
});

setTimeout(() => {
  obj.foo = false; //  并没有执行effectFn1 ， 而是 effectFn2，与预期不符
}, 3000);
