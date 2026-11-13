# 独立美术批次记录

2026-11-13 Art-Batch 1：8 张模型新绘进阶立绘接入 WebP，8 张旧 SVG 原样移至 art/stage-b/legacy-svg；PWA 192/512/maskable PNG 与 favicon、离线列表对齐。41 文件334测试及完整构建通过；四视口×中英×亮暗，144张 Actors/PartnerProfile 截图，HTTP/破图/页面横向溢出失败0。证据 ../commission-evidence/art-tools/art-gen-batch-1。保护路径零diff；无规则变更。像素身份一致性为人工抽查，非独立复审；继续 Batch 2。

素材溯源：art/art-batch-1-candidates-1113/{PROMPTS.md,manifest.json,reference-hashes.json}。首次脚本旧选择器失败保留在仓库外；修正后144截图完整通过。所有截图为无头浏览器视口，不宣称真机验证。

2026-11-13 Art-Batch 2：食堂移除前景植物侵入、图书馆后方独立桌椅改为建筑书架；其余5张白天图复用。新增7张1920×1080暖光夜景，先解码再替换、过期请求忽略，移除旧夜间重复压暗，不改命中或相机坐标。SIFT/RANSAC配准内点中位残差0.42–0.56px；生成纹理不保证逐像素同一。41文件335测试及构建通过；112基线+224最终昼夜四视口双语双主题截图，最终HTTP/破图/溢出0失败。最终截图等待12角色资源并强制完成渲染。证据 ../commission-evidence/art-tools/art-gen-batch-2，溯源 art/art-batch-2。第一次并发全量测试超时已保留日志，串行复跑通过；早期加载不足/重复暗化截图被最终同名图替换，早期日志保留。完整低端性能预算不在本批闭合。
