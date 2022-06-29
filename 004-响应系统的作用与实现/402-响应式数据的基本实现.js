/**
 *
 *
 * obj.text -> 触发读取操作 -> 将 effect 存入桶中
 * obj.text = 'hello vue3'  -> 触发设置操作 -> 从桶中取出 effect 并执行
 *
 * proxy 可以拦截一个对象的读取和设置操作，ES2015 之前是用Object.defineProperty
 *
 */
let globalStr = '';

const bucket = new Set();
const data = { text: 'hello world' };

const obj = new Proxy(data, {
  get(target, key) {
    // 将effect 存入桶中
    bucket.add(effect);
    return target[key];
  },
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal;
    // 从桶中取出 effect 并执行
    bucket.forEach((fn) => fn());
    // 返回 true 代表设置操作成功
    return true;
  },
});

function effect() {
  globalStr = obj.text;
  console.log('effect:', globalStr);
}

// 执行副作用函数，触发读取
effect();

setTimeout(() => {
  obj.text = 'hello vue3';
}, 3000);
