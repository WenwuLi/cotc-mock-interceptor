<template>
  <a-modal
    :open="visible"
    :title="rule ? '编辑Override' : '创建Override'"
    :width="900"
    :ok-text="rule ? '更新' : '创建'"
    :body-style="{ padding: '20px 24px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }"
    :centered="true"
    @ok="handleSave"
    @cancel="handleCancel"
    class="override-modal"
  >
    <a-form 
      :model="form" 
      layout="vertical"
      :label-col="{ style: { marginBottom: '8px' } }"
      class="override-form"
    >
      <a-form-item label="请求类型" class="form-item-compact">
        <a-select v-model:value="form.requestType" disabled>
          <a-select-option value="xhr">XHR/Fetch请求</a-select-option>
        </a-select>
        <div class="form-help">
          当前版本专注于XHR/Fetch请求拦截
        </div>
      </a-form-item>

      <a-form-item
        label="规则名称"
        :validate-status="errors.name ? 'error' : ''"
        :help="errors.name"
        class="form-item-compact"
      >
        <a-input
          v-model:value="form.name"
          placeholder="为这个拦截规则起一个容易识别的名称"
          size="large"
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
          size="large"
        />
      </a-form-item>

      <a-form-item
        label="响应内容 (JSON格式)"
        :validate-status="errors.responseJson ? 'error' : ''"
        :help="errors.responseJson || '输入要返回的JSON响应内容,将替换原始服务器响应'"
        class="form-item-compact json-item"
      >
        <a-textarea
          v-model:value="form.responseJsonText"
          :rows="8"
          placeholder='{"code": 200, "message": "success", "data": {}}'
          :class="{ 'error-border': errors.responseJson }"
          class="json-textarea"
        />
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

const props = defineProps<{
  open: boolean
  rule?: InterceptionRule | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [rule: InterceptionRule]
  cancel: []
}>()

const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const form = ref({
  requestType: 'xhr',
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

// 监听 rule 变化，初始化表单
watch(
  () => props.rule,
  (rule) => {
    if (rule) {
      form.value = {
        requestType: 'xhr',
        name: rule.name,
        urlPattern: rule.urlPattern,
        responseJsonText: JSON.stringify(rule.responseJson, null, 2),
        enabled: rule.enabled,
      }
    } else {
      form.value = {
        requestType: 'xhr',
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
    if (!open) {
      errors.value = {
        name: '',
        urlPattern: '',
        responseJson: '',
      }
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
  padding: var(--spacing-lg) var(--spacing-xl);
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
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  transition: background-color var(--transition-normal) var(--easing-ease-in-out),
              border-color var(--transition-normal) var(--easing-ease-in-out);
}

.override-form {
  margin: 0;
}

.form-item-compact {
  margin-bottom: var(--spacing-lg);
}

.form-item-compact:last-child {
  margin-bottom: 0;
}

.form-help {
  margin-top: var(--spacing-sm);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.json-item {
  margin-bottom: var(--spacing-md);
}

.json-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  resize: vertical;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
}

.json-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
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

