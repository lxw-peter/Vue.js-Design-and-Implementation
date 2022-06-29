// 数据
const obj = { text: 'hello word ' };

// 副作用函数，读取 obj.text
function effect() {
  document.body.innerText = obj.text;
}

// 目的: 修改obj.text 会触发 effect 自动执行
obj.text = 'hellow vue3';
