const parse = require('./parse');

(function () {
  const ast = parse('<div><!-- Comment --></div>');
  console.log('------------  测试注释 ---------------------');
  console.log(JSON.stringify(ast, null, 4));
})();

(function () {
  const ast = parse('<div>foo</div>');
  console.log('------------ 测试文本字符串 -----------------');
  console.log(JSON.stringify(ast, null, 4));
})();

(function () {
  const ast = parse('<div>foo {{bar}} baz</div>');
  console.log('------------ 测试模板字符串 -----------------');
  console.log(JSON.stringify(ast, null, 4));
})();

(function () {
  const ast = parse(
    '<div id="foo" v-show="display" @click="handleClick" v-on:mousedown="onMouseDown"></div>'
  );
  console.log('------------ 测试标签属性 -----------------');
  console.log(JSON.stringify(ast, null, 4));
})();
