# 超星学习通小助手 (chaoxing-helper)

> **版本**：v5.0.4 (2026 重构维护版)  
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

## 🌟 v5.0.0 核心特性

1. **核心计算与逻辑 Bug 修复**：
   - **正确率计算修正**：修复章节测试原有 `Math.floor(...) * 100` 整数截断 Bug（原先会导致只要未全对就截断为 0%），杜绝 `totalQuestionNum == 0` 时 `NaN` 卡死。
   - **音频任务汇报修复**：修复音频任务点（Audio）`rt` 参数被覆盖回 `'0.9'` 的 Bug，确保音频始终以标准空字符串上报。
   - **闭包变量修复**：修复查题定时器循环中共享全局变量 `qu` 导致的并发异步串题 Bug。
   - **资源防泄漏**：修复 `missionList` 对象声明与判空逻辑；彻底清理 `doWork` 与 `visibilitychange` 定时器。

2. **代码瘦身与纯本地 MD5 计算**：
   - **代码瘦身 50%**：删除原占 170KB 的冗余 Base64 PNG 图片，作者面板改为轻量维护说明；保留关键的后台防休眠静音音频 `audiofile`。
   - **去中心化 MD5**：完全剔除对远端已废弃裸 IP（`14.29.190.187`）`getEnc.php` 的网络依赖，改为纯本地秒级 MD5 计算，内置轻量纯 JS MD5 算法兜底，离线无阻。

3. **三级题库降级链路与填空题支持**：
   - **查询降级链路**：优先查询一之哥哥主题库 -> 未命中查询自定义备用题库 -> 仍未命中自动调用 DeepSeek AI 大模型推理。
   - **新增填空题（type='2'）**：自动解析填空题输入框与文本域，多空智能切分并触发标准表单输入/变更事件。
   - **选项精准匹配增强**：全面支持字母匹配（如单选 `"A"`、多选 `"ACD"`）与清洗后的文本模糊包含匹配。

4. **DeepSeek 官方大模型深度集成**：
   - **官方专属端点**：固定对接 DeepSeek 官方对话与余额接口，支持 `deepseek-flash`（极速高准）与 `deepseek-v4-pro`（高阶推理）。
   - **思考深度控制**：提供 `low`（默认轻量思考）、`none`（关闭思考极速秒回）、`high`（深度思考）、`max`（极限思考）。
   - **双重检测工具**：面板内置 `[测试 API 与余额]` 按钮，毫秒级检测账户余额状态与模型连通性。

5. **配置可视化与全量持久化**：
   - 跳转模式（智能/遍历/不跳转）、解除多端监控、无答案盲猜等均持久化至 `GM_getValue`/`GM_setValue` 并可在面板实时切换。

---

## 🤖 DeepSeek AI 答题配置说明

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key（形如 `sk-...`）。
2. 打开学习通章节页面，展开**【题库与 AI 答题配置】**面板中的“3. DeepSeek AI 智能答题”。
3. 配置各项参数：
   - **Model 模型**：默认选择 `deepseek-flash`（日常刷课推荐，耗时短且准确率极高）；难课疑难课可选择 `deepseek-v4-pro`。
   - **思考深度**：推荐选择 `low`；如需最省 Token 和极速秒答可选择 `none`。
   - **API Key**：粘贴您的 `sk-...` 密钥。
4. 点击 **`[保存配置]`**，随后点击 **`[测试 API 与余额]`**：
   - 看到绿色提示 `✅ 可用 | 余额: xx CNY | 响应: "B" (xxx ms)` 说明配置成功。
5. 点击标题旁边的 **`[已禁用]`** 按钮，切换为绿色 **`[已启用]`** 即可开始自动 AI 答题。

---

## 🛠️ 开发者日常维护与版本升级指南

本脚本已配置标准 `@updateURL` 与 `@downloadURL`。若后续进行了代码维护或功能升级，请按以下步骤发布更新：

### 1. 修改代码并升级版本号
在 `chaoxing-helper.user.js` 头部将 `@version` 递增（例如从 `5.0.0` 升级为 `5.0.1`）：

```javascript
// ==UserScript==
// @name         【减负社区】【超星学习通小助手】【完全免费】视频-章节测试|自动挂机|防清进度|不占资源
// @namespace    unrival
// @version      5.0.1
// ...
```

### 2. 本地语法检查
在提交前务必验证 JS 语法：

```bash
node --check chaoxing-helper.user.js
```

### 3. Git 提交并推送到 GitHub

```bash
git add chaoxing-helper.user.js README.md
git commit -m "feat: release v5.0.1 (优化某某功能)"
git push origin main
```

### 4. 用户端自动更新生效
推送至 `main` 分支后，所有安装了本脚本的用户的油猴或脚本猫扩展将在设定的检查周期内（或手动点击“检查脚本更新”时），自动对比 `@version` 并无感拉取最新版本。

---

## ⚖️ 免责声明

1. 本脚本仅供前端自动化技术学习、编程研究与交流使用，请勿用于违反学校规章制度或商业谋利的场景。
2. 使用本脚本所产生的一切后果由使用者自行承担，作者不对任何因使用本脚本导致的学分或账号异常负责。
