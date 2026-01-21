import type { Project, InterceptionRule } from '@/types'
import { StorageManager } from '@/utils/storage'

/**
 * 拦截管理器类
 * 使用 Chrome Debugger API 实现请求拦截
 */
class InterceptionManager {
  /** 活跃的拦截规则映射 */
  private activeRules = new Map<string, InterceptionRule>()

  /** 调试器会话映射：tabId -> debuggee */
  private debuggerSessions = new Map<number, chrome.debugger.Debuggee>()

  constructor() {
    this.init()
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    // 初始化拦截器状态
    await chrome.storage.local.set({ interceptorStatus: 'idle' })

    // 加载规则
    await this.loadRules()

    // 监听存储变化
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && (changes.projects || changes.currentProjectId)) {
        this.loadRules().catch(console.error)
      }
    })

    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        // 只有在有活跃规则时才附加调试器
        if (this.activeRules.size > 0) {
          this.attachDebugger(tabId).catch(console.error)
        }
      }
    })

    // 监听标签页激活
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId)
      if (tab.url && tab.url.startsWith('http')) {
        // 只有在有活跃规则时才附加调试器
        if (this.activeRules.size > 0) {
          this.attachDebugger(activeInfo.tabId).catch(console.error)
        }
      }
    })

    // 为所有现有标签页附加调试器（只有在有活跃规则时）
    chrome.tabs.query({}, (tabs) => {
      if (this.activeRules.size > 0) {
        tabs.forEach(tab => {
          if (tab.id && tab.url && tab.url.startsWith('http')) {
            this.attachDebugger(tab.id).catch(console.error)
          }
        })
      }
    })
  }

  /**
   * 加载所有启用的规则
   */
  async loadRules(): Promise<void> {
    try {
      // 设置状态为加载中
      await chrome.storage.local.set({ interceptorStatus: 'loading' })

      const projects = await StorageManager.getProjects()
      const enabledProjects = projects.filter(p => p.enabled)

      this.activeRules.clear()

      // 收集所有启用的规则
      for (const project of enabledProjects) {
        for (const rule of project.rules) {
          if (rule.enabled) {
            this.activeRules.set(rule.id, rule)
          }
        }
      }

      console.log(`[MockInterceptor] 已加载 ${this.activeRules.size} 个启用的拦截规则`)

      // 如果没有活跃规则，分离所有调试器
      if (this.activeRules.size === 0) {
        await this.detachAllDebuggers()
        await chrome.storage.local.set({ interceptorStatus: 'idle' })
      } else {
        // 优化：主动检查所有符合条件的标签页并并行附加
        const tabs = await chrome.tabs.query({})
        const attachPromises = tabs
          .filter(tab => tab.id && tab.url && tab.url.startsWith('http'))
          .map(tab => this.attachDebugger(tab.id!))

        await Promise.all(attachPromises)

        // 为所有已附加的调试器会话更新拦截模式
        await this.updateInterceptionPatterns()

        // 设置状态为就绪
        await chrome.storage.local.set({ interceptorStatus: 'ready' })
        console.log(`[MockInterceptor] 拦截器已就绪`)
      }
    } catch (error) {
      console.error(`[MockInterceptor] 加载规则失败:`, error)
      await chrome.storage.local.set({ interceptorStatus: 'idle' })
      // 如果加载失败，分离所有调试器以确保安全
      await this.detachAllDebuggers()
    }
  }

  /**
   * 附加调试器到标签页
   */
  async attachDebugger(tabId: number): Promise<boolean> {
    try {
      // 检查是否已经附加
      if (this.debuggerSessions.has(tabId)) {
        // 验证连接是否有效
        const debuggee = this.debuggerSessions.get(tabId)!
        try {
          await chrome.debugger.sendCommand(debuggee, 'Runtime.evaluate', {
            expression: '1+1'
          })
          // 连接有效，更新拦截模式
          await this.updateInterceptionPatternsForTab(tabId)
          return true
        } catch (error) {
          // 连接无效，重新附加
          console.warn(`[MockInterceptor] 调试器连接无效，重新附加到标签页 ${tabId}`)
          this.debuggerSessions.delete(tabId)
        }
      }

      const debuggee = { tabId }

      // 附加调试器
      await chrome.debugger.attach(debuggee, '1.3')
      this.debuggerSessions.set(tabId, debuggee)

      // 启用 Network 域
      await chrome.debugger.sendCommand(debuggee, 'Network.enable')

      // 启用 Fetch 拦截
      await this.updateInterceptionPatternsForTab(tabId)

      console.log(`[MockInterceptor] 调试器已附加到标签页 ${tabId}`)
      return true
    } catch (error: any) {
      // 忽略"另一个调试器已附加"的错误
      if (error.message && error.message.includes('Another debugger')) {
        console.log(`[MockInterceptor] 标签页 ${tabId} 已有其他调试器附加`)
        return false
      }
      console.error(`[MockInterceptor] 附加调试器失败 (标签页 ${tabId}):`, error)
      return false
    }
  }

  /**
   * 分离调试器
   */
  async detachDebugger(tabId: number): Promise<void> {
    try {
      const debuggee = this.debuggerSessions.get(tabId)
      if (debuggee) {
        await chrome.debugger.detach(debuggee)
        this.debuggerSessions.delete(tabId)
        console.log(`[MockInterceptor] 调试器已从标签页 ${tabId} 分离`)
      }
    } catch (error) {
      console.error(`[MockInterceptor] 分离调试器失败 (标签页 ${tabId}):`, error)
    }
  }

  /**
   * 分离所有调试器
   */
  async detachAllDebuggers(): Promise<void> {
    const tabIds = Array.from(this.debuggerSessions.keys())
    console.log(`[MockInterceptor] 分离所有调试器，共 ${tabIds.length} 个标签页`)
    for (const tabId of tabIds) {
      await this.detachDebugger(tabId)
    }
  }

  /**
   * 更新拦截模式（为所有标签页）
   */
  async updateInterceptionPatterns(): Promise<void> {
    for (const tabId of this.debuggerSessions.keys()) {
      await this.updateInterceptionPatternsForTab(tabId)
    }
  }

  /**
   * 更新拦截模式（为指定标签页）
   */
  async updateInterceptionPatternsForTab(tabId: number): Promise<void> {
    const debuggee = this.debuggerSessions.get(tabId)
    if (!debuggee) {
      return
    }

    try {
      // 优化：直接调用 Fetch.enable。
      // 在 CDP 中，重复调用 Fetch.enable 会直接覆盖之前的 patterns，无需先 disable

      // 如果没有活跃规则，分离调试器
      if (this.activeRules.size === 0) {
        await this.detachDebugger(tabId)
        return
      }

      // 生成拦截模式
      const patterns: Array<{ urlPattern: string; requestStage: string }> = []

      for (const rule of this.activeRules.values()) {
        let urlPattern = rule.urlPattern

        // 如果是路径模式（以/开头），转换为完整URL模式
        if (urlPattern.startsWith('/')) {
          urlPattern = `*${urlPattern}*`
        }

        patterns.push({
          urlPattern: urlPattern,
          requestStage: 'Request'
        })
      }

      // 启用 Fetch 拦截
      await chrome.debugger.sendCommand(debuggee, 'Fetch.enable', {
        patterns: patterns
      })

      console.log(`[MockInterceptor] 已为标签页 ${tabId} 启用 ${patterns.length} 个拦截模式`)
    } catch (error) {
      console.error(`[MockInterceptor] 更新拦截模式失败 (标签页 ${tabId}):`, error)
    }
  }

  /**
   * 查找匹配的拦截规则
   */
  findMatchingRule(url: string): InterceptionRule | null {
    // 提取URL路径部分
    let urlPath = ''
    let urlPathOnly = ''
    try {
      const urlObj = new URL(url)
      urlPath = urlObj.pathname + urlObj.search
      urlPathOnly = urlObj.pathname
    } catch (error) {
      urlPath = url
      urlPathOnly = url.split('?')[0]
    }

    // 收集所有匹配的规则
    const matchingRules: Array<{ rule: InterceptionRule; priority: number }> = []

    for (const rule of this.activeRules.values()) {
      let pattern = rule.urlPattern
      let isMatch = false
      let priority = 0

      // 1. 完整URL包含规则
      if (url.includes(pattern)) {
        isMatch = true
        priority = 500
      }

      // 2. 路径模式处理（以/开头）
      if (pattern.startsWith('/')) {
        const patternPathOnly = pattern.split('?')[0]

        // 精确路径匹配（忽略查询参数）
        if (patternPathOnly === urlPathOnly) {
          isMatch = true
          priority = 900
        }
        // 后缀匹配
        else if (urlPathOnly.endsWith(patternPathOnly)) {
          isMatch = true
          priority = 800
        }
        // 包含匹配（URL路径中包含规则路径）
        else if (urlPathOnly.includes(patternPathOnly)) {
          isMatch = true
          priority = 750
        }
      }

      // 3. 通配符正则匹配
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
          .replace(/\\\*/g, '.*')               // 将 * 替换为 .*
        const regex = new RegExp(`^${regexPattern}$`)

        // 分别测试完整URL和路径部分
        if (regex.test(url) || regex.test(urlPath) || regex.test(urlPathOnly)) {
          isMatch = true
          priority = Math.max(priority, 700)
        }
      }

      if (isMatch) {
        matchingRules.push({ rule, priority })
      }
    }

    if (matchingRules.length === 0) {
      console.log(`[MockInterceptor] 匹配失败: URL "${url}" 未命中任何规则`)
      return null
    }

    // 按优先级排序，返回最高优先级的规则
    matchingRules.sort((a, b) => b.priority - a.priority)
    return matchingRules[0].rule
  }

  /**
   * 处理被拦截的请求
   */
  async handleRequestPaused(source: chrome.debugger.Debuggee, params: any): Promise<void> {
    const { requestId, request } = params

    console.log(`[MockInterceptor] 拦截到请求: ${request.method} ${request.url}`)

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      await this.handleOptionsRequest(source, requestId, request)
      return
    }

    // 查找匹配的规则
    const rule = this.findMatchingRule(request.url)

    if (rule) {
      console.log(`[MockInterceptor] 找到匹配规则: ${rule.name} (${rule.urlPattern})`)

      // 应用拦截规则
      await this.applyRule(source, requestId, rule, request)
    } else {
      // 继续正常请求
      try {
        await chrome.debugger.sendCommand(source, 'Fetch.continueRequest', {
          requestId
        })
      } catch (error) {
        console.error(`[MockInterceptor] 继续请求失败:`, error)
      }
    }
  }

  /**
   * 从请求头对象中获取特定头的值（忽略大小写）
   */
  private getHeaderValue(headers: any, name: string): string | undefined {
    if (!headers) return undefined
    const lowerName = name.toLowerCase()
    const key = Object.keys(headers).find(k => k.toLowerCase() === lowerName)
    return key ? headers[key] : undefined
  }

  /**
   * 处理 OPTIONS 预检请求
   */
  async handleOptionsRequest(
    source: chrome.debugger.Debuggee,
    requestId: string,
    request: any
  ): Promise<void> {
    try {
      // 获取请求的 Origin
      const origin = this.getHeaderValue(request.headers, 'origin')

      // 设置 CORS 预检响应头
      const responseHeaders = [
        { name: 'Access-Control-Allow-Origin', value: origin || '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin' },
        { name: 'Access-Control-Max-Age', value: '86400' },
        { name: 'Content-Length', value: '0' }
      ]

      // 只有在有 Origin 时才设置 Credentials（避免与 * 冲突）
      if (origin) {
        responseHeaders.push({ name: 'Access-Control-Allow-Credentials', value: 'true' })
      }

      // 返回 OPTIONS 响应
      await chrome.debugger.sendCommand(source, 'Fetch.fulfillRequest', {
        requestId,
        responseCode: 204,
        responseHeaders,
        body: ''
      })

      console.log(`[MockInterceptor] 已处理 OPTIONS 预检请求: ${request.url}`)
    } catch (error) {
      console.error(`[MockInterceptor] 处理 OPTIONS 请求失败:`, error)
      // 如果失败，继续正常请求
      try {
        await chrome.debugger.sendCommand(source, 'Fetch.continueRequest', {
          requestId
        })
      } catch (continueError) {
        console.error(`[MockInterceptor] 继续请求失败:`, continueError)
      }
    }
  }

  /**
   * 应用拦截规则
   */
  async applyRule(
    source: chrome.debugger.Debuggee,
    requestId: string,
    rule: InterceptionRule,
    request: any
  ): Promise<void> {
    try {
      // 将 JSON 对象转换为字符串
      const responseBody = JSON.stringify(rule.responseJson, null, 2)

      // 获取请求的 Origin（用于 CORS）
      const origin = this.getHeaderValue(request.headers, 'origin')

      // 设置响应头（包含完整的 CORS 头）
      const responseHeaders: Array<{ name: string; value: string }> = [
        { name: 'Content-Type', value: 'application/json; charset=utf-8' },
        { name: 'Access-Control-Allow-Origin', value: origin || '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin' },
        { name: 'Access-Control-Expose-Headers', value: 'Content-Length, Content-Type' }
      ]

      // 只有在有 Origin 时才设置 Credentials（避免与 * 冲突）
      if (origin) {
        responseHeaders.push({ name: 'Access-Control-Allow-Credentials', value: 'true' })
      }

      // 将响应体转换为 base64
      const bodyBase64 = btoa(unescape(encodeURIComponent(responseBody)))

      // 发送模拟响应
      await chrome.debugger.sendCommand(source, 'Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders,
        body: bodyBase64
      })

      console.log(`[MockInterceptor] 已应用拦截规则: ${rule.name}`)
    } catch (error) {
      console.error(`[MockInterceptor] 应用拦截规则失败:`, error)
      // 如果失败，继续正常请求
      try {
        await chrome.debugger.sendCommand(source, 'Fetch.continueRequest', {
          requestId
        })
      } catch (continueError) {
        console.error(`[MockInterceptor] 继续请求失败:`, continueError)
      }
    }
  }
}

// 创建全局实例
const interceptionManager = new InterceptionManager()

// 监听调试器事件
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (method === 'Fetch.requestPaused') {
    interceptionManager.handleRequestPaused(source, params).catch(console.error)
  }
})

// 监听调试器分离事件
chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId) {
    interceptionManager.detachDebugger(source.tabId).catch(console.error)
  }
})

console.log('[MockInterceptor] Service Worker 已加载')
