<template>
  <div
    class="project-card"
    :class="{ active: isActive }"
    @click="$emit('select', project)"
  >
    <div class="card-header">
      <h3 class="project-name">{{ project.name }}</h3>
      <a-switch
        :checked="project.enabled"
        @change="handleToggle"
        @click.stop
        :checked-children="'已启用'"
        :un-checked-children="'已禁用'"
      />
    </div>
    <div class="card-content">
      <div class="stats">
        <span>{{ project.rules.length }} 总规则</span>
        <span>{{ enabledRulesCount }} 已启用</span>
      </div>
      <div class="meta">
        <span>创建于 {{ formatDate(project.createdAt) }}</span>
      </div>
    </div>
    <div class="card-actions" @click.stop>
      <a-button type="link" danger size="small" @click="handleDelete">
        删除
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Modal } from 'ant-design-vue'
import type { Project } from '@/types'

const props = defineProps<{
  project: Project
  isActive?: boolean
}>()

const emit = defineEmits<{
  select: [project: Project]
  toggle: [project: Project, enabled: boolean]
  delete: [project: Project]
}>()

const enabledRulesCount = computed(() => {
  return props.project.rules.filter(r => r.enabled).length
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

const handleToggle = (checked: boolean) => {
  emit('toggle', props.project, checked)
}

const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除项目"${props.project.name}"吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      emit('delete', props.project)
    },
  })
}
</script>

<style scoped>
.project-card {
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  background: var(--color-bg-elevated);
  cursor: pointer;
  transition: all var(--transition-normal) var(--easing-ease-in-out);
  box-shadow: 0 1px 3px var(--color-shadow-sm);
  position: relative;
  overflow: hidden;
}

.project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  opacity: 0;
  transition: opacity var(--transition-normal) var(--easing-ease-in-out);
}

.project-card:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-elevated);
  box-shadow: 0 4px 12px var(--color-shadow-md);
  transform: translateY(-2px);
}

.project-card:hover::before {
  opacity: 1;
}

.project-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 4px 12px var(--color-primary-light);
}

.project-card.active::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.project-name {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.card-content {
  margin-bottom: var(--spacing-md);
}

.stats {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.meta {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-primary);
}
</style>


