# 游戏选装前端

多平台「游戏选装」单页应用：按分类筛选、搜索、分页浏览游戏，选择游戏与硬盘档位后提交订单。同一套前端可部署到不同平台的子目录，按目录名自动识别当前平台。

## 技术栈

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- 无第三方 UI 组件库，样式集中在 `src/index.css`
- 相对路径构建（`base: './'`），可直接放到任意子目录，无需服务器 rewrite

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 生产构建，产物输出到 dist/
npm run preview  # 本地预览构建产物（默认 http://localhost:4173）
npm run typecheck# 仅做 TypeScript 类型检查
```

## 目录结构

```
src/
  api.ts              # 接口封装：相对路径、平台识别、mock/真实切换
  App.tsx             # 页面组装与状态
  components/         # Header / DiskSelector / CapacityBar / GameGrid / BottomBar / SelectedDrawer / SubmitDialog ...
  hooks/useHistory.ts # 本地提交历史（localStorage，按平台隔离）
  index.css           # 全局样式
  types.ts            # 接口数据类型
mock/api/             # 本地开发用的接口响应样本（init / game_list / games）
docs/website-analysis.md  # 后端接口协议（请求/响应字段、图片地址、本地夹具）
dist/                 # 生产构建产物（build 生成，不入库时可忽略）
```

## 部署

构建产物 `dist/` 使用相对路径，可整体拷贝到任意子目录（例如 `game_select_xxx/`），页面通过 `./assets/...` 引用资源。

1. 执行 `npm run build`。
2. 将 `dist/` 下的 `index.html` 和整个 `assets/` 目录上传到目标子目录（如 `game_select_switch/`）。
   - **必须连同 `assets/` 一起替换**：每次构建的资源文件名带哈希，只覆盖 `index.html` 会导致旧哈希资源 404。
3. 目标子目录下需同时存在后端资源 `api/`（接口）与 `game_logo/`（封面图片），页面相对当前目录请求它们。

> 接口未开启 CORS，因此前端必须与接口**同域部署**。

## 平台识别

`src/api.ts` 中的 `getPlatform()` 从 `location.pathname` 提取 `game_select_xxx` 的 `xxx` 作为平台标识（如 `/game_select_switch/` → `SWITCH`），用于页面标题与历史隔离。部署到不同平台只需放到对应名称的子目录即可，无需改代码。

## 本地 Mock 与真实接口

- 默认 **仅 `localhost` / `127.0.0.1` 走本地 mock**（使用 `mock/api/` 样本数据），其他域名（生产）默认直连真实接口。
- 可用环境变量强制覆盖：`VITE_USE_MOCK=true` 强制走 mock，`VITE_USE_MOCK=false` 强制走真实接口。

## 后端接口协议

接口均为 `POST`、请求体为 JSON，统一响应包 `{ status, msg, data }`。三个接口：

| 接口 | 说明 |
|------|------|
| `api/init.php` | 初始化：分类、内置/外置硬盘档位 |
| `api/game_list.php` | 游戏列表（搜索 + 分类 + 分页，每页 12 条） |
| `api/submit.php` | 提交选中游戏 + 硬盘 + 联系方式（写操作） |

封面为相对路径（`/game_logo/{aid}.jpg`），按部署目录相对解析。完整字段说明见 [docs/website-analysis.md](docs/website-analysis.md)。

## 常见问题

- **页面空白 / 列表为空**：通常是目标子目录缺少 `api/` 或 `game_logo/`，与前端代码无关，补齐后端资源即可。
- **改了源码却没生效**：务必在改动后重新 `npm run build` 再部署，避免上传了旧的 `dist/`。
