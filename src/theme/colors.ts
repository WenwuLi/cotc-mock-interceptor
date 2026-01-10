/**
 * 颜色定义
 * 定义浅色和深色主题的颜色变量
 */

export const lightColors = {
  // 背景色
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#f1f3f5',
  bgElevated: '#ffffff',
  
  // 文本色
  textPrimary: '#1a1a1a',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // 边框色
  borderPrimary: '#e5e7eb',
  borderSecondary: '#d1d5db',
  borderFocus: '#3b82f6',
  
  // 主色
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',
  primaryLight: '#dbeafe',
  
  // 功能色
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // 阴影
  shadowSm: 'rgba(0, 0, 0, 0.05)',
  shadowMd: 'rgba(0, 0, 0, 0.1)',
  shadowLg: 'rgba(0, 0, 0, 0.15)',
  
  // 覆盖层
  overlay: 'rgba(0, 0, 0, 0.5)',
}

export const darkColors = {
  // 背景色
  bgPrimary: '#1a1a1a',
  bgSecondary: '#242424',
  bgTertiary: '#2d2d2d',
  bgElevated: '#2d2d2d',
  
  // 文本色
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textTertiary: '#737373',
  textInverse: '#1a1a1a',
  
  // 边框色
  borderPrimary: '#404040',
  borderSecondary: '#525252',
  borderFocus: '#60a5fa',
  
  // 主色
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  primaryActive: '#2563eb',
  primaryLight: '#1e3a8a',
  
  // 功能色
  success: '#34d399',
  successLight: '#065f46',
  warning: '#fbbf24',
  warningLight: '#78350f',
  danger: '#f87171',
  dangerLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',
  
  // 阴影
  shadowSm: 'rgba(0, 0, 0, 0.3)',
  shadowMd: 'rgba(0, 0, 0, 0.4)',
  shadowLg: 'rgba(0, 0, 0, 0.5)',
  
  // 覆盖层
  overlay: 'rgba(0, 0, 0, 0.7)',
}

export type ColorTheme = typeof lightColors


