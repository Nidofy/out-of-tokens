# AI Village 原版 Q 角色复用 v1

用户明确要求“角色直接采用ai-village中的角色，初期先做q版”。本次按该授权复用相邻dsh_plugin的生产角色资源，不重新生成或改画角色。

来源完整HEAD：f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352；源assets/characters、assets/portraits、LICENSE在复制前git status为空。12人production manifest均approvedForRelease=true。逐件复制character.json、其实际引用的141张PNG部件（含四表情）、12张原头像；核对全部部件/头像源manifest哈希。源manifest与源头像清单保存在此处，179条复制记录含审计文件/许可证共25455059字节，完整SHA256见manifest.json。

图像来源沿用AI Village已有image_gen生产记录；本轮无图像生成、重绘、压缩或像素处理。保留原始尺寸/alpha/层级/pivot/服饰配饰。相邻项目MIT许可证原文随运行时art/ai-village/LICENSE.txt分发，保留DeepSeek/Nidofy版权。这里记录明确选定的生产资源，不将包级许可证泛化到未选定的社区图片。

角色：bluewhale(DeepSeek)、Qwen、Llama、Mistral、GPT、Claude、Kimi、Gemini、Grok、GLM、MiniMax、Seedance。加载采用现有MIT PaperDoll渲染器和原character.json；固定本地ID白名单，当前场景有角色才解码部件，原图保留且全部加入离线缓存。现代场景仍使用本项目原创背景。

本轮接入中性/开心/惊讶/困倦表情及轻量整体/身体动作，没有把AI Village全部工作/用餐替换手臂、行走路径或活动系统复制进来。版本成长仅显示版本标签，不另加改变原角色造型的眼镜、光环、丝带等。

上一轮重新设计的12张角色WebP转存art/studio-v1/retired-actors；母版和历史包保留，已不作为运行时角色使用。旧生成脚本改为输出该归档路径，避免再覆盖当前角色选择。其余15张现代场景/剧情WebP继续使用。

复现导入：node scripts/import-village-chibi.mjs <dsh_plugin绝对路径>；只读源仓库，源部件哈希不符立即失败，不写源仓库或实际DSH Profile。
