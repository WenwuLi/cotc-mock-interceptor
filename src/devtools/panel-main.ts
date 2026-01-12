// DevTools 面板主入口
// 这个文件会在 DevTools 面板中执行

// 注意：DevTools 面板中无法直接使用 Vue，因为它是独立的上下文
// 我们需要使用 iframe 来加载选项页面，或者重新实现 UI

// 使用 iframe 加载选项页面
const app = document.getElementById('app')
if (app) {
  const iframe = document.createElement('iframe')
  iframe.src = chrome.runtime.getURL('options/index.html')
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute('scrolling', 'auto')
  app.appendChild(iframe)
}

