import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 构造轻量 DOM 元素模拟器
 */
function createMockElement(tagName, attrs = {}, textContent = '') {
    const children = [];
    const eventListeners = [];
    let classes = attrs.class || '';

    const el = {
        tagName: tagName.toUpperCase(),
        attributes: { ...attrs },
        textContent: textContent,
        innerText: textContent,
        innerHTML: textContent,
        value: attrs.value || '',
        clicked: 0,
        click() {
            this.clicked++;
        },
        getAttribute(name) {
            if (name === 'class') return classes;
            return this.attributes[name] !== undefined ? this.attributes[name] : null;
        },
        setAttribute(name, val) {
            if (name === 'class') classes = String(val);
            this.attributes[name] = String(val);
        },
        appendChild(child) {
            children.push(child);
            return child;
        },
        getElementsByTagName(tag) {
            const target = tag.toUpperCase();
            const results = [];
            for (const child of children) {
                if (child.tagName === target) results.push(child);
                if (child.getElementsByTagName) {
                    results.push(...child.getElementsByTagName(tag));
                }
            }
            return results;
        },
        getElementsByClassName(cls) {
            const results = [];
            for (const child of children) {
                const c = child.getAttribute ? child.getAttribute('class') : '';
                if (c && c.includes(cls)) results.push(child);
                if (child.getElementsByClassName) {
                    results.push(...child.getElementsByClassName(cls));
                }
            }
            return results;
        },
        querySelectorAll(selector) {
            const results = [];
            for (const child of children) {
                if (selector.includes('input') && child.tagName === 'INPUT') results.push(child);
                if (selector.includes('textarea') && child.tagName === 'TEXTAREA') results.push(child);
                if (child.querySelectorAll) results.push(...child.querySelectorAll(selector));
            }
            return results;
        },
        querySelector(selector) {
            const list = this.querySelectorAll(selector);
            return list[0] || null;
        },
        dispatchEvent(evt) {
            eventListeners.push(evt);
            return true;
        },
        dispatchedEvents: eventListeners
    };

    return el;
}

/**
 * 初始化沙箱环境并按序加载源码模块
 */
function createTestSandbox() {
    const fakeTop = {
        unrivalWorkLogs: [],
        unrivalWorkResults: [],
        unrivalCourseName: '软件测试工程',
        document: {
            getElementsByTagName: () => [],
            querySelector: () => null
        }
    };

    // 为 top.unrivalWorkInfo 设置 setter 自动收集日志到 unrivalWorkLogs（跨帧日志队列）
    let _info = '';
    Object.defineProperty(fakeTop, 'unrivalWorkInfo', {
        get() {
            return _info;
        },
        set(val) {
            _info = val;
            if (val) {
                if (!Array.isArray(fakeTop.unrivalWorkLogs)) {
                    fakeTop.unrivalWorkLogs = [];
                }
                fakeTop.unrivalWorkLogs.push(val);
            }
        },
        configurable: true,
        enumerable: true
    });

    fakeTop.drainWorkLogs = function () {
        const logs = fakeTop.unrivalWorkLogs ? [...fakeTop.unrivalWorkLogs] : [];
        if (fakeTop.unrivalWorkLogs) {
            fakeTop.unrivalWorkLogs.length = 0;
        }
        return logs;
    };

    const fakeLocation = {
        search: '?courseId=12345&clazzid=67890',
        protocol: 'https:',
        host: 'mooc1.chaoxing.com'
    };

    const elementsById = new Map();
    const fakeDoc = {
        cookie: 'UID=10001; fid=20002; _uid=10001',
        getElementsByClassName: () => [],
        getElementsByTagName: () => [],
        querySelectorAll: () => [],
        querySelector: () => null,
        getElementById: (id) => elementsById.get(id) || null
    };

    const fakeWindow = {
        top: fakeTop,
        document: fakeDoc,
        location: fakeLocation,
        navigator: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        }
    };

    class FakeEvent {
        constructor(type, init = {}) {
            this.type = type;
            this.bubbles = !!init.bubbles;
            this.cancelable = !!init.cancelable;
        }
    }

    const gmStore = new Map();

    const sandbox = {
        console,
        JSON,
        Math,
        Date,
        RegExp,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Set,
        Map,
        Promise,
        Uint8Array,
        unescape: globalThis.unescape || ((s) => decodeURI(s)),
        encodeURIComponent: globalThis.encodeURIComponent,
        decodeURIComponent: globalThis.decodeURIComponent,
        atob: globalThis.atob || ((b64) => Buffer.from(b64, 'base64').toString('binary')),
        btoa: globalThis.btoa || ((bin) => Buffer.from(bin, 'binary').toString('base64')),
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
        setInterval: globalThis.setInterval,
        clearInterval: globalThis.clearInterval,
        Event: FakeEvent,
        _w: fakeWindow,
        _d: fakeDoc,
        _l: fakeLocation,
        document: fakeDoc,
        window: fakeWindow,
        unsafeWindow: fakeWindow,
        ctUrl: 'https://api.example.com/tiku',
        GM_getValue: (key, def) => gmStore.has(key) ? gmStore.get(key) : def,
        GM_setValue: (key, val) => { gmStore.set(key, val); },
        GM_xmlhttpRequest: () => { }
    };

    const ctx = vm.createContext(sandbox);

    // 按依赖顺序加载源码文件
    const sourceFiles = [
        'src/utils/crypto.js',
        'src/utils/helpers.js',
        'src/core/logger.js',
        'src/ui/template.js',
        'src/tiku/search.js',
        'src/matcher/index.js'
    ];

    for (const relPath of sourceFiles) {
        const fullPath = path.resolve(PROJECT_ROOT, relPath);
        if (fs.existsSync(fullPath)) {
            const code = fs.readFileSync(fullPath, 'utf8');
            vm.runInContext(code, ctx);
        }
    }

    return {
        ctx,
        sandbox,
        elementsById,
        exec: (code) => vm.runInContext(code, ctx)
    };
}

// ==========================================
// 单元测试套件
// ==========================================

describe('子任务 4 零依赖白盒单元测试套件', () => {
    let env;

    beforeEach(() => {
        env = createTestSandbox();
    });

    // ------------------------------------------
    // 1. 加密与签名 (localMd5)
    // ------------------------------------------
    describe('加密与签名 (localMd5)', () => {
        it('验证空字符串及普通 ASCII 字符串的标准 MD5 结果为 32 位小写十六进制', () => {
            const { ctx } = env;
            const emptyHash = ctx.localMd5('');
            assert.strictEqual(emptyHash, 'd41d8cd98f00b204e9800998ecf8427e');
            assert.match(emptyHash, /^[0-9a-f]{32}$/);

            const helloHash = ctx.localMd5('hello world');
            assert.strictEqual(helloHash, '5eb63bbbe01eeed093cb22bb8f5acdc3');
        });

        it('验证 UTF-8 中文字符串的 MD5 与 Node.js 原生 crypto 完全一致', () => {
            const { ctx } = env;
            const testCases = [
                '超星学习通助手',
                '高等数学（下）期末测试【官方标准答案】',
                'A/B/C/D 选项混合中文与特殊符号 ~!@#$%^&*()_+'
            ];

            for (const text of testCases) {
                const actual = ctx.localMd5(text);
                const expected = crypto.createHash('md5').update(text, 'utf8').digest('hex');
                assert.strictEqual(actual, expected, `MD5 mismatch for input: ${text}`);
            }
        });

        it('防封红线校验: 验证超星视频汇报签名串 (cards.js 格式) 哈希计算准确性', () => {
            const { ctx } = env;
            const classIdFromData = '68123456';
            const UID = '98765432';
            const jobid = '169000111';
            const objectId = 'c8d4e9f012345678abcdef';
            const playTime = 120; // 120 秒
            const duration = 600; // 600 秒
            const salt = 'd_yHJ!$pdA~5';

            // cards.js 中的真实签名构造串
            const strEc = `[${classIdFromData}][${UID}][${jobid}][${objectId}][${playTime * 1000}][${salt}][${duration * 1000}][0_${duration}]`;

            const actualEnc = ctx.localMd5(strEc);
            const expectedEnc = crypto.createHash('md5').update(strEc, 'utf8').digest('hex');

            assert.strictEqual(actualEnc.length, 32);
            assert.match(actualEnc, /^[0-9a-f]{32}$/);
            assert.strictEqual(actualEnc, expectedEnc);
        });
    });

    // ------------------------------------------
    // 2. 文本清洗与标准化 (toCDB, trim, cleanText, handleImgs)
    // ------------------------------------------
    describe('文本清洗与降噪 (toCDB, trim, cleanText, handleImgs)', () => {
        it('toCDB: 应正确将全角英数与常见全角标点转为半角', () => {
            const { ctx } = env;
            const input = 'ＡＢＣ１２３（测试）';
            const result = ctx.toCDB(input);
            assert.strictEqual(result, 'ABC123(测试)');

            // 引号与句号转换
            assert.strictEqual(ctx.toCDB('“测试” ‘单引号’ 结束。'), '"测试" \'单引号\' 结束.');
            assert.strictEqual(ctx.toCDB(null), '');
            assert.strictEqual(ctx.toCDB(123), '');
        });

        it('handleImgs: 应提取 <img> 标签内的 URL 并剥离 HTML 标签', () => {
            const { ctx } = env;
            const html = '题目描述：请辨别图示电路<img src="https://p.ananas.chaoxing.com/star3/origin/test_circuit_01.png" alt="电路图">，求阻值。';
            const result = ctx.handleImgs(html);
            assert.ok(!result.includes('<img'));
            assert.ok(result.includes('p.ananas.chaoxing.com/star3/origin/test_circuit_01.png'));
            assert.strictEqual(ctx.handleImgs('无图纯文本'), '无图纯文本');
            assert.strictEqual(ctx.handleImgs(undefined), '');
        });

        it('trim: 应移除 HTML 标签、不可见空格并标准化标点', () => {
            const { ctx } = env;
            const raw = '<p><b>1. </b>测试题目&nbsp;&nbsp;内容（包含中文括号与！标点）<br></p>';
            const cleaned = ctx.trim(raw);
            assert.strictEqual(cleaned, '1. 测试题目  内容(包含中文括号与!标点)');
        });

        it('cleanText: 答案比对专用降噪应剔除不可见零宽字符、标点符号并转小写', () => {
            const { ctx } = env;
            // 包含零宽字符 \u200b, \u200c, \u200d, \uFEFF、不间断空格 \u00a0 以及中英文混合标点与空白
            const noisy = ' 测\u200b试\u200c零\u200d宽\uFEFF字符_\u00a0(A) “B” C！ ，,。：:；;？?--  ';
            const cleaned = ctx.cleanText(noisy);
            // 标点、零宽字符与多余空格全剔除，字母全转为小写
            assert.strictEqual(cleaned, '测试零宽字符abc');

            const optionNoisy = '  A.  计算机网络 (Computer Network)  ';
            assert.strictEqual(ctx.cleanText(optionNoisy), 'a计算机网络computernetwork');
        });

        it('escapeHtml: 应正确转义 HTML 实体防止 XSS 注入', () => {
            const { ctx } = env;
            const malicious = '<script>alert("xss")</script>&\'test\'';
            assert.strictEqual(
                ctx.escapeHtml(malicious),
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#39;test&#39;'
            );
            assert.strictEqual(ctx.escapeHtml(null), '');
            assert.strictEqual(ctx.escapeHtml(undefined), '');
            assert.strictEqual(ctx.escapeHtml(12345), '12345');
        });
    });

    // ------------------------------------------
    // 3. AI 端点归一化与题库解析 (normalizeAiEndpoint, parseAnswerResponse)
    // ------------------------------------------
    describe('AI 端点归一化与题库响应解析 (normalizeAiEndpoint, parseAnswerResponse)', () => {
        it('normalizeAiEndpoint: 空地址或无效输入应回退至默认 DeepSeek 官方地址', () => {
            const { ctx } = env;
            const defUrl = 'https://api.deepseek.com/chat/completions';
            assert.strictEqual(ctx.normalizeAiEndpoint(''), defUrl);
            assert.strictEqual(ctx.normalizeAiEndpoint(null), defUrl);
            assert.strictEqual(ctx.normalizeAiEndpoint(undefined), defUrl);
            assert.strictEqual(ctx.normalizeAiEndpoint('   '), defUrl);
        });

        it('normalizeAiEndpoint: 根域名应正确补齐 /v1/chat/completions', () => {
            const { ctx } = env;
            assert.strictEqual(
                ctx.normalizeAiEndpoint('https://api.openai.com'),
                'https://api.openai.com/v1/chat/completions'
            );
            assert.strictEqual(
                ctx.normalizeAiEndpoint('https://api.openai.com/'),
                'https://api.openai.com/v1/chat/completions'
            );
            assert.strictEqual(
                ctx.normalizeAiEndpoint('http://localhost:11434///'),
                'http://localhost:11434/v1/chat/completions'
            );
        });

        it('normalizeAiEndpoint: 以 /v1 结尾的地址应正确补齐 /chat/completions', () => {
            const { ctx } = env;
            assert.strictEqual(
                ctx.normalizeAiEndpoint('https://dashscope.aliyuncs.com/compatible-mode/v1'),
                'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
            );
            assert.strictEqual(
                ctx.normalizeAiEndpoint('https://api.deepseek.com/v1/'),
                'https://api.deepseek.com/v1/chat/completions'
            );
        });

        it('normalizeAiEndpoint: 已包含完整 /chat/completions 的地址应保持原样', () => {
            const { ctx } = env;
            const fullUrl = 'https://api.example.com/v1/chat/completions';
            assert.strictEqual(ctx.normalizeAiEndpoint(fullUrl), fullUrl);
            assert.strictEqual(ctx.normalizeAiEndpoint(fullUrl + '///'), fullUrl);
        });

        it('parseAnswerResponse: 正确解析 code: 1, code: 200 及多层嵌套数据', () => {
            const { ctx } = env;
            // 格式 1: { code: 1, data: "答案A" }
            assert.strictEqual(
                ctx.parseAnswerResponse({ responseText: JSON.stringify({ code: 1, data: '答案A' }) }),
                '答案A'
            );

            // 格式 2: { code: 200, data: { answer: "答案B" } }
            assert.strictEqual(
                ctx.parseAnswerResponse({ responseText: JSON.stringify({ code: 200, data: { answer: '答案B' } }) }),
                '答案B'
            );

            // 格式 3: { code: 0, answer: "答案C" }
            assert.strictEqual(
                ctx.parseAnswerResponse({ responseText: JSON.stringify({ code: 0, answer: '答案C' }) }),
                '答案C'
            );

            // 格式 4: { status: true, data: "答案D" }
            assert.strictEqual(
                ctx.parseAnswerResponse({ responseText: JSON.stringify({ status: true, data: '答案D' }) }),
                '答案D'
            );
        });

        it('parseAnswerResponse: 兼容解析非 JSON 纯文本答案并有效屏蔽 HTML 异常页面', () => {
            const { ctx } = env;
            // 纯文本且非 HTML
            assert.strictEqual(
                ctx.parseAnswerResponse({ status: 200, responseText: '正确' }),
                '正确'
            );

            // 拦截 502/404 HTML 网关报错
            assert.strictEqual(
                ctx.parseAnswerResponse({ status: 200, responseText: '<html><body>502 Bad Gateway</body></html>' }),
                null
            );

            // 空或无效入参
            assert.strictEqual(ctx.parseAnswerResponse(null), null);
            assert.strictEqual(ctx.parseAnswerResponse({ responseText: '' }), null);
        });
    });

    // ------------------------------------------
    // 4. 题目匹配与防截胡红线 (applyQuestionAnswer)
    // ------------------------------------------
    describe('题目匹配与防截胡红线 (applyQuestionAnswer)', () => {
        it('判断题语义归一化: "true"、"对"、"√" 识别为 true (绝不因含字母 "e" 误判为 false)，"false"、"错"、"×" 识别为 false', () => {
            const { ctx } = env;

            const qId = '1001';
            const trueOption = createMockElement('li', { 'val-param': 'true', 'id-param': qId, class: '' });
            trueOption.appendChild(createMockElement('em', { 'id-param': 'A' }, 'A'));
            const falseOption = createMockElement('li', { 'val-param': 'false', 'id-param': qId, class: '' });
            falseOption.appendChild(createMockElement('em', { 'id-param': 'B' }, 'B'));

            const choiceEs = [trueOption, falseOption];
            const quu = {
                index: 0,
                question: '地球是球体吗？',
                type: '判断题',
                typeCode: '3',
                questionid: 'answer' + qId,
                options: { length: 2 }
            };

            // 测试 1: "true" 必须命中 trueOption，绝不能因为含有 'e' 被当做 false
            let matched = false;
            ctx.applyQuestionAnswer(
                { code: 1, data: 'true', from: '测试题库' },
                quu,
                { choiceEs, cleanQId: qId, questionsElement: [], curRandomDo: 0, curAccuracy: 100, onAnswerMatched: () => { matched = true; } }
            );
            assert.strictEqual(trueOption.clicked, 1, '"true" 应点击 trueOption');
            assert.strictEqual(falseOption.clicked, 0, '"true" 绝不能误点 falseOption');
            assert.strictEqual(matched, true);

            // 测试 2: "√" 必须命中 trueOption
            trueOption.clicked = 0;
            ctx.applyQuestionAnswer(
                { code: 1, data: '√', from: '测试题库' },
                quu,
                { choiceEs, cleanQId: qId, questionsElement: [], curRandomDo: 0, curAccuracy: 100, onAnswerMatched: () => { } }
            );
            assert.strictEqual(trueOption.clicked, 1);
            assert.strictEqual(falseOption.clicked, 0);

            // 测试 3: "对" 必须命中 trueOption
            trueOption.clicked = 0;
            ctx.applyQuestionAnswer(
                { code: 1, data: '正确答案：对', from: '测试题库' },
                quu,
                { choiceEs, cleanQId: qId, questionsElement: [], curRandomDo: 0, curAccuracy: 100, onAnswerMatched: () => { } }
            );
            assert.strictEqual(trueOption.clicked, 1);
            assert.strictEqual(falseOption.clicked, 0);

            // 测试 4: "false" / "错" / "×" 必须命中 falseOption
            trueOption.clicked = 0;
            falseOption.clicked = 0;
            ctx.applyQuestionAnswer(
                { code: 1, data: 'false', from: '测试题库' },
                quu,
                { choiceEs, cleanQId: qId, questionsElement: [], curRandomDo: 0, curAccuracy: 100, onAnswerMatched: () => { } }
            );
            assert.strictEqual(trueOption.clicked, 0);
            assert.strictEqual(falseOption.clicked, 1, '"false" 应点击 falseOption');

            // 测试 5: "×" 命中 falseOption
            falseOption.clicked = 0;
            ctx.applyQuestionAnswer(
                { code: 1, data: '×', from: '测试题库' },
                quu,
                { choiceEs, cleanQId: qId, questionsElement: [], curRandomDo: 0, curAccuracy: 100, onAnswerMatched: () => { } }
            );
            assert.strictEqual(falseOption.clicked, 1);
        });

        it('单选题长短选项防截胡: 选项包含 "科学" 与 "计算机科学" 时，题库返回 "计算机科学" 绝不误点 "科学"', () => {
            const { ctx } = env;

            const qId = '2002';
            // 选项 A 为短文本 "科学"
            const optA = createMockElement('li', { 'id-param': qId, class: '' });
            optA.appendChild(createMockElement('em', { 'id-param': 'A' }, 'A'));

            // 选项 B 为长文本 "计算机科学"
            const optB = createMockElement('li', { 'id-param': qId, class: '' });
            optB.appendChild(createMockElement('em', { 'id-param': 'B' }, 'B'));

            const choiceEs = [optA, optB];
            const quu = {
                index: 1,
                question: '以下哪门学科研究算法与计算系统？',
                type: '单选题',
                typeCode: '0',
                questionid: 'answer' + qId,
                options: {
                    '科学': { id: 'opt_a', value: 'A' },
                    '计算机科学': { id: 'opt_b', value: 'B' },
                    length: 2
                }
            };

            let matched = false;
            // 题库返回长选项内容 "计算机科学"
            ctx.applyQuestionAnswer(
                { code: 1, data: '计算机科学', from: '测试题库' },
                quu,
                {
                    choiceEs,
                    cleanQId: qId,
                    questionsElement: [],
                    curRandomDo: 0,
                    curAccuracy: 100,
                    onAnswerMatched: () => { matched = true; }
                }
            );

            // 断言防截胡：选项 B 被点击，短选项 A 绝不能被误点！
            assert.strictEqual(optB.clicked, 1, '长选项 B (计算机科学) 必须精准点击');
            assert.strictEqual(optA.clicked, 0, '短选项 A (科学) 绝不能被截胡点击！');
            assert.strictEqual(matched, true);

            // 反向验证：如果题库返回短选项 "科学"，应精准点击 A 而不点 B
            optA.clicked = 0;
            optB.clicked = 0;
            ctx.applyQuestionAnswer(
                { code: 1, data: '科学', from: '测试题库' },
                quu,
                {
                    choiceEs,
                    cleanQId: qId,
                    questionsElement: [],
                    curRandomDo: 0,
                    curAccuracy: 100,
                    onAnswerMatched: () => { }
                }
            );
            assert.strictEqual(optA.clicked, 1, '短选项 A (科学) 应精准点击');
            assert.strictEqual(optB.clicked, 0, '长选项 B 不应被点击');
        });

        it('跨帧日志队列不丢失: 题库答案未匹配触发盲猜时，unrivalWorkLogs 同时保留“题库返回答案”与“未匹配自动盲猜”两条日志', () => {
            const { ctx, sandbox } = env;

            const qId = '3003';
            // 选项仅有 A: "牛顿力学" 和 B: "相对论"
            const optA = createMockElement('li', { 'id-param': qId, class: '' });
            optA.appendChild(createMockElement('em', { 'id-param': 'A' }, 'A'));
            const optB = createMockElement('li', { 'id-param': qId, class: '' });
            optB.appendChild(createMockElement('em', { 'id-param': 'B' }, 'B'));

            const choiceEs = [optA, optB];
            const quu = {
                index: 2,
                question: '微观粒子运动遵循什么理论？',
                type: '单选题',
                typeCode: '0',
                questionid: 'answer' + qId,
                options: {
                    '牛顿力学': { id: 'opt_a', value: 'A' },
                    '相对论': { id: 'opt_b', value: 'B' },
                    length: 2
                }
            };

            // 清空已有日志队列
            if (sandbox._w.top.unrivalWorkLogs) {
                sandbox._w.top.unrivalWorkLogs.length = 0;
            }

            // 题库返回了不在选项中的答案 "量子力学"，并且开启了自动盲猜 (curRandomDo=1, curAccuracy=80)
            ctx.applyQuestionAnswer(
                { code: 1, data: '量子力学', from: '测试题库' },
                quu,
                {
                    choiceEs,
                    cleanQId: qId,
                    questionsElement: [],
                    curRandomDo: 1,
                    curAccuracy: 80,
                    onAnswerMatched: () => { }
                }
            );

            // 获取跨帧日志列表
            const workLogs = typeof sandbox._w.top.drainWorkLogs === 'function'
                ? sandbox._w.top.drainWorkLogs()
                : (sandbox._w.top.unrivalWorkLogs || []);

            // 验证两条日志均存在，没有被后一条单值覆盖！
            assert.ok(workLogs.length >= 2, `日志条数应 >= 2，实际为: ${workLogs.length}条 (${JSON.stringify(workLogs)})`);

            const hasAnswerLog = workLogs.some(log => log.includes('量子力学') || log.includes('题目：'));
            const hasGuessLog = workLogs.some(log => log.includes('未匹配到正确答案') || log.includes('自动选'));

            assert.ok(hasAnswerLog, '必须包含“题库返回答案”日志');
            assert.ok(hasGuessLog, '必须包含“未匹配自动盲猜”日志');
            assert.strictEqual(optB.clicked, 1, '盲猜机制应自动选择选项 B');
        });

        it('填空题支持多空用 ### 分隔填入并派发 input 和 change 事件', () => {
            const { ctx } = env;

            const qId = '4004';
            const input1 = createMockElement('input', { type: 'text', value: '' });
            const input2 = createMockElement('input', { type: 'text', value: '' });

            const questionContainer = createMockElement('div', { id: 'question' + qId });
            questionContainer.appendChild(input1);
            questionContainer.appendChild(input2);

            const quu = {
                index: 0,
                question: '四大名著中的两部是____和____。',
                type: '填空题',
                typeCode: '2',
                questionid: 'answer' + qId,
                options: { length: 0 }
            };

            let matched = false;
            ctx.applyQuestionAnswer(
                { code: 1, data: '红楼梦###西游记', from: '测试题库' },
                quu,
                {
                    choiceEs: [],
                    cleanQId: qId,
                    questionsElement: [questionContainer],
                    curRandomDo: 0,
                    curAccuracy: 100,
                    onAnswerMatched: () => { matched = true; }
                }
            );

            assert.strictEqual(input1.value, '红楼梦');
            assert.strictEqual(input2.value, '西游记');
            assert.strictEqual(matched, true);

            // 检查 input1 和 input2 均派发了 input 和 change 事件
            const evtTypes1 = input1.dispatchedEvents.map(e => e.type);
            assert.ok(evtTypes1.includes('input') && evtTypes1.includes('change'));
            const evtTypes2 = input2.dispatchedEvents.map(e => e.type);
            assert.ok(evtTypes2.includes('input') && evtTypes2.includes('change'));
        });
    });
});
