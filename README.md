# cotc-mock-interceptor - Chrome 扩展请求拦截插件

一个功能强大的 Chrome 浏览器扩展，用于拦截 XHR/Fetch 请求并返回配置的模拟数据。

## 功能特性

- ✅ 拦截浏览器发出的 XHR/Fetch 请求
- ✅ 支持多项目配置管理
- ✅ URL 模式匹配（支持通配符 `*`）
- ✅ JSON 格式的响应配置
- ✅ 项目启用/禁用控制
- ✅ 规则级别的启用/禁用控制
- ✅ 实时规则同步
- ✅ 规则快速复制功能
- ✅ 项目数据导入/导出（JSON格式）

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Ant Design Vue 4.x
- **构建工具**: Vite
- **Chrome API**: Manifest V3 + declarativeNetRequest

## 项目结构

```
cotc-mock-interceptor/
├── manifest.json              # Chrome 扩展配置文件
├── src/
│   ├── background/            # 后台脚本（Service Worker）
│   │   └── service-worker.ts  # 处理请求拦截逻辑
│   ├── options/               # Options 页面
│   │   ├── index.html         # Options 页面入口
│   │   ├── main.ts            # Options 页面入口脚本
│   │   └── App.vue            # Options 页面主组件
│   ├── components/            # Vue 组件
│   │   ├── ProjectList.vue    # 项目列表组件
│   │   ├── ProjectCard.vue    # 项目卡片组件
│   │   ├── InterceptionList.vue # 拦截规则列表组件
│   │   └── OverrideModal.vue  # 编辑拦截规则弹窗组件
│   ├── stores/                # 状态管理
│   │   └── useStorage.ts      # Chrome Storage 封装
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts           # 项目、规则等类型定义
│   └── utils/                 # 工具函数
│       ├── urlMatcher.ts      # URL 匹配工具
│       └── storage.ts         # 存储操作工具
└── vite.config.ts             # Vite 配置
```

## 安装使用

### 从 Release 下载

如果您只是想使用本扩展，无需从源码构建，可以直接下载最新版本：

1. 访问 [release 文件夹](https://github.com/WenwuLi/cotc-mock-interceptor/tree/master/release)
2. 选择最新的 `cotc-mock-interceptor_YYYY-MM-DDTHH-mm-ss.zip` 文件
3. 点击文件名进入详情页，然后点击"Download"按钮下载

**安装步骤**：

1. 解压下载的 ZIP 文件到本地任意目录
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择刚才解压后的文件夹
6. 安装完成！点击扩展图标即可开始使用

> **提示**: 每次 Chrome 浏览器更新或重启后，扩展仍会保持启用状态，无需重新安装。

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建扩展

```bash
npm run build
```

构建完成后，`dist` 目录将包含所有扩展文件。

### 打包发布

```bash
npm run release
```

该命令会自动执行以下操作：
1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录打包成 ZIP 文件
3. 保存到 `release` 目录，文件名格式为 `cotc-mock-interceptor_YYYY-MM-DDTHH-mm-ss.zip`

打包后的 ZIP 文件可以直接上传到 GitHub Releases，用户下载解压后即可使用。

### 加载扩展到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 使用说明

### 创建项目

1. 在 Options 页面点击"新建项目"按钮
2. 输入项目名称
3. 创建成功后，项目会出现在项目列表中

### 配置拦截规则

1. 点击项目卡片进入拦截规则管理页面
2. 点击"创建XHR拦截"按钮
3. 填写以下信息：
   - **规则名称**: 为规则起一个容易识别的名称
   - **目标URL模式**: 支持通配符，如 `/api/user/info` 或 `*/api/*`
   - **响应内容**: JSON 格式的响应数据
   - **立即启用此规则**: 是否在创建后立即启用

### URL 模式匹配

支持以下匹配模式：

- 精确匹配: `/api/user/info`
- 通配符匹配: `*/api/*` (匹配所有包含 `/api/` 的请求)
- 路径匹配: `/api/*` (匹配所有以 `/api/` 开头的请求)

### 启用/禁用

- **项目级别**: 在项目卡片上切换开关，控制整个项目的所有规则
- **规则级别**: 在规则列表中勾选/取消勾选，控制单个规则

### 复制规则

1. 在拦截规则列表中，找到想要复制的规则
2. 点击规则操作栏中的"复制"按钮
3. 系统会自动创建一个新规则，规则名称后缀为 "(副本)"
4. 可以编辑复制后的规则以满足新的需求

### 导出项目数据

1. 在项目卡片的操作菜单中点击"导出项目"
2. 系统会自动下载一个 JSON 文件，文件名格式为 `项目名称_YYYYMMDD_HHmmss.json`
3. 该文件包含项目的所有配置信息和拦截规则
4. 可以用于备份或在其他设备上导入

### 导入项目数据

1. 在 Options 页面点击"导入项目"按钮
2. 选择之前导出的 JSON 文件
3. 系统会验证文件格式：
   - 如果项目名称已存在，会提示是否覆盖
   - 如果文件格式不正确，会显示错误提示
4. 导入成功后，项目及其所有规则会自动添加到当前配置中

## 注意事项

1. 扩展使用 Manifest V3，需要 Chrome 88+ 版本
2. 拦截规则需要同时满足以下条件才会生效：
   - 项目已启用
   - 规则已启用
3. 修改规则后会自动同步到 Chrome，无需手动刷新
4. 数据存储在 `chrome.storage.local`，仅本地存储

## 许可证

MIT
