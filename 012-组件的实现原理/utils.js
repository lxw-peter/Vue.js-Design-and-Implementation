/**
 * 获取给定序列的最长递增子序列
 * @param {Array} arr
 * @returns Array
 */
function getSequence(arr) {
  // 拷贝一份副本
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

function shouldSetAsProps(el, key) {
  // 特殊处理， input 元素的 form 属性是只读的，只能用setAttribute
  if (key === 'form' && el.tagName === 'INPUT') return false;
  return key in el;
}

// class ,style 也可以用该方法序列化
function normalizeProp(params, type = 'class') {
  let delimiter = type === 'style' ? ';' : ' ';
  if (typeof params === 'string') {
    return params;
  } else if (Array.isArray(params)) {
    return params.reduce((last, cur) => {
      return last ? last + delimiter + normalizeProp(cur) : normalizeProp(cur);
    }, '');
  } else if (getType(params) === 'Object') {
    let result = '';
    for (const key in params) {
      if (!Object.hasOwnProperty.call(params, key)) continue;
      if (params[key]) {
        result = result ? result + delimiter + key : key;
      }
    }
    return result;
  }
  return '';
}

/** 获取数据类型 */
function getType(params) {
  return Object.prototype.toString.call(params).slice(8, -1);
}
/**
 * 调度器
 * @returns function
 */
function queueJob() {
  const queue = new Set();
  // 刷新任务队列的标志
  let isFlushing = false;
  const p = Promise.resolve();
  return function (job) {
    queue.add(job);
    if (!isFlushing) {
      // 将该标志设置 为true，以避免重复刷新
      isFlushing = true;
      // 在微任务中刷新缓存队列
      p.then(() => {
        try {
          // 执行任务队列中的任务
          queue.forEach((job) => job());
        } finally {
          // 重置状态
          isFlushing = false;
          queue.clear = 0;
        }
      });
    }
  };
}

/**
 *
 * @param {Object} options
 * @param {Object} propData
 * @returns [props, attrs]
 */
function resolveProps(options, propData) {
  const props = {};
  const attrs = {};
  // 遍历为组件传递的props 数据
  for (const key in propData) {
    if (key in options || key.startsWith('on')) {
      // 如果组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
      props[key] = propData[key];
    } else {
      // 否则将其作为attrs
      attrs[key] = propData[key];
    }
  }
  return [props, attrs];
}
/**
 *
 * @param {*} prevProps
 * @param {*} nextProps
 * @returns  Bool
 */
function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    return nextProps[key] !== prevProps[key];
  }
  return false;
}
