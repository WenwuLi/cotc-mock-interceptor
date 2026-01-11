import type { Project, InterceptionRule, ChromeRule } from '@/types'
import { convertPatternToChromeFilter } from '@/utils/urlMatcher'
import { StorageManager } from '@/utils/storage'

/**
 * 规则ID生成器（从1开始，避免与静态规则冲突）
 */
let nextRuleId = 1

/**
 * 规则映射：Chrome规则ID -> 项目ID和规则ID
 */
const ruleMapping = new Map<number, { projectId: string; ruleId: string }>()

/**
 * 将 JSON 对象转换为 base64 编码的数据 URL
 */
function createDataUrl(jsonData: object): string {
  const jsonString = JSON.stringify(jsonData, null, 2)
  const base64 = btoa(unescape(encodeURIComponent(jsonString)))
  return `data:application/json;base64,${base64}`
}

/**
 * 将拦截规则转换为 Chrome declarativeNetRequest 规则
 */
function convertRuleToChromeRule(
  rule: InterceptionRule,
  chromeRuleId: number,
  projectId: string
): ChromeRule {
  const filter = convertPatternToChromeFilter(rule.urlPattern)
  
  return {
    id: chromeRuleId,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: createDataUrl(rule.responseJson),
      },
    },
    condition: {
      ...filter,
      resourceTypes: ['xmlhttprequest', 'fetch'] as chrome.declarativeNetRequest.ResourceType[],
    },
  }
}

/**
 * 同步所有启用的规则到 Chrome
 */
async function syncRulesToChrome(): Promise<void> {
  const projects = await StorageManager.getProjects()
  const enabledProjects = projects.filter(p => p.enabled)
  
  const chromeRules: ChromeRule[] = []
  const newRuleMapping = new Map<number, { projectId: string; ruleId: string }>()
  
  // 收集所有启用的规则
  for (const project of enabledProjects) {
    for (const rule of project.rules) {
      if (rule.enabled) {
        const chromeRuleId = nextRuleId++
        const chromeRule = convertRuleToChromeRule(rule, chromeRuleId, project.id)
        chromeRules.push(chromeRule)
        newRuleMapping.set(chromeRuleId, {
          projectId: project.id,
          ruleId: rule.id,
        })
      }
    }
  }
  
  // 获取当前所有动态规则
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules()
  const existingRuleIds = existingRules.map(r => r.id)
  
  // 删除所有现有规则
  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
    })
  }
  
  // 添加新规则
  if (chromeRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: chromeRules,
    })
  }
  
  // 更新映射
  ruleMapping.clear()
  newRuleMapping.forEach((value, key) => {
    ruleMapping.set(key, value)
  })
  
  // 重置规则ID生成器（如果所有规则都被删除）
  if (chromeRules.length === 0) {
    nextRuleId = 1
  }
}

/**
 * 监听存储变化，自动同步规则
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.projects || changes.currentProjectId)) {
    syncRulesToChrome().catch(console.error)
  }
})

/**
 * 扩展安装或启动时初始化
 */
chrome.runtime.onInstalled.addListener(() => {
  syncRulesToChrome().catch(console.error)
})

// 扩展启动时同步规则
syncRulesToChrome().catch(console.error)


