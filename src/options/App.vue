<template>
  <a-config-provider :theme="themeConfig">
    <StyleProvider hash-priority="high">
      <div class="app-container">
      <!-- VS Code 风格布局 -->
      <div class="workbench">
        <!-- 左侧侧边栏 -->
        <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
          <div class="sidebar-header">
            <div class="sidebar-title" v-show="!sidebarCollapsed">
              <span>项目</span>
            </div>
            <div class="sidebar-actions">
              <a-button
                type="text"
                size="small"
                @click="toggleTheme"
                class="sidebar-action-btn"
                :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
              >
                <template #icon>
                  <BulbOutlined v-if="theme === 'dark'" />
                  <span v-else class="theme-icon">🌙</span>
                </template>
              </a-button>
              <a-button
                type="text"
                size="small"
                @click="handleCreateProject"
                class="sidebar-action-btn"
                title="新建项目"
              >
                <template #icon>
                  <PlusOutlined />
                </template>
              </a-button>
              <a-button
                v-if="!isSmallScreen"
                type="text"
                size="small"
                @click="toggleSidebar"
                class="sidebar-toggle-btn"
                :title="sidebarCollapsed ? '展开侧边栏' : '收缩侧边栏'"
              >
                <template #icon>
                  <MenuFoldOutlined v-if="!sidebarCollapsed" />
                  <MenuUnfoldOutlined v-else />
                </template>
              </a-button>
            </div>
          </div>
          <div class="sidebar-content">
            <div class="sidebar-search">
              <a-input
                v-model:value="searchKeyword"
                placeholder="搜索项目..."
                size="small"
                allow-clear
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
            </div>
            <div class="sidebar-list">
              <div
                v-for="project in filteredProjects"
                :key="project.id"
                class="sidebar-item"
                :class="{ active: currentProject?.id === project.id }"
                @click="handleSelectProject(project)"
              >
                <div class="sidebar-item-icon" v-if="!sidebarCollapsed">
                  <GlobalOutlined />
                </div>
                <div class="sidebar-item-avatar" v-else>
                  {{ project.name.charAt(0).toUpperCase() }}
                </div>
                <div class="sidebar-item-label" v-show="!sidebarCollapsed">
                  {{ project.name }}
                </div>
                <div
                  class="sidebar-item-actions"
                  @click.stop
                  v-show="!sidebarCollapsed"
                >
                  <a-switch
                    :checked="project.enabled"
                    @change="(checked: boolean) => handleToggleProject(project, checked)"
                    size="small"
                    @click.stop
                  />
                </div>
              </div>
              <div v-if="filteredProjects.length === 0" class="sidebar-empty">
                <p>暂无项目</p>
              </div>
            </div>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="editor-area">
          <!-- 项目列表视图 -->
          <div v-if="!currentProject" class="editor-content">
            <div class="editor-empty">
              <div class="empty-icon">
                <GlobalOutlined />
              </div>
              <h2 class="empty-title">欢迎使用 cotc-mock-interceptor</h2>
              <p class="empty-description">
                从左侧选择一个项目，或创建新项目开始
              </p>
              <a-button
                type="primary"
                size="large"
                @click="handleCreateProject"
              >
                <template #icon>
                  <PlusOutlined />
                </template>
                创建新项目
              </a-button>
            </div>
          </div>

          <!-- 拦截规则管理视图 -->
          <div v-else class="editor-content">
            <div class="editor-body">
              <div class="editor-toolbar">
                <div class="toolbar-left">
                  <div class="toolbar-group">
                    <a-input
                      v-model:value="ruleSearchKeyword"
                      placeholder="搜索规则..."
                      size="small"
                      allow-clear
                      class="toolbar-search"
                    >
                      <template #prefix>
                        <SearchOutlined />
                      </template>
                    </a-input>
                    <a-select
                      v-model:value="filterType"
                      size="small"
                      class="toolbar-filter"
                    >
                      <a-select-option value="all">全部</a-select-option>
                      <a-select-option value="enabled">已启用</a-select-option>
                      <a-select-option value="disabled">已禁用</a-select-option>
                    </a-select>
                  </div>
                </div>
                <div class="toolbar-right">
                  <div class="toolbar-group">
                    <a-button size="small" @click="handleEnableAll"
                      >启用全部</a-button
                    >
                    <a-button size="small" @click="handleDisableAll"
                      >禁用全部</a-button
                    >
                    <a-button size="small" danger @click="handleClearList"
                      >清空</a-button
                    >
                    <a-button
                      type="primary"
                      size="small"
                      @click="handleCreateRule"
                    >
                      <template #icon>
                        <PlusOutlined />
                      </template>
                      新建规则
                    </a-button>
                  </div>
                </div>
              </div>
              <div class="editor-main">
                <div class="editor-header">
                  <div class="editor-title-section">
                    <div class="editor-title-wrapper">
                      <h1 class="editor-title">{{ currentProject.name }}</h1>
                      <div class="editor-title-actions">
                        <a-button
                          type="text"
                          size="small"
                          class="editor-title-action-btn"
                          @click="() => handleEditProject(currentProject)"
                          title="编辑项目名称"
                        >
                          <template #icon>
                            <EditOutlined />
                          </template>
                        </a-button>
                        <a-button
                          type="text"
                          size="small"
                          danger
                          class="editor-title-action-btn"
                          @click="
                            () => handleDeleteProjectConfirm(currentProject)
                          "
                          title="删除项目"
                        >
                          <template #icon>
                            <DeleteOutlined />
                          </template>
                        </a-button>
                      </div>
                    </div>
                    <div class="editor-meta">
                      <span class="meta-label">项目状态:</span>
                      <a-switch
                        :checked="currentProject.enabled"
                        @change="(checked: boolean) => handleToggleProject(currentProject, checked)"
                        size="small"
                      />
                      <span class="meta-item">{{
                        currentProject.enabled ? "已启用" : "已禁用"
                      }}</span>
                    </div>
                  </div>
                </div>
                <div class="editor-scrollable">
                  <InterceptionList
                    :rules="filteredRules"
                    @toggle="handleToggleRule"
                    @edit="handleEditRule"
                    @delete="handleDeleteRule"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- 项目创建/编辑弹窗 -->
      <a-modal
        v-model:open="projectModalVisible"
        :title="editingProject ? '编辑项目' : '新建项目'"
        @ok="handleSaveProject"
        @cancel="handleCancelProject"
      >
        <a-form
          :model="projectForm"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="项目名称" required>
            <a-input
              v-model:value="projectForm.name"
              placeholder="请输入项目名称"
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 拦截规则编辑弹窗 -->
      <OverrideModal
        v-model:open="ruleModalVisible"
        :rule="editingRule"
        @save="handleSaveRule"
        @cancel="handleCancelRule"
      />
      </div>
    </StyleProvider>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  GlobalOutlined,
  PlusOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import { message, theme as antdTheme, Modal, StyleProvider } from "ant-design-vue";
import type { Project, InterceptionRule } from "@/types";
import { StorageManager } from "@/utils/storage";
import { useTheme, getThemeColors } from "@/theme/theme";
import InterceptionList from "@/components/InterceptionList.vue";
import OverrideModal from "@/components/OverrideModal.vue";

// 主题系统
const { theme, toggleTheme } = useTheme();
const themeConfig = computed(() => {
  const colors = getThemeColors();
  const isDark = theme.value === "dark";
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.danger,
      colorInfo: colors.info,
      colorBgContainer: colors.bgElevated,
      colorBgElevated: colors.bgElevated,
      colorBgBase: colors.bgPrimary,
      colorText: colors.textPrimary,
      colorTextSecondary: colors.textSecondary,
      colorTextTertiary: colors.textTertiary,
      colorBorder: colors.borderPrimary,
      colorBorderSecondary: colors.borderSecondary,
      borderRadius: 6,
      wireframe: false,
    },
  };
});

// 状态
const projects = ref<Project[]>([]);
const currentProject = ref<Project | null>(null);
const searchKeyword = ref("");
const ruleSearchKeyword = ref("");
const filterType = ref<"all" | "enabled" | "disabled">("all");
const activeTab = ref("");
const isReady = ref(true);
const isSmallScreen = ref(false);
const sidebarCollapsed = ref(false);

// 弹窗状态
const projectModalVisible = ref(false);
const ruleModalVisible = ref(false);
const editingProject = ref<Project | null>(null);
const editingRule = ref<InterceptionRule | null>(null);

// 表单数据
const projectForm = ref({
  name: "",
});

// 计算属性
const filteredProjects = computed(() => {
  if (!searchKeyword.value) {
    return projects.value;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return projects.value.filter((p) => p.name.toLowerCase().includes(keyword));
});

const enabledRulesCount = computed(() => {
  return currentProject.value?.rules.filter((r) => r.enabled).length || 0;
});

const filteredRules = computed(() => {
  if (!currentProject.value) {
    return [];
  }
  let rules = currentProject.value.rules;

  // 按状态筛选
  if (filterType.value === "enabled") {
    rules = rules.filter((r) => r.enabled);
  } else if (filterType.value === "disabled") {
    rules = rules.filter((r) => !r.enabled);
  }

  // 按关键词搜索
  if (ruleSearchKeyword.value) {
    const keyword = ruleSearchKeyword.value.toLowerCase();
    rules = rules.filter(
      (r) =>
        r.name.toLowerCase().includes(keyword) ||
        r.urlPattern.toLowerCase().includes(keyword)
    );
  }

  return rules;
});

// 方法
const loadProjects = async () => {
  projects.value = await StorageManager.getProjects();
  const currentProjectId = (await StorageManager.getAll()).currentProjectId;
  if (currentProjectId) {
    currentProject.value =
      projects.value.find((p) => p.id === currentProjectId) || null;
  }
};

const handleCreateProject = () => {
  editingProject.value = null;
  projectForm.value.name = "";
  projectModalVisible.value = true;
};

const handleEditProject = (project: Project) => {
  editingProject.value = project;
  projectForm.value.name = project.name;
  projectModalVisible.value = true;
};

const handleSaveProject = async () => {
  if (!projectForm.value.name.trim()) {
    message.error("请输入项目名称");
    return;
  }

  try {
    if (editingProject.value) {
      // 更新项目
      await StorageManager.updateProject(editingProject.value.id, {
        name: projectForm.value.name,
      });
      // message.success("项目更新成功");
    } else {
      // 创建新项目
      const newProject: Project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectForm.value.name,
        enabled: false,
        rules: [],
        createdAt: new Date().toISOString(),
      };
      await StorageManager.addProject(newProject);
      message.success("项目创建成功");
    }
    projectModalVisible.value = false;
    await loadProjects();
    // 如果编辑的是当前项目，更新当前项目显示
    if (
      editingProject.value &&
      currentProject.value?.id === editingProject.value.id
    ) {
      const updated = await StorageManager.getProjects();
      currentProject.value =
        updated.find((p) => p.id === editingProject.value!.id) || null;
    }
  } catch (error) {
    console.error("保存项目失败:", error);
    message.error("保存项目失败");
  }
};

const handleCancelProject = () => {
  projectModalVisible.value = false;
  editingProject.value = null;
  projectForm.value.name = "";
};

const handleSelectProject = async (project: Project) => {
  await StorageManager.setCurrentProject(project.id);
  currentProject.value = project;
  activeTab.value = project.id;
  // // 选择项目后自动收缩侧边栏
  // sidebarCollapsed.value = true
};

const toggleSidebar = () => {
  // 小屏幕时不允许展开
  if (isSmallScreen.value) {
    return;
  }
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 检测屏幕尺寸
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 360;
  // 小屏幕时强制收起侧边栏
  if (isSmallScreen.value) {
    sidebarCollapsed.value = true;
  }
};

const handleBackToList = async () => {
  await StorageManager.setCurrentProject(undefined);
  currentProject.value = null;
};

const handleToggleProject = async (project: Project, enabled: boolean) => {
  await StorageManager.updateProject(project.id, { enabled });
  await loadProjects();
  if (currentProject.value?.id === project.id) {
    currentProject.value.enabled = enabled;
  }
  // message.success(enabled ? "项目已启用" : "项目已禁用");
};

const handleDeleteProjectConfirm = (project: Project) => {
  Modal.confirm({
    title: "确认删除项目",
    content: `确定要删除项目 "${project.name}" 吗？此操作将同时删除该项目下的所有规则，且无法恢复。`,
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: async () => {
      await handleDeleteProject(project);
    },
  });
};

const handleDeleteProject = async (project: Project) => {
  try {
    await StorageManager.deleteProject(project.id);
    // message.success("项目删除成功");
    if (currentProject.value?.id === project.id) {
      currentProject.value = null;
    }
    await loadProjects();
  } catch (error) {
    console.error("删除项目失败:", error);
    message.error("删除项目失败");
  }
};

const handleTabChange = (key: string) => {
  const project = projects.value.find((p) => p.id === key);
  if (project) {
    handleSelectProject(project);
  }
};

const handleCreateRule = () => {
  editingRule.value = null;
  ruleModalVisible.value = true;
};

const handleEditRule = (rule: InterceptionRule) => {
  editingRule.value = { ...rule };
  ruleModalVisible.value = true;
};

const handleSaveRule = async (rule: InterceptionRule) => {
  if (!currentProject.value) {
    return;
  }

  try {
    if (editingRule.value) {
      // 更新规则
      await StorageManager.updateRule(
        currentProject.value.id,
        editingRule.value.id,
        rule
      );
      // message.success("规则更新成功");
    } else {
      // 创建新规则
      const newRule: InterceptionRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      await StorageManager.addRule(currentProject.value.id, newRule);
      message.success("规则创建成功");
    }
    ruleModalVisible.value = false;
    editingRule.value = null;
    await loadProjects();
    if (currentProject.value) {
      const updated = await StorageManager.getProjects();
      currentProject.value =
        updated.find((p) => p.id === currentProject.value!.id) || null;
    }
  } catch (error) {
    console.error("保存规则失败:", error);
    message.error("保存规则失败");
  }
};

const handleCancelRule = () => {
  ruleModalVisible.value = false;
  editingRule.value = null;
};

const handleToggleRule = async (rule: InterceptionRule, enabled: boolean) => {
  if (!currentProject.value) {
    return;
  }
  await StorageManager.updateRule(currentProject.value.id, rule.id, {
    enabled,
  });
  await loadProjects();
  if (currentProject.value) {
    const updated = await StorageManager.getProjects();
    currentProject.value =
      updated.find((p) => p.id === currentProject.value!.id) || null;
  }
  // message.success(enabled ? "规则已启用" : "规则已禁用");
};

const handleDeleteRule = async (rule: InterceptionRule) => {
  if (!currentProject.value) {
    return;
  }
  try {
    await StorageManager.deleteRule(currentProject.value.id, rule.id);
    message.success("规则删除成功");
    await loadProjects();
    if (currentProject.value) {
      const updated = await StorageManager.getProjects();
      currentProject.value =
        updated.find((p) => p.id === currentProject.value!.id) || null;
    }
  } catch (error) {
    console.error("删除规则失败:", error);
    message.error("删除规则失败");
  }
};

const handleEnableAll = async () => {
  if (!currentProject.value) {
    return;
  }
  const allEnabled = currentProject.value.rules.map((r) => ({
    ...r,
    enabled: true,
  }));
  await StorageManager.updateProjectRules(currentProject.value.id, allEnabled);
  message.success("已启用所有规则");
  await loadProjects();
  if (currentProject.value) {
    const updated = await StorageManager.getProjects();
    currentProject.value =
      updated.find((p) => p.id === currentProject.value!.id) || null;
  }
};

const handleDisableAll = async () => {
  if (!currentProject.value) {
    return;
  }
  const allDisabled = currentProject.value.rules.map((r) => ({
    ...r,
    enabled: false,
  }));
  await StorageManager.updateProjectRules(currentProject.value.id, allDisabled);
  message.success("已禁用所有规则");
  await loadProjects();
  if (currentProject.value) {
    const updated = await StorageManager.getProjects();
    currentProject.value =
      updated.find((p) => p.id === currentProject.value!.id) || null;
  }
};

const handleClearList = async () => {
  if (!currentProject.value) {
    return;
  }
  await StorageManager.updateProjectRules(currentProject.value.id, []);
  message.success("已清空规则列表");
  await loadProjects();
  if (currentProject.value) {
    const updated = await StorageManager.getProjects();
    currentProject.value =
      updated.find((p) => p.id === currentProject.value!.id) || null;
  }
};

// 生命周期
onMounted(() => {
  try {
    loadProjects();
    checkScreenSize();
    // 监听窗口大小变化
    window.addEventListener("resize", checkScreenSize);
  } catch (e) {
    console.error('App.vue 初始化失败:', e)
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  transition: background-color var(--transition-normal) var(--easing-ease-in-out);
}

/* ========== VS Code 工作台布局 ========== */
.workbench {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 200px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-primary);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal) var(--easing-ease-in-out);
  position: relative;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 40px;
}

.sidebar-header {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  position: relative;
  min-height: 35px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
  flex-direction: column;
  height: auto;
  min-height: auto;
  padding: var(--spacing-xs) 0;
}

.sidebar-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
}

.sidebar-title span {
  display: inline-block;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.sidebar.collapsed .sidebar-actions {
  flex-direction: column-reverse;
  gap: var(--spacing-xs);
}

.sidebar-action-btn {
  color: var(--color-text-secondary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-action-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.sidebar-action-btn .theme-icon {
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle-btn {
  color: var(--color-text-secondary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-search {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
}

.sidebar-search .ant-input {
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.sidebar.collapsed .sidebar-search {
  display: none;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-xs) 0;
  min-height: 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-ease-in-out);
  color: var(--color-text-primary);
  position: relative;
}

.sidebar-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity var(--transition-fast) var(--easing-ease-in-out);
}

.sidebar-item.active::before {
  opacity: 1;
}

.sidebar.collapsed .sidebar-item {
  padding: var(--spacing-sm);
  justify-content: center;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.sidebar-item-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.sidebar-item-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex-shrink: 0;
  transition: all var(--transition-fast) var(--easing-ease-in-out);
}

.sidebar-item.active .sidebar-item-avatar {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.sidebar-item:hover .sidebar-item-avatar {
  border-color: var(--color-primary);
}

.sidebar-item-label {
  flex: 1;
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.sidebar.collapsed .sidebar-item-label {
  font-size: var(--font-size-xs);
}

.sidebar-item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast) var(--easing-ease-in-out);
  flex-shrink: 0;
}

.sidebar-item:hover .sidebar-item-actions {
  opacity: 1;
}

.sidebar.collapsed .sidebar-item-actions {
  display: none;
}

.sidebar-empty {
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.sidebar-empty p {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  line-height: 1.5;
}

.sidebar-empty .ant-btn-link {
  padding: var(--spacing-xs) var(--spacing-sm);
  height: auto;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.sidebar-empty .ant-btn-link:hover {
  color: var(--color-primary-hover);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
}

/* ========== 主编辑区 ========== */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== 编辑器主体 ========== */
.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.toolbar-search {
  width: 180px;
  min-width: 150px;
}

.toolbar-filter {
  width: 90px;
  min-width: 80px;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-elevated);
}

.editor-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.editor-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.editor-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.editor-title-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast) var(--easing-ease-in-out);
}

.editor-title-wrapper:hover .editor-title-actions {
  opacity: 1;
}

.editor-title-action-btn {
  color: var(--color-text-tertiary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.editor-title-action-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.editor-title-action-btn.danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-light);
}

.editor-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.meta-label {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-right: var(--spacing-xs);
}

.meta-divider {
  color: var(--color-text-tertiary);
}

.editor-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg) var(--spacing-xl);
}

/* ========== 空状态 ========== */
.editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  text-align: center;
  min-height: 300px;
}

.empty-icon {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-tertiary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
  box-shadow: 0 4px 12px var(--color-shadow-sm);
  transition: transform var(--transition-normal) var(--easing-ease-in-out);
}

.editor-empty:hover .empty-icon {
  transform: scale(1.05);
}

.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.3;
}

.empty-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl) 0;
  max-width: 420px;
  line-height: 1.6;
}

.editor-empty .ant-btn-primary {
  height: 40px;
  padding: 0 var(--spacing-xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
}

.editor-empty .ant-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* ========== 滚动条样式 ========== */
.sidebar-list::-webkit-scrollbar,
.editor-scrollable::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.sidebar-list::-webkit-scrollbar-track,
.editor-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-list::-webkit-scrollbar-thumb,
.editor-scrollable::-webkit-scrollbar-thumb {
  background: var(--color-border-secondary);
  border-radius: 5px;
}

.sidebar-list::-webkit-scrollbar-thumb:hover,
.editor-scrollable::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* ========== 小屏幕响应式优化 ========== */
@media (max-width: 360px) {
  .sidebar {
    width: 40px !important;
  }

  .sidebar.collapsed {
    width: 40px !important;
  }

  .sidebar-header {
    padding: var(--spacing-xs) 0 !important;
    justify-content: center !important;
    flex-direction: column !important;
    height: auto !important;
    min-height: auto !important;
  }

  .sidebar-title {
    display: none !important;
  }

  .sidebar-actions {
    display: flex !important;
    flex-direction: column !important;
    gap: var(--spacing-xs) !important;
    width: 100%;
    align-items: center;
  }

  .sidebar-search {
    display: none !important;
  }

  .sidebar-item-label {
    display: none !important;
  }

  .sidebar-item-actions {
    display: none !important;
  }

  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .toolbar-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .toolbar-search {
    width: 100%;
    min-width: 100%;
  }

  .toolbar-filter {
    width: 100%;
    min-width: 100%;
  }

  .editor-header {
    padding: var(--spacing-md);
  }

  .editor-title {
    font-size: var(--font-size-lg);
  }

  .editor-title-actions {
    opacity: 1 !important;
  }

  .editor-scrollable {
    padding: var(--spacing-md);
  }
}
</style>
