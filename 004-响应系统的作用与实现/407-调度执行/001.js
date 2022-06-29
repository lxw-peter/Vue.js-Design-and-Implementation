const data = { foo: 1 };
const obj = new Proxy(data, {
  /* */
});

function effect() {
  /*  */
}

effect(() => console.log(obj.foo));

obj.foo++;

console.log('结束了');

// 正常情况下执行顺序如下:
// 1
// 2
// 结束了

// 现在要求在不改变代码顺序的情况下改变执行顺序，实现如下输出顺序：
// 1
// 结束了
// 2
