# 超星学习通助手项目规则 (AGENTS.md)

本规则适用于在当前项目仓库 [`D:\lanhanCODE\projects\chaoxing-helper\`](file:///D:/lanhanCODE/projects/chaoxing-helper/) 下的所有 Agent 开发与维护任务。

---

## 1. 核心铁律

1. **禁止直接修改产物**：严禁直接编辑 `chaoxing-helper.user.js`！所有业务修改必须在 [`src/`](file:///D:/lanhanCODE/projects/chaoxing-helper/src/) 各独立模块中完成。
2. **改动必自检**：每次修改后必须运行 `node build.js` 打包，并执行 `npm test`（即 `node --test tests/unit.test.js`），确保打包成功、语法检查通过且 18 项单测 100% 通过。
3. **架构与避坑手册**：开发前请先阅读交付维护手册 [`D:\lanhanDOC\01_Agent交付文档\docs\超星学习通助手_技术架构与交付维护手册.md`](file:///D:/lanhanDOC/01_Agent交付文档/docs/超星学习通助手_技术架构与交付维护手册.md)。

---

## 2. 核心红线速查

- **测验 iframe 注入**：必须大写驼峰 `&knowledgeId=` 且 `workId` 取自 `jobid.replace('work-', '')`，违者超星报 `code=2`。
- **视频与音频协议**：走纯本地 `localMd5`；音频任务必须 `rt = ''`。
- **全角转半角**：清洗必须前置 `toCDB`，字体解密统一调用 `decryptFontIfNeeded`。
- **挂机状态跨章**：持久化读写 `unrivalbacknow`。
- **跨 iframe 测验日志**：统一调用 `pushWorkLog(msg)` 推入 `_w.top.unrivalWorkLogs` 队列，由外层卡片页 `drainWorkLogs()` 批量消费，严禁直接给 `_w.top.unrivalWorkInfo` 赋单字符串（杜绝同帧盲猜覆盖原始查题答案）。

---

## 3. 文档自更新触发规则

Agent 必须在以下契机主动同步文档，无需等待用户提醒：
- **涉及配置项增删** -> 同步维护手册第 4 节配置字典；
- **解决新踩坑点/协议变动** -> 同步维护手册第 5/6 节避坑表；
- **发版或递增版本号** -> 同步 `README.md` 与维护手册第 7 节里程碑。
- 日常单点代码答疑直接在对话中回复，不向手册灌入冗余流水账。
