# Art-Batch 11 家具图层与角色叠合核验

基线 `de10b0baa79f1a54c0f9e0c3514fe212958ed34b`。本地资产提交 `73b8b48cd6317e7607ad6ea76a4c505aadbd6ea4`。2026-11-20 在此提交的暂存内容上复跑了完整工程检查。

## 成品

内置 image_gen 使用透明背景生成 28 张候选，选用 14 张原始 PNG，共 9,909,446 字节。工具未返回后端模型版本。每项的提示词、参考源、退选原因与 SHA256 见[生成记录](../../art/art-batch-11/PROMPTS.md)。[资产清单](../../art/art-batch-11/manifest.json)

| 家具或摆件 | 后层字节 | 前层字节 | 单件字节 |
| --- | ---: | ---: | ---: |
| basic | 13,582 | 13,794 | |
| standard | 20,250 | 15,000 | |
| whiteboard | 25,224 | | |
| coffee | 21,912 | | |
| sofa | 24,070 | | |
| server | 14,044 | | |
| dining | | 30,826 | |
| reading | | 21,268 | |
| decor-studio_cat | | | 11,888 |
| decor-monstera_pot | | | 14,750 |
| decor-token_jar | | | 9,556 |
| decor-vinyl_player | | | 8,600 |

10 张家具图层共 199,970 字节，8 张合成预览共 61,034 字节，4 张摆件共 44,794 字节。22 张运行态 WebP 解码后的 alpha 范围均为 [0, 255]，alpha 大于 0 的像素中纯黑数为 0。离线包覆盖这 22 张图和 1 份目录，公共文件与发行副本的 SHA256 逐项一致。

## 人与家具

两张书桌前层均只含书桌与桌面物品。最初两张前层在 480 px 宽时，桌面后沿分别落在 y292 和 y302。参考旧 SVG 重画后，实测成品宽分别为 466 和 469 px，中央桌面后沿均为 y224，桌脚均落在 y428。导出脚本对双手和腿部使用实际姿态坐标检查遮挡，对中央挡板的 y284–384 区域逐像素检查不透明度。[双底资产图](../../art/art-batch-11/review/batch11-assets-review.png)

在 Chromium 隔离核验页使用实际 Pixi WebGL 渲染器、角色加载器与 MapleChibiRig，按 165 世界单位身高复核六组静态构图。Bluewhale 与 Mistral 的两只手都在桌沿之上，腿被前挡板完整遮住，椅背上缘从发型两侧可辨。Bluewhale 坐在沙发左侧软垫上，GPT 朝向咖啡机，Claude 朝向白板。四件摆件与站姿角色并排时仍可辨认。未见误嵌椅子、文字乱码、裁切或大块地面投影。正式场景、编辑器与彩蛋点击反馈属于后续接入范围。[六组叠合核验图](../../art/art-batch-11/review/batch11-composite-review.png) · [WebGL 实机截图](art-batch-11-pixi.png)

## 复现

1. 在仓库根目录使用装有 Pillow、NumPy、SciPy 的 Python 运行 `python -B scripts/export-art-batch11.py`。连续两次导出后，批次归档和公共目录中的 64 个文件 SHA256 全部一致。
2. 运行 `pnpm check`。类型检查、lint、55 个文件中的 507 项测试及生产构建均通过。构建后可运行 `pnpm vitest run apps/web/package-verification.test.ts` 单独复核路径白名单、透明度、尺寸、锚点、预览合成与离线副本，23 项测试均通过。
3. 运行 `git diff --check de10b0b 73b8b48`。已对照基线检查保护路径，旧家具 SVG、既有艺术批次、角色、规则、内容、场景、编辑器、交互与样式均为零差异。
