// ==========================================
// 课程卡片任务控制面板 HTML 渲染与交互事件绑定
// ==========================================

const CARDS_PANEL_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>超星学习通助手 Next v5.0.5</title>
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
                <a href="https://github.com/SlackHan/chaoxing-helper" target="_blank">超星学习通助手 Next v5.1.0</a>
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

function bindPanelEvents() {
    const htmlHook = setInterval(function () {
        if (_d.getElementById('unrivalRate') && _d.getElementById('updateRateButton') && _d
            .getElementById('reviewModeButton') && _d.getElementById('autoDoWorkButton') && _d
            .getElementById('autoSubmitButton') && _d.getElementById('autoSaveButton')) {
            clearInterval(htmlHook);
            if (isMobile) {
                logs.addLog('手机浏览器不保证能正常运行此脚本', 'orange');
            }

            // 0. 题库面板折叠、Tab切换与清空日志
            const tikuCardBody = _d.getElementById('tikuCardBody');
            const toggleCollapseBtn = _d.getElementById('toggleTikuCollapse');
            let isTikuCollapsed = GM_getValue('unrivaltikucollapse', '0') === '1';
            const applyTikuCollapse = (collapsed) => {
                if (!tikuCardBody || !toggleCollapseBtn) return;
                tikuCardBody.style.display = collapsed ? 'none' : 'block';
                toggleCollapseBtn.innerText = collapsed ? '展开 ▼' : '收起 ▲';
            };
            applyTikuCollapse(isTikuCollapsed);
            if (toggleCollapseBtn) {
                toggleCollapseBtn.onclick = function () {
                    isTikuCollapsed = !isTikuCollapsed;
                    GM_setValue('unrivaltikucollapse', isTikuCollapsed ? '1' : '0');
                    applyTikuCollapse(isTikuCollapsed);
                };
            }

            const tabMap = {
                ai: { btn: _d.getElementById('tabBtnAi'), pane: _d.getElementById('tabPaneAi') },
                main: { btn: _d.getElementById('tabBtnMain'), pane: _d.getElementById('tabPaneMain') },
                custom: { btn: _d.getElementById('tabBtnCustom'), pane: _d.getElementById('tabPaneCustom') }
            };
            const switchTikuTab = (tabKey) => {
                const target = tabMap[tabKey] ? tabKey : 'ai';
                Object.keys(tabMap).forEach(k => {
                    if (tabMap[k].btn) tabMap[k].btn.className = k === target ? 'cx-tab active' : 'cx-tab';
                    if (tabMap[k].pane) tabMap[k].pane.className = k === target ? 'cx-tab-pane active' : 'cx-tab-pane';
                });
                GM_setValue('unrivaltikutab', target);
            };
            switchTikuTab(GM_getValue('unrivaltikutab', 'ai'));
            Object.keys(tabMap).forEach(k => {
                if (tabMap[k].btn) {
                    tabMap[k].btn.onclick = function () {
                        switchTikuTab(k);
                    };
                }
            });

            const clearLogBtn = _d.getElementById('clearLogBtn');
            if (clearLogBtn) {
                clearLogBtn.onclick = function () {
                    logs.logArry = [];
                    logs.addLog('日志已清空', 'green');
                };
            }

            const toggleQuizSummaryBtn = _d.getElementById('toggleQuizSummaryBtn');
            const quizSummaryBody = _d.getElementById('quizSummaryBody');
            if (toggleQuizSummaryBtn && quizSummaryBody) {
                let isQuizCollapsed = false;
                toggleQuizSummaryBtn.onclick = function () {
                    isQuizCollapsed = !isQuizCollapsed;
                    quizSummaryBody.style.display = isQuizCollapsed ? 'none' : 'block';
                    toggleQuizSummaryBtn.innerText = isQuizCollapsed ? '展开 ▼' : '收起 ▲';
                };
            }

            // 1. 一之哥哥题库 Token
            _d.getElementById('token').value = GM_getValue('tikutoken', '');
            _d.getElementById('updateToken').onclick = function () {
                let inputToken = _d.getElementById('token').value.trim();
                GM_setValue('tikutoken', inputToken);
                token = inputToken;
                logs.addLog(inputToken ? '一之哥哥题库 Token 已更新为：' + inputToken : '一之哥哥题库 Token 已清空', 'green');
            };

            // 2. 正确率
            _d.getElementById('accuracy').value = accuracy;
            _d.getElementById('updateaccuracy').onclick = function () {
                let uaccuracy = _d.getElementById('accuracy').value;
                if (parseFloat(uaccuracy) == parseInt(uaccuracy)) {
                    uaccuracy = parseInt(uaccuracy);
                } else {
                    uaccuracy = parseFloat(uaccuracy);
                }
                GM_setValue('accuracy', uaccuracy);
                accuracy = uaccuracy;
                if (uaccuracy >= 0 && uaccuracy <= 100) {
                    logs.addLog('章节测试合格正确率已更新为 ' + uaccuracy + '%', 'green');
                } else {
                    logs.addLog('奇怪的正确率数值', 'orange');
                }
            };

            // 3. 视频倍速
            _d.getElementById('unrivalRate').value = rate;
            _d.getElementById('updateRateButton').onclick = function () {
                let urate = _d.getElementById('unrivalRate').value;
                if (parseFloat(urate) == parseInt(urate)) {
                    urate = parseInt(urate);
                } else {
                    urate = parseFloat(urate);
                }
                GM_setValue('unrivalrate', urate);
                rate = urate;
                if (urate > 0) {
                    logs.addLog('视频倍速已更新为 ' + urate + ' 倍', 'green');
                } else {
                    logs.addLog('奇怪的倍速，将会自动跳过视频任务', 'orange');
                }
            };

            // 4. 激活挂机（状态恢复与点击切换）
            const bgBtn = _d.getElementById('backGround');
            const isBgActive = (_w.top && _w.top.backNow !== undefined && _w.top.backNow !== null)
                ? (_w.top.backNow == 1)
                : (GM_getValue('unrivalbacknow', '0') === '1');

            const updateBgBtnUI = (active) => {
                if (active) {
                    bgBtn.setAttribute('class', 'btn btn-success btn-sm');
                    bgBtn.innerText = '已激活挂机';
                } else {
                    bgBtn.setAttribute('class', 'btn btn-default btn-sm');
                    bgBtn.innerText = '激活挂机';
                }
            };
            updateBgBtnUI(isBgActive);
            if (isBgActive) {
                if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
            } else {
                if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
            }

            bgBtn.onclick = function () {
                let currentActive = bgBtn.getAttribute('class').includes('btn-success');
                let nextActive = !currentActive;
                if (nextActive) {
                    _w.top.backNow = 1;
                    GM_setValue('unrivalbacknow', '1');
                    updateBgBtnUI(true);
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
                    logs.addLog('挂机激活成功，您现在可以最小化页面了', 'green');
                } else {
                    _w.top.backNow = 0;
                    GM_setValue('unrivalbacknow', '0');
                    updateBgBtnUI(false);
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
                    logs.addLog('挂机已取消激活', 'orange');
                }
            };

            // 5. 复习模式
            _d.getElementById('reviewModeButton').onclick = function () {
                let reviewButton = _d.getElementById('reviewModeButton');
                if (reviewButton.getAttribute('class').includes('btn-default')) {
                    _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-success btn-sm');
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                    GM_setValue('unrivalreview', '1');
                    _w.top.unrivalReviewMode = '1';
                } else {
                    _d.getElementById('reviewModeButton').setAttribute('class', 'btn btn-default btn-sm');
                    logs.addLog('复习模式已关闭，遇到已完成的视频任务会自动跳过', 'green');
                    GM_setValue('unrivalreview', '0');
                    _w.top.unrivalReviewMode = '0';
                }
            };

            // 6. 自动做题
            _d.getElementById('autoDoWorkButton').onclick = function () {
                let autoDoWorkButton = _d.getElementById('autoDoWorkButton');
                if (autoDoWorkButton.getAttribute('class').includes('btn-default')) {
                    _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-success btn-sm');
                    logs.addLog('自动做章节测试已开启', 'green');
                    GM_setValue('unrivaldowork', '1');
                    _w.top.unrivalDoWork = '1';
                } else {
                    _d.getElementById('autoDoWorkButton').setAttribute('class', 'btn btn-default btn-sm');
                    logs.addLog('自动做章节测试已关闭', 'green');
                    GM_setValue('unrivaldowork', '0');
                    _w.top.unrivalDoWork = '0';
                }
            };

            // 7. 自动提交
            _d.getElementById('autoSubmitButton').onclick = function () {
                let autoSubmitButton = _d.getElementById('autoSubmitButton');
                if (autoSubmitButton.getAttribute('class').includes('btn-default')) {
                    _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-success btn-sm');
                    logs.addLog('符合标准的章节测试将会自动提交', 'green');
                    GM_setValue('unrivalautosubmit', '1');
                    _w.top.unrivalAutoSubmit = '1';
                } else {
                    _d.getElementById('autoSubmitButton').setAttribute('class', 'btn btn-default btn-sm');
                    logs.addLog('章节测试将不会自动提交', 'green');
                    GM_setValue('unrivalautosubmit', '0');
                    _w.top.unrivalAutoSubmit = '0';
                }
            };

            // 8. 自动保存
            _d.getElementById('autoSaveButton').onclick = function () {
                let autoSaveButton = _d.getElementById('autoSaveButton');
                if (autoSaveButton.getAttribute('class').includes('btn-default')) {
                    _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-success btn-sm');
                    logs.addLog('不符合提交标准的章节测试将会自动保存', 'green');
                    GM_setValue('unrivalautosave', '1');
                    _w.top.unrivalAutoSave = '1';
                } else {
                    _d.getElementById('autoSaveButton').setAttribute('class', 'btn btn-default btn-sm');
                    logs.addLog('未达标的章节测试将不会自动保存，等待用户手动处理', 'green');
                    GM_setValue('unrivalautosave', '0');
                    _w.top.unrivalAutoSave = '0';
                }
            };

            // 9. 跳转模式下拉框
            let jumpSelect = _d.getElementById('unrivalJumpTypeSelect');
            jumpSelect.value = String(jumpType);
            jumpSelect.onchange = function () {
                jumpType = parseInt(jumpSelect.value, 10);
                GM_setValue('unrivaljumptype', String(jumpType));
                _w.top.unrivalJumpType = jumpType;
                logs.addLog('跳转模式已切换为：' + ['智能模式', '遍历模式', '不跳转'][jumpType], 'green');
            };

            // 10. 解除多端监控
            let monitorBtn = _d.getElementById('disableMonitorButton');
            let updateMonitorBtnUI = () => {
                if (disableMonitor == 1) {
                    monitorBtn.setAttribute('class', 'btn btn-success btn-sm');
                    monitorBtn.innerText = '解除多端监控: 开';
                } else {
                    monitorBtn.setAttribute('class', 'btn btn-default btn-sm');
                    monitorBtn.innerText = '解除多端监控: 关';
                }
            };
            updateMonitorBtnUI();
            monitorBtn.onclick = function () {
                disableMonitor = disableMonitor == 1 ? 0 : 1;
                GM_setValue('unrivaldisablemonitor', String(disableMonitor));
                _w.top.unrivalDisableMonitor = disableMonitor;
                updateMonitorBtnUI();
                logs.addLog(disableMonitor == 1 ? '已开启解除多端监控' : '已关闭解除多端监控', 'green');
            };

            // 11. 盲猜
            let randomDoBtn = _d.getElementById('randomDoButton');
            let updateRandomDoBtnUI = () => {
                if (randomDo == 1) {
                    randomDoBtn.setAttribute('class', 'btn btn-success btn-sm');
                    randomDoBtn.innerText = '无答案盲猜: 开';
                } else {
                    randomDoBtn.setAttribute('class', 'btn btn-default btn-sm');
                    randomDoBtn.innerText = '无答案盲猜: 关';
                }
            };
            updateRandomDoBtnUI();
            randomDoBtn.onclick = function () {
                randomDo = randomDo == 1 ? 0 : 1;
                GM_setValue('unrivalrandomdo', String(randomDo));
                _w.top.unrivalRandomDo = randomDo;
                updateRandomDoBtnUI();
                logs.addLog(randomDo == 1 ? '已开启无答案盲猜（单选选B/多选全选/判断选错）' : '已关闭无答案盲猜', 'green');
            };

            // 12. 自定义备用题库
            _d.getElementById('customTikuUrl').value = GM_getValue('customTikuUrl', '');
            _d.getElementById('customTikuToken').value = GM_getValue('customTikuToken', '');
            let customToggleBtn = _d.getElementById('toggleCustomTiku');
            let updateCustomTikuUI = () => {
                let isCustomOn = GM_getValue('customTikuEnable', '0') === '1';
                if (isCustomOn) {
                    customToggleBtn.setAttribute('class', 'btn btn-success btn-xs');
                    customToggleBtn.innerText = '已启用';
                } else {
                    customToggleBtn.setAttribute('class', 'btn btn-default btn-xs');
                    customToggleBtn.innerText = '已禁用';
                }
            };
            updateCustomTikuUI();
            customToggleBtn.onclick = function () {
                let nextState = GM_getValue('customTikuEnable', '0') === '1' ? '0' : '1';
                GM_setValue('customTikuEnable', nextState);
                updateCustomTikuUI();
                logs.addLog(nextState === '1' ? '已启用自定义备用题库' : '已禁用自定义备用题库', 'green');
            };
            _d.getElementById('saveCustomTiku').onclick = function () {
                let u = _d.getElementById('customTikuUrl').value.trim();
                let t = _d.getElementById('customTikuToken').value.trim();
                GM_setValue('customTikuUrl', u);
                GM_setValue('customTikuToken', t);
                logs.addLog('自定义备用题库配置已保存', 'green');
            };

            // 13. AI 智能答题配置（支持 DeepSeek 官方与自定义 OpenAI 兼容接口）
            const aiProviderSelect = _d.getElementById('aiTikuProvider');
            const aiCustomUrlRow = _d.getElementById('aiCustomUrlRow');
            const aiCustomUrlInput = _d.getElementById('aiCustomUrl');
            const aiTikuModelSelect = _d.getElementById('aiTikuModel');
            const aiCustomModelInput = _d.getElementById('aiCustomModel');
            const aiEffortRow = _d.getElementById('aiEffortRow');
            const aiTikuEffortSelect = _d.getElementById('aiTikuEffort');
            const aiApiKeyInput = _d.getElementById('aiTikuApiKey');
            const aiToggleBtn = _d.getElementById('toggleAiTiku');
            const saveAiBtn = _d.getElementById('saveAiTiku');
            const testAiBtn = _d.getElementById('testAiTiku');
            const testStatusSpan = _d.getElementById('aiTestStatus');

            let currentAiProvider = GM_getValue('aiTikuProvider', 'deepseek') || 'deepseek';
            if (!['deepseek', 'custom'].includes(currentAiProvider)) {
                currentAiProvider = 'deepseek';
            }
            if (aiProviderSelect) aiProviderSelect.value = currentAiProvider;

            let savedDeepseekModel = GM_getValue('aiTikuModel', 'deepseek-flash');
            if (!['deepseek-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'].includes(savedDeepseekModel)) {
                savedDeepseekModel = 'deepseek-flash';
                GM_setValue('aiTikuModel', 'deepseek-flash');
            }
            if (aiTikuModelSelect) aiTikuModelSelect.value = savedDeepseekModel;

            let savedDeepseekEffort = GM_getValue('aiTikuEffort', 'low');
            if (!['low', 'none', 'high', 'max'].includes(savedDeepseekEffort)) {
                savedDeepseekEffort = 'low';
                GM_setValue('aiTikuEffort', 'low');
            }
            if (aiTikuEffortSelect) aiTikuEffortSelect.value = savedDeepseekEffort;

            if (aiCustomUrlInput) aiCustomUrlInput.value = GM_getValue('aiCustomUrl', '');
            if (aiCustomModelInput) aiCustomModelInput.value = GM_getValue('aiCustomModel', '');

            const applyAiProviderUI = (provider) => {
                if (provider === 'custom') {
                    if (aiCustomUrlRow) aiCustomUrlRow.style.display = 'flex';
                    if (aiTikuModelSelect) aiTikuModelSelect.style.display = 'none';
                    if (aiCustomModelInput) aiCustomModelInput.style.display = 'block';
                    if (aiEffortRow) aiEffortRow.style.display = 'none';
                    if (aiApiKeyInput) aiApiKeyInput.value = GM_getValue('aiCustomApiKey', '');
                    if (testAiBtn) testAiBtn.innerText = '测试 API 连通性';
                } else {
                    if (aiCustomUrlRow) aiCustomUrlRow.style.display = 'none';
                    if (aiTikuModelSelect) aiTikuModelSelect.style.display = 'block';
                    if (aiCustomModelInput) aiCustomModelInput.style.display = 'none';
                    if (aiEffortRow) aiEffortRow.style.display = 'flex';
                    if (aiApiKeyInput) aiApiKeyInput.value = GM_getValue('aiTikuApiKey', '');
                    if (testAiBtn) testAiBtn.innerText = '测试 API 与余额';
                }
            };
            applyAiProviderUI(currentAiProvider);

            if (aiProviderSelect) {
                aiProviderSelect.onchange = function () {
                    const p = aiProviderSelect.value;
                    applyAiProviderUI(p);
                    if (testStatusSpan) testStatusSpan.innerHTML = '';
                };
            }

            const updateAiTikuUI = () => {
                const isAiOn = GM_getValue('aiTikuEnable', '0') === '1';
                if (aiToggleBtn) {
                    if (isAiOn) {
                        aiToggleBtn.setAttribute('class', 'btn btn-success btn-xs');
                        aiToggleBtn.innerText = '已启用';
                    } else {
                        aiToggleBtn.setAttribute('class', 'btn btn-default btn-xs');
                        aiToggleBtn.innerText = '已禁用';
                    }
                }
            };
            updateAiTikuUI();
            if (aiToggleBtn) {
                aiToggleBtn.onclick = function () {
                    const nextState = GM_getValue('aiTikuEnable', '0') === '1' ? '0' : '1';
                    GM_setValue('aiTikuEnable', nextState);
                    updateAiTikuUI();
                    const pName = (aiProviderSelect && aiProviderSelect.value === 'custom') ? '自定义 AI' : 'DeepSeek AI';
                    logs.addLog(nextState === '1' ? '已启用 ' + pName + ' 智能答题' : '已禁用 ' + pName + ' 智能答题', 'green');
                };
            }

            if (saveAiBtn) {
                saveAiBtn.onclick = function () {
                    const provider = aiProviderSelect ? aiProviderSelect.value : 'deepseek';
                    GM_setValue('aiTikuProvider', provider);
                    const currentKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';

                    if (provider === 'custom') {
                        const url = aiCustomUrlInput ? aiCustomUrlInput.value.trim() : '';
                        const model = aiCustomModelInput ? aiCustomModelInput.value.trim() : '';
                        GM_setValue('aiCustomUrl', url);
                        GM_setValue('aiCustomModel', model);
                        GM_setValue('aiCustomApiKey', currentKey);
                        logs.addLog('自定义 AI 配置已保存 (模型: ' + (model || '未填写') + ')', 'green');
                    } else {
                        const model = aiTikuModelSelect ? aiTikuModelSelect.value : 'deepseek-flash';
                        const effort = aiTikuEffortSelect ? aiTikuEffortSelect.value : 'low';
                        GM_setValue('aiTikuModel', model);
                        GM_setValue('aiTikuEffort', effort);
                        GM_setValue('aiTikuApiKey', currentKey);
                        logs.addLog('DeepSeek 配置已保存 (模型: ' + model + ' | 思考深度: ' + effort + ')', 'green');
                    }
                };
            }

            if (testAiBtn) {
                testAiBtn.onclick = function () {
                    const provider = aiProviderSelect ? aiProviderSelect.value : 'deepseek';
                    const apiKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';

                    if (provider === 'custom') {
                        const rawUrl = aiCustomUrlInput ? aiCustomUrlInput.value.trim() : '';
                        const model = aiCustomModelInput ? aiCustomModelInput.value.trim() : '';

                        if (!rawUrl) {
                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写接口地址 (URL)</span>';
                            logs.addLog('请先填写自定义 AI 接口地址', 'red');
                            return;
                        }
                        if (!model) {
                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写 Model 模型名称</span>';
                            logs.addLog('请先填写自定义 AI 模型名称', 'red');
                            return;
                        }
                        if (!apiKey) {
                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写 API Key</span>';
                            logs.addLog('请先填写自定义 AI API Key', 'red');
                            return;
                        }

                        GM_setValue('aiTikuProvider', 'custom');
                        GM_setValue('aiCustomUrl', rawUrl);
                        GM_setValue('aiCustomModel', model);
                        GM_setValue('aiCustomApiKey', apiKey);

                        const resetBtn = () => {
                            testAiBtn.innerText = '测试 API 连通性';
                            testAiBtn.style.pointerEvents = 'auto';
                            testAiBtn.style.opacity = '1';
                        };

                        testAiBtn.innerText = '⏳ 测试中...';
                        testAiBtn.style.pointerEvents = 'none';
                        testAiBtn.style.opacity = '0.6';
                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: #31708f;">⏳ 正在测试自定义 AI 接口连通性...</span>';

                        const targetUrl = normalizeAiEndpoint(rawUrl);
                        const startTime = Date.now();

                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: targetUrl,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + apiKey
                            },
                            data: JSON.stringify({
                                model: model,
                                messages: [
                                    { role: 'user', content: '单选题：1+1等于几？A.1 B.2。请仅输出正确选项字母，不要任何解释。' }
                                ],
                                stream: false
                            }),
                            timeout: 15000,
                            onload: function (chatRes) {
                                resetBtn();
                                const ms = Date.now() - startTime;
                                if (chatRes.status === 200) {
                                    try {
                                        const chatJson = JSON.parse(chatRes.responseText);
                                        const reply = chatJson.choices && chatJson.choices[0] && chatJson.choices[0].message && chatJson.choices[0].message.content;
                                        if (reply) {
                                            const cleanReply = reply.trim().replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').trim();
                                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 模型: ' + model + ' | 响应: "' + cleanReply + '" (' + ms + ' ms)</span>';
                                            logs.addLog('自定义 AI 测试成功！模型: ' + model + ' | 响应: "' + cleanReply + '" (' + ms + ' ms)', 'green');
                                            return;
                                        }
                                    } catch (e) { }
                                }

                                let errMsg = '';
                                try {
                                    const errJson = JSON.parse(chatRes.responseText);
                                    if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                                } catch (e) { }
                                const errDisplay = '❌ 连通测试失败 [HTTP ' + chatRes.status + ']: ' + (errMsg || chatRes.statusText || '请求异常');
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                logs.addLog('自定义 AI 连通测试失败: ' + errDisplay, 'red');
                            },
                            onerror: function (err) {
                                resetBtn();
                                const errDisplay = '❌ 对话接口网络错误: ' + ((err && err.error) || '连接异常');
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                logs.addLog('自定义 AI 连通错误: ' + errDisplay, 'red');
                            },
                            ontimeout: function () {
                                resetBtn();
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 对话接口请求超时 (15s)</span>';
                                logs.addLog('自定义 AI 连通请求超时 (15s)', 'red');
                            }
                        });
                    } else {
                        // DeepSeek 模式
                        const model = aiTikuModelSelect ? aiTikuModelSelect.value : 'deepseek-flash';
                        const effort = aiTikuEffortSelect ? aiTikuEffortSelect.value : 'low';

                        if (!apiKey) {
                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写 API Key</span>';
                            logs.addLog('请先填写 DeepSeek API Key', 'red');
                            return;
                        }

                        GM_setValue('aiTikuProvider', 'deepseek');
                        GM_setValue('aiTikuApiKey', apiKey);
                        GM_setValue('aiTikuModel', model);
                        GM_setValue('aiTikuEffort', effort);

                        const resetBtn = () => {
                            testAiBtn.innerText = '测试 API 与余额';
                            testAiBtn.style.pointerEvents = 'auto';
                            testAiBtn.style.opacity = '1';
                        };

                        testAiBtn.innerText = '⏳ 测试中...';
                        testAiBtn.style.pointerEvents = 'none';
                        testAiBtn.style.opacity = '0.6';
                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: #31708f;">⏳ 正在检测账户余额与模型连通性...</span>';

                        // 第1步：请求余额
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: 'https://api.deepseek.com/user/balance',
                            headers: { 'Authorization': 'Bearer ' + apiKey },
                            timeout: 8000,
                            onload: function (balRes) {
                                if (balRes.status === 401) {
                                    resetBtn();
                                    if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ API Key 无效或已过期 (HTTP 401)</span>';
                                    logs.addLog('DeepSeek 余额查询失败：API Key 无效或已过期 (HTTP 401)', 'red');
                                    return;
                                }

                                let balanceStr = '';
                                let isAvailable = true;
                                try {
                                    const balJson = JSON.parse(balRes.responseText);
                                    if (balJson.is_available !== undefined) isAvailable = balJson.is_available;
                                    if (balJson.balance_infos && balJson.balance_infos.length > 0) {
                                        const bInfo = balJson.balance_infos[0];
                                        const total = bInfo.total_balance !== undefined ? bInfo.total_balance : '';
                                        const curr = bInfo.currency || 'CNY';
                                        balanceStr = total + ' ' + curr;
                                    }
                                } catch (e) { }

                                if (!balanceStr) balanceStr = isAvailable ? '充足' : '0.00 CNY';

                                if (isAvailable === false) {
                                    resetBtn();
                                    if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 账户余额不足 (余额: ' + balanceStr + ')</span>';
                                    logs.addLog('DeepSeek 账户余额不足 (余额: ' + balanceStr + ')', 'red');
                                    return;
                                }

                                // 第2步：验证对话接口
                                const startTime = Date.now();
                                GM_xmlhttpRequest({
                                    method: 'POST',
                                    url: 'https://api.deepseek.com/chat/completions',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + apiKey
                                    },
                                    data: JSON.stringify({
                                        model: model,
                                        messages: [
                                            { role: 'user', content: '单选题：1+1等于几？A.1 B.2。请仅输出正确选项字母，不要任何解释。' }
                                        ],
                                        stream: false,
                                        reasoning_effort: 'none',
                                        thinking: { type: 'disabled' }
                                    }),
                                    timeout: 15000,
                                    onload: function (chatRes) {
                                        resetBtn();
                                        const ms = Date.now() - startTime;
                                        if (chatRes.status === 200) {
                                            try {
                                                const chatJson = JSON.parse(chatRes.responseText);
                                                const reply = chatJson.choices && chatJson.choices[0] && chatJson.choices[0].message && chatJson.choices[0].message.content;
                                                if (reply) {
                                                    const cleanReply = reply.trim();
                                                    if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 余额: ' + balanceStr + ' | 响应: "' + cleanReply + '" (' + ms + 'ms)</span>';
                                                    logs.addLog('DeepSeek 测试成功！可用余额: ' + balanceStr + ' | 模型: ' + model + ' | 响应: "' + cleanReply + '" (' + ms + 'ms)', 'green');
                                                    return;
                                                }
                                            } catch (e) { }
                                        }

                                        let errMsg = '';
                                        try {
                                            const errJson = JSON.parse(chatRes.responseText);
                                            if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                                        } catch (e) { }
                                        const errDisplay = '❌ 连通测试失败 [HTTP ' + chatRes.status + ']: ' + (errMsg || chatRes.statusText || '请求异常');
                                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                        logs.addLog('DeepSeek 连通测试失败: ' + errDisplay, 'red');
                                    },
                                    onerror: function (err) {
                                        resetBtn();
                                        const errDisplay = '❌ 对话接口网络错误: ' + ((err && err.error) || '连接异常');
                                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                        logs.addLog('DeepSeek 连通错误: ' + errDisplay, 'red');
                                    },
                                    ontimeout: function () {
                                        resetBtn();
                                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 对话接口请求超时 (15s)</span>';
                                        logs.addLog('DeepSeek 连通请求超时 (15s)', 'red');
                                    }
                                });
                            },
                            onerror: function (err) {
                                resetBtn();
                                const errDisplay = '❌ 余额接口网络错误: ' + ((err && err.error) || '连接异常');
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                logs.addLog('DeepSeek 余额请求错误: ' + errDisplay, 'red');
                            },
                            ontimeout: function () {
                                resetBtn();
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">❌ 余额接口请求超时 (8s)</span>';
                                logs.addLog('DeepSeek 余额请求超时 (8s)', 'red');
                            }
                        });
                    }
                };
            }
        }
    }, 100);
}

// ==========================================
// 答题结果速览表辅助函数与渲染
// ==========================================

function copyToClipboard(text, el) {
    if (!text) return;
    try {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text);
        } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text);
        } else {
            const input = _d.createElement('textarea');
            input.value = text;
            _d.body.appendChild(input);
            input.select();
            _d.execCommand('copy');
            _d.body.removeChild(input);
        }
        if (el) {
            const origBg = el.style.backgroundColor;
            el.classList.add('cell-copied');
            setTimeout(() => {
                el.classList.remove('cell-copied');
                el.style.backgroundColor = origBg;
            }, 600);
        }
        if (typeof logs !== 'undefined' && logs.addLog) {
            logs.addLog('已复制到剪贴板: ' + (text.length > 25 ? text.slice(0, 25) + '...' : text), 'green');
        }
    } catch (e) {
        if (typeof logs !== 'undefined' && logs.addLog) {
            logs.addLog('复制失败: ' + (e.message || '未知错误'), 'red');
        }
    }
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderQuizSummary(results) {
    const panel = _d.getElementById('quizSummaryPanel');
    const tbody = _d.getElementById('quizSummaryTbody');
    if (!panel || !tbody) return;
    if (!Array.isArray(results) || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">等待作答数据...</td></tr>';
        return;
    }

    let html = '';
    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const num = item.num !== undefined ? item.num : (item.index !== undefined ? item.index + 1 : (i + 1));
        const type = item.type || item.questionType || '未知';
        const question = item.question || item.title || '';
        let answer = item.answer !== undefined ? item.answer : (item.result !== undefined ? item.result : '');
        if (typeof answer === 'object') {
            try { answer = JSON.stringify(answer); } catch (e) { answer = String(answer); }
        } else {
            answer = String(answer || '');
        }

        const isMatched = !(item.matched === false || item.status === 'unmatched');
        const rowClass = isMatched ? '' : 'unmatched';
        const statusHtml = isMatched
            ? '<span style="color: #16a34a; font-weight: 500;">✅ 已填</span>'
            : '<span style="color: #b45309; font-weight: 600;">⚠️ 待确认</span>';

        const safeQ = escapeHtml(question);
        const safeAns = escapeHtml(answer);

        html += `
            <tr class="${rowClass}">
                <td style="text-align: center; color: #64748b; font-weight: 500;">${num}</td>
                <td style="text-align: center;"><span style="background: #e2e8f0; color: #334155; padding: 1px 4px; border-radius: 3px; font-size: 11px;">${escapeHtml(type)}</span></td>
                <td class="copyable-cell" data-copy="${safeQ}" title="点击复制题目" style="max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeQ || '-'}</td>
                <td class="copyable-cell" data-copy="${safeAns}" title="点击复制答案" style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: Consolas, monospace;">${safeAns || '-'}</td>
                <td style="text-align: center;">${statusHtml}</td>
            </tr>
        `;
    }
    tbody.innerHTML = html;

    const copyCells = tbody.querySelectorAll('.copyable-cell');
    copyCells.forEach(cell => {
        cell.onclick = function (e) {
            e.stopPropagation();
            const text = this.getAttribute('data-copy');
            if (text) {
                const unescaped = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                copyToClipboard(unescaped, this);
            }
        };
    });
}
