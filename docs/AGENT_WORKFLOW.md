# Coding Agent 工作指南：3D Bomper

> 本文档是给 coding agent（Codex CLI / Claude Code / 其他编程 AI）的阅读和执行顺序
> 所有开发者必须按此顺序阅读文档，不得跳过

---

## 一、必读文档及阅读顺序

**严格按以下顺序阅读，后一份文档依赖前一份的理解：**

| 序号 | 文档 | 用途 |
|------|------|------|
| 1 | TASK_BREAKDOWN.md | **Coding Agent 专用** — 当前任务、完成标准 |
| 2 | PRD.md | 项目整体背景、玩法、技术栈 |
| 3 | TECH_SPEC.md | 系统架构、核心逻辑、API 设计 |
| 4 | UI_UX_SPEC.md | 视觉风格、色彩方案、组件规范 |
| 5 | SPRITE_GENERATION_SPEC.md | 美术素材生产标准 |
| 6 | AGENT_WORKFLOW.md | **Coding Agent 专用** — 执行规则 |

---

## 二、执行规则

### 2.1 任务边界

- 每个任务完成后必须编译通过（`npm run build` 无错误）
- 每个任务完成后必须本地运行验证（`npm run dev` 可访问）
- 不要修改与当前任务无关的文件
- 不要修改 `package.json` 中的依赖版本（除非必要）

### 2.2 文档冲突处理

**优先级：**
1. TASK_BREAKDOWN.md（当前任务）
2. PRD.md（产品设计）
3. TECH_SPEC.md（技术实现）
4. UI_UX_SPEC.md（UI 规范）

当文档之间有冲突时，按以上优先级执行。如有歧义，停下来问用户。

### 2.3 禁止事项

- ❌ 不要自动 `git push`
- ❌ 不要修改路由注册顺序（FastAPI 通配路由必须在最后）
- ❌ 不要在 mount/unmount 的组件中使用 RigidBody
- ❌ 不要用 try/catch 包裹 useTexture/useLoader
- ❌ 不要硬编码 API key（从配置文件读取）
- ❌ 不要删除 `ecs/` 目录（即使未使用，保留为未来扩展）
- ❌ 不要修改 `frontend/dist/` 下的构建产物（那是编译结果）

### 2.4 完成汇报格式

每个任务完成后，按以下格式汇报：

```
## 任务 [编号] 完成汇报

### 修改文件
- [文件1]: [变更说明]
- [文件2]: [变更说明]

### 验证结果
- [ ] npm run build 通过
- [ ] npm run dev 可访问
- [ ] 功能测试通过
- [ ] ESLint 零警告

### 截图
[截图路径]
```

---

## 三、常见场景指引

### 场景 1：重构 GameScene.tsx

```
阅读顺序：
1. TECH_SPEC.md — 系统架构
2. TASK_BREAKDOWN.md — Task 1.1

执行：
1. 将 GameScene.tsx 拆分为独立组件
2. 每个组件不超过 300 行
3. 保持原有功能不变
4. 运行 npm run build 验证

输出：
- 拆分后的组件文件
- 新的 GameScene.tsx（精简版）
```

### 场景 2：添加新英雄

```
阅读顺序：
1. PRD.md — 英雄系统
2. TECH_SPEC.md — 英雄数据结构
3. SPRITE_GENERATION_SPEC.md — 模型生成规范
4. TASK_BREAKDOWN.md — Task 1.5

执行：
1. 在 heroes.ts 中添加英雄定义
2. 在 HeroSelect.tsx 中显示新英雄
3. 生成英雄模型参考图
4. 验证英雄技能效果

输出：
- 更新后的 heroes.ts
- 英雄模型文件
```

### 场景 3：修复道具系统

```
阅读顺序：
1. TECH_SPEC.md — 道具系统
2. TASK_BREAKDOWN.md — Task 1.2

执行：
1. 检查 store.ts 中的道具状态
2. 验证道具效果逻辑
3. 添加道具拾取动画
4. 运行游戏验证

输出：
- 修复后的代码
- 验证截图
```

---

## 四、快速参考卡

| 我要做... | 读这份文档 | 关键章节 |
|-----------|-----------|---------|
| 生成 3D 模型参考图 | SPRITE_GENERATION_SPEC.md | 二、3D 模型生图规范 |
| 实现英雄 | TECH_SPEC.md | 二、英雄系统 |
| 实现炸弹系统 | TECH_SPEC.md | 二、炸弹系统 |
| 实现怪物 AI | TECH_SPEC.md | 二、怪物系统 |
| 实现道具系统 | TECH_SPEC.md | 二、道具系统 |
| 实现维度切换 | TECH_SPEC.md | 二、地图系统 |
| 写 UI 组件 | UI_UX_SPEC.md | 三、UI 组件规范 |
| 实现 HUD | UI_UX_SPEC.md | 五、HUD 规范 |
| 实现菜单 | UI_UX_SPEC.md | 四、菜单界面 |
| 移动端适配 | UI_UX_SPEC.md | 六、移动端适配 |
| 数据库/存储 | TECH_SPEC.md | 三、数据库 Schema |
| 项目目录结构 | TASK_BREAKDOWN.md | 五、目录结构 |
| 启动命令 | TASK_BREAKDOWN.md | 六、环境配置清单 |
| 当前任务 | TASK_BREAKDOWN.md | 四、任务拆解 |
| 路由配置 | abcyesno-project skill | 路由注册顺序 |
| 纹理加载 | abcyesno-project skill | Pitfall #8 |
| 刚体生命周期 | abcyesno-project skill | Pitfall #5 |
| 雾效渲染 | abcyesno-project skill | Pitfall #11 |
| 音效系统 | abcyesno-project skill | Agnes AI 生图 |

---

## 五、FastAPI 路由注意事项

**重要：** 3D Bomper 游戏通过 FastAPI 提供服务。路由注册顺序至关重要。

```python
# 正确顺序：具体路由在前，通配路由在后
@app.get("/game/3d-bomber")           # 游戏入口
@app.get("/game/3d-bomber/{file_path:path}")  # 游戏资源
@router.get("/{file_path:path}")       # 通配路由（最后）
```

**验证命令：**
```bash
python -c "from main import app; [print(r.path, r.methods) for r in app.routes if hasattr(r,'path')]"
```

**MIME 类型：**
- `.glb` → `model/gltf-binary`
- `.gltf` → `model/gltf+json`

---

## 六、R3F 关键注意事项

### 纹理加载
```typescript
// 正确方式：useEffect + TextureLoader
function useSafeTexture(path: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(path, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = false
      setTexture(tex)
    }, undefined, () => setTexture(null))
  }, [path])
  return texture
}
```

### 刚体管理
```typescript
// 正确方式：持久化组件管理 RigidBody
function BombColliders({ bombs }) {
  return <>
    {bombs.filter(b => !b.exploded).map(b => (
      <RigidBody key={b.id} type="fixed" position={[b.x, 0.5, b.z]}>
        <CuboidCollider args={[0.3, 0.5, 0.3]} />
      </RigidBody>
    ))}
  </>
}
```

### 雾效渲染
```typescript
// 关键参数
<mesh renderOrder={999}>
  <shaderMaterial
    transparent
    depthWrite={false}
    depthTest={false}  // 必须！
  />
</mesh>
```

---

## 七、音频注意事项

- Howler.js 在首次播放前需要用户交互
- 添加"点击开始"遮罩，用户点击后才启用音频
- 合成音效使用 WAV 生成，无需外部文件
- 音量控制通过 Howler 全局音量设置
