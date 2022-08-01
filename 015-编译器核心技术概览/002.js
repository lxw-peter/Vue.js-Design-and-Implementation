/**
 *
 * @file parser 的实现原理和状态机
 *  */

/** 状态机的状态 */
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称状态
  text: 4, // 文本状态
  tagEnd: 5, // 结束标签状态
  tagEndName: 6, // 结束标签名称状态
};

/**
 * 判断是否为字母
 * @param {String} char
 * @returns Boolean
 */
function isAlpha(char) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

function tokenize(str) {
  // 状态机的当前状态：初始化状态
  let currentState = State.initial;
  // 缓存字符
  const chars = [];
  // 返回值
  const tokens = [];
  // 使用 while 循环开启自动机，
  while (str) {
    // 使用 char 存储第一个字符
    const char = str[0];
    switch (currentState) {
      case State.initial:
        if (char === '<') {
          currentState = State.tagOpen;
          str = str.slice(1);
        } else if (isAlpha(char)) {
          currentState = State.text;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case State.tagOpen:
        if (isAlpha(char)) {
          currentState = State.tagName;
          chars.push(char);
          str = str.slice(1);
        } else if (char === '/') {
          currentState = State.tagEnd;
          str = str.slice(1);
        }
        break;
      case State.tagName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === '>') {
          currentState = State.initial;
          tokens.push({
            type: 'tag',
            name: chars.join(''),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case State.text:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === '<') {
          currentState = State.tagOpen;
          tokens.push({
            type: 'text',
            content: chars.join(''),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case State.tagEnd:
        if (isAlpha(char)) {
          currentState = State.tagEndName;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case State.tagEndName:
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === '>') {
          currentState = State.initial;
          tokens.push({
            type: 'tagEnd',
            name: chars.join(''),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
    }
  }
  return tokens;
}

const tokens = tokenize(`<p>Vue</p>`);

console.log(JSON.stringify(tokens, null, 2));
