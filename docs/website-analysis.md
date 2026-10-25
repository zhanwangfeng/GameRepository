# 后端接口协议

> 用途：新前端对接后端接口的开发参考。接口基于同域部署，路径为相对路径，可整体复用到不同平台目录（如 `game_select_*`）。

## 1. 通用约定

- 所有接口均为 `POST`，请求体为 JSON（`Content-Type: application/json`）。
- 统一响应包：
  ```json
  { "status": true | false, "msg": "ok", "data": { ... } }
  ```
- 接口未开启 CORS，且响应 `Content-Type` 可能为 `text/html`（body 仍是 JSON，前端按 JSON 解析即可）。因此前端需**与接口同域部署**。
- 接口无鉴权（提交仅凭手机号 + 姓名）。

## 2. 接口总览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/init.php` | POST | 初始化配置：分类、内置/外置硬盘档位 |
| `/api/game_list.php` | POST | 游戏列表（搜索 + 分类 + 分页） |
| `/api/submit.php` | POST | 提交选中的游戏 + 硬盘 + 联系方式（写操作） |

## 3. 各接口与数据格式

### 3.1 `POST /api/init.php`
请求体：`{}`

返回 `data`：
```json
{
  "cate_list": [
    { "id": 48, "typename": "ps4" }
  ],
  "hard_disk": [
    { "type": 0, "id": 1, "capacity": 7050, "title": "8T = 7.05T", "submit": "8T" },
    { "type": 0, "id": 2, "capacity": 3100, "title": "4T = 3.10T", "submit": "4T" },
    { "type": 0, "id": 3, "capacity": 1450, "title": "2T = 1.45T", "submit": "2T" },
    { "type": 0, "id": 4, "capacity": 720,  "title": "1T = 720G",  "submit": "1T" },
    { "type": 0, "id": 5, "capacity": 330,  "title": "500G = 330G","submit": "500G" }
  ],
  "attach_hard_disk": [
    { "type": 1, "id": 11, "capacity": 7050, "title": "8T = 7.05T", "submit": "8T" },
    { "type": 1, "id": 12, "capacity": 3100, "title": "4T = 3.10T", "submit": "4T" },
    { "type": 1, "id": 13, "capacity": 1450, "title": "2T = 1.45T", "submit": "2T" },
    { "type": 1, "id": 14, "capacity": 720,  "title": "1T = 720G",  "submit": "1T" },
    { "type": 1, "id": 15, "capacity": 330,  "title": "500G = 330G","submit": "500G" }
  ]
}
```
字段说明：
- `cate_list`：分类列表；`id` 用于 `game_list` 的 `tid`。
- `hard_disk`：内置硬盘档位（`type=0`）。
- `attach_hard_disk`：外置硬盘档位（`type=1`）。
- `capacity` 单位为 **G**（7050 = 7.05T，720 = 720G，330 = 330G）。

### 3.2 `POST /api/game_list.php`
请求体：
```json
{ "keywords": "", "page": 1, "tid": "" }
```
- `keywords`：标题模糊搜索关键字。
- `page`：页码，从 1 起。
- `tid`：分类 id（取 `cate_list[].id`），空串 `""` = 全部。

返回 `data`：
```json
{
  "total": 640,
  "per_page": 12,
  "current_page": 1,
  "last_page": 54,
  "data": [
    {
      "aid": "1",
      "flag": "1",
      "title": "F1 2024【竞速类 单人】",
      "litpic": "/game_logo/1.jpg",
      "is_news": 0,
      "gamesize": "55.8",
      "gametype": "",
      "language": "中文"
    }
  ]
}
```
游戏对象字段：
| 字段 | 说明 |
|------|------|
| `aid` | 游戏 id（**字符串**），勾选/提交去重主键 |
| `title` | 名称，已内嵌「类型 / 人数」中文标签 |
| `litpic` | 封面相对路径，如 `/game_logo/1.jpg` |
| `gamesize` | 容量，**字符串数字，单位 G**（如 `"55.8"`） |
| `language` | `中文` / `英文` |
| `flag` | 标记（通常等于 `aid`） |
| `is_news` | 是否资讯（0/1） |
| `gametype` | 类型（通常为空串） |

分页：每页 12 条；前端加载更多时递增 `page` 并追加 `data`；`last_page` 控制结束。

### 3.3 `POST /api/submit.php`（写操作，慎用）
请求体：
```json
{
  "phone": "13800000000",
  "fullname": "姓名",
  "game": "1,340,790",
  "c_id": 1,
  "c_id1": 11
}
```
- `phone`：手机号（必填）。
- `fullname`：姓名（必填）。
- `game`：选中游戏的 `aid`，**逗号拼接**字符串。
- `c_id`：内置硬盘 id，未选时为 `null`/空。
- `c_id1`：外置硬盘 id，未选时为 `null`/空。
- 校验：必须有选中游戏 + 手机号 + 姓名。
- 返回 `{ status, msg, data }`（后端落库）。

> 本地测试时不要真提交；用桩函数直接返回 `{ "status": true, "msg": "ok", "data": {} }`。

## 4. 资源地址（图片）

- 封面为相对路径：`litpic` 形如 `/game_logo/{aid}.jpg`，按部署目录相对解析（前端去掉前缀斜杠后相对当前目录加载）。
- 本地 mock 无图时使用占位图。

## 5. 本地测试夹具（mock/api）

离线开发用的真实响应样本，位于 `mock/api/`：

| 文件 | 内容 |
|------|------|
| `init.json` | `init.php` 原始响应（分类 / 内置 / 外置档位） |
| `game_list.json` | `game_list.php` 第 1 页原始响应 |
| `games.json` | 全量游戏扁平数组（聚合分页结果） |

本地 mock 建议：
- `init` 直接返回 `init.json`。
- `game_list` 根据 `keywords/page/tid` 从 `games.json` 过滤、分页，返回与接口同构的对象。
- `submit` 直接返回成功桩。
