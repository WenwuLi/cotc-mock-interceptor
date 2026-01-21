<template>
  <div class="interception-list">
    <div v-if="rules.length === 0" class="empty-state">
      <a-empty description="暂无拦截规则，点击上方按钮创建新规则" />
    </div>
    <div v-else class="rule-list">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="rule-item"
        :class="{ enabled: rule.enabled }"
      >
        <div class="rule-checkbox">
          <a-checkbox
            :checked="rule.enabled"
            @change="(e: any) => $emit('toggle', rule, e.target.checked)"
          />
        </div>
        <div class="rule-content">
          <div class="rule-name-row" @click="handleEdit(rule)">
            <div class="rule-name">
              {{ rule.name }}
            </div>
          </div>
          <div class="rule-bottom-row">
            <div class="rule-url">
              {{ rule.urlPattern }}
            </div>
            <div class="rule-actions">
              <a-button type="link" size="small" @click.stop="handleEdit(rule)">
                编辑
              </a-button>
              <a-button type="link" size="small" @click.stop="$emit('copy', rule)">
                复制
              </a-button>
              <a-button
                type="link"
                danger
                size="small"
                @click.stop="handleDelete(rule)"
              >
                删除
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Modal } from "ant-design-vue";
import type { InterceptionRule } from "@/types";

defineProps<{
  rules: InterceptionRule[];
}>();

const emit = defineEmits<{
  toggle: [rule: InterceptionRule, enabled: boolean];
  edit: [rule: InterceptionRule];
  copy: [rule: InterceptionRule];
  delete: [rule: InterceptionRule];
}>();

const handleEdit = (rule: InterceptionRule) => {
  emit("edit", rule);
};

const handleDelete = (rule: InterceptionRule) => {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除规则"${rule.name}"吗？此操作不可恢复。`,
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      emit("delete", rule);
    },
  });
};
</script>

<style scoped>
.interception-list {
  min-height: 200px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.rule-item {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
}

.rule-item:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
}

.rule-item.enabled {
  background: var(--color-success-light);
  border-left: 3px solid var(--color-success);
}

.rule-checkbox {
  margin-right: var(--spacing-md);
  margin-top: 2px;
  flex-shrink: 0;
}

.rule-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
}

.rule-name-row {
  cursor: pointer;
}

.rule-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.rule-url {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro",
    monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.rule-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.empty-state {
  padding: var(--spacing-4xl) 0;
}
</style>
