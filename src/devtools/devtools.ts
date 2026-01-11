// DevTools 面板创建脚本
// 这个文件会在开发者工具打开时执行

// 创建自定义面板
chrome.devtools.panels.create(
  'MockInterceptor', // 面板标题
  '', // 图标路径（留空使用默认图标）
  'devtools/panel.html', // 面板 HTML 文件路径
  (panel) => {
    if (chrome.runtime.lastError) {
      console.error('DevTools 面板创建失败:', chrome.runtime.lastError)
      return
    }
  }
)

