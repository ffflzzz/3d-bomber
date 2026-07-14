# TECH SPEC：3D Bomper — 核心系统

> 配合 PRD 使用，专注技术实现细节

---

## 一、游戏场景架构

### 1.1 整体结构

```
GameScene.tsx (1297 行)
├── useGLTF 加载 3D 模型
├── Physics (Rapier) 物理引擎
│   ├── RigidBody (玩家)
│   ├── RigidBody (炸弹 collider)
│   └── CuboidCollider
├── Canvas (R3F)
│   ├── Camera (OrbitControls / 跟随)
│   ├── Lights (环境光 + 方向光)
│   ├── 地图渲染 (tile-based)
│   ├── 玩家模型
│   ├── 怪物模型
│   ├── 炸弹渲染
│   ├── 爆炸效果
│   ├── 道具渲染
│   └── FogOfWar (雾效)
├── 游戏循环 (useFrame)
│   ├── 玩家移动
│   ├── 怪物 AI
│   ├── 炸弹计时
│   ├── 碰撞检测
│   ├── 爆炸判定
│   └── 道具掉落
└── Zustand store 读写
```

### 1.2 关键设计决策

**为什么用 Zustand 而非 ECS：**
- 当前游戏逻辑集中在 `GameScene.tsx` 一个文件中
- ECS 层 (`ecs/`) 仅有 schema 定义，未实际使用
- Zustand 更适合当前规模的单文件游戏逻辑
- 未来如需迁移到 ECS，Zustand store 可作为数据源

**为什么用 Rapier 而非 Cannon：**
- Rapier 性能更好（WebAssembly）
- React Three Fiber 有官方支持的 `@react-three/rapier`
- 刚体生命周期管理简单

---

## 二、核心系统详细设计

### 2.1 地图系统

**地图表示：**
```typescript
// 二维数组，每个元素是 tile 类型
type MapGrid = number[][]

// Tile 类型 (constants.ts)
TILE_EMPTY = 0   // 空地
TILE_WALL = 1    // 不可破坏墙
TILE_DESTRUCTIBLE = 2  // 可破坏方块
TILE_GRASS = 3   // 装饰性草地
```

**地图生成：**
- 固定网格：`WORLD_WIDTH x WORLD_HEIGHT`（默认 21x21）
- Tile 大小：`TILE_SIZE`（默认 2 单位）
- 边界：四周一圈不可破坏墙
- 内部：随机生成可破坏方块（密度 ~30%）
- 玩家出生点：左上角区域，确保周围安全

**维度切换：**
- 每个维度有独立的地图配置（`dimensions/configs.ts`）
- 传送门激活时调用 `chunkGenerator.generateNewMap()`
- 切换时有过渡动画（PortalSystem.tsx）

### 2.2 玩家系统

**状态结构 (store.ts)：**
```typescript
interface PlayerStats {
  level: number          // 等级
  xp: number            // 经验值
  xpToNext: number      // 升级所需经验
  hp: number            // 当前生命
  maxHp: number         // 最大生命
  attack: number        // 攻击力
  defense: number       // 防御力
  speed: number         // 移动速度
  bombCount: number     // 最大炸弹数
  bombPower: number     // 爆炸范围
}
```

**移动逻辑：**
- 键盘：WASD / 方向键
- 触屏：虚拟摇杆（platform/touchControls.ts）
- 物理：Rapier RigidBody type="dynamic"
- 锁定旋转：`lockRotations` 防止倾倒
- 碰撞：玩家 Collider 0.4x0.5x0.4

**关键参数：**
- 移动速度：基础 3.0，速度道具 +0.5
- 重力：-9.81（标准）
- 线性阻尼：0（无摩擦力）

### 2.3 炸弹系统

**炸弹实例：**
```typescript
interface BombInstance {
  id: number
  x: number
  z: number
  timer: number          // 剩余秒数
  radius: number         // 爆炸半径（tile 数）
  exploded: boolean
  isMonsterBomb?: boolean
}
```

**放置逻辑：**
- 网格对齐：`Math.round(pos / TILE_SIZE) * TILE_SIZE`
- 数量限制：`bombCount`（基础 1，道具可加）
- 重叠检测：同一格不能放两颗炸弹

**爆炸判定（十字模式）：**
```typescript
// 1. 检查是否在同行或同列
// 2. 计算曼哈顿距离
// 3. 沿路径检测墙壁阻挡
// 4. 未被阻挡的格子受到伤害
```

**连锁爆炸（递归洪水填充）：**
```typescript
// 1. 从第一颗炸弹开始
// 2. 检查范围内所有炸弹
// 3. 如果路径未被阻挡，加入爆炸队列
// 4. 递归处理
// 5. 同时移除所有连锁炸弹并创建爆炸效果
```

**关键参数：**
- 炸弹 Collider：0.3x0.5x0.3（不要用 0.4，太大会卡住玩家）
- 爆炸计时：3.0 秒（可被道具缩短）
- 默认爆炸半径：3 tile

### 2.4 怪物系统

**怪物类型：**
```typescript
MONSTER_SLIME = 0      // 史莱姆 — 慢速，低智
MONSTER_FOREST = 1     // 森林怪 — 中等速度
MONSTER_BOSS = 2       // Boss — 高速，高血量
```

**AI 状态机：**
```
idle → patrol → chase → attack → retreat → idle
```

**攻击方式：**
- 投掷炸弹（非近战）
- 攻击冷却时间按怪物类型区分：
  - Slime: 5.0s
  - Forest: 3.0s
  - Boss: 2.0s

**躲避 AI：**
- Slime: 30% 躲避率
- Forest: 60% 躲避率
- Boss: 90% 躲避率
- 躲避时 BFS 寻找安全格子

**怪物生成：**
- 每波生成一定数量
- 刷新间隔：30-60 秒
- 最大存活数：15

### 2.5 道具系统

**掉落逻辑：**
- 破坏可破坏方块时 35% 概率掉落
- 掉落位置 = 方块位置
- 道具类型随机（6 种均匀分布）

**道具效果：**
| 道具 | 持续时间 | 效果 |
|------|---------|------|
| bomb_up | 永久 | +1 最大炸弹数 |
| fire_up | 永久 | +1 爆炸范围 |
| speed_up | 永久 | +0.5 移动速度 |
| shield | 3 秒 | 无敌状态 |
| kick | 永久 | 可踢出炸弹 |
| remote | 永久 | 手动引爆所有炸弹 |

### 2.6 英雄系统

**英雄定义：**
```typescript
interface HeroDef {
  id: string
  name: string
  title: string
  description: string
  emoji: string
  modelPath: string      // 3D 模型路径
  texturePath: string    // 贴图路径
  color: string          // 主题色
  era: string            // 时代
  instrument: string     // 乐器
  stats: { ... }         // 属性
  abilities: [...]       // 技能
  passive: string        // 被动
  bombColor: string      // 炸弹颜色
  explosionColor: string // 爆炸颜色
}
```

**当前英雄列表（heroes.ts）：**
1. 巴赫 — 赋格之父（巴洛克）
2. 莫扎特 — 神童作曲家（古典）
3. 贝多芬 — 命运交响（浪漫）
4. 肖邦 — 钢琴诗人（浪漫）
5. 亨德尔 — 清唱剧大师（巴洛克）
6. 海顿 — 交响乐之父（古典）

### 2.7 技能系统

**技能结构：**
```typescript
interface AbilityState {
  key: string
  name: string
  icon: string
  mana: number
  cooldown: number
  maxCooldown: number
  ready: boolean
}
```

**技能释放：**
- 键盘快捷键（Q/W/E/R）
- 触屏按钮
- 释放时消耗 mana
- 进入冷却时间

---

## 三、数据库 Schema

当前无后端数据库（纯前端游戏）。数据存储使用 localStorage。

```typescript
// localStorage key: '3d-bomber-save'
interface SaveData {
  selectedHero: string
  highestDimension: number
  totalKills: number
  unlockedHeroes: string[]
  settings: {
    volume: number
    graphicsQuality: 'low' | 'medium' | 'high'
    touchControls: boolean
  }
}
```

---

## 四、API 设计

当前无后端 API（纯前端游戏）。如果需要未来扩展（排行榜等），预留以下接口：

```typescript
// 排行榜
GET  /api/3d-bomber/leaderboard?type=daily      // 每日排行
GET  /api/3d-bomber/leaderboard?type=alltime     // 总排行
POST /api/3d-bomber/submit-score                 // 提交分数

// 每日挑战
GET  /api/3d-bomber/daily-challenge              // 今日挑战种子
```

---

## 五、性能指标

### 5.1 目标帧率

- 高端设备：60 fps
- 中端设备：30 fps
- 低端设备：24 fps（降低粒子数）

### 5.2 内存限制

- 模型总大小：< 50MB
- 纹理总大小：< 30MB
- 运行时内存峰值：< 200MB

### 5.3 加载时间

- 首次加载：< 5 秒（4G 网络）
- 后续加载：< 1 秒（缓存）

---

## 六、关键技术决策

### 6.1 纹理加载 — 不用 Suspense

**原因：** `useTexture` 和 `useLoader` 内部使用 React Suspense（抛出 Promise），try/catch 无法捕获。

**方案：** 使用 `useEffect` + `THREE.TextureLoader`：
```typescript
function useSafeTexture(path: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      path,
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; setTexture(tex) },
      undefined,
      () => setTexture(null)  // 错误时返回 null，用 fallback color
    )
  }, [path])
  return texture
}
```

### 6.2 刚体生命周期

**规则：** 永远不要把 RigidBody 放在会 mount/unmount 的组件内。

**方案：** 将 collider 提取到独立的持久化组件：
```tsx
function BombColliders({ bombs }) {
  return <>
    {bombs.filter(b => !b.exploded).map(b => (
      <RigidBody key={b.id} type="fixed" position={[b.x, 0.5, b.z]}>
        <CuboidCollider args={[0.3, 0.5, 0.3]} />
      </RigidBody>
    ))}
  </>
}
// 在 <Physics> 内部常驻
```

### 6.3 雾效渲染

**关键参数：**
- Y 位置：2（不是 5，太高）
- renderOrder：999（最后渲染）
- depthTest：false（不被其他物体遮挡）
- depthWrite：false（不写入深度缓冲）

### 6.4 环境光

**调试建议：** 开发时将环境光强度设为 1.2（默认 0.5 太暗）。

---

## 七、文件依赖关系

```
main.tsx
  └── App.tsx
        ├── MainMenu (ui/menus/)
        │     └── HeroSelect (ui/menus/)
        │           └── heroes.ts (英雄数据)
        │           └── heroDialogues.ts (英雄台词)
        │
        └── GameScene (game/GameScene.tsx)
              ├── store.ts (Zustand 状态)
              ├── heroes.ts (英雄数据)
              ├── heroVFX.ts (英雄特效)
              ├── PowerupRenderer.tsx (道具)
              ├── dimensions/ (维度系统)
              │     ├── configs.ts
              │     ├── chunkGenerator.ts
              │     └── PortalSystem.tsx
              ├── particles/ParticleSystem.tsx (粒子)
              ├── platform/ (平台适配)
              │     ├── touchControls.ts
              │     ├── deviceProfile.ts
              │     ├── platformAdapter.ts
              │     └── safeArea.ts
              ├── ui/ (UI)
              │     ├── hud/HUD.tsx
              │     ├── hud/Minimap.tsx
              │     └── menus/ (GameOver, PauseMenu, SettingsPanel, QuestLog)
              └── utils/
                    ├── audio.ts (音效)
                    └── constants.ts (常量)
```
