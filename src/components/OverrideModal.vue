<template>
  <a-modal
    :open="visible"
    :title="rule ? '编辑Override' : '创建Override'"
    :width="700"
    :ok-text="rule ? '更新' : '创建'"
    cancel-text="取消"
    :body-style="{ padding: '16px 20px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }"
    :centered="true"
    @ok="handleSave"
    @cancel="handleCancel"
    class="override-modal"
  >
    <a-form 
      :model="form" 
      layout="vertical"
      :label-col="{ style: { marginBottom: '4px' } }"
      class="override-form"
    >
      <a-form-item
        label="规则名称"
        :validate-status="errors.name ? 'error' : ''"
        :help="errors.name"
        class="form-item-compact"
      >
        <a-input
          v-model:value="form.name"
          placeholder="为这个拦截规则起一个容易识别的名称"
        />
      </a-form-item>

      <a-form-item
        label="目标URL模式"
        :validate-status="errors.urlPattern ? 'error' : ''"
        :help="errors.urlPattern || '支持通配符(*)匹配,如: * /api/* 匹配所有包含/api/的请求'"
        class="form-item-compact"
      >
        <a-input
          v-model:value="form.urlPattern"
          placeholder="/api/user/info"
        />
      </a-form-item>

      <a-form-item
        label="响应内容 (JSON格式)"
        :validate-status="errors.responseJson ? 'error' : ''"
        :help="errors.responseJson || '输入要返回的JSON响应内容,将替换原始服务器响应'"
        class="form-item-compact json-item"
      >
        <div class="editor-container" :class="{ 'error-border': errors.responseJson, 'is-fullscreen': isFullscreen }">
          <div class="editor-toolbar">
            <a-space>
              <a-button size="small" type="link" @click="toggleFullscreen" class="toolbar-btn">
                <template #icon>
                  <FullscreenOutlined v-if="!isFullscreen" />
                  <FullscreenExitOutlined v-else />
                </template>
                {{ isFullscreen ? '退出全屏' : '全屏' }}
              </a-button>
              <a-button size="small" type="link" @click="handleFormat" class="toolbar-btn">格式化</a-button>
              <a-button size="small" type="link" @click="handleMinify" class="toolbar-btn">压缩</a-button>
            </a-space>
          </div>
          <codemirror
            v-model="form.responseJsonText"
            placeholder='{"code": 200, "message": "success", "data": {}}'
            :style="isFullscreen ? {} : { height: '260px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
            class="json-editor"
          />
        </div>
      </a-form-item>

      <a-form-item class="form-item-compact checkbox-item">
        <a-checkbox v-model:checked="form.enabled">
          立即启用此规则
        </a-checkbox>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { InterceptionRule } from '@/types'
import { validatePattern } from '@/utils/urlMatcher'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { message } from 'ant-design-vue'
import { useTheme } from '@/theme/theme'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  open: boolean
  rule?: InterceptionRule | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [rule: InterceptionRule]
  cancel: []
}>()

const { theme } = useTheme()
const isFullscreen = ref(false)

const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const form = ref({
  name: '',
  urlPattern: '',
  responseJsonText: '',
  enabled: true,
})

const errors = ref({
  name: '',
  urlPattern: '',
  responseJson: '',
})

// CodeMirror 扩展配置：根据主题动态切换
const extensions = computed(() => {
  const exts: any[] = [json()]
  if (theme.value === 'dark') {
    exts.push(oneDark)
  }
  return exts
})

/**
 * 格式化 JSON
 */
const handleFormat = () => {
  try {
    if (!form.value.responseJsonText) return
    const obj = JSON.parse(form.value.responseJsonText)
    form.value.responseJsonText = JSON.stringify(obj, null, 2)
  } catch (e) {
    message.error('JSON 格式不正确，无法格式化')
  }
}

/**
 * 压缩 JSON
 */
const handleMinify = () => {
  try {
    if (!form.value.responseJsonText) return
    const obj = JSON.parse(form.value.responseJsonText)
    form.value.responseJsonText = JSON.stringify(obj)
  } catch (e) {
    message.error('JSON 格式不正确，无法压缩')
  }
}

// 监听 rule 变化，初始化表单
watch(
  () => props.rule,
  (rule) => {
    if (rule) {
      form.value = {
        name: rule.name,
        urlPattern: rule.urlPattern,
        responseJsonText: JSON.stringify(rule.responseJson, null, 2),
        enabled: rule.enabled,
      }
    } else {
      form.value = {
        name: '',
        urlPattern: '',
        responseJsonText: '',
        enabled: true,
      }
    }
    // 清除错误
    errors.value = {
      name: '',
      urlPattern: '',
      responseJson: '',
    }
  },
  { immediate: true }
)

// 监听 open 变化，重置表单
watch(
  () => props.open,
  (open) => {
    if (open) {
      // 弹窗打开时，如果 rule 为 null，重置表单
      if (!props.rule) {
        form.value = {
          name: '',
          urlPattern: '',
          responseJsonText: '',
          enabled: true,
        }
        errors.value = {
          name: '',
          urlPattern: '',
          responseJson: '',
        }
      }
    } else {
      // 弹窗关闭时，清除错误
      errors.value = {
        name: '',
        urlPattern: '',
        responseJson: '',
      }
      isFullscreen.value = false
    }
  }
)

const validateForm = (): boolean => {
  errors.value = {
    name: '',
    urlPattern: '',
    responseJson: '',
  }

  let isValid = true

  // 验证规则名称
  if (!form.value.name.trim()) {
    errors.value.name = '请输入规则名称'
    isValid = false
  }

  // 验证 URL 模式
  if (!form.value.urlPattern.trim()) {
    errors.value.urlPattern = '请输入URL模式'
    isValid = false
  } else if (!validatePattern(form.value.urlPattern)) {
    errors.value.urlPattern = 'URL模式格式无效'
    isValid = false
  }

  // 验证 JSON
  if (!form.value.responseJsonText.trim()) {
    errors.value.responseJson = '请输入JSON响应内容'
    isValid = false
  } else {
    try {
      JSON.parse(form.value.responseJsonText)
    } catch (e) {
      errors.value.responseJson = 'JSON格式无效，请检查语法'
      isValid = false
    }
  }

  return isValid
}

const handleSave = () => {
  if (!validateForm()) {
    return
  }

  try {
    const responseJson = JSON.parse(form.value.responseJsonText)
    const rule: InterceptionRule = {
      id: props.rule?.id || '',
      name: form.value.name.trim(),
      urlPattern: form.value.urlPattern.trim(),
      responseJson,
      enabled: form.value.enabled,
      createdAt: props.rule?.createdAt,
    }

    emit('save', rule)
  } catch (error) {
    console.error('解析JSON失败:', error)
    errors.value.responseJson = 'JSON解析失败'
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
:deep(.override-modal .ant-modal-content) {
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 20px var(--color-shadow-lg);
  background: var(--color-bg-elevated);
  transition: background-color var(--transition-normal) var(--easing-ease-in-out);
}

:deep(.override-modal .ant-modal-header) {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  transition: background-color var(--transition-normal) var(--easing-ease-in-out),
              border-color var(--transition-normal) var(--easing-ease-in-out);
}

:deep(.override-modal .ant-modal-title) {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

:deep(.override-modal .ant-modal-footer) {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  transition: background-color var(--transition-normal) var(--easing-ease-in-out),
              border-color var(--transition-normal) var(--easing-ease-in-out);
}

.override-form {
  margin: 0;
}

.form-item-compact {
  margin-bottom: var(--spacing-md);
}

.form-item-compact:last-child {
  margin-bottom: 0;
}

.form-help {
  margin-top: var(--spacing-xs);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.json-item {
  margin-bottom: var(--spacing-sm);
}

.editor-container {
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-bg-secondary);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
  position: relative;
}

.editor-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
}

.editor-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.editor-container.is-fullscreen .json-editor {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex !important;
  flex-direction: column;
}

.editor-container.is-fullscreen :deep(.cm-editor) {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container.is-fullscreen :deep(.cm-scroller) {
  flex: 1;
  min-height: 0;
  overflow: auto !important;
}

.editor-toolbar {
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.toolbar-btn {
  font-size: var(--font-size-xs);
  padding: 0 4px;
  height: 24px;
  color: var(--color-text-secondary);
}

.toolbar-btn:hover {
  color: var(--color-primary);
}

.json-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: var(--font-size-sm);
  background: transparent !important;
}

:deep(.cm-editor) {
  outline: none !important;
  background: transparent !important;
}

:deep(.cm-scroller) {
  font-family: inherit !important;
}

:deep(.cm-focused) {
  outline: none !important;
}

.checkbox-item {
  margin-top: var(--spacing-sm);
  margin-bottom: 0;
}

.error-border {
  border-color: var(--color-danger) !important;
}

.error-border:focus {
  border-color: var(--color-danger) !important;
  box-shadow: 0 0 0 2px var(--color-danger-light) !important;
}

:deep(.ant-form-item-label > label) {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

:deep(.ant-form-item-explain-error) {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
  color: var(--color-danger);
}

:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-input-affix-wrapper) {
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
  background: var(--color-bg-elevated);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover),
:deep(.ant-input-affix-wrapper:hover) {
  border-color: var(--color-primary);
}

:deep(.ant-textarea) {
  border-radius: var(--radius-sm);
}
</style>

