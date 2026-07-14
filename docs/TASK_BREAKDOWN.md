# 开发任务清单：3D Bomper 重新开发

> 配合 PRD、TECH_SPEC、UI_UX_SPEC 使用

---

## 一、Phase 1 目标

**目标：** 基于现有代码重构，清理架构，完善功能，准备上线新版本。

**MVP 定义：**
- 完整的游戏流程（主菜单 → 英雄选择 → 游戏 → 游戏结束）
- 至少 4 位可玩英雄（巴赫、莫扎特、贝多芬、肖邦）
- 完整的炸弹系统（十字爆炸、连锁引爆）
- 至少 3 种怪物（史莱姆、森林怪、Boss）
- 6 种道具全部可用
- 等级成长系统
- 移动端触屏支持
- 雾效系统

**预估工时：3-4 周（单人全职）**

---

## 二、技术决策（已确认）

| 决策项 | 选择 | 备注 |
|--------|------|------|
| 前端框架 | React 18 + R3F | 已有完整实现 |
| 3D 引擎 | Three.js | 通过 R3F 使用 |
| 物理引擎 | Rapier | @react-three/rapier |
| 状态管理 | Zustand | 替代 ECS 方案 |
| 构建工具 | Vite | 已有配置 |
| 后端 | FastAPI | 静态文件服务 |
| 音频 | Howler.js + 合成 | 无需外部音频文件 |
| 部署 | CF Tunnel → localhost:8899 | 已有 |

---

## 三、现有代码分析

### 3.1 代码规模

| 模块 | 文件数 | 行数 | 状态 |
|------|--------|------|------|
| 游戏场景 | 1 | 1297 | 核心逻辑，需重构拆分 |
| 状态管理 | 1 | 593 | 基本完整 |
| 英雄系统 | 1 | 322 | 6 位英雄，需扩充 |
| 英雄对话 | 1 | 591 | 台词数据，需验证 |
| 维度系统 | 3 | ~450 | 传送门+地图生成 |
| 粒子系统 | 1 | 308 | 爆炸/技能特效 |
| 平台适配 | 4 | ~550 | 触屏控制+设备检测 |
| UI 系统 | 7 | ~900 | HUD+菜单 |
| 音频系统 | 1 | 333 | 合成音效 |
| ECS 骨架 | 11 | ~70 | 未完成，暂不使用 |

**总计：约 5000 行 TypeScript/TSX**

### 3.2 已知问题清单

1. **ECS 层未集成** — `ecs/` 目录有 schema 但未使用，游戏逻辑全在 `GameScene.tsx`
2. **部分道具未实现** — kick（踢球）和 remote（遥控）可能未完全工作
3. **任务系统未集成** — Quest 数据结构存在但未与游戏逻辑联动
4. **维度切换需测试** — PortalSystem 和 chunkGenerator 需要实际验证
5. **移动端摇杆精度** — 虚拟摇杆灵敏度待调优
6. **模型/贴图缺失** — 部分英雄模型和贴图可能未上传
7. **音效需验证** — 合成音效在不同浏览器表现可能不一致

### 3.3 代码结构问题

- `GameScene.tsx` 1297 行，过于庞大，需拆分为多个组件
- 常量散落在多处，应统一到 `constants.ts`
- 音效逻辑在 `audio.ts` 中硬编码，应配置化

---

## 四、任务拆解

### Task 1.1：项目清理与重构（2 天）

**内容：**
- 将 `GameScene.tsx` 拆分为独立组件：
  - `PlayerController.tsx` — 玩家移动和控制
  - `MonsterManager.tsx` — 怪物生成和 AI
  - `BombManager.tsx` — 炸弹放置和爆炸
  - `MapRenderer.tsx` — 地图渲染
  - `GameLoop.tsx` — 游戏主循环
- 统一常量到 `constants.ts`
- 清理未使用的 import 和代码
- 添加 JSDoc 注释

**完成标准：**
- 代码行数减少 30%
- 每个组件不超过 300 行
- ESLint 零警告

---

### Task 1.2：道具系统补全（1 天）

**内容：**
- 验证所有 6 种道具的效果
- 实现 kick（踢球）功能：踢出已放置的炸弹
- 实现 remote（遥控）功能：手动引爆所有炸弹
- 添加道具拾取动画和音效

**完成标准：**
- 6 种道具全部可用
- 每种道具有独立的拾取动画
- 道具效果立即生效

---

### Task 1.3：任务系统集成（1 天）

**内容：**
- 将 Quest 系统与游戏逻辑连接
- 实现任务追踪（击杀计数、收集计数）
- 任务完成通知
- 任务奖励发放（XP、道具）

**完成标准：**
- 每个维度有 3-5 个任务
- 任务进度实时更新
- 完成任务后有视觉和音效反馈

---

### Task 1.4：维度系统验证（1 天）

**内容：**
- 测试传送门激活和维度切换
- 验证每个维度的地图生成
- 添加维度切换动画
- 解锁条件验证

**完成标准：**
- 4 个维度均可正常切换
- 切换时有平滑过渡动画
- 未解锁维度显示锁定状态

---

### Task 1.5：英雄扩充（2 天）

**内容：**
- 新增 2-4 位英雄（目标 8-10 位）
- 每位英雄有独特的：
  - 3D 模型路径
  - 属性面板
  - 技能
  - 被动效果
  - 炸弹/爆炸颜色
  - 英雄介绍视频

**完成标准：**
- 英雄选择界面显示所有英雄
- 每位英雄可正常游戏
- 英雄技能效果正确

---

### Task 1.6：移动端优化（2 天）

**内容：**
- 虚拟摇杆灵敏度调优
- 触屏按钮布局优化
- 性能分级验证（低/中/高）
- 横竖屏适配
- 刘海屏/灵动岛适配

**完成标准：**
- 手机端可流畅操作
- 触屏响应延迟 < 100ms
- 低端设备帧率 ≥ 24fps

---

### Task 1.7：音频系统优化（1 天）

**内容：**
- 验证所有合成音效
- 添加背景音乐（可选项）
- 音量控制集成到设置面板
- 音效与视觉同步

**完成标准：**
- 所有音效在主流浏览器正常工作
- 音量控制有效
- 音效与动画同步

---

### Task 1.8：美术素材生成（3-5 天，并行）

**内容：**
- 按 SPRITE_GENERATION_SPEC 生成英雄 3D 模型参考图
- 生成怪物贴图
- 生成道具图标
- 生成 UI 素材（按钮、图标、背景）
- 生成英雄介绍视频（可选）

**完成标准：**
- 所有素材在 `assets/` 目录下
- 英雄模型路径与 heroes.ts 对应
- 贴图分辨率匹配

---

### Task 1.9：联调与测试（1 天）

**内容：**
- 完整游戏流程测试
- 移动端兼容性测试
- 性能测试（帧率、内存）
- Bug 修复

**完成标准：**
- 完整流程可跑通
- 帧率稳定 30fps+
- 无明显 bug

---

## 五、目录结构（目标态）

```
3d-bomber/
│
├── frontend/                   # React + R3F 前端
│   ├── src/
│   │   ├── main.tsx            # 入口
│   │   ├── App.tsx             # 路由/状态管理
│   │   │
│   │   ├── game/               # 游戏核心
│   │   │   ├── GameScene.tsx   # 主场景（待拆分）
│   │   │   ├── store.ts        # Zustand 状态
│   │   │   ├── heroes.ts       # 英雄数据
│   │   │   ├── heroDialogues.ts
│   │   │   ├── heroVFX.ts      # 英雄特效
│   │   │   ├── PowerupRenderer.tsx
│   │   │   ├── dimensions/     # 维度系统
│   │   │   │   ├── configs.ts
│   │   │   │   ├── chunkGenerator.ts
│   │   │   │   └── PortalSystem.tsx
│   │   │   └── particles/      # 粒子系统
│   │   │       └── ParticleSystem.tsx
│   │   │
│   │   ├── ecs/                # ECS 骨架（暂不使用）
│   │   │   ├── components/
│   │   │   ├── systems/
│   │   │   └── World.ts
│   │   │
│   │   ├── platform/           # 平台适配
│   │   │   ├── touchControls.ts
│   │   │   ├── deviceProfile.ts
│   │   │   ├── platformAdapter.ts
│   │   │   └── safeArea.ts
│   │   │
│   │   ├── ui/                 # UI 组件
│   │   │   ├── hud/
│   │   │   │   ├── HUD.tsx
│   │   │   │   └── Minimap.tsx
│   │   │   └── menus/
│   │   │       ├── MainMenu.tsx
│   │   │       ├── HeroSelect.tsx
│   │   │       ├── PauseMenu.tsx
│   │   │       ├── GameOver.tsx
│   │   │       ├── QuestLog.tsx
│   │   │       └── SettingsPanel.tsx
│   │   │
│   │   └── utils/              # 工具
│   │       ├── audio.ts
│   │       ├── constants.ts
│   │       └── index.ts
│   │
│   ├── public/
│   │   ├── models/             # 3D 模型
│   │   ├── textures/           # 贴图
│   │   ├── hero_videos/        # 英雄介绍视频
│   │   └── sounds/             # 音效（如有）
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
├── docs/                       # 文档
│   ├── PRD.md
│   ├── TECH_SPEC.md
│   ├── UI_UX_SPEC.md
│   ├── SPRITE_GENERATION_SPEC.md  # 待创建
│   └── TASK_BREAKDOWN.md       # 本文档
│
├── backend/                    # FastAPI 后端
│   ├── main.py                 # 入口（已有）
│   └── requirements.txt
│
├── assets/                     # 美术素材
│   ├── models/
│   ├── textures/
│   ├── icons/
│   └── videos/
│
├── scripts/                    # 辅助脚本
│   └── batch_generate.py       # 批量生图
│
├── .gitignore
└── README.md
```

---

## 六、环境配置清单

### 6.1 必须安装的软件

```bash
# Python 3.12（已有）
# Node.js 18+（已有）
# Git（已有）
```

### 6.2 前端启动

```bash
cd ~/AppData/Local/hermes/abcyesno-site/frontend
npm install
npm run dev
# 浏览器访问 http://localhost:5173
```

### 6.3 后端启动

```bash
cd ~/AppData/Local/hermes/abcyesno-site
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8899
```

### 6.4 路由配置

FastAPI 必须确保 `/game/3d-bomber/{file_path:path}` 路由正确：

```python
# 具体路由必须在通配路由之前注册
@app.get("/game/3d-bomber/{file_path:path}")
async def game_3d_bomber_assets(file_path: str):
    ...

@router.get("/{file_path:path}")  # 通配路由放最后
async def game_static(file_path: str):
    ...
```

### 6.5 MIME 类型

```python
# .glb 必须设置正确的 MIME 类型
if file_path.endswith('.glb'):
    media_type = "model/gltf-binary"
elif file_path.endswith('.gltf'):
    media_type = "model/gltf+json"
```

---

## 七、开发顺序建议

```
Day 1-2:   Task 1.1 (项目清理与重构)
Day 3:     Task 1.2 (道具系统补全)
Day 4:     Task 1.3 (任务系统集成)
Day 5:     Task 1.4 (维度系统验证)
Day 6-7:   Task 1.5 (英雄扩充)
Day 8-9:   Task 1.6 (移动端优化)
Day 10:    Task 1.7 (音频系统优化)
Day 11-15: Task 1.8 (美术素材生产，并行)
Day 16:    Task 1.9 (联调测试)
```

---

## 八、风险与注意事项

1. **3D 模型依赖** — 英雄模型和贴图需要从 Agnes AI 生成或外部获取。如果模型路径不对，游戏会白屏。
2. **R3F 版本兼容性** — React Three Fiber 和 Three.js 版本必须匹配。检查 `package.json` 中的 peer dependencies。
3. **Rapier 刚体崩溃** — 不要在 mount/unmount 的组件中使用 RigidBody。这是已知坑位。
4. **TextureLoader 错误处理** — 不要用 try/catch 包裹 useTexture/useLoader。使用 useEffect + TextureLoader 模式。
5. **雾效渲染顺序** — 雾平面必须 renderOrder=999 且 depthTest=false。
6. **音效浏览器兼容性** — Howler.js 在某些浏览器可能需要用户交互才能播放音频。添加"点击开始"遮罩。
7. **移动端性能** — 粒子系统在低端设备上可能导致掉帧。实现性能分级。
8. **FastAPI 路由顺序** — 通配路由必须在具体路由之后注册。
