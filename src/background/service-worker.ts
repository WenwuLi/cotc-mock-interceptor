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
    } else {
      // 为所有已附加的调试器会话更新拦截模式
      await this.updateInterceptionPatterns()
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
      // 先禁用 Fetch
      try {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.disable')
      } catch (error) {
        // 忽略错误
      }
      
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
    try {
      const urlObj = new URL(url)
      urlPath = urlObj.pathname + urlObj.search
    } catch (error) {
      urlPath = url
    }
    
    // 收集所有匹配的规则
    const matchingRules: Array<{ rule: InterceptionRule; priority: number }> = []
    
    for (const rule of this.activeRules.values()) {
      let pattern = rule.urlPattern
      
      // 如果是路径模式（以/开头），提取路径部分
      if (pattern.startsWith('/')) {
        const patternPath = pattern.split('?')[0]
        const urlPathOnly = urlPath.split('?')[0]
        
        // 精确匹配
        if (pattern === urlPath) {
          matchingRules.push({ rule, priority: 1000 })
        }
        // 路径匹配（忽略查询参数）
        else if (patternPath === urlPathOnly) {
          matchingRules.push({ rule, priority: 900 })
        }
        // 后缀匹配
        else if (urlPathOnly.endsWith(patternPath)) {
          matchingRules.push({ rule, priority: 800 })
        }
        // 通配符匹配
        else if (pattern.includes('*')) {
          const regexPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
          const regex = new RegExp(`^${regexPattern}$`)
          if (regex.test(urlPath)) {
            matchingRules.push({ rule, priority: 700 })
          }
        }
      } else {
        // 完整URL模式匹配
        if (pattern.includes('*')) {
          const regexPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
          const regex = new RegExp(`^${regexPattern}$`)
          if (regex.test(url)) {
            matchingRules.push({ rule, priority: 600 })
          }
        } else if (url.includes(pattern)) {
          matchingRules.push({ rule, priority: 500 })
        }
      }
    }
    
    if (matchingRules.length === 0) {
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
    
    // 查找匹配的规则
    const rule = this.findMatchingRule(request.url)
    
    if (rule) {
      console.log(`[MockInterceptor] 找到匹配规则: ${rule.name} (${rule.urlPattern})`)
      
      // 应用拦截规则
      await this.applyRule(source, requestId, rule)
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
   * 应用拦截规则
   */
  async applyRule(
    source: chrome.debugger.Debuggee,
    requestId: string,
    rule: InterceptionRule
  ): Promise<void> {
    try {
      // 将 JSON 对象转换为字符串
      const responseBody = JSON.stringify(rule.responseJson, null, 2)
      
      // 设置响应头
      const responseHeaders = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
      ]
      
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
