# 生图素材生产规范：3D Bomper

> 配合 PRD 和 UI_UX_SPEC 使用

---

## 一、整体风格定位

**参考：3D Bomberman × Super Mario Odyssey**

- 低多边形（low-poly）3D 风格
- 色彩鲜艳但不刺眼
- 角色圆润可爱，表情简化但有辨识度
- 3D 模型 + 2D UI 混合
- 清晰的光照和阴影

**时代背景约束：音乐史主题**

- 每个英雄代表一个音乐时代
- 巴赫：巴洛克风格（假发、礼服、管风琴元素）
- 莫扎特：古典风格（白色礼服、羽毛笔）
- 贝多芬：浪漫风格（卷发、激烈表情）
- 肖邦：浪漫钢琴家（燕尾服、钢琴元素）

---

## 二、3D 模型生图规范

### 2.1 核心参数

所有 3D 模型的参考图必须严格遵循：

```
3D model render, low-poly style, game asset, 
neutral pose (T-pose or A-pose), 
white background, 
front view + side view + back view,
consistent lighting from top-right,
no shadows, clean topology
```

### 2.2 模型规格

| 模型类型 | 面数 | 贴图尺寸 | 文件格式 |
|---------|------|---------|---------|
| 英雄 | 500-2000 面 | 512x512 | .glb |
| 怪物 | 200-800 面 | 256x256 | .glb |
| 炸弹 | 100-300 面 | 128x128 | .glb |
| 道具 | 50-200 面 | 128x128 | .glb |
| 建筑/装饰 | 可变 | 512x512 | .glb |

### 2.3 英雄模型 Prompt 模板

**巴赫：**
```
3D game character, low-poly model render, 
Baroque composer Johann Sebastian Bach, 
wearing 17th century white wig, black formal coat with gold trim,
holding a violin, T-pose, neutral expression,
front view + side view + back view,
white background, consistent top-right lighting,
game asset quality, clean geometry, no shadows
```

**莫扎特：**
```
3D game character, low-poly model render,
Classical composer Wolfgang Amadeus Mozart,
wearing white powdered wig, blue formal coat with red trim,
holding a quill pen, T-pose, cheerful expression,
front view + side view + back view,
white background, consistent top-right lighting,
game asset quality, clean geometry, no shadows
```

**贝多芬：**
```
3D game character, low-poly model render,
Romantic composer Ludwig van Beethoven,
wild curly hair, passionate expression, wearing dark formal coat,
holding a baton, T-pose, intense expression,
front view + side view + back view,
white background, consistent top-right lighting,
game asset quality, clean geometry, no shadows
```

**肖邦：**
```
3D game character, low-poly model render,
Romantic composer Frédéric Chopin,
elegant black tuxedo, refined expression,
standing near a small piano, T-pose, gentle expression,
front view + side view + back view,
white background, consistent top-right lighting,
game asset quality, clean geometry, no shadows
```

### 2.4 怪物模型 Prompt 模板

**静音史莱姆：**
```
3D game enemy, low-poly slime monster,
green blob with mute symbol (crossed-out speaker),
cute but menacing, simple facial features,
front view + side view + back view,
white background, consistent lighting,
game asset quality
```

**混沌森林怪：**
```
3D game enemy, low-poly forest monster,
dark green/brown creature made of twisted branches,
glowing red eyes, mute symbol on chest,
menacing but cartoonish,
front view + side view + back view,
white background, consistent lighting,
game asset quality
```

**Boss — 大静音者：**
```
3D game boss, low-poly giant monster,
massive dark figure with crown made of broken musical notes,
purple/black color scheme, glowing red eyes,
intimidating presence, mute symbol on forehead,
front view + side view + back view,
white background, consistent lighting,
game asset quality
```

---

## 三、2D 图标与 UI 素材

### 3.1 道具图标

| 道具 | 尺寸 | 描述 | Prompt |
|------|------|------|--------|
| 炸弹加成 | 64x64 | 炸弹图标+1 | `game icon, bomb with +1 badge, flat design, golden border` |
| 火焰加成 | 64x64 | 火焰图标+1 | `game icon, flame with +1 badge, flat design, red gradient` |
| 速度加成 | 64x64 | 闪电图标+0.5 | `game icon, lightning bolt with +0.5 badge, flat design, blue` |
| 护盾 | 64x64 | 盾牌图标 | `game icon, shield, flat design, silver metallic` |
| 踢球 | 64x64 | 靴子踢炸弹 | `game icon, boot kicking bomb, flat design, brown leather` |
| 遥控 | 64x64 | 遥控器+炸弹 | `game icon, remote control with wireless signal, flat design` |

### 3.2 英雄头像

```
32x32 像素头像，圆形裁剪，带金色边框
Prompt: `game avatar, circular portrait, [英雄描述], 
flat illustration style, warm colors, gold border,
white background, 32x32 pixels`
```

### 3.3 怪物头像

```
32x32 像素头像，圆形裁剪，红色边框
Prompt: `game enemy avatar, circular portrait, [怪物描述],
flat illustration style, dark colors, red border,
white background, 32x32 pixels`
```

### 3.4 UI 按钮

```
游戏内按钮，圆角矩形，深蓝底色 (#1A237E)，金色边框 (#FFD700)
尺寸：64x32 (小), 128x48 (中), 256x64 (大)
文字：白色，加粗
悬停状态：背景加深
```

---

## 四、纹理与材质

### 4.1 地面纹理

| 纹理名 | 尺寸 | 描述 |
|--------|------|------|
| floor_wood | 512x512 | 木地板（舞台/大厅） |
| floor_stone | 512x512 | 石砖地面（地下城） |
| floor_grass | 512x512 | 草地（室外） |
| floor_marble | 512x512 | 大理石（宫廷） |

**Prompt：**
```
seamless tile texture, [描述], 
top-down view, game asset, 512x512 pixels,
no visible seams, consistent lighting
```

### 4.2 墙壁纹理

| 纹理名 | 尺寸 | 描述 |
|--------|------|------|
| wall_stone | 512x512 | 石墙（不可破坏） |
| wall_bricks | 512x512 | 砖墙（可破坏） |
| wall_ice | 512x512 | 冰墙（特殊维度） |

### 4.3 爆炸特效

```
3D game explosion effect, low-poly style,
fire and smoke particles, orange/yellow/red gradient,
dynamic pose, white background,
front view + side view,
game asset quality
```

---

## 五、一致性控制方法

### 5.1 Reference Image

每张图生成时，传入一张**风格参考图**：

```
参考图内容：一张已确认满意的 low-poly 3D 角色渲染图
用途：锁定画风、色彩倾向、渲染风格
```

**参考图制作流程：**
1. 先用 Agnes AI 生成 3-5 张候选图
2. 人工挑选最符合预期的一张作为"黄金参考图"
3. 后续所有同类素材都用这张图做 reference

### 5.2 色彩约束

所有素材严格使用 UI_UX_SPEC 中定义的色彩方案：

```
英雄：金色 #FFD700、深蓝 #1A237E、白色 #FFFFFF
怪物：红色 #D32F2F、紫色 #7B1FA2、绿色 #388E3C
道具：蓝色 #1976D2、绿色 #388E3C
UI：深蓝 #1A237E、金色 #FFD700、白色 #FFFFFF
```

### 5.3 提示词模板

建立标准化提示词模板：

```
[主体描述], 3D game asset, low-poly style, 
neutral pose (T-pose), white background,
front view + side view + back view,
consistent top-right lighting,
game asset quality, clean geometry, no shadows,
--style reference: [黄金参考图URL]
```

---

## 六、英雄介绍视频生成

### 6.1 视频规格

| 参数 | 值 |
|------|-----|
| 分辨率 | 1920x1080 |
| 时长 | 5-10 秒 |
| 帧率 | 30 fps |
| 格式 | MP4 (H.264) |
| 码率 | 5 Mbps |

### 6.2 视频内容

每个英雄的介绍视频包含：
1. 英雄 3D 模型旋转展示（3 秒）
2. 英雄名称和称号浮现（2 秒）
3. 英雄技能特效展示（2 秒）
4. 英雄台词字幕（2 秒）

### 6.3 Prompt 模板

```
Cinematic 3D render, [英雄描述],
camera slowly rotating around the character,
dramatic lighting, particle effects,
music notes floating in background,
elegant transition to title card with name,
cinematic quality, 1080p, 30fps
```

---

## 七、生产流程

### 阶段一：核心资产（Phase 1 必需）

1. 4 位英雄的 3D 模型参考图（正/侧/背三面）
2. 3 种怪物的 3D 模型参考图
3. 炸弹和爆炸效果参考图
4. 6 种道具图标
5. 地面/墙壁纹理
6. UI 按钮和图标

### 阶段二：扩展资产（Phase 2）

1. 额外英雄模型
2. 额外怪物类型
3. Boss 模型
4. 维度特殊纹理
5. 英雄介绍视频

### 阶段三：精细打磨（Phase 4-5）

1. 动画帧（行走、攻击、受伤）
2. 粒子特效增强
3. 高分辨率版本

---

## 八、质量检查清单

- [ ] 3D 模型面数在规格范围内
- [ ] 贴图分辨率正确（512x512 / 256x256 / 128x128）
- [ ] 正/侧/背三面视图一致
- [ ] 光照方向统一（右上方）
- [ ] 背景纯白（#FFFFFF）
- [ ] 无多余几何体或悬浮碎片
- [ ] 色彩符合方案
- [ ] 文件格式正确（.glb / .png）
- [ ] 文件名与 heroes.ts 中的 modelPath 匹配
