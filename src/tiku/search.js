// ==========================================
// 三级题库降级查题引擎（一之哥哥 -> 备用题库 -> 自定义 AI）
// ==========================================

function normalizeAiEndpoint(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
        return 'https://api.deepseek.com/chat/completions';
    }
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!url) {
        return 'https://api.deepseek.com/chat/completions';
    }
    if (url.endsWith('/chat/completions')) {
        return url;
    }
    if (url.endsWith('/v1')) {
        return url + '/chat/completions';
    }
    return url + '/v1/chat/completions';
}

function requestAiCompletion(options) {
    const {
        provider,
        apiKey,
        rawUrl,
        model,
        effort,
        messages,
        timeout = 25000,
        onSuccess,
        onError
    } = options;

    let targetUrl;
    let reqBody;

    if (provider === 'custom') {
        targetUrl = normalizeAiEndpoint(rawUrl);
        reqBody = {
            model: model,
            messages: messages,
            stream: false
        };
    } else {
        targetUrl = 'https://api.deepseek.com/chat/completions';
        reqBody = {
            model: model,
            messages: messages,
            stream: false,
            reasoning_effort: effort,
            thinking: {
                type: effort === 'none' ? 'disabled' : 'enabled'
            }
        };
    }

    const startTime = Date.now();

    GM_xmlhttpRequest({
        method: 'POST',
        url: targetUrl,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        data: JSON.stringify(reqBody),
        timeout: timeout,
        onload: function (res) {
            const ms = Date.now() - startTime;
            if (res.status >= 200 && res.status < 300) {
                try {
                    const json = JSON.parse(res.responseText);
                    const msg = json.choices && json.choices[0] && json.choices[0].message;
                    let content = (msg && msg.content) || '';
                    if (content) {
                        content = content.trim().replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').trim();
                        if (content) {
                            if (typeof onSuccess === 'function') {
                                onSuccess({ content, ms, res });
                            }
                            return;
                        }
                    }
                } catch (e) { }
            }

            let errMsg = '';
            try {
                const errJson = JSON.parse(res.responseText);
                if (errJson.error && errJson.error.message) {
                    errMsg = errJson.error.message;
                }
            } catch (e) { }

            if (typeof onError === 'function') {
                onError({
                    status: res.status,
                    message: errMsg || res.statusText || '请求异常',
                    isNetworkError: false,
                    res
                });
            }
        },
        onerror: function (err) {
            if (typeof onError === 'function') {
                onError({
                    status: 0,
                    message: (err && err.error) || '连接异常或超时',
                    isNetworkError: true
                });
            }
        },
        ontimeout: function (err) {
            if (typeof onError === 'function') {
                onError({
                    status: 0,
                    message: (err && err.error) || '连接异常或超时',
                    isNetworkError: true
                });
            }
        }
    });
}

function searchQuestionAnswer(quItem, callback, widParam) {
    const curToken = GM_getValue('tikutoken', '') || '';
    const currentWid = widParam || '';

    // 1. 尝试自定义备用题库
    function tryCustomBank() {
        const customEnable = GM_getValue('customTikuEnable', '0') === '1';
        const customUrl = (GM_getValue('customTikuUrl', '') || '').trim();
        const customToken = (GM_getValue('customTikuToken', '') || '').trim();
        if (!customEnable || !customUrl) {
            tryAiBank();
            return;
        }
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        if (customToken) headers['Authorization'] = customToken;
        const courseName = getCourseName();
        const param = 'question=' + encodeURIComponent(quItem['question']) +
            '&type=' + quItem['typeCode'] + '&id=' + currentWid +
            '&course=' + encodeURIComponent(courseName);
        GM_xmlhttpRequest({
            method: 'POST',
            url: customUrl,
            headers: headers,
            data: param,
            timeout: 5000,
            onload: function (res) {
                const ans = parseAnswerResponse(res);
                if (ans) {
                    callback({ code: 1, data: ans, from: '备用题库' });
                } else {
                    tryAiBank();
                }
            },
            onerror: function () { tryAiBank(); },
            ontimeout: function () { tryAiBank(); }
        });
    }

    // 2. 尝试 AI 智能大模型（支持 DeepSeek 官方与自定义 OpenAI 兼容接口）
    function tryAiBank() {
        const aiEnable = GM_getValue('aiTikuEnable', '0') === '1';
        const aiProvider = GM_getValue('aiTikuProvider', 'deepseek') || 'deepseek';

        let optionsStr = '';
        if (quItem['options'] && quItem['options'].length > 0) {
            const optArr = [];
            for (let optText in quItem['options']) {
                if (optText === 'length') continue;
                optArr.push(quItem['options'][optText].value + '. ' + optText);
            }
            optArr.sort();
            optionsStr = optArr.join('\n');
        }
        const courseName = getCourseName();
        let promptText = '';
        if (courseName) {
            promptText += '【课程】' + courseName + '\n';
        }
        promptText += '【题型】' + quItem['type'] + '\n【题目】' + quItem['question'] + '\n';
        if (optionsStr) {
            promptText += '【选项】\n' + optionsStr + '\n';
        }
        promptText += '请直接给出本题最终正确答案，严禁输出任何分析过程、解释、推导或多余字符。\n' +
            '- 单选题：仅输出对应选项字母（如 A）或文本；\n' +
            '- 多选题：仅输出所有正确选项字母组合（如 ACD）或文本；\n' +
            '- 判断题：仅输出“正确”或“错误”；\n' +
            '- 填空题：仅输出填空内容，多空时请用“###”分隔（如：答案一###答案二）。';

        const messages = [
            { role: 'system', content: '你是高校专业章节测试答题机器人，仅输出最简答案文本，不要任何废话。' },
            { role: 'user', content: promptText }
        ];

        if (aiProvider === 'custom') {
            const rawCustomUrl = GM_getValue('aiCustomUrl', '');
            const customModel = (GM_getValue('aiCustomModel', '') || '').trim();
            const customKey = (GM_getValue('aiCustomApiKey', '') || '').trim();

            if (!aiEnable || !customKey || !customModel || !rawCustomUrl.trim()) {
                callback({ code: -1, data: '未找到答案' });
                return;
            }

            requestAiCompletion({
                provider: 'custom',
                apiKey: customKey,
                rawUrl: rawCustomUrl,
                model: customModel,
                messages: messages,
                timeout: 25000,
                onSuccess: function ({ content }) {
                    const cleanAnswer = content.replace(/^(答|答案|标准答案|正确答案)[:：\s]*/i, '').trim();
                    if (cleanAnswer) {
                        callback({ code: 1, data: cleanAnswer, from: '自定义AI (' + customModel + ')' });
                    } else {
                        callback({ code: -1, data: '未找到答案' });
                    }
                },
                onError: function () {
                    callback({ code: -1, data: '未找到答案' });
                }
            });
        } else {
            // DeepSeek 官方
            const aiApiKey = (GM_getValue('aiTikuApiKey', '') || '').trim();
            let aiModel = (GM_getValue('aiTikuModel', 'deepseek-flash') || '').trim();
            if (!['deepseek-flash', 'deepseek-v4-pro', 'deepseek-chat', 'deepseek-reasoner'].includes(aiModel)) {
                aiModel = 'deepseek-flash';
                GM_setValue('aiTikuModel', 'deepseek-flash');
            }
            let aiEffort = GM_getValue('aiTikuEffort', 'low') || 'low';
            if (!['low', 'none', 'high', 'max'].includes(aiEffort)) {
                aiEffort = 'low';
            }

            if (!aiEnable || !aiApiKey) {
                callback({ code: -1, data: '未找到答案' });
                return;
            }

            requestAiCompletion({
                provider: 'deepseek',
                apiKey: aiApiKey,
                model: aiModel,
                effort: aiEffort,
                messages: messages,
                timeout: 25000,
                onSuccess: function ({ content }) {
                    const cleanAnswer = content.replace(/^(答|答案|标准答案|正确答案)[:：\s]*/i, '').trim();
                    if (cleanAnswer) {
                        callback({ code: 1, data: cleanAnswer, from: 'DeepSeek (' + aiModel + ')' });
                    } else {
                        callback({ code: -1, data: '未找到答案' });
                    }
                },
                onError: function () {
                    callback({ code: -1, data: '未找到答案' });
                }
            });
        }
    }

    // 优先请求一之哥哥公共题库
    const param = 'question=' + encodeURIComponent(quItem['question']) +
        '&type=' + quItem['typeCode'] + '&id=' + currentWid;
    GM_xmlhttpRequest({
        method: "POST",
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Authorization': curToken,
        },
        url: ctUrl,
        timeout: 4000,
        data: param,
        onload: function (res) {
            let parsed = null;
            try {
                parsed = JSON.parse(res.responseText);
            } catch (e) { }
            if (parsed && parsed.code === 1 && parsed.data) {
                callback(parsed);
            } else {
                tryCustomBank();
            }
        },
        onerror: function () { tryCustomBank(); },
        ontimeout: function () { tryCustomBank(); }
    });
}

function parseAnswerResponse(res) {
    if (!res || !res.responseText) return null;
    try {
        const json = JSON.parse(res.responseText);
        if (json.code === 1 || json.code === 200 || json.code === 0 || json.status === true || json.status === 1) {
            if (json.data !== undefined && json.data !== null && json.data !== '') {
                if (typeof json.data === 'string') return json.data;
                if (json.data.answer) return json.data.answer;
                return json.data;
            }
            if (json.answer) return json.answer;
        }
        if (json.data && typeof json.data === 'string') return json.data;
        if (json.answer) return json.answer;
    } catch (e) {
        if (res.status === 200 && res.responseText.length > 0 && res.responseText.length < 500 && !res.responseText.includes('<html')) {
            return res.responseText.trim();
        }
    }
    return null;
}
