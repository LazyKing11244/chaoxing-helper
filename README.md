# 超星学习通助手 Next (chaoxing-helper)

> **版本**：v5.1.0 (2026 重构维护版)  
> **开源协议**：GPL-3.0-or-later  
> **项目主页**：[LazyKing11244/chaoxing-helper](https://github.com/LazyKing11244/chaoxing-helper)

---

## 🚀 一键安装指南

请确保浏览器已安装 **Tampermonkey (油猴)** 或 **ScriptCat (脚本猫)** 扩展，点击下方链接即可一键安装：

- 🔗 **GitHub Raw 安装（推荐）**：  
  [https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js](https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js)
- ⚡ **国内镜像加速安装**：  
  [https://ghproxy.net/https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js](https://ghproxy.net/https://raw.githubusercontent.com/LazyKing11244/chaoxing-helper/main/chaoxing-helper.user.js)  
  *备用加速*：[https://fastly.jsdelivr.net/gh/LazyKing11244/chaoxing-helper@main/chaoxing-helper.user.js](https://fastly.jsdelivr.net/gh/LazyKing11244/chaoxing-helper@main/chaoxing-helper.user.js)

---

## 🌟 核心特性与架构演进 (v5.1.0+)

1. **彻底的代码精简与轻量化运行**：
   - **全面剔除历史冗余**：彻底清除废弃的第三方后台助手联动页面与接口、失效的自动登录模块、过期旧内核嗅探逻辑，移除 16KB Base64 音频编码。
   - **Web Worker 与现代保活机制**：基于 Web Audio API 静音振荡器结合 Screen WakeLock 现代 API 实现真后台防休眠保活，无缝支持页面最小化与多标签切换。
   - **去中心化本地 MD5 计算**：完全剔除远端裸 IP 网络依赖，采用纯本地秒级 MD5 与算法兜底，杜绝离线卡顿。

2. **核心业务逻辑与稳定性强化**：
   - **正确率计算修正**：修复章节测试原有整数截断缺陷，杜绝 `totalQuestionNum == 0` 时 `NaN` 导致的流程卡死。
   - **音频与任务汇报标准化**：规范多媒体任务点与音频任务汇报参数，避免进度意外重置。
   - **闭包安全与内存防护**：修复查题与任务遍历中的异步闭包串题隐患，定时器与资源监听严格自回收。

3. **三级题库降级链路与全题型支持**：
   - **查询降级链路**：优先查询公共题库 -> 未命中查询自定义备用题库 -> 仍未命中自动调用 AI 大模型智能推理。
   - **全题型支持**：支持单选、多选、判断，并完整支持填空题多空智能拆分与表单事件触发。
   - **选项精准匹配**：支持字母匹配（单选 `"A"`、多选 `"ACD"`）与清洗后文本模糊包含匹配。

4. **DeepSeek 与 OpenAI 兼容大模型深度集成**：
   - **多端点支持**：固定对接 DeepSeek 官方接口，并全面兼容自定义 OpenAI 格式端点。
   - **思考深度控制**：支持 `low`、`none`、`high`、`max` 多档思考深度调节。
   - **面板连通性工具**：内置一键测试 API 连通性与余额查询，秒级反馈模型状态。

5. **极简双栏面板与持久化配置**：
   - 现代化响应式双栏界面，实时展示运行日志与状态。
   - 跳转模式（智能/遍历/不跳转）、解除多端监控、盲猜等配置全量本地持久化。
   - 挂机激活状态（`unrivalbacknow`）支持跨章节与跨页面持久化自启，切换章节不掉挂机。

6. **字体混淆反爬与学科语境增强**：
   - **按需字体解密**：零开销按需嗅探 `.font-cxsecret`，自动通过字形轮廓指纹还原混淆汉字，设有 5 秒超时兜底。
   - **课程名上下文注入**：从页面顶层自动提取课程名注入 AI 提示词与备用题库请求，大幅降低专业题目的理解偏差。
   - **全角半角标准化**：底层集成 `toCDB` 全角转半角，杜绝因全角符号、字母或数字导致查题匹配落空。

7. **答题速览与资源直链实用工具**：
   - **结构化答题速览表**：面板实时呈现题目处理结果，未命中或盲猜题目醒目黄色高亮预警，支持单元格一键点击复制。
   - **任务资源直链下载**：卡片任务列表中直接提供音视频与文档资源的源文件直链下载入口。
   - **课程章节统计胶囊**：在课程章节目录顶部自动注入剩余待完成统计与章节分析一键直达入口。

---

## 🤖 AI 答题配置说明

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key（形如 `sk-...`）。
2. 打开学习通章节页面，展开**【题库与 AI 答题配置】**面板中的“3. DeepSeek AI 智能答题”。
3. 配置各项参数：
   - **Model 模型**：默认选择 `deepseek-flash`（日常刷课推荐，耗时短且准确率高）；复杂课程可选择 `deepseek-v4-pro`。
   - **思考深度**：推荐选择 `low`；如需最省 Token 和极速秒答可选择 `none`。
   - **API Key**：粘贴您的 `sk-...` 密钥。
4. 点击 **`[保存配置]`**，随后点击 **`[测试 API 与余额]`**：
   - 看到绿色提示 `✅ 可用 | 余额: xx CNY | 响应: "B" (xxx ms)` 说明配置成功。
5. 点击标题旁边的 **`[已禁用]`** 按钮，切换为绿色 **`[已启用]`** 即可开始自动 AI 答题。

---

## 🛠️ 开发者日常维护与发布指南

> 💡 **详细维护手册**：完整模块路由映射、GM Storage 配置字典与核心协议避坑红线，请参考交付文档：  
> [`超星学习通助手_技术架构与交付维护手册.md`](file:///D:/lanhanDOC/01_Agent交付文档/docs/超星学习通助手_技术架构与交付维护手册.md)

本脚本已配置标准 `@updateURL` 与 `@downloadURL`。若后续进行了代码维护或功能升级，请按以下步骤发布更新：

### 1. 修改代码并升级版本号
在 `src/meta.js` 与 `package.json` 中保持版本号同步（如 `5.1.0`）。

### 2. 执行模块化构建与语法检查
项目采用模块化源码组织，在根目录下执行：

```bash
node build.js
```

构建脚本将自动读取 `src/` 中的模块，拼接生成单文件 `chaoxing-helper.user.js` 并执行 `node --check` 语法校验。

### 3. Git 提交并推送到 GitHub

```bash
git add .
git commit -m "chore: release v5.1.0 (超星学习通助手 Next)"
git push origin main
```

---

## ⚖️ 免责声明

1. 本脚本仅供前端自动化技术学习、编程研究与交流使用，请勿用于违反学校规章制度或商业谋利的场景。
2. 使用本脚本所产生的一切后果由使用者自行承担，作者不对任何因使用本脚本导致的学分或账号异常负责。
