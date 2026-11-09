# 办公室场景、角色比例与全屏 UI 修复说明 (UI & Art Fixes)

> **状态**：已完成 O4a 首闭环及全界面视觉统一化改造（Phase 1–3 全量落地，待提交）
> **涉及目录**：`out-of-tokens/apps/web`、`out-of-tokens/scripts`、`out-of-tokens/docs`

---

## 一、 问题根因总结

在审查最新提交的办公室工位化（O0–O3）与全屏 Village UI 改造后，定位到以下 5 类核心视觉与交互问题：

### 1. 角色整体偏大且同屏出现 3 种失真尺码（反向透视 Bug）
- **原逻辑**（`apps/web/src/office-scene.ts:33`）：
  ```ts
  w.height = !seated && members.length > 4 ? 130 : seated ? 280 : 200;
  ```
- **问题表现**：
  - 凡是处于工位（`work`）或白板（`meeting`）状态的角色被强制放大到 **`280px`**，而旁边待命角色为 **`200px`**（当同场景人数 `> 4` 时骤降至 **`130px`**）。
  - 在 1280×720 视口下，`280px` 的角色占画布高度近 **39%**，头部比电脑显示器大 3～4 倍。
  - 站在后排白板（`y = 635`）的规划角色高度为 `280px`，而站在前排（`y = 840`）的待命角色只有 `130px`～`200px`，形成严重的**近小远大反向透视**。

### 2. 各角色之间头身比例与视觉大小不统一
- **原逻辑**：所有 12 名角色的 `character.json` 均硬编码了 `visibleHeight: 900`，渲染时统一用 `height / 900` 缩放，未考虑各角色 PNG 部件的实际像素包围盒差异：
  - **BlueWhale（蓝鲸 / DeepSeek）**：头顶有一根细长呆毛（`ahoge` 从 `y = 152` 延伸到 `y = 55`，占去约 100px 顶部高度），且头部贴图宽度仅 `478px`（其余 11 名角色均为 `604px`），导致相同 `height` 下脸部与身体视觉小约 10%。
  - **Mistral / Llama / GPT**：头顶高帽羽毛、长立耳、弯角占用了 `900px` 包围盒顶部空间，导致实际脸部与躯干被压缩；而无帽角色（**Qwen、Claude、Seedance、Kimi**）头部填满顶部，显得头大身大。
  - **GLM（智谱）**：`face.png` 高度为 `605px`（其余角色均为 `560px`），下巴向下多出 `45px` 压住衣领，导致颈部消失、显得臃肿。

### 3. 角色入座与工位家具穿帮（桌下露脚、显示器过小）
- **原逻辑**：角色入座时仅将 `w.paper.root.y` 下移 `+12px`，**未隐藏站立双腿部件**（`leg-left`、`leg-right`），且办公桌前挡板过浅（`y = -43..-33`），导致角色坐在电脑桌后时，桌子底下一双站立的脚完整露在外面。
- **显示器比例**：原 `create-office-art.mjs` 将电脑显示器缩放为 `scale(0.6)`（宽约 `55px`、高约 `33px`），远小于角色头部宽度（约 `95px`），造成“巨人看袖珍玩具电脑”的违和感。

### 4. 布置模式（Arrange Office）槽位遮挡与角色干扰
- **原逻辑**：第 0 章的 `work-1..4` 全部排在 `y = 900`，槽位框底部与标签（`y = 928`）被底部 `footer` 抽屉（高度 `170px–200px`）遮挡；且 `work-4`（`x = 1600, y = 900`）与 `server-2`（`x = 1690, y = 860`）坐标重叠。
- **角色干扰**：进入布置模式时，场景中的角色与名字标签保持 100% 不透明，与半透明槽位框（如 `lounge-1`、`lounge-2`、`meeting-1`）发生文字重叠。

### 5. 待命角色垂直对齐叠字 & 顶部 HUD 暗背景可读性不足
- **待命队列**：原 `idlePoint` 将上下两排待命角色放在完全相同的 `x` 坐标（`170, 390`），上排角色脚下的名字标签恰好压在下排角色头顶。
- **顶部 HUD 与布置模式顶栏**：`garage.webp` 顶部为深褐色木梁，原 `--hud-halo: #fff6eaaa` 的 `2px` 阴影过弱，且 `.office-editor > header` 无背景衬底，深色文字在深色木梁上难以辨认；此外 `< 900px` 平板视口直接隐藏了 `.hud-resources`（现金与算力）。

---

## 二、 详细修改说明

### 1. 角色视觉尺寸校准与景深透视统一
- **文件**：
  - [`apps/web/src/village-characters.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-characters.ts)
  - [`apps/web/src/office-scene.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene.ts)
- **修改内容**：
  1. 在 `village-characters.ts` 中新增 `characterCalibration` 校准表与 `characterHeight(id, y)` 计算函数：
     - **基准高度**：统一为 **`172px`**（彻底移除 `280 / 200 / 130` 三档割裂尺码）。
     - **Y 轴景深透视**：根据角色所在 `y` 坐标（`620..880`）平滑插值缩放因子 `0.82 + 0.18 * clamp((y - 620) / 260, 0, 1)`，确保后排（会议区 `y = 635`）到前排（工位区 `y = 795`、休闲区 `y = 840`）呈现自然的近大远小透视关系，且在行走过程中动态平滑过渡。
     - **个体比例补偿**：
       - 呆毛/高帽/长耳角色放大补偿：`bluewhale: 1.08`、`mistral: 1.08`、`llama: 1.05`、`gpt: 1.04`、`glm: 1.02`。
       - 无帽饱满头型微缩补偿：`qwen: 0.96`、`claude: 0.96`、`kimi: 0.97`、`gemini: 0.97`、`seedance: 0.97`。
     - **GLM 头部偏移修正**：为 `glm` 配置 `headY: -22`，在 `villagePose` 中上移头部锚点，消除 `605px` 脸部贴图压衣领的问题。
  2. 同步调整角色脚底阴影椭圆尺寸（`ellipse(0, 4, 34, 8)`）与点击热区（`Rectangle(-65, -195, 130, 215)`），贴合新角色比例。

### 2. 入座遮挡修复与工位家具 SVG 升级
- **文件**：
  - [`scripts/create-office-art.mjs`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/scripts/create-office-art.mjs)
  - [`apps/web/public/art/office/*.svg`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/public/art/office/basic-front.svg)
  - [`apps/web/src/office-scene.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene.ts)
- **修改内容**：
  1. **入座隐藏站立小腿**：在 `office-scene.ts` 的 `tick()` 中，当角色在电脑工位就座（`w.zone === 'work' && w.arrived > 0.6`）时，自动将 `leg-left` 与 `leg-right` 节点设为隐藏（`visible = false`），并将坐姿根节点上移 `-18px`，使角色上半身自然露在桌面与显示器上方，桌下不再露出站立的脚。
  2. **办公桌与显示器比例升级**：更新 `scripts/create-office-art.mjs` 并重新生成全部办公室 SVG：
     - 将办公桌前挡板（Modesty Panel）加深至 `y = -52..-18`（`M-92 -52H92V-18H-92Z`），完整遮挡坐姿腰臀部。
     - 将桌面显示器从 `scale(0.6)` 放大至 **`scale(0.82)`**（高配工位 `standard-front.svg` 额外增加副屏），与校准后的角色头身比例协调。
     - 抬高座椅靠背（`basic-back.svg` 与带头枕的 `standard-back.svg`），并将描边从 `3px` 柔化至 `2.2px`（`#6b5240`），融入 `garage.webp` 手绘暖色背景。

### 3. 槽位坐标重排、待命交错站位与布置模式减噪
- **文件**：
  - [`apps/web/src/office-scene-spec.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene-spec.ts)
  - [`apps/web/src/office-editor.tsx`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-editor.tsx)
  - [`apps/web/src/office-scene.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene.ts)
- **修改内容**：
  1. **槽位避让底部抽屉与消除重叠**（`office-scene-spec.ts`）：
     - 将第 0 章 `work-1..4` 从 `y = 900` 上移至 **`y = 795`**，多章双排工位设为 `y = 720 + row * 125`，水平间距 `x = 640 + col * 260 + (row % 2) * 36`。
     - 将 `server-1..2` 移至 `x = 1720, y = 635 + n * 155`，彻底消除 `work-4` 与 `server-2` 的重叠。
     - 将 `lounge` 槽位调整为 `x = 215 + (n % 2) * 245, y = 635 + Math.floor(n / 2) * 155`，保证 `lounge-3` 与 `work-1..4` 全部位于布置模式底部 `footer` 抽屉上方。
  2. **待命角色交错站位**（`office-scene-spec.ts`）：
     - 将 `idlePoint` 改为梅花桩交错坐标（`<= 4` 人时为 `(165, 690), (375, 670), (255, 840), (465, 820)`；`> 4` 人时奇数排自动横向错开 `+140px`），彻底避免上排角色名字压住下排角色头顶。
  3. **布置模式（`layout`）视觉减噪与内嵌胶囊标签**（`office-scene.ts`、`office-editor.tsx`）：
     - 进入布置模式时，自动将场景中角色透明度降至 `0.28` 并隐藏角色名字标签，同时禁用角色与家具的 Pixi 指针拦截，避免与槽位选择冲突。
     - 在 `office-editor.tsx` 中将槽位框收敛为 `196×100`（`rx="14"`），并将槽位文字移入框体底部内侧的毛玻璃胶囊衬底（`fill="var(--glass)"`）中，确保在任何地板或家具纹理上均清晰可读且绝不超出槽位框底部。

### 4. 顶部 HUD 光晕增强、布置模式顶栏毛玻璃化与平板资源显示
- **文件**：[`apps/web/src/village-ui.css`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-ui.css)
- **修改内容**：
  1. 增强 `.studio-hud` 与 `.studio-dock` 的文字与图标光晕（`--hud-halo: #fff8ebf5`，多层 `text-shadow: 0 0 10px var(--hud-halo), 0 0 4px var(--hud-halo), 0 1px 2px var(--hud-halo)`），解决深色木梁背景下的阅读困难。
  2. 为 `.office-editor > header` 增加毛玻璃胶囊条衬底（`background: var(--glass); backdrop-filter: blur(14px) saturate(1.08); border: 1px solid var(--line); border-radius: 16px`），使布置模式标题、现金公式与操作按钮清晰醒目。
  3. 在 `560px–899px` 平板视口保留顶部 `.hud-resources`（现金与算力显示），仅在 `< 560px` 窄屏手机视口下收起到“更多”菜单中。

---

## 三、 验证结果

在 `out-of-tokens` 目录下运行完整检查流水线 `pnpm check`：
- **TypeScript (`tsc -b --pretty false`)**：0 错误
- **ESLint (`eslint packages apps`)**：0 错误 / 0 警告
- **Vite / Package Build (`pnpm build`)**：构建通过
- **Vitest (`vitest run`)**：全部测试套件（含 `apps/sim-cli/office.test.ts` 的 5 种视口相机裁剪与工位聚焦断言）100% 通过


## 四、集成复审结论（2026-11-09，以下修订覆盖上文过强结论）

接受统一世界尺寸、连续景深、GLM头部补偿、就座腿部隐藏、细描边暖色家具和布置模式减噪。角色PNG与骨架原文件未修改；校准系数是视觉调参，不是“所有头脸完全相同”的测量证明。280是世界单位，1280×720全景scale=2/3时实际约187屏幕像素，并非占720高的39%。附件所称P0是视觉重要性描述，不是崩溃/数据损坏级故障。

实机发现并追加修正：
- 入座缩小后显示器遮脸：坐姿上移48世界单位，主屏移到右侧76；保留身体比例和起身双腿恢复。
- 待命名牌仍压下一排头：四人纵距250，高人数改为通道站位，移除冗余“可安排”后缀。保留不同角色头饰特征。
- 560px英文顶栏把时间挤到0宽、“更多”超出屏幕：时间禁止收缩，900以下收起地点和推进文字；560以上保留资源，手机资源在更多。全透明HUD保持不变。
- 第1–4章68行距小于100高槽框：改130行距并分离会议/休闲/机房坐标；五章全部槽框无交叠有回归测试。
- 不能以移动槽位保证浮窗永远不遮挡：编辑器增加“收起工具/展开工具”，隐藏工具退出键盘循环。底部边缘槽位可用收起工具或槽位选择器操作，不宣称所有槽位同时在所有屏幕可见。

静态背景的墙面白板/吧台视为建筑装饰，独立落地白板/咖啡台是可购买家具，不删除玩法实体来掩盖装饰重复。细描边与暖色统一已接受；矢量家具仍较背景简化，后续精修须保留地板锚点和前后遮挡层。第1–4章槽框几何已测，尚未以满配置实机证明全部家具在所有背景上无美术遮挡。

复验：基线213通过；修正后219测试/33文件，typecheck/lint/Web及DSH构建通过。日志harness/ui-art-1109-final.log。实机证据harness/ui-art-1109/：1280工作与十二人、560英文深色、390手机版与工具收起；error/warn为空。十二人中间失败布局截图保留为twelve-1280.jpg，最终为twelve-1280-final.jpg。本UI基线不改变engine0.15.0/content office-1。

用户已确认下一阶段：O4首闭环只实施基础/标准工位效率与疲劳，预估、结算、展示、回放同时更新；摸鱼/发现提醒、休闲恢复、Tier2/3和设备效果后续实施。

---

## 五、 全界面视觉风格统一化升级（历史实施自述，完成口径已被复审修订）

> 2026-11-09 集成复审：本节保留原实施记录；“全量落地”、坐姿/屏幕调整、双屏标准工位、逐节点染色及部分 token 名称不再代表当前结论。当前方向、修复清单、待完成项与验收门禁统一见 [UI_ART_DIRECTION_1109.md](UI_ART_DIRECTION_1109.md)。标准工位仍为 Tier 1 单屏，UI 改造不是全部视觉验收通过。

结合 [`docs/UI_ART_REVIEW_1109.md`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/UI_ART_REVIEW_1109.md) 深度审计报告与美术光影复盘，确立了 **“象牙羊皮纸 + 深胡桃木 + 鼠尾草绿 + 黄铜细饰”** 的 3 级游戏化视觉语言体系，并一次性完成 Phase 1（P0 视觉止血与材质重构）、Phase 2（场景、家具与角色美术融合精修）、Phase 3（排版层级、游戏化控件与 O4a 视觉增强）三阶段改造：

### 1. Phase 1：P0 视觉止血与 3 级材质体系重构
- **文件**：
  - [`apps/web/src/tokens.css`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/tokens.css)
  - [`apps/web/src/village-ui.css`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-ui.css)
  - [`apps/web/src/alpha-app.tsx`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx)
- **修改内容**：
  1. **单一真相源材质 Token 与 6 级排版体系**（`tokens.css`）：
     - 收拢 `tokens.css` 与 `village-ui.css` 中的重复颜色变量，建立 3 级材质体系：
       - **Level 1（常驻 HUD 浮层）**：`--hud-pill` 半透明暖木黑底胶囊（`rgba(26, 20, 16, 0.56)`）+ `--brass-line` 黄铜细边 + 顶部 68px 暗角衬底，替代原有的 `3px` 白色文字发光描边（避免字体发糊、笔画粘连）。
       - **Level 2（模态弹窗与侧拉抽屉）**：`--paper` 96% 高不透明度象牙羊皮纸（`rgba(248, 241, 229, 0.96)`）+ `.dialog-head` 100% 实心羊皮纸顶栏 + `dialog::backdrop` 半透明暗场遮罩（`rgba(18, 13, 9, 0.42)` + `blur(4px)`），彻底解决弹窗穿透背景家具轮廓与滚动时标题叠字的 P0 问题。
       - **Level 3（建造/布置工具架）**：`--tool-surface` 90% 暖调毛玻璃（`rgba(244, 235, 220, 0.90)`）+ 1px 内高光。
     - 定义 6 级排版阶梯（`--font-xs: 11px` 至 `--font-2xl: 24px`），所有数值展示统一启用 `font-variant-numeric: tabular-nums`。
  2. **修复主操作按钮透明失效 Bug**（`village-ui.css`）：
     - 移除将 `button.primary` 与 `.advance-period` 强制覆写为 `background: transparent` 的规则，恢复实心深胡桃木/鼠尾草绿主按钮（`--primary-bg` + `--primary-fg` + `--brass-line` 内发光与阴影），确保主次按钮层级一眼可辨。
  3. **消除弹窗打开时右上角关闭按钮刺眼焦框**（`alpha-app.tsx`、`village-ui.css`）：
     - 为 `<dialog>` 根节点设置 `tabIndex={-1}` 并在打开时聚焦容器本身而非首个 `<button>`，同时将 `:focus-visible` 升级为精致的黄铜外环（`0 0 0 2px var(--paper-solid), 0 0 0 4px var(--focus)`）。

### 2. Phase 2：场景、家具与角色美术融合精修
- **文件**：
  - [`scripts/create-office-art.mjs`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/scripts/create-office-art.mjs) & [`apps/web/public/art/office/*.svg`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/public/art/office/standard-front.svg)
  - [`apps/web/src/village-characters.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-characters.ts)
  - [`apps/web/src/office-scene-spec.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene-spec.ts)
  - [`apps/web/src/office-scene.ts`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-scene.ts)
- **修改内容**：
  1. **家具 SVG 135° 暖阳渐变、高光切角与工位剪影升级**（`create-office-art.mjs`）：
     - 移除生硬的 `2.2px` 纯色描边，统一采用 **135° 左上暖阳线性渐变**（桌面 `#f0cca0 -> #cf9666 -> #a66d43`）、左上缘 `1.5px` 暖白受光切角（`#fff4dc`）与径向柔和投影（`cx="6" cy="15"`）。
     - **修正入座朝向与遮挡**：将显示器向桌面中心回调（`translate(12..18, -11)`），加深前挡板至 `M-94 -58H94V-8H-94Z` 并增加桌下暗部遮挡，配合 `office-scene.ts` 中坐姿高度回调至 `-26px`，使角色自然坐在桌后正对屏幕，消除“半截身子悬空飘在空板凳上方”的穿帮感。
     - **拉开基础/标准工位等级辨识度**：将 `standard` 标准工位从冷灰蓝色改为**深胡桃木配黄铜铭牌（Tier II）**，桌面配置**宽幅主屏 + 屏幕挂灯 + 右侧竖屏代码副屏 + 陶土多肉盆栽**，后层配备带人体工学头枕的高背网布椅，无需看文字即可区分基础木桌与标准工位。
  2. **角色头身比例收敛、暖光染色与胶囊铭牌**（`village-characters.ts`、`office-scene.ts`）：
     - 将 `characterCalibration` 收敛至 `[0.98, 1.04]` 区间（`bluewhale: 1.01`、`qwen: 1`），消除 DeepSeek 与 Qwen 并排站立时一窄一宽的割裂感。
     - 为 PaperDoll 各图层施加环境暖光染色（`sprite.tint = 0xfff5e8`），并用三层递进式柔边椭圆阴影替代单层死黑圆盘。
     - 将场景内角色原本 `5px` 白边描边的裸文字替换为**胡桃木黄铜胶囊铭牌**（`badgeBg: Graphics` + `11px` 象牙白文字），支持直接展示标准工位加成（`✦+10%`）与低精力预警（`⚡`）。
  3. **待命锚点避让与 12 人底栏防撞**（`office-scene-spec.ts`）：
     - 将 4 人待命后排锚点移至 `(335, 655), (490, 655)`，前排移至 `(215, 900), (430, 900)`，使 DeepSeek 从 `lounge-1` 咖啡吧台正上方移出至开阔地板，同时严格保持 `idlePoint(front).y - 186 > idlePoint(back).y + 44` 的前后排不压头几何不变量。
     - 将 12 人模式最底排 `y` 从 `1020` 上移至 `955`，避免底部角色铭牌与左下角实验室徽章重叠。

### 3. Phase 3：游戏化控件、国际化补全与 O4a 视觉增强
- **文件**：
  - [`apps/web/index.html`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/index.html)
  - [`apps/web/src/alpha-app.tsx`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx)
  - [`apps/web/src/decision-panels.tsx`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/decision-panels.tsx)
  - [`apps/web/src/office-editor.tsx`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/office-editor.tsx)
  - [`apps/web/src/village-ui.css`](file:///d:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-ui.css)
- **修改内容**：
  1. **原生控件游戏化与英文硬编码修复**（`village-ui.css`、`alpha-app.tsx`）：
     - 为所有 `<select>` 注入 `appearance: none` 与胡桃木色定制 SVG 下拉箭头，统一 `36px` 控件高度与内阴影；定制 `6px` 极细暖色滚动条。
     - 修复 `alpha-app.tsx` 英文模式下岗位（`Not assigned / Worker / Planner / Reviewer / Tool`）与部署方式（`Cloud / Local`）残留中文硬编码的问题。
  2. **O4a 工位加成可视化与布置模式地贴升级**（`decision-panels.tsx`、`office-editor.tsx`）：
     - 在 `AssignmentForecast`（本时段预估）中为成员增加工位徽章（`.station-pill`）、标准工位效率加成（`.bonus-pill: ✦ +10%`）与精力胶囊（`.energy-pill`）。
     - 将布置模式 SVG 槽位框升级为暖金黄铜地贴样式，内嵌深胡桃木胶囊铭牌与工位等级角标（`✦+10%` / `· Ⅰ`）。
  3. **底部悬浮胶囊导航栏与响应式抽屉**（`village-ui.css`、`index.html`）：
     - 将底部 `.studio-dock` 升级为悬浮暗色胶囊导航栏，移除网页感的 `text-decoration: underline`，改用顶部黄铜横条与浅金胶囊底色标识激活态。
     - 将右侧 `.hud-drawer` 宽度设为 `clamp(340px, 27vw, 440px)`，并在 `index.html` 补齐 `viewport-fit=cover` 安全区适配。

### 4. Phase 1–3 全量验证结果
- 执行 `node scripts/create-office-art.mjs`：16 个办公室家具 SVG 资产全部重新生成。
- 执行 `pnpm check`：
  - **TypeScript (`tsc -b --pretty false`)**：0 错误
  - **ESLint (`eslint packages apps`)**：0 错误 / 0 警告
  - **Build (`pnpm build`)**：`oot-core`、`oot-web`、`oot-dsh` 构建全部通过
  - **Vitest (`vitest run`)**：**34 个测试文件 / 233 项测试用例 100% 通过**（含 `office.test.ts` 37 项几何/遮挡/焦点测试与 `office-effects.test.ts` 13 项 O4a 结算测试）
