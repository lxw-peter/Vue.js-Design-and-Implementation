# 组件的实现原理

## 插槽的工作原理和实现

### 插槽的使用场景示例

- 组件模板

```html
<!-- MyComponent -->
<template>
  <header><slot name="header"></slot></header>
  <main><slot name="main"></slot></main>
  <footer><slot name="footer"></slot></footer>
</template>

```

```js
// 对应生成渲染函数
function render() {
  return [
    {
      type: 'header',
      children: [this.$slots.header()]
    },
    {
      type: 'body',
      children: [this.$slots.body()]
    },
    {
      type: 'footer',
      children: [this.$slots.footer()]
    }
  ] 
}

```

- 插槽在组件使用

```html
<!-- 在父组件调用 -->
<MyComponent>
  <template #header>
    <h1>我是标题</h1>
  </template>
  <template #body>
    <section>我是内容</section>
  </template>
  <template #footer>
    <p>我是注脚</p>
  </template>
</MyComponent>
```

```js
// 对应渲染函数
function render() {
  return {
    type: MyComponent,
    children: {
      header() {
        return { type: 'h1',children: '我是标题' }
      },
      body() {
        return { type: 'section', children: '我是内容' }
      },
      footer() {
        return { type: 'p', children: '我是注脚' }
      }
    }
  } 
}
```
