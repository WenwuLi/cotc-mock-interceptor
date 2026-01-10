<template>
  <div class="project-list">
    <div v-if="projects.length === 0" class="empty-state">
      <a-empty description="暂无项目，点击上方按钮创建新项目" />
    </div>
    <div v-else class="project-grid">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        @select="$emit('select', project)"
        @toggle="$emit('toggle', project, $event)"
        @delete="$emit('delete', project)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@/types'
import ProjectCard from './ProjectCard.vue'

defineProps<{
  projects: Project[]
  searchKeyword?: string
}>()

defineEmits<{
  select: [project: Project]
  toggle: [project: Project, enabled: boolean]
  delete: [project: Project]
}>()
</script>

<style scoped>
.project-list {
  min-height: 200px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.empty-state {
  padding: var(--spacing-4xl) 0;
}
</style>


