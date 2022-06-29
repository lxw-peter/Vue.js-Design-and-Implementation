/**
 * 上一节硬编码了副作用函数的名字 effect，导致一旦副作用函数名字不叫effect，代码即失效
 */

let activeEffect;
function effect(fn) {
  activeEffect = fn;
  fn();
}

let globalStr = '';

const bucket = new Set();
const data = { text: 'hello world' };

const obj = new Proxy(data, {
  get(target, key) {
    // 将 activeEffect 存入桶中
    if (activeEffect) {
      bucket.add(activeEffect);
    }
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

effect(() => {
  globalStr = obj.text;
  console.log('effect:', globalStr);
});

setTimeout(() => {
  // 副作用函数中没有读取 noExist 属性的值，但依然会执行副作用函数
  obj.noExist = 'hello vue3';
}, 3000);
