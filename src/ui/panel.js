// ==========================================
// 课程卡片任务控制面板交互事件绑定与速览渲染
// ==========================================

function bindPanelEvents() {
    const htmlHook = setInterval(function () {
        if (_d.getElementById('unrivalRate') && _d.getElementById('updateRateButton') && _d
            .getElementById('reviewModeButton') && _d.getElementById('autoDoWorkButton') && _d
            .getElementById('autoSubmitButton') && _d.getElementById('autoSaveButton')) {
            clearInterval(htmlHook);
            if (isMobile) {
                logs.addLog('手机浏览器不保证能正常运行此脚本', 'orange');
            }

            function bindToggleSwitch(options) {
                const {
                    id,
                    gmKey,
                    defaultVal = '0',
                    topProp,
                    topType = 'string',
                    size = 'btn-sm',
                    textOn,
                    textOff,
                    onLog,
                    offLog,
                    onChange
                } = options;

                const btn = _d.getElementById(id);
                if (!btn) return null;

                const updateUI = (isActive) => {
                    btn.setAttribute('class', 'btn ' + (isActive ? 'btn-success' : 'btn-default') + ' ' + size);
                    if (isActive && textOn !== undefined) {
                        btn.innerText = typeof textOn === 'function' ? textOn() : textOn;
                    } else if (!isActive && textOff !== undefined) {
                        btn.innerText = typeof textOff === 'function' ? textOff() : textOff;
                    }
                };

                const isCurrentOn = GM_getValue(gmKey, defaultVal) === '1';
                updateUI(isCurrentOn);
                if (topProp && _w && _w.top) {
                    _w.top[topProp] = topType === 'number' ? (isCurrentOn ? 1 : 0) : (isCurrentOn ? '1' : '0');
                }
                if (typeof onChange === 'function') {
                    onChange(isCurrentOn);
                }

                btn.onclick = function () {
                    const nextState = GM_getValue(gmKey, defaultVal) === '1' ? '0' : '1';
                    const nextActive = nextState === '1';
                    GM_setValue(gmKey, nextState);
                    if (topProp && _w && _w.top) {
                        _w.top[topProp] = topType === 'number' ? (nextActive ? 1 : 0) : (nextActive ? '1' : '0');
                    }
                    updateUI(nextActive);

                    if (nextActive) {
                        if (onLog) {
                            const msg = typeof onLog === 'function' ? onLog() : onLog;
                            if (msg) logs.addLog(msg, 'green');
                        }
                    } else {
                        if (offLog) {
                            const msg = typeof offLog === 'function' ? offLog() : offLog;
                            if (msg) logs.addLog(msg, 'green');
                        }
                    }

                    if (typeof onChange === 'function') {
                        onChange(nextActive);
                    }
                };

                return { btn, updateUI };
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
                    backNow = 1;
                    GM_setValue('unrivalbacknow', '1');
                    updateBgBtnUI(true);
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
                    logs.addLog('挂机激活成功，您现在可以最小化页面了', 'green');
                } else {
                    _w.top.backNow = 0;
                    backNow = 0;
                    GM_setValue('unrivalbacknow', '0');
                    updateBgBtnUI(false);
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
                    logs.addLog('挂机已取消激活', 'orange');
                }
            };

            // 5. 复习模式
            bindToggleSwitch({
                id: 'reviewModeButton',
                gmKey: 'unrivalreview',
                defaultVal: '0',
                topProp: 'unrivalReviewMode',
                onLog: '复习模式已开启，遇到已完成的视频任务不会跳过',
                offLog: '复习模式已关闭，遇到已完成的视频任务会自动跳过'
            });

            // 6. 自动做题
            bindToggleSwitch({
                id: 'autoDoWorkButton',
                gmKey: 'unrivaldowork',
                defaultVal: '1',
                topProp: 'unrivalDoWork',
                onLog: '自动做章节测试已开启',
                offLog: '自动做章节测试已关闭'
            });

            // 7. 自动提交
            bindToggleSwitch({
                id: 'autoSubmitButton',
                gmKey: 'unrivalautosubmit',
                defaultVal: '1',
                topProp: 'unrivalAutoSubmit',
                onLog: '符合标准的章节测试将会自动提交',
                offLog: '章节测试将不会自动提交'
            });

            // 8. 自动保存
            bindToggleSwitch({
                id: 'autoSaveButton',
                gmKey: 'unrivalautosave',
                defaultVal: '0',
                topProp: 'unrivalAutoSave',
                onLog: '不符合提交标准的章节测试将会自动保存',
                offLog: '未达标的章节测试将不会自动保存，等待用户手动处理'
            });

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
            bindToggleSwitch({
                id: 'disableMonitorButton',
                gmKey: 'unrivaldisablemonitor',
                defaultVal: '0',
                topProp: 'unrivalDisableMonitor',
                topType: 'number',
                textOn: '解除多端监控: 开',
                textOff: '解除多端监控: 关',
                onLog: '已开启解除多端监控',
                offLog: '已关闭解除多端监控',
                onChange: (active) => {
                    disableMonitor = active ? 1 : 0;
                    if (_w && _w.top) _w.top.unrivalDisableMonitor = disableMonitor;
                }
            });

            // 11. 盲猜
            bindToggleSwitch({
                id: 'randomDoButton',
                gmKey: 'unrivalrandomdo',
                defaultVal: '1',
                topProp: 'unrivalRandomDo',
                topType: 'number',
                textOn: '无答案盲猜: 开',
                textOff: '无答案盲猜: 关',
                onLog: '已开启无答案盲猜（单选选B/多选全选/判断选错）',
                offLog: '已关闭无答案盲猜',
                onChange: (active) => {
                    randomDo = active ? 1 : 0;
                    if (_w && _w.top) _w.top.unrivalRandomDo = randomDo;
                }
            });

            // 12. 自定义备用题库
            _d.getElementById('customTikuUrl').value = GM_getValue('customTikuUrl', '');
            _d.getElementById('customTikuToken').value = GM_getValue('customTikuToken', '');
            bindToggleSwitch({
                id: 'toggleCustomTiku',
                gmKey: 'customTikuEnable',
                defaultVal: '0',
                size: 'btn-xs',
                textOn: '已启用',
                textOff: '已禁用',
                onLog: '已启用自定义备用题库',
                offLog: '已禁用自定义备用题库'
            });
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

            bindToggleSwitch({
                id: 'toggleAiTiku',
                gmKey: 'aiTikuEnable',
                defaultVal: '0',
                size: 'btn-xs',
                textOn: '已启用',
                textOff: '已禁用',
                onLog: () => '已启用 ' + ((aiProviderSelect && aiProviderSelect.value === 'custom') ? '自定义 AI' : 'DeepSeek AI') + ' 智能答题',
                offLog: () => '已禁用 ' + ((aiProviderSelect && aiProviderSelect.value === 'custom') ? '自定义 AI' : 'DeepSeek AI') + ' 智能答题'
            });

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

                        requestAiCompletion({
                            provider: 'custom',
                            apiKey: apiKey,
                            rawUrl: rawUrl,
                            model: model,
                            messages: [
                                { role: 'user', content: '请仅回复 OK 两个字母，不要包含任何其他内容。' }
                            ],
                            timeout: 15000,
                            onSuccess: function ({ content, ms }) {
                                resetBtn();
                                if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 模型: ' + model + ' | 响应: "' + content + '" (' + ms + ' ms)</span>';
                                logs.addLog('自定义 AI 测试成功！模型: ' + model + ' | 响应: "' + content + '" (' + ms + ' ms)', 'green');
                            },
                            onError: function ({ status, message, isNetworkError }) {
                                resetBtn();
                                if (isNetworkError) {
                                    const errDisplay = '❌ 对话接口网络错误: ' + message;
                                    if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                    logs.addLog('自定义 AI 连通错误: ' + errDisplay, 'red');
                                } else {
                                    const errDisplay = '❌ 连通测试失败 [HTTP ' + status + ']: ' + message;
                                    if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                    logs.addLog('自定义 AI 连通测试失败: ' + errDisplay, 'red');
                                }
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
                                requestAiCompletion({
                                    provider: 'deepseek',
                                    apiKey: apiKey,
                                    model: model,
                                    effort: effort,
                                    messages: [
                                        { role: 'user', content: '请仅回复 OK 两个字母，不要包含任何其他内容。' }
                                    ],
                                    timeout: 15000,
                                    onSuccess: function ({ content, ms }) {
                                        resetBtn();
                                        if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 余额: ' + balanceStr + ' | 响应: "' + content + '" (' + ms + 'ms)</span>';
                                        logs.addLog('DeepSeek 测试成功！可用余额: ' + balanceStr + ' | 模型: ' + model + ' | 响应: "' + content + '" (' + ms + 'ms)', 'green');
                                    },
                                    onError: function ({ status, message, isNetworkError }) {
                                        resetBtn();
                                        if (isNetworkError) {
                                            const errDisplay = '❌ 对话接口网络错误: ' + message;
                                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                            logs.addLog('DeepSeek 连通错误: ' + errDisplay, 'red');
                                        } else {
                                            const errDisplay = '❌ 连通测试失败 [HTTP ' + status + ']: ' + message;
                                            if (testStatusSpan) testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                            logs.addLog('DeepSeek 连通测试失败: ' + errDisplay, 'red');
                                        }
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
