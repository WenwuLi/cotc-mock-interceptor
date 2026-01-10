/**
 * URL 匹配工具
 * 支持通配符匹配，如 * /api/* 或 /api/*
 */

/**
 * 将用户友好的通配符模式转换为 Chrome declarativeNetRequest 支持的格式
 * @param pattern 用户输入的模式，如 * /api/* 或 /api/*
 * @returns Chrome API 支持的 urlFilter 或 regexFilter
 */
export function convertPatternToChromeFilter(pattern: string): {
  urlFilter?: string
  regexFilter?: string
} {
  // 如果包含通配符，使用 regexFilter
  if (pattern.includes('*')) {
    // 将 * 转换为 .*（匹配任意字符）
    // 转义其他正则特殊字符
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
      .replace(/\*/g, '.*') // 将 * 替换为 .*
    
    return {
      regexFilter: `^${escaped}$`,
    }
  }
  
  // 不包含通配符，使用简单的 urlFilter
  return {
    urlFilter: pattern,
  }
}

/**
 * 检查 URL 是否匹配模式
 * @param url 要检查的 URL
 * @param pattern 匹配模式，支持通配符
 * @returns 是否匹配
 */
export function matchUrl(url: string, pattern: string): boolean {
  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
    .replace(/\*/g, '.*') // 将 * 替换为 .*
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(url)
}

/**
 * 验证 URL 模式格式
 * @param pattern URL 模式
 * @returns 是否有效
 */
export function validatePattern(pattern: string): boolean {
  if (!pattern || pattern.trim().length === 0) {
    return false
  }
  // 基本验证：不能只包含通配符
  if (pattern.trim() === '*') {
    return false
  }
  return true
}

