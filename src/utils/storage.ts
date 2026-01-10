import type { StorageData, Project, InterceptionRule } from '@/types'

const STORAGE_KEY = 'mockdataflow_storage'

/**
 * Chrome Storage 操作工具类
 */
export class StorageManager {
  /**
   * 检查是否在 Chrome 扩展环境中
   */
  private static isChromeExtension(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local
  }

  /**
   * 从 localStorage 读取数据
   */
  private static getFromLocalStorage(): StorageData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as StorageData
        return {
          projects: parsed.projects || [],
          currentProjectId: parsed.currentProjectId,
        }
      }
    } catch (error) {
      console.error('读取 localStorage 失败:', error)
    }
    return {
      projects: [],
      currentProjectId: undefined,
    }
  }

  /**
   * 写入 localStorage
   */
  private static setToLocalStorage(data: StorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('写入 localStorage 失败:', error)
    }
  }

  /**
   * 获取所有存储数据
   */
  static async getAll(): Promise<StorageData> {
    // 在 Chrome 扩展环境中使用 chrome.storage.local
    if (this.isChromeExtension()) {
      const result = await chrome.storage.local.get<{
        projects?: Project[]
        currentProjectId?: string
      }>(['projects', 'currentProjectId'])
      return {
        projects: result.projects || [],
        currentProjectId: result.currentProjectId,
      }
    }

    // 开发环境下使用 localStorage
    return this.getFromLocalStorage()
  }

  /**
   * 保存所有数据
   */
  static async setAll(data: StorageData): Promise<void> {
    // 在 Chrome 扩展环境中使用 chrome.storage.local
    if (this.isChromeExtension()) {
      await chrome.storage.local.set({
        projects: data.projects,
        currentProjectId: data.currentProjectId,
      })
      return
    }

    // 开发环境下使用 localStorage
    this.setToLocalStorage(data)
  }

  /**
   * 获取项目列表
   */
  static async getProjects(): Promise<Project[]> {
    const data = await this.getAll()
    return data.projects
  }

  /**
   * 保存项目列表
   */
  static async setProjects(projects: Project[]): Promise<void> {
    const data = await this.getAll()
    data.projects = projects
    await this.setAll(data)
  }

  /**
   * 添加项目
   */
  static async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects()
    projects.push(project)
    await this.setProjects(projects)
  }

  /**
   * 更新项目
   */
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects()
    const index = projects.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates }
      await this.setProjects(projects)
    }
  }

  /**
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<void> {
    const projects = await this.getProjects()
    const filtered = projects.filter(p => p.id !== projectId)
    await this.setProjects(filtered)
    
    // 如果删除的是当前项目，清除当前项目ID
    const data = await this.getAll()
    if (data.currentProjectId === projectId) {
      if (this.isChromeExtension()) {
        await chrome.storage.local.remove('currentProjectId')
      } else {
        // 开发环境下更新 localStorage
        const updated = { ...data, currentProjectId: undefined }
        this.setToLocalStorage(updated)
      }
    }
  }

  /**
   * 获取当前项目
   */
  static async getCurrentProject(): Promise<Project | null> {
    const data = await this.getAll()
    if (!data.currentProjectId) {
      return null
    }
    const projects = await this.getProjects()
    return projects.find(p => p.id === data.currentProjectId) || null
  }

  /**
   * 设置当前项目
   */
  static async setCurrentProject(projectId: string | undefined): Promise<void> {
    if (this.isChromeExtension()) {
      if (projectId) {
        await chrome.storage.local.set({ currentProjectId: projectId })
      } else {
        await chrome.storage.local.remove('currentProjectId')
      }
    } else {
      // 开发环境下更新 localStorage
      const data = this.getFromLocalStorage()
      data.currentProjectId = projectId
      this.setToLocalStorage(data)
    }
  }

  /**
   * 获取项目的拦截规则
   */
  static async getProjectRules(projectId: string): Promise<InterceptionRule[]> {
    const project = (await this.getProjects()).find(p => p.id === projectId)
    return project?.rules || []
  }

  /**
   * 更新项目的拦截规则
   */
  static async updateProjectRules(projectId: string, rules: InterceptionRule[]): Promise<void> {
    await this.updateProject(projectId, { rules })
  }

  /**
   * 添加拦截规则到项目
   */
  static async addRule(projectId: string, rule: InterceptionRule): Promise<void> {
    const rules = await this.getProjectRules(projectId)
    rules.push(rule)
    await this.updateProjectRules(projectId, rules)
  }

  /**
   * 更新拦截规则
   */
  static async updateRule(projectId: string, ruleId: string, updates: Partial<InterceptionRule>): Promise<void> {
    const rules = await this.getProjectRules(projectId)
    const index = rules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates }
      await this.updateProjectRules(projectId, rules)
    }
  }

  /**
   * 删除拦截规则
   */
  static async deleteRule(projectId: string, ruleId: string): Promise<void> {
    const rules = await this.getProjectRules(projectId)
    const filtered = rules.filter(r => r.id !== ruleId)
    await this.updateProjectRules(projectId, filtered)
  }
}


