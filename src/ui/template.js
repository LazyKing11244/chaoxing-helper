// ==========================================
// 课程卡片任务控制面板 HTML 模板与渲染辅助
// ==========================================

const CARDS_PANEL_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>超星学习通助手 Next v5.1.3</title>
    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 16px;
            background: #f4f6f8;
            color: #1e293b;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
            font-size: 13px;
            line-height: 1.5;
        }
        a { text-decoration: none; }
        .cx-container {
            max-width: 1180px;
            margin: 0 auto;
        }
        .cx-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            border: 1px solid #dce1e7;
            border-radius: 6px;
            padding: 10px 16px;
            margin-bottom: 12px;
        }
        .cx-title {
            font-size: 16px;
            font-weight: 600;
            color: #0f172a;
            margin: 0;
        }
        .cx-title a { color: #0f172a; }
        .cx-title a:hover { color: #2563eb; }
        .cx-warn {
            font-size: 12px;
            color: #b45309;
            background: #fef3c7;
            border: 1px solid #fde68a;
            padding: 3px 10px;
            border-radius: 4px;
        }
        .cx-grid {
            display: grid;
            grid-template-columns: 480px 1fr;
            gap: 12px;
            align-items: start;
        }
        @media (max-width: 920px) {
            .cx-grid { grid-template-columns: 1fr; }
        }
        .cx-col {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
        }
        .cx-card {
            background: #ffffff;
            border: 1px solid #dce1e7;
            border-radius: 6px;
            overflow: hidden;
        }
        .cx-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 9px 14px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 600;
            font-size: 13px;
            color: #334155;
        }
        .cx-card-body {
            padding: 12px 14px;
        }
        .cx-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            padding: 7px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .cx-row:first-child { padding-top: 0; }
        .cx-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cx-label {
            width: 88px;
            flex-shrink: 0;
            color: #475569;
            font-weight: 500;
        }
        .form-control {
            height: 28px;
            padding: 3px 8px;
            font-size: 13px;
            color: #1e293b;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            outline: none;
        }
        .form-control:focus {
            border-color: #2563eb;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 28px;
            padding: 0 10px;
            font-size: 12px;
            font-weight: 500;
            border-radius: 4px;
            border: 1px solid transparent;
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
        }
        .btn-xs {
            height: 22px;
            padding: 0 8px;
            font-size: 11px;
        }
        .btn-default {
            background: #f8fafc;
            color: #475569;
            border-color: #cbd5e1;
        }
        .btn-default:hover {
            background: #f1f5f9;
            color: #0f172a;
        }
        .btn-success {
            background: #16a34a;
            color: #ffffff !important;
            border-color: #15803d;
        }
        .btn-success:hover {
            background: #15803d;
        }
        .btn-primary {
            background: #2563eb;
            color: #ffffff !important;
            border-color: #1d4ed8;
        }
        .btn-primary:hover {
            background: #1d4ed8;
        }
        .btn-info {
            background: #0284c7;
            color: #ffffff !important;
            border-color: #0369a1;
        }
        .btn-info:hover {
            background: #0369a1;
        }
        .text-muted {
            color: #64748b;
            font-size: 12px;
        }
        /* Tabs */
        .cx-tabs {
            display: flex;
            gap: 4px;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 12px;
            padding-bottom: 8px;
        }
        .cx-tab {
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            background: #f1f5f9;
            border: 1px solid transparent;
            border-radius: 4px;
            cursor: pointer;
        }
        .cx-tab:hover {
            color: #0f172a;
        }
        .cx-tab.active {
            color: #2563eb;
            background: #eff6ff;
            border-color: #bfdbfe;
            font-weight: 600;
        }
        .cx-tab-pane { display: none; }
        .cx-tab-pane.active { display: block; }
        .cx-field {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        .cx-field-label {
            width: 72px;
            flex-shrink: 0;
            color: #475569;
            font-size: 12px;
        }
        /* Joblist items compatible with cards.js */
        #joblist {
            max-height: 150px;
            overflow-y: auto;
        }
        #joblist:empty::before {
            content: "暂无待处理任务或正在加载...";
            color: #94a3b8;
            font-size: 12px;
        }
        #joblist .panel {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 6px;
        }
        #joblist .panel:last-child { margin-bottom: 0; }
        #joblist .panel-body {
            padding: 6px 10px;
            font-size: 12px;
            color: #334155;
        }
        /* Log Console */
        #result {
            overflow: hidden;
        }
        #log {
            height: 340px;
            overflow-y: auto;
            background: #fcfcfd;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 10px;
            font-family: Consolas, "Microsoft YaHei", monospace;
            font-size: 12.5px;
            line-height: 1.65;
            word-break: break-all;
        }
        #workPanel {
            grid-column: 1 / -1;
            height: 760px;
        }
        /* Quiz Summary Table */
        .cx-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .cx-table th {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 8px;
            font-weight: 600;
            color: #475569;
            text-align: left;
        }
        .cx-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        .cx-table tr:hover {
            background-color: #f8fafc;
        }
        .cx-table tr.unmatched {
            background-color: #fff8e6;
            color: #856404;
        }
        .cx-table tr.unmatched:hover {
            background-color: #fef3c7;
        }
        .copyable-cell {
            cursor: pointer;
            user-select: none;
            transition: background-color 0.2s;
        }
        .copyable-cell:hover {
            text-decoration: underline;
        }
        .cell-copied {
            background-color: #dcfce7 !important;
            transition: background-color 0.2s;
        }
    </style>
</head>
<body>
    <div class="cx-container">
        <div class="cx-topbar">
            <h3 class="cx-title">
                <a href="https://github.com/SlackHan/chaoxing-helper" target="_blank">超星学习通助手 Next v5.1.3</a>
            </h3>
            <span class="cx-warn">提示：高倍速有清进度风险，建议 1 倍速运行</span>
        </div>

        <div class="cx-grid">
            <!-- 左栏：控制与配置 -->
            <div class="cx-col">
                <div class="cx-card" id="normalQuery">
                    <div class="cx-card-header">
                        <span>任务与运行配置</span>
                    </div>
                    <div class="cx-card-body">
                        <div class="cx-row">
                            <span class="cx-label">视频与挂机</span>
                            <input type="number" id="unrivalRate" style="width: 58px;" class="form-control" title="播放倍速">
                            <a id="updateRateButton" class="btn btn-primary btn-sm">修改倍速</a>
                            <a id="reviewModeButton" class="btn btn-default btn-sm">复习模式</a>
                            <a id="backGround" class="btn btn-default btn-sm">激活挂机</a>
                        </div>

                        <div class="cx-row">
                            <span class="cx-label">章节测试</span>
                            <a id="autoDoWorkButton" class="btn btn-default btn-sm">自动答题</a>
                            <a id="autoSubmitButton" class="btn btn-default btn-sm">自动提交</a>
                            <a id="autoSaveButton" class="btn btn-default btn-sm">自动保存</a>
                        </div>

                        <div class="cx-row">
                            <span class="cx-label">合格正确率</span>
                            <input type="number" id="accuracy" style="width: 58px;" class="form-control">
                            <span class="text-muted">%</span>
                            <a id="updateaccuracy" class="btn btn-primary btn-sm">修改正确率</a>
                            <span class="text-muted" style="margin-left: 4px;">达标才自动提交</span>
                        </div>

                        <div class="cx-row">
                            <span class="cx-label">跳转与策略</span>
                            <select id="unrivalJumpTypeSelect" class="form-control" style="width: 124px;">
                                <option value="1">遍历模式 (推荐)</option>
                                <option value="0">智能模式</option>
                                <option value="2">不跳转</option>
                            </select>
                            <a id="disableMonitorButton" class="btn btn-default btn-sm" title="解除多端学习监控">解除多端监控: 关</a>
                            <a id="randomDoButton" class="btn btn-default btn-sm" title="无答案时自动盲猜">无答案盲猜: 开</a>
                        </div>
                    </div>
                </div>

                <div class="cx-card" id="tikupeizhi">
                    <div class="cx-card-header">
                        <span>题库与 AI 答题配置</span>
                        <a id="toggleTikuCollapse" class="btn btn-default btn-xs">收起 ▲</a>
                    </div>
                    <div class="cx-card-body" id="tikuCardBody">
                        <div class="cx-tabs">
                            <span class="cx-tab" id="tabBtnAi" data-tab="ai">1. 自定义 AI</span>
                            <span class="cx-tab" id="tabBtnMain" data-tab="main">2. 一之哥哥题库</span>
                            <span class="cx-tab" id="tabBtnCustom" data-tab="custom">3. 备用题库 API</span>
                        </div>

                        <!-- Tab: 自定义 AI -->
                        <div class="cx-tab-pane" id="tabPaneAi">
                            <div class="cx-field" style="justify-content: space-between; margin-bottom: 10px;">
                                <span class="text-muted">当题库未命中时，自动调用 AI 大模型推理</span>
                                <a id="toggleAiTiku" class="btn btn-default btn-xs">已禁用</a>
                            </div>
                            <div class="cx-field">
                                <span class="cx-field-label">接口模式</span>
                                <select id="aiTikuProvider" class="form-control" style="flex: 1;">
                                    <option value="deepseek">DeepSeek 官方 (默认)</option>
                                    <option value="custom">自定义 OpenAI 兼容接口</option>
                                </select>
                            </div>
                            <div class="cx-field" id="aiCustomUrlRow" style="display: none;">
                                <span class="cx-field-label">接口地址</span>
                                <input type="text" id="aiCustomUrl" style="flex: 1;" class="form-control" placeholder="https://api.openai.com/v1/chat/completions">
                            </div>
                            <div class="cx-field" id="aiModelRow">
                                <span class="cx-field-label">Model 模型</span>
                                <select id="aiTikuModel" class="form-control" style="flex: 1;">
                                    <option value="deepseek-flash">deepseek-flash (推荐：极速高准)</option>
                                    <option value="deepseek-v4-pro">deepseek-v4-pro (高阶推理)</option>
                                    <option value="deepseek-chat">deepseek-chat (通用对话)</option>
                                    <option value="deepseek-reasoner">deepseek-reasoner (深度推理)</option>
                                </select>
                                <input type="text" id="aiCustomModel" style="flex: 1; display: none;" class="form-control" placeholder="如 gpt-4o-mini / Qwen/Qwen2.5-72B-Instruct">
                            </div>
                            <div class="cx-field" id="aiEffortRow">
                                <span class="cx-field-label">思考深度</span>
                                <select id="aiTikuEffort" class="form-control" style="flex: 1;">
                                    <option value="low">low (推荐：轻量思考)</option>
                                    <option value="none">none (关闭思考：极速秒回)</option>
                                    <option value="high">high (深度思考)</option>
                                    <option value="max">max (极限思考)</option>
                                </select>
                            </div>
                            <div class="cx-field">
                                <span class="cx-field-label">API Key</span>
                                <input type="password" id="aiTikuApiKey" style="flex: 1;" class="form-control" placeholder="sk-...">
                            </div>
                            <div class="cx-field" style="margin-top: 10px; margin-bottom: 0;">
                                <span class="cx-field-label"></span>
                                <a id="saveAiTiku" class="btn btn-primary btn-sm">保存配置</a>
                                <a id="testAiTiku" class="btn btn-info btn-sm">测试 API 连通性</a>
                            </div>
                            <div id="aiTestStatus" style="margin-top: 6px; padding-left: 80px; font-size: 12px; font-weight: 600;"></div>
                        </div>

                        <!-- Tab: 一之哥哥题库 -->
                        <div class="cx-tab-pane" id="tabPaneMain">
                            <div class="cx-field">
                                <span class="cx-field-label">题库 Token</span>
                                <input type="text" id="token" style="flex: 1;" class="form-control" placeholder="关注公众号【一之哥哥】获取">
                                <a id="updateToken" class="btn btn-primary btn-sm">保存 Token</a>
                            </div>
                            <div class="text-muted" style="margin-top: 6px;">
                                关注微信公众号【一之哥哥】发送“token”获取。未配置或无答案时自动降级查询备用题库 / DeepSeek AI。
                            </div>
                        </div>

                        <!-- Tab: 自定义备用题库 -->
                        <div class="cx-tab-pane" id="tabPaneCustom">
                            <div class="cx-field" style="justify-content: space-between; margin-bottom: 10px;">
                                <span class="text-muted">支持 GET/POST，兼容 {code:1, data:"..."} 或 {answer:"..."}</span>
                                <a id="toggleCustomTiku" class="btn btn-default btn-xs">已禁用</a>
                            </div>
                            <div class="cx-field">
                                <span class="cx-field-label">API URL</span>
                                <input type="text" id="customTikuUrl" style="flex: 1;" class="form-control" placeholder="https://your-api.com/query">
                            </div>
                            <div class="cx-field" style="margin-bottom: 0;">
                                <span class="cx-field-label">Token/Key</span>
                                <input type="text" id="customTikuToken" style="flex: 1;" class="form-control" placeholder="可选认证 Token">
                                <a id="saveCustomTiku" class="btn btn-primary btn-sm">保存备用题库</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右栏：任务列表与实时日志 -->
            <div class="cx-col">
                <div class="cx-card">
                    <div class="cx-card-header">
                        <span>当前章节任务列表</span>
                    </div>
                    <div class="cx-card-body" id="joblist"></div>
                </div>

                <div class="cx-card">
                    <div class="cx-card-header">
                        <span>实时运行日志</span>
                        <a id="clearLogBtn" class="btn btn-default btn-xs">清空日志</a>
                    </div>
                    <div class="cx-card-body">
                        <div id="result">
                            <div id="log">
                                <span style="color: #dc2626">[00:00:00] 如果此提示不消失，说明页面出现了错误，请联系作者</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cx-card" id="quizSummaryPanel" style="display: none;">
                    <div class="cx-card-header">
                        <span>答题结果速览 (点击题目/答案可复制)</span>
                        <a id="toggleQuizSummaryBtn" class="btn btn-default btn-xs">收起 ▲</a>
                    </div>
                    <div class="cx-card-body" id="quizSummaryBody" style="padding: 0;">
                        <div style="max-height: 220px; overflow-y: auto;">
                            <table class="cx-table" id="quizSummaryTable">
                                <thead style="position: sticky; top: 0; z-index: 1;">
                                    <tr>
                                        <th style="width: 42px; text-align: center;">题号</th>
                                        <th style="width: 60px; text-align: center;">题型</th>
                                        <th>题目</th>
                                        <th style="width: 130px;">答案</th>
                                        <th style="width: 70px; text-align: center;">状态</th>
                                    </tr>
                                </thead>
                                <tbody id="quizSummaryTbody">
                                    <tr>
                                        <td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">等待作答数据...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部跨栏：章节测试作答容器 -->
            <div class="cx-card" id="workPanel" style="display: none;">
                <div class="cx-card-header">
                    <span>章节测试作答窗口</span>
                </div>
                <div class="cx-card-body" id="workWindow" style="height: calc(100% - 38px); padding: 0;">
                    <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                        style="width: 100%; height: 100%;"></iframe>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
