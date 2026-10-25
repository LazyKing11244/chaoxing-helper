// ==========================================
// 课程卡片任务控制面板 HTML 渲染与交互事件绑定
// ==========================================

const CARDS_PANEL_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>学习通小助手 - 2026重构版</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;">
                        <a href="https://github.com/LazyKing11244/chaoxing-helper" target="_blank" style="color: #337ab7; text-decoration: none;">学习通小助手 v5.0.3 (2026维护版)</a>
                    </h3>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">

                <div class="panel panel-info" id='remarks'>
                    <div class="panel-heading">脚本维护说明</div>
                    <div class="panel-body">
                        <p><strong>超星学习通小助手 2026 重构维护版 (v5.0.3)</strong></p>
                        <p>1. 重构题库答案匹配引擎：深度优化单选/多选/判断题文本与选项字母匹配，杜绝字符误判与长短选项误包含；</p>
                        <p>2. 修复测验自动保存卡死与提交作用域隔离 Bug，增加多重完成延时兜底机制；</p>
                        <p>3. 修复视频/任务详情网络异常与超时导致 busyThread 线程死锁，增强跳章健壮性；</p>
                        <p>4. 填空题增强多空智能拆分匹配（支持 ###、===、# 等分隔符）。</p>
                    </div>
                </div>

                <div class="panel panel-info" id="normalQuery">
                    <div class="panel-heading">任务配置</div>
                    <div class="panel-body">
                        <div>
                            <span class="text-warning">提示：高倍速有清进度风险，建议一倍速运行。</span><br/>
                            <div style="margin-top: 8px;">
                                <span style="font-size: 15px;">视频倍速：</span>
                                <input type="number" id="unrivalRate" style="width: 70px; display: inline-block;" class="form-control input-sm">
                                &nbsp;
                                <a id='updateRateButton' class="btn btn-primary btn-sm" style="color: white;">修改倍速</a>
                                &nbsp;|&nbsp;
                                <a id='reviewModeButton' class="btn btn-default btn-sm">复习模式</a>
                                &nbsp;|&nbsp;
                                <a id='fuckMeModeButton' class="btn btn-default btn-sm" href="https://scriptcat.org/zh-CN/script-show-page/379" target="_blank">常见问题</a>
                                &nbsp;
                                <a id='backGround' class="btn btn-default btn-sm" target="view_window">激活挂机</a>
                            </div>

                            <hr style="margin: 10px 0;">

                            <div>
                                <span style="font-size: 15px;">章节测试：</span>
                                <a id='autoDoWorkButton' class="btn btn-default btn-sm">自动答题</a>&nbsp;|&nbsp;
                                <a id='autoSubmitButton' class="btn btn-default btn-sm">自动提交</a>&nbsp;|&nbsp;
                                <a id='autoSaveButton' class="btn btn-default btn-sm">自动保存</a>
                            </div>

                            <div style="margin-top: 8px;">
                                <span style="font-size: 15px;">合格正确率(%)：</span>
                                <input type="number" id="accuracy" style="width: 70px; display: inline-block;" class="form-control input-sm">
                                &nbsp;
                                <a id='updateaccuracy' class="btn btn-primary btn-sm" style="color: white;">修改正确率</a>
                                <span class="text-muted" style="font-size: 12px; margin-left: 8px;">正确率高于此值且允许自动提交时才会提交答案</span>
                            </div>

                            <hr style="margin: 10px 0;">

                            <div>
                                <span style="font-size: 15px;">跳转与运行模式：</span>
                                <select id="unrivalJumpTypeSelect" class="form-control input-sm" style="width: 140px; display: inline-block;">
                                    <option value="1">遍历模式 (推荐)</option>
                                    <option value="0">智能模式</option>
                                    <option value="2">不跳转</option>
                                </select>
                                &nbsp;&nbsp;
                                <a id='disableMonitorButton' class="btn btn-default btn-sm" title="解除多端学习监控">解除多端监控: 关</a>
                                &nbsp;&nbsp;
                                <a id='randomDoButton' class="btn btn-default btn-sm" title="无答案时自动盲猜">无答案盲猜: 开</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info" id='tikupeizhi' style="width: 100%;">
                    <div class="panel-heading">题库与 AI 答题配置</div>
                    <div class="panel-body">
                        <!-- 1. 主题库配置 -->
                        <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #ddd;">
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">1. 主题库（一之哥哥题库）</h4>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">题库Token:</span>
                                <input type="text" id="token" style="width: 240px; display: inline-block;" class="form-control input-sm" placeholder="关注公众号【一之哥哥】获取">
                                &nbsp;
                                <a id='updateToken' class="btn btn-primary btn-sm" style="color: white;">保存 Token</a>
                            </div>
                            <small class="text-muted">关注微信公众号【一之哥哥】发送“token”获取。未配置或无答案时自动降级查询备用题库/AI。</small>
                        </div>

                        <!-- 2. 自定义备用题库 -->
                        <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #ddd;">
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">
                                2. 自定义备用题库 API
                                <a id="toggleCustomTiku" class="btn btn-default btn-xs" style="margin-left: 10px;">已禁用</a>
                            </h4>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">API URL:</span>
                                <input type="text" id="customTikuUrl" style="width: 320px; display: inline-block;" class="form-control input-sm" placeholder="https://your-api.com/query">
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="display: inline-block; width: 80px;">Token/Key:</span>
                                <input type="text" id="customTikuToken" style="width: 240px; display: inline-block;" class="form-control input-sm" placeholder="可选认证 Token">
                                &nbsp;
                                <a id="saveCustomTiku" class="btn btn-primary btn-sm" style="color: white;">保存备用题库</a>
                            </div>
                            <small class="text-muted">支持常见 GET/POST 接口，兼容 {code: 1, data: "..."} 或 {answer: "..."} 返回格式。</small>
                        </div>

                        <!-- 3. DeepSeek AI 专属配置 -->
                        <div>
                            <h4 style="font-size: 15px; margin-top: 0; color: #31708f;">
                                3. DeepSeek AI 智能答题（V4.1-Flash / V4-Pro）
                                <a id="toggleAiTiku" class="btn btn-default btn-xs" style="margin-left: 10px;">已禁用</a>
                            </h4>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">Model 模型:</span>
                                <select id="aiTikuModel" class="form-control input-sm" style="width: 320px; display: inline-block;">
                                    <option value="deepseek-flash">deepseek-flash (推荐：V4.1-Flash 极速高准)</option>
                                    <option value="deepseek-v4-pro">deepseek-v4-pro (高阶推理：V4-Pro)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">思考深度:</span>
                                <select id="aiTikuEffort" class="form-control input-sm" style="width: 320px; display: inline-block;">
                                    <option value="low">low (推荐：轻量思考，兼顾速度与准确率)</option>
                                    <option value="none">none (关闭思考：极速秒回，最省 Token)</option>
                                    <option value="high">high (深度思考：适合复杂计算与疑难专业课)</option>
                                    <option value="max">max (极限思考)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 6px;">
                                <span style="display: inline-block; width: 80px;">API Key:</span>
                                <input type="password" id="aiTikuApiKey" style="width: 320px; display: inline-block;" class="form-control input-sm" placeholder="sk-...">
                            </div>
                            <div style="margin-top: 8px;">
                                <span style="display: inline-block; width: 80px;"></span>
                                <a id="saveAiTiku" class="btn btn-primary btn-sm" style="color: white;">保存配置</a>
                                <a id="testAiTiku" class="btn btn-info btn-sm" style="color: white; margin-left: 6px;">测试 API 与余额</a>
                                <span id="aiTestStatus" style="margin-left: 10px; font-size: 13px; font-weight: bold;"></span>
                            </div>
                            <div style="margin-top: 6px;">
                                <span style="display: inline-block; width: 80px;"></span>
                                <small class="text-muted">底层固定使用 DeepSeek 官方接口。当题库未搜到答案时，自动调用官方大模型答题（单选、多选、判断、填空）。</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'></div>
                </div>

                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log">
                                <span style="color: red">[00:00:00]如果此提示不消失，说明页面出现了错误，请联系作者</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel panel-info" id='workPanel' style="display: none;height: 1000px;">
                    <div class="panel-heading">章节测试</div>
                    <div class="panel-body" id='workWindow' style="height: 100%;">
                        <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 95%;"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;

function bindPanelEvents() {
    let allowBackground = false;
    const htmlHook = setInterval(function () {
        if (_d.getElementById('unrivalRate') && _d.getElementById('updateRateButton') && _d
            .getElementById('reviewModeButton') && _d.getElementById('autoDoWorkButton') && _d
            .getElementById('autoSubmitButton') && _d.getElementById('autoSaveButton')) {
            if (!backGround) {
                _d.getElementById('fuckMeModeButton').style.display = "none";
            }
            allowBackground = Math.round(new Date() / 1000) - parseInt(GM_getValue('unrivalBackgroundVideoEnable', '6')) < 15;
            if (allowBackground) {
                _d.getElementById('fuckMeModeButton').setAttribute('href', 'unrivalxxtbackground/');
            }
            clearInterval(htmlHook);
            if (cVersion < 86) {
                logs.addLog('您的浏览器内核过老，请更新浏览器或者使用火狐/Edge浏览器', 'red');
                stop = true;
                return;
            }
            if (isMobile) {
                logs.addLog('手机浏览器不保证能正常运行此脚本', 'orange');
            }
            _d.addEventListener('visibilitychange', function () {
                let isH = _d.hidden;
                if (!isH) {
                    logs.addLog('挂机功能不稳定，不建议长时间最小化窗口', 'orange');
                }
            });

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

            // 4. 激活挂机
            _d.getElementById('backGround').onclick = function () {
                logs.addLog('挂机激活成功，您现在可以最小化页面了', 'green');
                _d.getElementById('backGround').setAttribute('class', 'btn btn-success btn-sm');
                _w.top.backNow = 1;
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

            // 13. DeepSeek AI 专属配置与双重测活
            let savedModel = GM_getValue('aiTikuModel', 'deepseek-flash');
            if (!['deepseek-flash', 'deepseek-v4-pro'].includes(savedModel)) {
                savedModel = 'deepseek-flash';
                GM_setValue('aiTikuModel', 'deepseek-flash');
            }
            _d.getElementById('aiTikuModel').value = savedModel;

            let savedEffort = GM_getValue('aiTikuEffort', 'low');
            if (!['low', 'none', 'high', 'max'].includes(savedEffort)) {
                savedEffort = 'low';
                GM_setValue('aiTikuEffort', 'low');
            }
            _d.getElementById('aiTikuEffort').value = savedEffort;
            _d.getElementById('aiTikuApiKey').value = GM_getValue('aiTikuApiKey', '');

            let aiToggleBtn = _d.getElementById('toggleAiTiku');
            let updateAiTikuUI = () => {
                let isAiOn = GM_getValue('aiTikuEnable', '0') === '1';
                if (isAiOn) {
                    aiToggleBtn.setAttribute('class', 'btn btn-success btn-xs');
                    aiToggleBtn.innerText = '已启用';
                } else {
                    aiToggleBtn.setAttribute('class', 'btn btn-default btn-xs');
                    aiToggleBtn.innerText = '已禁用';
                }
            };
            updateAiTikuUI();
            aiToggleBtn.onclick = function () {
                let nextState = GM_getValue('aiTikuEnable', '0') === '1' ? '0' : '1';
                GM_setValue('aiTikuEnable', nextState);
                updateAiTikuUI();
                logs.addLog(nextState === '1' ? '已启用 DeepSeek AI 智能答题' : '已禁用 DeepSeek AI 智能答题', 'green');
            };

            _d.getElementById('saveAiTiku').onclick = function () {
                let k = _d.getElementById('aiTikuApiKey').value.trim();
                let m = _d.getElementById('aiTikuModel').value;
                let ef = _d.getElementById('aiTikuEffort').value;
                GM_setValue('aiTikuApiKey', k);
                GM_setValue('aiTikuModel', m);
                GM_setValue('aiTikuEffort', ef);
                logs.addLog('DeepSeek 配置已保存 (模型: ' + m + ' | 思考深度: ' + ef + ')', 'green');
            };

            let testAiBtn = _d.getElementById('testAiTiku');
            let testStatusSpan = _d.getElementById('aiTestStatus');
            testAiBtn.onclick = function () {
                let apiKey = _d.getElementById('aiTikuApiKey').value.trim();
                let model = _d.getElementById('aiTikuModel').value;
                let effort = _d.getElementById('aiTikuEffort').value;

                if (!apiKey) {
                    testStatusSpan.innerHTML = '<span style="color: red;">❌ 请先填写 API Key</span>';
                    logs.addLog('请先填写 DeepSeek API Key', 'red');
                    return;
                }

                GM_setValue('aiTikuApiKey', apiKey);
                GM_setValue('aiTikuModel', model);
                GM_setValue('aiTikuEffort', effort);

                let resetBtn = () => {
                    testAiBtn.innerText = '测试 API 与余额';
                    testAiBtn.style.pointerEvents = 'auto';
                    testAiBtn.style.opacity = '1';
                };

                testAiBtn.innerText = '⏳ 测试中...';
                testAiBtn.style.pointerEvents = 'none';
                testAiBtn.style.opacity = '0.6';
                testStatusSpan.innerHTML = '<span style="color: #31708f;">⏳ 正在检测账户余额与模型连通性...</span>';

                // 第1步：请求余额
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://api.deepseek.com/user/balance',
                    headers: { 'Authorization': 'Bearer ' + apiKey },
                    timeout: 8000,
                    onload: function (balRes) {
                        if (balRes.status === 401) {
                            resetBtn();
                            testStatusSpan.innerHTML = '<span style="color: red;">❌ API Key 无效或已过期 (HTTP 401)</span>';
                            logs.addLog('DeepSeek 余额查询失败：API Key 无效或已过期 (HTTP 401)', 'red');
                            return;
                        }

                        let balanceStr = '';
                        let isAvailable = true;
                        try {
                            let balJson = JSON.parse(balRes.responseText);
                            if (balJson.is_available !== undefined) isAvailable = balJson.is_available;
                            if (balJson.balance_infos && balJson.balance_infos.length > 0) {
                                let bInfo = balJson.balance_infos[0];
                                let total = bInfo.total_balance !== undefined ? bInfo.total_balance : '';
                                let curr = bInfo.currency || 'CNY';
                                balanceStr = total + ' ' + curr;
                            }
                        } catch (e) { }

                        if (!balanceStr) balanceStr = isAvailable ? '充足' : '0.00 CNY';

                        if (isAvailable === false) {
                            resetBtn();
                            testStatusSpan.innerHTML = '<span style="color: red;">❌ 账户余额不足 (余额: ' + balanceStr + ')</span>';
                            logs.addLog('DeepSeek 账户余额不足 (余额: ' + balanceStr + ')', 'red');
                            return;
                        }

                        // 第2步：验证对话接口
                        let startTime = Date.now();
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
                                let ms = Date.now() - startTime;
                                if (chatRes.status === 200) {
                                    try {
                                        let chatJson = JSON.parse(chatRes.responseText);
                                        let reply = chatJson.choices && chatJson.choices[0] && chatJson.choices[0].message && chatJson.choices[0].message.content;
                                        if (reply) {
                                            reply = reply.trim();
                                            testStatusSpan.innerHTML = '<span style="color: green;">✅ 可用 | 余额: ' + balanceStr + ' | 响应: "' + reply + '" (' + ms + 'ms)</span>';
                                            logs.addLog('DeepSeek 测试成功！可用余额: ' + balanceStr + ' | 模型: ' + model + ' | 响应: "' + reply + '" (' + ms + 'ms)', 'green');
                                            return;
                                        }
                                    } catch (e) { }
                                }

                                let errMsg = '';
                                try {
                                    let errJson = JSON.parse(chatRes.responseText);
                                    if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                                } catch (e) { }
                                let errDisplay = '❌ 连通测试失败 [HTTP ' + chatRes.status + ']: ' + (errMsg || chatRes.statusText || '请求异常');
                                testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                logs.addLog('DeepSeek 连通测试失败: ' + errDisplay, 'red');
                            },
                            onerror: function (err) {
                                resetBtn();
                                let errDisplay = '❌ 对话接口网络错误: ' + (err.error || '连接异常');
                                testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                                logs.addLog('DeepSeek 连通错误: ' + errDisplay, 'red');
                            },
                            ontimeout: function () {
                                resetBtn();
                                testStatusSpan.innerHTML = '<span style="color: red;">❌ 对话接口请求超时 (15s)</span>';
                                logs.addLog('DeepSeek 连通请求超时 (15s)', 'red');
                            }
                        });
                    },
                    onerror: function (err) {
                        resetBtn();
                        let errDisplay = '❌ 余额接口网络错误: ' + (err.error || '连接异常');
                        testStatusSpan.innerHTML = '<span style="color: red;">' + errDisplay + '</span>';
                        logs.addLog('DeepSeek 余额请求错误: ' + errDisplay, 'red');
                    },
                    ontimeout: function () {
                        resetBtn();
                        testStatusSpan.innerHTML = '<span style="color: red;">❌ 余额接口请求超时 (8s)</span>';
                        logs.addLog('DeepSeek 余额请求超时 (8s)', 'red');
                    }
                });
            };
        }
    }, 100);
}
