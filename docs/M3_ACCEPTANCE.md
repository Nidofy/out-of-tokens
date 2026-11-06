# M3 工程与验收边界

工程范围：独立DSH Host适配、工坊入口/备用入口、iframe权限与CSP、Profile命名空间、schemaVersion/CAS/修订号、3手动+1自动+5备份、原子发布、请求中断和生命周期回收、可分发试玩包。经营引擎/内容仍0.8.0/m2-1；本阶段未改领域规则，无需改存档版本。

Host只挂connection/request，不新建公开服务或绕开宿主认证。API仅/out-of-tokens/api/saves；静态资源白名单启动时加载，不解析任意文件路径。写入先完整重放校验；锁内重新读取revision，一次原子替换整个槽位集合。使用MIT许可DSH atomic-write 0.2.1-rc.2，发布后flush文件再回应；无声称Windows断电目录元数据完全持久化。文件系统权限/磁盘故障仍可导致未确认结果，客户端禁止重试，先只读对账。

自动化覆盖：独立owner及三个独立进程CAS竞争、5备份顺序、坏JSON/不兼容/坏存储保护、取消/关闭拒绝、邻接命名空间不变、HTTP路由/外部Origin/非法方法、请求体未完成时卸载、丢失写回应不重试、浏览器fetch绑定。真实IAB通过临时Profile契约页验证地图打开、严格CSP绘制、推进保存、刷新恢复、关闭及卸载后邻接按钮可用，见harness/m3/browser-results.md。

待验收：真实DSH Profile中的安装/共存/卸载，M1 10人和M2公开试玩，乐趣/美术/双语编辑质量及经营平衡。用户确认暂无测试者，先交工程和试玩包。本阶段不声称完整产品M1/M2/M3已经验收，不用工程测试关闭M05-03。

相邻小院源码f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352只读核对。12角色ID一致；地图入口是DOM兼容适配，非已存在的官方扩展API。源包PaperDoll及atomic-write原许可证随分发保留。纪念物及真实Token只读彩蛋未启用。
最终自动验证：15文件114测试通过（harness/m3/check-final-v3.log）。CSP测试同时确认默认路径失败、scene模块的兼容路径可同步真实标量uniform，不靠放宽策略。
