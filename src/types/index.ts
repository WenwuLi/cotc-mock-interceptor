/**
 * 拦截规则接口
 */
export interface InterceptionRule {
  /** 规则唯一标识 */
  id: string
  /** 规则名称 */
  name: string
  /** URL 匹配模式，支持通配符，如 * /api/* 或 /api/* */
  urlPattern: string
  /** JSON 格式的响应数据 */
  responseJson: object
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt?: string
}

/**
 * 项目接口
 */
export interface Project {
  /** 项目唯一标识 */
  id: string
  /** 项目名称 */
  name: string
  /** 是否启用 */
  enabled: boolean
  /** 拦截规则列表 */
  rules: InterceptionRule[]
  /** 创建时间 */
  createdAt: string
}

/**
 * 存储数据结构
 */
export interface StorageData {
  /** 项目列表 */
  projects: Project[]
  /** 当前选中的项目ID */
  currentProjectId?: string
}

/**
 * Chrome declarativeNetRequest 规则
 */
export interface ChromeRule {
  /** 规则ID */
  id: number
  /** 优先级 */
  priority: number
  /** 操作类型 */
  action: {
    type: 'redirect'
    redirect: {
      url: string
    }
  }
  /** 匹配条件 */
  condition: {
    urlFilter?: string
    regexFilter?: string
    resourceTypes: chrome.declarativeNetRequest.ResourceType[]
  }
}

