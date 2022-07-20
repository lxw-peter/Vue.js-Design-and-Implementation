const fn = (name) => {
  console.log('我是:', name);
};
// proxy 只能拦截对一个对象的基本操作
const p = new Proxy(fn, {
  apply(target, thisArg, argArray) {
    target.call(thisArg, ...argArray);
  },
});

p('lxw');
const obj = { foo: 1 };
console.log(obj.foo); // 1
console.log(Reflect.get(obj, 'foo')); // 1

const obj2 = {
  get foo() {
    return this.foo;
  },
};
// Reflect 的第三个参数，reciver在 target指定了getter时为 getter 调用时的 this
console.log(Reflect.get(obj2, 'foo', { foo: 2 })); // 2
