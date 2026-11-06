# 固定快照审查
主线程唯一写入；Gemini技术/确定性、Opus机制/经济、Sonnet增量回归。
每次代码检查点通过pnpm check后commit，后续记录提交写SHA和packet（不能把自己的SHA写入自己）。
文件名 harness/reviews/<phase>-<shortsha>-packet.md。
包记录基准/目标SHA、路径、GDD对照、实际日志、争议、复现和问题。
报告格式：ID | severity P0/P1/P2/P3 | SHA | file:line | 复现证据 | 影响 | 最小修复 | 阻塞依赖。
只读快照可 git worktree add --detach <独立审查目录> <SHA>，审查者不改主工作树。
等待审查时继续独立任务；P0立即修，P1相关集成前修，P2/P3台账。
已收到针对15e2775的Gemini/Opus/Sonnet报告，处理表见REVIEW_RESPONSE.md。新快照需独立复审，不把自测当成外部通过。
必须从固定SHA创建独立worktree或git archive；不能直接对正在修改的主目录取证。主线程继续推进无依赖任务，审查者只交报告。
