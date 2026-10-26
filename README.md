# 超星学习通助手 Next (chaoxing-helper)

> **版本**：v5.1.0 (2026 重构维护版) | **开源协议**：GPL-3.0-or-later  
> 轻量高效的超星学习通油猴辅助脚本，采用模块化架构、协议级调度与现代前端保活技术。

---

## 🚀 一键安装

确保浏览器已安装 **Tampermonkey (油猴)** 或 **ScriptCat (脚本猫)**，点击下方链接直接安装：

- 🔗 **[GitHub Raw 安装（推荐）](https://raw.githubusercontent.com/SlackHan/chaoxing-helper/main/chaoxing-helper.user.js)**
- ⚡ **[国内镜像加速安装](https://ghproxy.net/https://raw.githubusercontent.com/SlackHan/chaoxing-helper/main/chaoxing-helper.user.js)**

---

## 🌟 核心特性

- **真后台防休眠挂机**：基于 Web Audio API 静音振荡器与 Screen WakeLock 现代 API，多标签切换与页面最小化不掉线、不卡顿。
- **三级智能答题链路**：公共题库 -> 自定义备用题库 -> DeepSeek / OpenAI 大模型智能推理，自动注入课程学科语境。
- **字体反爬按需解密**：按需嗅探并还原 `font-cxsecret` 混淆字形，底层集成 `toCDB` 全角标准化，杜绝题目错乱与匹配落空。
- **全题型支持与答题速览**：支持单选、多选、判断与多空填空；面板实时呈现答题表，未命中/盲猜醒目黄色高亮，支持一键点击复制。
- **极简双栏现代 UI**：左栏任务控制与持久化参数，右栏实时日志；提供任务资源直链下载与课程章节统计胶囊。

---

## 🤖 AI 答题快速配置

1. 在 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key（`sk-...`）；
2. 打开网课章节页面，展开面板中的**【题库与 AI 答题配置】**；
3. 填入 API Key，模型选择 `deepseek-flash`（日常推荐），点击 **`[保存配置]`** 与 **`[测试 API 与余额]`**；
4. 提示可用后，将标题旁状态切换为绿色 **`[已启用]`** 即可。

---

## 🛠️ 本地开发与构建

项目采用模块化源码组织，日常仅需维护 `src/` 中的各个子模块：

```bash
node build.js    # 零依赖单文件打包，输出至 chaoxing-helper.user.js 并完成语法自检
```

> 详细开发规约与避坑红线请参阅项目规则 [`AGENTS.md`](./AGENTS.md)。

---

## ⚖️ 免责声明

1. 本脚本仅供前端自动化技术学习与编程交流使用，请勿用于商业谋利或违反学校规章制度的场景；
2. 使用本脚本所产生的一切后果由使用者自行承担，作者不对任何学分或账号异常负责。
