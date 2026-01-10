/**
 * 主题配置和切换逻辑
 */
import { lightColors, darkColors, type ColorTheme } from './colors'
import { ref, watch, onMounted } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'mockinterceptor_theme'

// 当前主题模式
const currentTheme = ref<ThemeMode>('light')

/**
 * 获取当前主题颜色
 */
export function getThemeColors(): ColorTheme {
  return currentTheme.value === 'dark' ? darkColors : lightColors
}

/**
 * 应用主题到 CSS 变量
 */
export function applyTheme(theme: ThemeMode) {
  const colors = theme === 'dark' ? darkColors : lightColors
  const root = document.documentElement
  
  // 应用背景色
  root.style.setProperty('--color-bg-primary', colors.bgPrimary)
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--color-bg-tertiary', colors.bgTertiary)
  root.style.setProperty('--color-bg-elevated', colors.bgElevated)
  
  // 应用文本色
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-text-tertiary', colors.textTertiary)
  root.style.setProperty('--color-text-inverse', colors.textInverse)
  
  // 应用边框色
  root.style.setProperty('--color-border-primary', colors.borderPrimary)
  root.style.setProperty('--color-border-secondary', colors.borderSecondary)
  root.style.setProperty('--color-border-focus', colors.borderFocus)
  
  // 应用主色
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-primary-hover', colors.primaryHover)
  root.style.setProperty('--color-primary-active', colors.primaryActive)
  root.style.setProperty('--color-primary-light', colors.primaryLight)
  
  // 应用功能色
  root.style.setProperty('--color-success', colors.success)
  root.style.setProperty('--color-success-light', colors.successLight)
  root.style.setProperty('--color-warning', colors.warning)
  root.style.setProperty('--color-warning-light', colors.warningLight)
  root.style.setProperty('--color-danger', colors.danger)
  root.style.setProperty('--color-danger-light', colors.dangerLight)
  root.style.setProperty('--color-info', colors.info)
  root.style.setProperty('--color-info-light', colors.infoLight)
  
  // 应用阴影
  root.style.setProperty('--color-shadow-sm', colors.shadowSm)
  root.style.setProperty('--color-shadow-md', colors.shadowMd)
  root.style.setProperty('--color-shadow-lg', colors.shadowLg)
  
  // 应用覆盖层
  root.style.setProperty('--color-overlay', colors.overlay)
  
  // 更新类名
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(`theme-${theme}`)
}

/**
 * 设置主题
 */
export function setTheme(theme: ThemeMode) {
  currentTheme.value = theme
  applyTheme(theme)
  
  // 保存到存储
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme })
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
}

/**
 * 切换主题
 */
export function toggleTheme() {
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

/**
 * 初始化主题
 */
export async function initTheme() {
  let savedTheme: ThemeMode | null = null
  
  // 从存储中读取
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.local.get(THEME_STORAGE_KEY)
    const theme = result[THEME_STORAGE_KEY]
    if (theme === 'light' || theme === 'dark') {
      savedTheme = theme
    }
  } else {
    const theme = localStorage.getItem(THEME_STORAGE_KEY)
    if (theme === 'light' || theme === 'dark') {
      savedTheme = theme
    }
  }
  
  // 如果没有保存的主题，使用系统偏好
  if (!savedTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    savedTheme = prefersDark ? 'dark' : 'light'
  }
  
  setTheme(savedTheme)
}

/**
 * 使用主题的 Composable
 */
export function useTheme() {
  onMounted(() => {
    initTheme()
  })
  
  return {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    getThemeColors,
  }
}

