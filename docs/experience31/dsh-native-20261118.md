# 真实 DSH 安装尝试与兼容性阻塞

2026-11-18，Asia/Shanghai。用户明确批准将 `artifacts/out-of-tokens-843e0e5/dsh` 安装到当前日常DSH配置并验证；该具体授权优先于 `apps/dsh/AGENTS.md` 中默认禁止在live profile测试的约定。没有扩大到其他候选包或修改宿主安全设置。

## 实际结果：安装失败，后续门禁未执行

1. 安装前重新运行 `node scripts/verify-playtest.mjs artifacts/out-of-tokens-843e0e5`，819文件与构建身份通过，sourceCommit为 `843e0e5e5930ae3b701b19c8c6d9e5c747238e33`。
2. 在真实DSH原生插件管理器填写上述绝对目录并点击安装。
3. 宿主返回：`oot-dsh@0.3.0-experimental` 与 DSH `0.2.2-rc.1` 不兼容，要求 `engines.dsh 0.2.1-rc.5`。这是DSH自身的兼容检查，不是自动审批拒绝、路径错误或包哈希失败。
4. 没有强制安装、改manifest绕过检查或启用候选。关闭失败弹窗后，已安装列表没有oot-dsh；原有小院插件仍在列表。只证明列表状态，不冒称小院地图/角色/存档共存测试通过。
5. 工坊入口、真实认证、自动/手动保存恢复、双窗口冲突、断连重连、卸载/重装均未执行，继续HOLD。未读取小院存档、凭证或会话文件。宿主可能保留安装失败任务记录，不宣称磁盘从未产生任何暂存文件。

证据目录：`D:\Documents\FeiyangChen\devApps\ai-game\commission-evidence\dsh-native-1118`。`install-failure.txt`、`install-failure.png`及`ui-final-state.json`记录原生UI结果。宿主和用户其他插件未被关闭、卸载或重启。

## 只读接口核对：不能只改版本声明

使用现有REA CLI对已安装 `D:\Software\DSH_Official\resources\app.asar` 做静态清单检查，无新增工具安装/配置。

- ASAR SHA256：`5fa8a6b21bceb8f3e99e30efa2270efd0cc773a11e42aa0488f804a64b34e637`。
- REA检查Evidence：`ev_ff14135c08ac8db33d661a1e0bb24e81d4d559dc88decc7803c6b66f42cba0d9`。
- 清单Evidence：`ev_023f1d26d98fc3ce5e17943a16bc050b8916a8b8d82d76134f5232d20a0ddee1`。
- 完整清单在`rea-artifact.json`。随后用现有`@electron/asar`只提取已清单确认的四个模块到证据目录，源码摘要见`host-contract/manifest.json`；这是普通静态文件读取，不把它冒称为REA动态执行。

具体观察：

| 候选代码/接口 | 当前0.2.2包内证据 | 结论范围 |
|---|---|---|
| `apps/dsh/src/index.ts`监听connection/request，匹配`/out-of-tokens/` | `dsh-client-connection/lib/index.js`的apply在`/api`前缀路由里先admit，再waterfall同一req给connection/request（约1044–1058行） | 不能据旧HTTP harness推断候选根路径在当前真实Web路由可达；必须核对前缀/路由与认证链 |
| 候选没有使用Fetch registry | 同模块提供`connection.fetch.register`，注册精确path与methods；`assertFetchRoute`要求path属于`/api`（约732–734、840–853、973–976行） | 可作为适配方向，不能用匿名webServer旁路替代认证 |
| 客户端iframe使用`/out-of-tokens/web/index.html?dsh=1`；HostSaves默认`/out-of-tokens/api/saves` | 新宿主路由/桌面carrier仍须联合验证 | 后端、DSH客户端和HostSaves接线必须成套考虑，不能只修改engines字段 |
| 客户端使用connection.state.getSnapshot/subscribe | `client.browser.js`约1434–1443行仍提供这两个接口 | 这两个接口静态形状匹配；不代表全部生命周期/断连行为兼容 |

未检查0.2.1原始宿主包，不能声称已证明接口在哪一个版本首次变化。profileContext、完整桌面carrier与卸载生命周期尚未完成核对；静态观察不等于真实安装/运行通过。尚未生成或批准0.2.2兼容候选，原819文件包保持不变。

## 接续分工与验收要求

1. **Codex B**：在独立worktree核对并适配0.2.2认证路由、HostContext、生命周期与桌面carrier；保留17MB限制、CAS、取消/超时、单一事务及存档目录边界。先给出兼容性契约和路由fixture，不偷改保存格式/哈希/轮转例外。
2. **Gemini A（仅若需要Web调用点改变）**：消费B登记的显式HostSaves endpoint/能力；Codex不能越权改use-game等A文件。纯DSH客户端属于B，勿将两者混淆。若能在B边界内完整适配，则无需制造A依赖。
3. 完成旧行为/新路由/未认证拒绝/冲突/响应不确定对账/销毁测试后运行完整check，提交固定实现；据实声明验证过的DSH版本范围，禁止无证据放宽为任意未来版本。
4. 生成新固定SHA候选并校验全部文件，再按具体候选执行真实安装。当前用户批准的对象是843e0e5包；不能把失败记录改成新候选安装通过。
5. 真正安装成功后再跑双入口、保存恢复、冲突、断连、保存关闭、小院共存与卸载重装。不能提前关闭真实DSH HOLD，也不影响独立的3.1功能PASS和VF5/Visual Freeze HOLD。
