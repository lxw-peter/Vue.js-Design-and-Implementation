const { isEnd, decodeHtml } = require('./utils.js');
/** 定义文本模式，作为状态表 */
const TextModes = {
  DATA: 'DATA',
  RCDATA: 'RCDATA',
  RAWTEXT: 'RAWTEXT',
  CDATA: 'CDATA',
};

function parse(str) {
  /** 定义上下文对象 */
  const context = {
    source: str,
    mode: TextModes.DATA,
    // 消费指定数量的字符
    advanceBy(num) {
      // 根据给定字符数 num，截取位置 num 后的模板内容，并替换当前模板内容
      context.source = context.source.slice(num);
    },
    /**
     * 处理无用空白字符，如：<div  ></div>
     */
    advanceSpaces() {
      // 匹配空白字符
      const match = /^[\t\r\n\f ]+/.exec(context.source);
      if (match) {
        // 调用 advanceBy 消费空白字符
        context.advanceBy(match[0].length);
      }
    },
  };

  const nodes = parseChildren(context, []);
  return {
    type: 'Root',
    children: nodes,
  };
}

/**
 *
 * @param context 上下文对象
 * @param ancestors 父节点构成的栈
 * @returns childNodes
 */
function parseChildren(context, ancestors) {
  let nodes = [];
  const { mode } = context;

  while (!isEnd(context, ancestors)) {
    let node;
    // 只有 DATA 模式 和 RCDATA 模式才支持插值节点的解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有 DATA 模式才支持标签节点的解析
      if (mode === TextModes.DATA && context.source[0] === '<') {
        if (context.source[1] === '!') {
          if (context.source.startsWith('<!--')) {
            // 注释
            node = parseComment(context);
          } else if (context.source.startsWith('<![CDATA[')) {
            node = parseCDATA(context, ancestors);
          }
        } else if (context.source[1] === '/') {
          // 结束标签，抛出错误
          console.error('无效的结束标签');
          continue;
        } else if (/[a-z]/i.test(context.source[1])) {
          // 标签
          node = parseElement(context, ancestors);
        }
      } else if (context.source.startsWith('{{')) {
        // 解析插值
        node = parseInterPolation(context);
      }
    }
    // node 不存在，非 DATA 也非 RCDATA
    if (!node) {
      // 解析文本节点
      node = parseText(context);
    }

    nodes.push(node);
  }
  // 循环结束，子节点解析完毕，返回子节点
  return nodes;
}

function parseElement(context, ancestors) {
  // 解析开始标签
  const element = parseTag(context);
  if (element.isSelfClosing) {
    return element;
  }
  if (element.tag === 'textarea' || element.tag === 'title') {
    context.mode = TextModes.RCDATA;
  } else if (/style|xmp|iframe|noembed|noframes|noscript/.test(element.tag)) {
    context.mode = TextModes.RAWTEXT;
  } else {
    context.mode = TextModes.DATA;
  }
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();
  if (context.source.startsWith(`</${element.tag}`)) {
    // 解析结束标签，使用 end 作为标识符
    parseTag(context, 'end');
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`);
  }
  return element;
}

function parseTag(context, type = 'start') {
  const { advanceBy, advanceSpaces } = context;

  // 处理开始标签和结束标签的正则表达式不同
  const match =
    type === 'start'
      ? /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
      : /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(match[0].length);
  advanceSpaces();
  const props = parseAttribute(context);
  const isSelfClosing = context.source.startsWith('/>');
  advanceBy(isSelfClosing ? 2 : 1);
  return {
    type: 'Element',
    tag,
    props,
    children: [],
    isSelfClosing,
  };
}

function parseAttribute(context) {
  const { advanceBy, advanceSpaces } = context;
  const props = [];
  while (!context.source.startsWith('>') && !context.source.startsWith('/>')) {
    // 使用正则获取属性名称
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    const name = match[0];
    advanceBy(name.length);
    advanceSpaces();
    // 消费等于号
    advanceBy(1);
    // 消费等于号与属性值之间的空白字符
    advanceSpaces();

    let value = '';

    const quote = context.source[0];
    // 判断属性值是否被引号引用
    const isQuoted = quote === '"' || quote === "'";
    if (isQuoted) {
      // 消费左引号
      advanceBy(1);
      const endQuoteIndex = context.source.indexOf(quote);
      if (endQuoteIndex > -1) {
        value = context.source.slice(0, endQuoteIndex);
        advanceBy(value.length);
        // 消费右引号
        advanceBy(1);
      } else {
        console.error('缺少引号');
      }
    } else {
      const match = /^[^\t\r\n\f >]+/.exec(context.source);
      value = match[0];
      advanceBy(value.length);
    }
    advanceSpaces();
    let propsType = 'Attribute';
    if (name.startsWith('v-') || name.startsWith('@' || name.startsWith(':'))) {
      propsType = 'Directive';
    }
    props.push({
      type: propsType,
      name,
      value,
    });
  }
  return props;
}

function parseText(context) {
  let endIndex = context.source.length;
  const ltIndex = context.source.indexOf('<');
  const delimiterIndex = context.source.indexOf('{{');
  if (ltIndex > -1 && ltIndex < endIndex) {
    endIndex = ltIndex;
  }
  if (delimiterIndex > -1 && delimiterIndex < endIndex) {
    endIndex = delimiterIndex;
  }
  let content = context.source.slice(0, endIndex);
  context.advanceBy(content.length);
  return {
    type: 'Text',
    content: decodeHtml(content),
  };
}

function parseCDATA(params) {}

function parseInterPolation(context) {
  context.advanceBy('{{'.length);
  let closeIndex = context.source.indexOf('}}');
  if (closeIndex < 0) {
    console.error('差值缺少结束定界符');
  }
  const content = context.source.slice(0, closeIndex);
  context.advanceBy(content.length);
  context.advanceBy('}}'.length);
  return {
    type: 'Interpolation',
    content: {
      type: 'Expression',
      // 表达式节点的内容是经过 HTML 解码后的差值表达式
      content: decodeHtml(content),
    },
  };
}

function parseComment(context) {
  context.advanceBy('<!--'.length);
  closeIndex = context.source.indexOf('-->');
  const content = context.source.slice(0, closeIndex);
  context.advanceBy(content.length);
  context.advanceBy('-->'.length);
  return {
    type: 'Comment',
    content,
  };
}

module.exports = parse;
