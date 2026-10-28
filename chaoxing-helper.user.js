// ==UserScript==
// @name         超星学习通助手 Next
// @namespace    unrival
// @version      5.1.3
// @homepageURL  https://github.com/SlackHan/chaoxing-helper
// @supportURL   https://github.com/SlackHan/chaoxing-helper/issues
// @updateURL    https://raw.githubusercontent.com/SlackHan/chaoxing-helper/main/chaoxing-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/SlackHan/chaoxing-helper/main/chaoxing-helper.user.js
// @description  超星学习通助手 Next：极简双栏控制面板、Web Worker 真后台防休眠挂机、支持 DeepSeek 与自定义 OpenAI 兼容大模型自动答题。
// @author       unrival
// @run-at       document-end
// @storageName  unrivalxxt
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.ac.cn/*
// @icon         http://pan-yz.chaoxing.com/favicon.ico
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setClipboard
// @grant        GM_download
// @connect      mooc1-1.chaoxing.com
// @connect      mooc1.chaoxing.com
// @connect      mooc1-2.chaoxing.com
// @connect      cx.icodef.com
// @connect      api.deepseek.com
// @connect      static.muketool.com
// @connect      *
// @license      GPL-3.0-or-later
// @original-script https://greasyfork.org/zh-CN/scripts/453287
// @original-script https://scriptcat.org/zh-CN/script-show-page/379
// @original-author  unrival
// @original-license GPL-3.0-or-later
// ==/UserScript==
(() => {
    // ==================== 模块: core/context.js ====================
// ==========================================
// 核心运行环境上下文与全局变量嗅探
// ==========================================

const _w = unsafeWindow;
const _d = _w.document;
const _l = _w.location;
const _p = _l.protocol;
const _h = _l.host;

const isMobile = _w.navigator.userAgent.includes("Android");

let stop = false;


    // ==================== 模块: utils/helpers.js ====================
// ==========================================
// 通用工具函数与字符串/DOM降噪处理
// ==========================================

function getQueryVariable(variable) {
    const q = _l.search.substring(1);
    const v = q.split("&");
    let r = false;
    for (let i = 0, l = v.length; i < l; i++) {
        const p = v[i].split("=");
        if (p[0] === variable) r = p[1];
    }
    return r;
}

function getCookie(name) {
    return `; ${document.cookie}`.split(`; ${name}=`).pop().split(';').shift();
}

// 全角转半角标准化
function toCDB(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[\uff01-\uff5e]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 65248);
    }).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/。/g, '.');
}

// 提取当前课程名称并缓存
function getCourseName() {
    try {
        if (_w.top && _w.top.unrivalCourseName) {
            return _w.top.unrivalCourseName;
        }
        let courseName = '';
        let topDoc = null;
        try {
            topDoc = _w.top ? _w.top.document : null;
        } catch (e) {
            topDoc = null;
        }
        const docs = [topDoc, _d].filter(Boolean);

        for (const doc of docs) {
            if (courseName) break;
            try {
                // 1. 尝试从 script 中匹配 courseName
                const scripts = doc.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const text = scripts[i].textContent || scripts[i].innerText || '';
                    const match = text.match(/courseName\s*[:=]\s*['"]([^'"]+)['"]/);
                    if (match && match[1]) {
                        courseName = match[1].trim();
                        break;
                    }
                }

                // 2. 尝试读取 .coursename, .main h1, h1 文本
                if (!courseName) {
                    const selectors = ['.coursename', '.course_name', '.main h1', 'h1'];
                    for (const sel of selectors) {
                        const el = doc.querySelector(sel);
                        if (el) {
                            const txt = (el.innerText || el.textContent || '').trim();
                            if (txt) {
                                courseName = txt;
                                break;
                            }
                        }
                    }
                }
            } catch (e) { }
        }

        courseName = courseName ? trim(courseName).replace(/\s+/g, ' ') : '';
        if (_w.top && courseName) {
            try {
                _w.top.unrivalCourseName = courseName;
            } catch (e) { }
        }
        return courseName;
    } catch (e) {
        return '';
    }
}

// 将富文本题干中的 img 标签替换为纯文本 URL，避免标签干扰
function handleImgs(s) {
    if (!s || typeof s !== 'string') return '';
    const imgEs = s.match(/(<img([^>]*)>)/g);
    if (imgEs) {
        for (let j = 0, k = imgEs.length; j < k; j++) {
            const urls = imgEs[j].match(/http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/);
            if (urls) {
                const url = urls[0].replace(/http[s]?:\/\//, '');
                s = s.replaceAll(imgEs[j], url);
            }
        }
    }
    return s;
}

// 去除标点符号与 HTML 标签的标准化修剪
function trim(s) {
    if (!s || typeof s !== 'string') return '';
    s = toCDB(s);
    return handleImgs(s)
        .replaceAll('javascript:void(0);', '')
        .replaceAll("&nbsp;", ' ')
        .replaceAll("，", ',')
        .replaceAll("。", '.')
        .replaceAll("：", ':')
        .replaceAll("；", ';')
        .replaceAll("？", '?')
        .replaceAll("（", '(')
        .replaceAll("）", ')')
        .replaceAll("“", '"')
        .replaceAll("”", '"')
        .replaceAll("！", '!')
        .replaceAll("-", ' ')
        .replace(/(<([^>]+)>)/ig, '')
        .replace(/^\s+/ig, '')
        .replace(/\s+$/ig, '');
}

// 答案与选项比对专用高强度降噪清洗（转小写并剔除所有不可见字符与常见标点）
function cleanText(s) {
    if (!s || typeof s !== 'string') return '';
    s = toCDB(s);
    return trim(s)
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[\u200b-\u200d\uFEFF]/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/[，,。\.：:；;？\?（\(）\)“”"！!\-_\s]/g, '')
        .toLowerCase();
}

// 按需字体反爬解密
function decryptFontIfNeeded(doneCallback) {
    if (typeof doneCallback !== 'function') doneCallback = () => { };
    try {
        const secretEls = _d.querySelectorAll('.font-cxsecret');
        if (!secretEls || secretEls.length === 0) {
            doneCallback();
            return;
        }

        let styleBase64 = '';
        const styles = _d.getElementsByTagName('style');
        for (let i = 0; i < styles.length; i++) {
            const text = styles[i].textContent || styles[i].innerText || '';
            if (text.includes('font-cxsecret')) {
                const match = text.match(/base64,([\w\W]+?)['"\)]/);
                if (match && match[1]) {
                    styleBase64 = match[1].trim();
                    break;
                }
            }
        }

        if (!styleBase64) {
            doneCallback();
            return;
        }

        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            doneCallback();
        };

        const gmGet = (url) => new Promise((resolve, reject) => {
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: 5000,
                    onload: (res) => {
                        if (res.status === 200 && res.responseText) {
                            resolve(res.responseText);
                        } else {
                            reject(new Error('HTTP status ' + res.status));
                        }
                    },
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error('Request timeout: ' + url))
                });
            } catch (e) {
                reject(e);
            }
        });

        (async () => {
            try {
                // 1. 获取 cxsecret 映射表（优先读取本地缓存）
                let cxsecretMap = null;
                const cachedMapStr = GM_getValue('unrival_cxsecret_map', '');
                if (cachedMapStr) {
                    try {
                        cxsecretMap = JSON.parse(cachedMapStr);
                    } catch (e) {
                        cxsecretMap = null;
                    }
                }

                const tasks = [];
                const needFetchTypr = !(_w.Typr && _w.Typr.U);
                if (needFetchTypr) {
                    tasks.push(gmGet('https://static.muketool.com/scripts/cx/v2/js/Typr.min.js'));
                    tasks.push(gmGet('https://static.muketool.com/scripts/cx/v2/js/Typr.U.min.js'));
                }
                if (!cxsecretMap) {
                    tasks.push(gmGet('https://static.muketool.com/scripts/cx/v2/fonts/cxsecret.json'));
                }

                const results = await Promise.all(tasks);
                let resIdx = 0;
                if (needFetchTypr) {
                    const typrCode = results[resIdx++];
                    const typrUCode = results[resIdx++];
                    const T = new Function('window', typrCode + '\n; return Typr;')(_w);
                    new Function('Typr', 'window', typrUCode + '\n; return Typr.U;')(T, _w);
                    _w.Typr = T;
                }
                if (!cxsecretMap) {
                    const mapJsonStr = results[resIdx++];
                    cxsecretMap = JSON.parse(mapJsonStr);
                    try {
                        GM_setValue('unrival_cxsecret_map', mapJsonStr);
                    } catch (e) { }
                }

                const TyprInstance = _w.Typr;
                if (!TyprInstance || !TyprInstance.U || !cxsecretMap) {
                    finish();
                    return;
                }

                // 2. 解码 base64 字体并解析
                const rawBinary = atob(styleBase64.replace(/\s+/g, ''));
                const len = rawBinary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = rawBinary.charCodeAt(i);
                }
                const parsedFonts = TyprInstance.parse(bytes.buffer);
                if (!parsedFonts || parsedFonts.length === 0) {
                    finish();
                    return;
                }
                const font = parsedFonts[0];

                // 3. 遍历 19968 到 40870 构造字符映射表
                const fontMap = {};
                for (let code = 19968; code <= 40870; code++) {
                    try {
                        const glyph = TyprInstance.U.codeToGlyph(font, code);
                        if (!glyph) continue;
                        const path = TyprInstance.U.glyphToPath(font, glyph);
                        if (!path || !path.cmds || path.cmds.length === 0) continue;
                        const md5 = localMd5(JSON.stringify(path)).slice(24);
                        if (cxsecretMap[md5] !== undefined) {
                            const realChar = typeof cxsecretMap[md5] === 'number'
                                ? String.fromCharCode(cxsecretMap[md5])
                                : String(cxsecretMap[md5]);
                            fontMap[String.fromCharCode(code)] = realChar;
                        }
                    } catch (err) { }
                }

                // 4. 替换所有 .font-cxsecret 元素内的加密字符并移除 class
                const encChars = Object.keys(fontMap);
                if (encChars.length > 0) {
                    const reg = new RegExp('[' + encChars.join('') + ']', 'g');
                    const elements = _d.querySelectorAll('.font-cxsecret');
                    for (let el of elements) {
                        if (el.innerHTML) {
                            el.innerHTML = el.innerHTML.replace(reg, ch => fontMap[ch] || ch);
                        }
                        el.classList.remove('font-cxsecret');
                    }
                } else {
                    const elements = _d.querySelectorAll('.font-cxsecret');
                    for (let el of elements) {
                        el.classList.remove('font-cxsecret');
                    }
                }
            } catch (err) {
                console.error('[decryptFontIfNeeded Error]', err);
            } finally {
                finish();
            }
        })();
    } catch (e) {
        console.error('[decryptFontIfNeeded Outer Error]', e);
        doneCallback();
    }
}

// ==========================================
// 后台保活防休眠与 Worker 高精度定时器
// ==========================================

function createWorkerTimer(callback, intervalMs = 1000) {
    try {
        const workerCode = `let t = setInterval(() => postMessage(1), ${Number(intervalMs) || 1000}); onmessage = (e) => { if (e.data === 'stop') clearInterval(t); };`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);

        worker.onmessage = function () {
            try {
                callback();
            } catch (err) {
                console.error('[WorkerTimer Callback Error]', err);
            }
        };

        let stopped = false;
        return {
            stop: function () {
                if (stopped) return;
                stopped = true;
                try {
                    worker.postMessage('stop');
                } catch (e) { }
                try {
                    worker.terminate();
                } catch (e) { }
                try {
                    URL.revokeObjectURL(url);
                } catch (e) { }
            }
        };
    } catch (e) {
        // 浏览器环境或 CSP 限制导致 new Worker 抛错时自动降级
        const timerId = setInterval(callback, intervalMs);
        let stopped = false;
        return {
            stop: function () {
                if (stopped) return;
                stopped = true;
                clearInterval(timerId);
            }
        };
    }
}

const keepAliveAudio = {
    ctx: null,
    osc: null,
    gain: null,
    wakeLockSentinel: null,

    start: function () {
        try {
            const AudioCtx = _w.AudioContext || _w.webkitAudioContext;
            if (AudioCtx) {
                if (!this.ctx || this.ctx.state === 'closed') {
                    this.ctx = new AudioCtx();
                }
                if (!this.osc) {
                    this.osc = this.ctx.createOscillator();
                    this.gain = this.ctx.createGain();
                    this.osc.type = 'sine';
                    this.osc.frequency.value = 10;
                    this.gain.gain.value = 0.0001;
                    this.osc.connect(this.gain);
                    this.gain.connect(this.ctx.destination);
                    this.osc.start();
                }
                if (this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => { });
                }
            }
        } catch (e) {
            console.error('[keepAliveAudio] Audio start failed:', e);
        }

        try {
            if (_w.navigator && _w.navigator.wakeLock && !this.wakeLockSentinel) {
                _w.navigator.wakeLock.request('screen').then(sentinel => {
                    this.wakeLockSentinel = sentinel;
                    sentinel.addEventListener('release', () => {
                        if (this.wakeLockSentinel === sentinel) {
                            this.wakeLockSentinel = null;
                        }
                    });
                }).catch(() => { });
            }
        } catch (e) {
            console.error('[keepAliveAudio] WakeLock request failed:', e);
        }
    },

    stop: function () {
        if (this.osc) {
            try {
                this.osc.stop();
                this.osc.disconnect();
            } catch (e) { }
            this.osc = null;
        }
        if (this.gain) {
            try {
                this.gain.disconnect();
            } catch (e) { }
            this.gain = null;
        }
        if (this.ctx) {
            try {
                if (this.ctx.state !== 'closed') {
                    this.ctx.suspend().catch(() => { });
                }
            } catch (e) { }
        }
        if (this.wakeLockSentinel) {
            try {
                this.wakeLockSentinel.release().catch(() => { });
            } catch (e) { }
            this.wakeLockSentinel = null;
        }
    }
};


    // ==================== 模块: utils/crypto.js ====================
// ==========================================
// 本地纯 JS MD5 计算（替代原版远端 getEnc.php 裸IP依赖）
// ==========================================

function localMd5(string) {
    function md5_RotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function md5_AddUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }
    function md5_F(x, y, z) { return (x & y) | ((~x) & z); }
    function md5_G(x, y, z) { return (x & z) | (y & (~z)); }
    function md5_H(x, y, z) { return (x ^ y ^ z); }
    function md5_I(x, y, z) { return (y ^ (x | (~z))); }
    function md5_FF(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_GG(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_HH(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_II(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    }
    function md5_ConvertToWordArray(str) {
        var lWordCount;
        var lMessageLength = str.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function md5_WordToHex(lValue) {
        var WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = '0' + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    }
    function md5_Utf8Encode(str) {
        return unescape(encodeURIComponent(str));
    }
    string = md5_Utf8Encode(string);
    var x = md5_ConvertToWordArray(string);
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = md5_GG(d, a, b, c, x[k + 10], S22, 0x02441453);
        c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = md5_HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
        a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = md5_AddUnsigned(a, AA);
        b = md5_AddUnsigned(b, BB);
        c = md5_AddUnsigned(c, CC);
        d = md5_AddUnsigned(d, DD);
    }
    return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
}


    // ==================== 模块: core/env.js ====================
// ==========================================
// 页面环境参数提取与弹窗拦截
// ==========================================

const classId = getQueryVariable('clazzid') || getQueryVariable('clazzId') || getQueryVariable('classid') || getQueryVariable('classId');
const courseId = getQueryVariable('courseid') || getQueryVariable('courseId');
let UID = getCookie('_uid') || getCookie('UID');
let FID = getCookie('fid');
const jq = _w.top.$ || _w.top.jQuery;

// 劫持拦截超星各种阻塞式 confirm 确认弹窗
_w.confirm = (msg) => true;
setInterval(function () {
    _w.confirm = (msg) => true;
}, 2000);


    // ==================== 模块: core/config.js ====================
// ==========================================
// 本地持久化配置读取与全局状态机初始化
// ==========================================

let jumpType = parseInt(GM_getValue('unrivaljumptype', '1'), 10); // 0:智能模式，1:遍历模式，2:不跳转
let disableMonitor = parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10); // 0:无操作，1:解除多端学习监控
let randomDo = parseInt(GM_getValue('unrivalrandomdo', '1'), 10); // 0:关闭盲猜，1:开启盲猜
let backNow = parseInt(GM_getValue('unrivalbacknow', '0'), 10); // 0:未激活挂机，1:已激活挂机

// 播放与答题配置
let rate = GM_getValue('unrivalrate', '1'); // 倍速
let token = GM_getValue('tikutoken', ''); // 题库token
let accuracy = GM_getValue('accuracy', 60); // 章节测试正确率百分比
const ctUrl = 'https://cx.icodef.com/wyn-nb?v=4'; // 一之哥哥公共题库接口

if (parseFloat(rate) == parseInt(rate)) {
    rate = parseInt(rate);
} else {
    rate = parseFloat(rate);
}

// 同步关键配置至顶级 window 供跨 iframe 访问
try {
    _w.top.unrivalReviewMode = GM_getValue('unrivalreview', '0') || '0';
    _w.top.unrivalDoWork = GM_getValue('unrivaldowork', '1') || '1';
    _w.top.unrivalAutoSubmit = GM_getValue('unrivalautosubmit', '1') || '1';
    _w.top.unrivalAutoSave = GM_getValue('unrivalautosave', '0') || '0';
    _w.top.unrivalJumpType = jumpType;
    _w.top.unrivalDisableMonitor = disableMonitor;
    _w.top.unrivalRandomDo = randomDo;
    if (_w.top.backNow === undefined || _w.top.backNow === null) {
        _w.top.backNow = backNow;
    }
} catch (e) { }


    // ==================== 模块: core/logger.js ====================
// ==========================================
// 运行日志与悬浮窗日志面板管理器
// ==========================================

const logs = {
    logArry: [],
    addLog: function (str, color = "black") {
        if (this.logArry.length >= 50) {
            this.logArry.splice(0, 1);
        }
        const nowTime = new Date();
        const nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
        const nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
        const nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
        this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" + nowSec + "] " + str + "</span>");
        let logStr = "";
        for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
            logStr += this.logArry[logI] + "<br>";
        }
        const logElement = _d.getElementById('log');
        if (logElement) {
            logElement.innerHTML = logStr;
            logElement.scrollTop = logElement.scrollHeight;
        }
    }
};

function pushWorkLog(msg) {
    if (!msg) return;
    try {
        if (_w.top) {
            if (!Array.isArray(_w.top.unrivalWorkLogs)) {
                _w.top.unrivalWorkLogs = [];
            }
            _w.top.unrivalWorkLogs.push(String(msg));
        }
    } catch (e) { }
}

function drainWorkLogs() {
    const out = [];
    try {
        if (_w.top) {
            if (Array.isArray(_w.top.unrivalWorkLogs) && _w.top.unrivalWorkLogs.length > 0) {
                out.push(..._w.top.unrivalWorkLogs.splice(0));
            }
            if (_w.top.unrivalWorkInfo && typeof _w.top.unrivalWorkInfo === 'string') {
                out.push(_w.top.unrivalWorkInfo);
                _w.top.unrivalWorkInfo = '';
            }
        }
    } catch (e) { }
    return out;
}


    // ==================== 模块: ui/template.js ====================
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


    // ==================== 模块: ui/panel.js ====================
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


    // ==================== 模块: tiku/search.js ====================
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


    // ==================== 模块: matcher/index.js ====================
// ==========================================
// 题目解析提取器与高精度题型匹配引擎（单选/多选/判断/填空）
// ==========================================

function parseQuestionsFromDom() {
    const questionList = [];
    const questionsElement = _d.getElementsByClassName('Py-mian1');

    for (let i = 0; i < questionsElement.length; i++) {
        const questionElement = questionsElement[i];
        const idElements = questionElement.getElementsByTagName('input');
        let questionId = '0';
        const titleElement = questionElement.getElementsByClassName('Py-m1-title fs16')[0];
        if (!titleElement) continue;

        let question = titleElement.innerHTML;
        question = handleImgs(question)
            .replace(/(<([^>]+)>)/ig, '')
            .replace(/[0-9]{1,3}\.[\[【](.*?)[\]】]/ig, '')
            .replace(/[0-9]{1,3}\.\[(.*?)\]/ig, '')
            .replace(/[\(（]\s*\d+(?:\.\d+)?\s*分\s*[\)）]/ig, '')
            .replaceAll('\n', '')
            .replace(/^\s+/ig, '').replace(/\s+$/ig, '');

        for (let z = 0, k = idElements.length; z < k; z++) {
            try {
                const nameAttr = idElements[z].getAttribute('name');
                if (nameAttr && nameAttr.indexOf('answer') >= 0) {
                    questionId = nameAttr.replace('type', '');
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        if (questionId === '0' || question === '') continue;

        const typeE = questionElement.getElementsByTagName('input');
        if (!typeE || typeE.length === 0) continue;

        let typeN = 'unknown';
        for (let g = 0, h = typeE.length; g < h; g++) {
            if (typeE[g].id === 'answertype' + questionId.replace('answer', '').replace('check', '')) {
                typeN = typeE[g].value;
                break;
            }
        }

        // 支持 0:单选, 1:多选, 2:填空, 3:判断
        if (['0', '1', '2', '3'].indexOf(typeN) < 0) {
            pushWorkLog('遇到暂不支持的题型(题型代码:' + typeN + ')，已跳过');
            continue;
        }

        const type = {
            '0': '单选题',
            '1': '多选题',
            '2': '填空题',
            '3': '判断题'
        }[typeN];

        const optionList = { length: 0 };
        if (['单选题', '多选题'].indexOf(type) >= 0) {
            const answerListContainer = questionElement.getElementsByClassName('answerList')[0];
            if (answerListContainer) {
                const answersElements = answerListContainer.getElementsByTagName('li');
                for (let x = 0, j = answersElements.length; x < j; x++) {
                    const optionE = answersElements[x];
                    const emE = optionE.getElementsByTagName('em')[0];
                    let optionValue = emE ? (emE.getAttribute('id-param') || emE.innerText || emE.textContent || '').trim() : '';
                    const optionTextE = trim(optionE.innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
                    const optionId = optionE.getAttribute('id-param');
                    if (!optionValue) {
                        optionValue = optionTextE.slice(0, 1).toUpperCase();
                    }
                    let optionText = optionTextE.replace(/^[A-Za-z][\.\、\:\s]*/, '').replace(/(^\s*)|(\s*$)/g, "");
                    if (!optionText) {
                        optionText = optionValue;
                    }
                    optionList[optionText] = {
                        'id': optionId,
                        'value': optionValue
                    };
                    optionList.length++;
                }
            }
        }

        questionList.push({
            'index': i,
            'question': question,
            'type': type,
            'typeCode': typeN,
            'questionid': questionId,
            'options': optionList
        });
    }

    return questionList;
}

// 统一答案填涂与题型精准匹配
function applyQuestionAnswer(res, quu, contextObj) {
    const { choiceEs, cleanQId, questionsElement, curRandomDo, curAccuracy, onAnswerMatched } = contextObj;
    const ctResult = res || { 'code': -1, 'data': '未找到答案' };
    let isMatched = false;

    function clickOptionByLetter(letter) {
        if (!letter) return false;
        const targetLtr = String(letter).trim().toUpperCase();
        for (let y = 0, j = choiceEs.length; y < j; y++) {
            const em = choiceEs[y].getElementsByTagName('em');
            if (em.length < 1) continue;
            const emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
            if (emLetter.toUpperCase() === targetLtr && choiceEs[y].getAttribute('id-param') === cleanQId) {
                const cls = choiceEs[y].getAttribute('class') || '';
                if (!cls.includes('cur')) {
                    choiceEs[y].click();
                }
                return true;
            }
        }
        return false;
    }

    function clickJudgeOption(valStr, requireEm = false) {
        const targetVal = String(valStr);
        for (let u = 0, k = choiceEs.length; u < k; u++) {
            if (requireEm && choiceEs[u].getElementsByTagName('em').length < 1) continue;
            if (choiceEs[u].getAttribute('val-param') === targetVal && choiceEs[u].getAttribute('id-param') === cleanQId) {
                choiceEs[u].click();
                return true;
            }
        }
        return false;
    }

    const handleAnswerMatched = () => {
        isMatched = true;
        if (typeof onAnswerMatched === 'function') {
            try {
                onAnswerMatched();
            } catch (e) { }
        }
    };

    const recordWorkResult = () => {
        if (_w.top && Array.isArray(_w.top.unrivalWorkResults)) {
            _w.top.unrivalWorkResults[quu.index] = {
                index: quu.index + 1,
                type: quu.type,
                question: quu.question,
                answer: ctResult.code === 1 ? (typeof ctResult.data === 'object' ? JSON.stringify(ctResult.data) : String(ctResult.data)) : '未找到答案',
                from: ctResult.from || (ctResult.code === 1 ? '公共题库' : '-'),
                matched: isMatched
            };
        }
    };

    try {
        if (ctResult['code'] !== 1) {
            pushWorkLog('题目：' + quu['question'] + '：未搜索到答案');

            // 未命中答案时的盲猜机制（当允许盲猜且合格正确率不为100%时）
            if (curRandomDo == 1 && curAccuracy < 100) {
                if (quu['type'] === '判断题') {
                    pushWorkLog(quu['question'] + '：未找到答案，自动选【错】');
                    if (clickJudgeOption('false', true)) return;
                } else if (quu['type'] === '单选题') {
                    pushWorkLog(quu['question'] + '：未找到答案，自动选【B】');
                    if (clickOptionByLetter('B')) return;
                } else if (quu['type'] === '多选题') {
                    pushWorkLog(quu['question'] + '：未找到答案，自动全选');
                    let clicked = false;
                    for (let option in quu['options']) {
                        if (option === 'length') continue;
                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                            clicked = true;
                        }
                    }
                    if (!clicked) {
                        for (let y = 0, j = choiceEs.length; y < j; y++) {
                            if (choiceEs[y].getElementsByTagName('em').length < 1) continue;
                            if (choiceEs[y].getAttribute('id-param') === cleanQId) {
                                const cls = choiceEs[y].getAttribute('class') || '';
                                if (!cls.includes('cur')) {
                                    choiceEs[y].click();
                                }
                            }
                        }
                    }
                }
            }
            return;
        }

        const result = ctResult['data'];
        pushWorkLog((ctResult['from'] ? '[' + ctResult['from'] + '] ' : '') + '题目：' + quu['question'] + '：' + (typeof result === 'object' ? JSON.stringify(result) : result));

        switch (quu['type']) {
            case '判断题': {
                let s = String(result).trim();
                s = s.replace(/^(?:答案|判断)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                const lower = s.toLowerCase();
                let answer = '';
                if (/^(?:错|×|错误|否|false|f|0|不对|不正确|不是)/i.test(lower) || /不正确|错误|为错|为假|false/i.test(lower)) {
                    answer = 'false';
                } else if (/^(?:对|√|正确|是|true|t|1)/i.test(lower) || /正确|为对|为真|true/i.test(lower)) {
                    answer = 'true';
                }

                if (answer) {
                    if (clickJudgeOption(answer)) {
                        handleAnswerMatched();
                        return;
                    }
                }

                // 支持判断题返回 A / B 选项字母
                const letterMatch = s.match(/^([A-Ba-b])(?:\.|\、|\:|\s|$)/);
                if (letterMatch) {
                    const targetLtr = letterMatch[1].toUpperCase();
                    if (clickOptionByLetter(targetLtr)) {
                        handleAnswerMatched();
                        return;
                    }
                }

                if (curRandomDo == 1 && curAccuracy < 100) {
                    pushWorkLog(quu['question'] + '：未匹配到判断结果，自动选【错】');
                    if (clickJudgeOption('false', true)) return;
                }
                break;
            }

            case '单选题': {
                const cleanRes = String(result).trim();
                const s = cleanRes.replace(/^(?:答案|正确答案|选项)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();

                // 1. 优先尝试选项字母匹配（如 "A", "A.", "选项A", "A、"）
                const letterMatch = s.match(/^([A-Za-z])(?:\.|\、|\:|\s|$)/i);
                if (letterMatch) {
                    const targetLetter = letterMatch[1].toUpperCase();
                    if (clickOptionByLetter(targetLetter)) {
                        handleAnswerMatched();
                        return;
                    }
                }

                // 2. 全文本精准相等匹配（无标点空格降噪后）
                const cleanResText = cleanText(s);
                for (let option in quu['options']) {
                    if (option === 'length') continue;
                    const cleanOpt = cleanText(option);
                    if (cleanOpt && cleanResText && cleanOpt === cleanResText) {
                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                            handleAnswerMatched();
                            return;
                        }
                    }
                }

                // 3. 文本长子串包含匹配（按选项长度从长到短优先匹配，且要求子串长 >= 2）
                const sortedOptions = Object.keys(quu['options']).filter(k => k !== 'length').sort((a, b) => b.length - a.length);
                for (let option of sortedOptions) {
                    const cleanOpt = cleanText(option);
                    if (cleanOpt && cleanResText && cleanOpt.length >= 2 && (cleanOpt.includes(cleanResText) || cleanResText.includes(cleanOpt))) {
                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                            handleAnswerMatched();
                            return;
                        }
                    }
                }

                // 4. 盲猜
                if (curRandomDo == 1 && curAccuracy < 100) {
                    pushWorkLog(quu['question'] + '：未匹配到正确答案，自动选【B】');
                    clickOptionByLetter('B');
                }
                break;
            }

            case '多选题': {
                const matchedLetters = new Set();
                if (Array.isArray(result)) {
                    for (let item of result) {
                        const itemStr = String(item).trim().replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                        if (/^[A-Za-z]$/.test(itemStr)) {
                            matchedLetters.add(itemStr.toUpperCase());
                        } else {
                            const cleanItem = cleanText(itemStr);
                            for (let option in quu['options']) {
                                if (option === 'length') continue;
                                const cleanOpt = cleanText(option);
                                if (cleanOpt && cleanItem && (cleanOpt === cleanItem || (cleanOpt.length >= 2 && cleanItem.includes(cleanOpt)))) {
                                    matchedLetters.add(quu['options'][option]['value']);
                                }
                            }
                        }
                    }
                } else if (typeof result === 'string') {
                    const s = result.trim().replace(/^(?:答案|正确答案|选项)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                    if (/^[A-Za-z\s,#、|&;]+$/.test(s)) {
                        const letters = s.toUpperCase().match(/[A-Z]/g);
                        if (letters && letters.length > 0) {
                            letters.forEach(ltr => matchedLetters.add(ltr));
                        }
                    } else {
                        const answerData = cleanText(s);
                        const sortedOptions = Object.keys(quu['options']).filter(k => k !== 'length').sort((a, b) => b.length - a.length);
                        for (let option of sortedOptions) {
                            const optTextClean = cleanText(option);
                            if (optTextClean && answerData && (optTextClean.length >= 2 && (answerData.includes(optTextClean) || optTextClean.includes(answerData)))) {
                                matchedLetters.add(quu['options'][option]['value']);
                            }
                        }
                    }
                }

                let hasAnswer = false;
                if (matchedLetters.size > 0) {
                    matchedLetters.forEach(ltr => {
                        if (clickOptionByLetter(ltr)) hasAnswer = true;
                    });
                }

                if (hasAnswer) {
                    handleAnswerMatched();
                } else if (curRandomDo == 1 && curAccuracy < 100) {
                    pushWorkLog(quu['question'] + '：未匹配到正确答案，自动全选');
                    for (let option in quu['options']) {
                        if (option === 'length') continue;
                        clickOptionByLetter(quu['options'][option]['value']);
                    }
                }
                break;
            }

            case '填空题': {
                let qEl = questionsElement[quu['index']];
                if (!qEl) {
                    qEl = _d.getElementById('question' + cleanQId) || questionsElement[0];
                }
                let inputEs = qEl ? qEl.querySelectorAll('textarea, input[type="text"]') : [];
                if (!inputEs || inputEs.length === 0) {
                    inputEs = qEl ? qEl.getElementsByTagName('textarea') : [];
                }
                if (!inputEs || inputEs.length === 0) {
                    inputEs = qEl ? Array.from(qEl.getElementsByTagName('input')).filter(el => {
                        const t = (el.getAttribute('type') || 'text').toLowerCase();
                        return t === 'text' || t === '';
                    }) : [];
                }
                if (inputEs && inputEs.length > 0) {
                    let answers = [];
                    if (Array.isArray(result)) {
                        answers = result;
                    } else if (typeof result === 'string') {
                        const s = result.trim().replace(/^(?:答案|正确答案)[:：\s]*/i, '');
                        if (inputEs.length > 1) {
                            if (s.includes('###')) answers = s.split('###');
                            else if (s.includes('===')) answers = s.split('===');
                            else if (s.includes('#')) answers = s.split('#');
                            else if (s.includes('|')) answers = s.split('|');
                            else if (s.includes('\n')) answers = s.split('\n');
                            else answers = [s];
                        } else {
                            answers = [s];
                        }
                    } else {
                        answers = [String(result)];
                    }
                    let filledCount = 0;
                    for (let b = 0; b < inputEs.length; b++) {
                        let ans = (answers[b] !== undefined ? answers[b] : answers[0]) || '';
                        ans = trim(ans).replace(/^(答案[:：]|\d+[\.、])/g, '').replace(/[*_`]/g, '').trim();
                        inputEs[b].value = ans;
                        inputEs[b].dispatchEvent(new Event('input', { bubbles: true }));
                        inputEs[b].dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    }
                    if (filledCount > 0) {
                        handleAnswerMatched();
                    }
                }
                break;
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        recordWorkResult();
    }
}


    // ==================== 模块: pages/cards.js ====================
// ==========================================
// 路由模块: knowledge/cards (任务调度、视频/音频/文档/测验 iframe 控制)
// ==========================================

function fallbackOpenUrl(url) {
    try {
        const tempA = _d.createElement('a');
        tempA.href = url;
        tempA.target = '_blank';
        tempA.rel = 'noopener';
        tempA.referrerPolicy = 'no-referrer-when-downgrade';
        _d.body.appendChild(tempA);
        tempA.click();
        _d.body.removeChild(tempA);
    } catch (e) {
        window.open(url, '_blank');
    }
}

function extractMArgParam(doc) {
    const scripts = (doc || _d).getElementsByTagName('script');
    for (let i = 0, l = scripts.length; i < l; i++) {
        const text = scripts[i].innerHTML;
        if (text.indexOf('mArg = "";') !== -1 && text.indexOf('==UserScript==') === -1) {
            const start = 'try{\n    mArg = ';
            const end = ';\n}catch(e){';
            const sIdx = text.indexOf(start);
            const eIdx = text.indexOf(end);
            if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
                return text.substring(sIdx + start.length, eIdx);
            }
        }
    }
    return null;
}

function notifyAllDoneOrJump(emptyPage = false) {
    let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
    const desc = emptyPage ? '此页无任务' : '所有任务处理完毕';
    if (curJump != 2) {
        _w.top.jump = true;
        logs.addLog(desc + '，5秒后自动进入下一章', 'green');
    } else {
        logs.addLog(desc + '，用户设置为不跳转，脚本已就绪', 'green');
    }
}

function markMissionDone(missionList, jobid, delayMs = 0) {
    const applyDone = () => {
        if (missionList && missionList['m' + jobid]) {
            missionList['m' + jobid]['running'] = false;
            missionList['m' + jobid]['done'] = true;
        }
    };
    if (delayMs > 0) {
        setTimeout(applyDone, delayMs);
    } else {
        applyDone();
    }
}

function initCardsPage() {
    let spans = _d.getElementsByTagName('span');
    for (let i = 0, l = spans.length; i < l; i++) {
        if (spans[i].innerHTML.indexOf('章节未开放') !== -1) {
            if (_l.href.indexOf("ut=s") !== -1) {
                _l.href = _l.href.replace("ut=s", "ut=t").replace(/&cpi=[0-9]{1,10}/, '');
            } else if (_l.href.indexOf("ut=t") !== -1) {
                spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！';
                return;
            }
            break;
        }
    }
    _w.top.unrivalPageRd = String(Math.random());

    let busyThread = 0;
    const param = extractMArgParam(_d);
    if (param === null) return;

    let vrefer;
    try {
        vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
    } catch (e) {
        vrefer = _p + '//' + _h + '/ananas/modules/video/index.html?v=2022-1118-1729';
    }
    GM_setValue('vrefer', vrefer);
    GM_setValue('host', _h);

    _d.getElementsByTagName("html")[0].innerHTML = CARDS_PANEL_HTML;
    bindPanelEvents();

    const downloadMedia = (url, name) => {
        if (!url) {
            alert('未获取到该资源的有效直链！');
            return;
        }
        let fileName = (name || 'resource').trim();
        if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
            fileName += '.mp4';
        }
        logs.addLog('正在发起资源下载：' + fileName, 'blue');

        if (typeof GM_download === 'function') {
            try {
                GM_download({
                    url: url,
                    name: fileName,
                    saveAs: false,
                    headers: {
                        'Referer': vrefer || (_p + '//' + _h + '/ananas/modules/video/index.html')
                    },
                    onload: function () {
                        logs.addLog('资源下载完成：' + fileName, 'green');
                    },
                    onerror: function (err) {
                        const errMsg = (err && (err.error || err.details)) || '未授权或跨域';
                        logs.addLog('油猴下载受阻(' + errMsg + ')，已转为直接打开直链', 'orange');
                        fallbackOpenUrl(url);
                    },
                    ontimeout: function () {
                        logs.addLog('下载连接超时，已转为直接打开直链', 'orange');
                        fallbackOpenUrl(url);
                    }
                });
                return;
            } catch (e) {
                logs.addLog('调用 GM_download 异常，启用备用通道', 'orange');
            }
        }

        fallbackOpenUrl(url);
    };

    // 绑定任务列表中下载与直链复制按钮事件委托
    if (!_d.__unrivalMediaActionsBound) {
        _d.__unrivalMediaActionsBound = true;
        _d.addEventListener('click', function (e) {
            const target = e.target;
            if (!target || !target.classList) return;

            // 1. 复制直链
            if (target.classList.contains('unrival-copy-link')) {
                e.preventDefault();
                const rawUrl = decodeURIComponent(target.getAttribute('data-url') || '');
                if (rawUrl) {
                    if (typeof GM_setClipboard === 'function') {
                        GM_setClipboard(rawUrl);
                        alert('直链已成功复制到剪贴板！\n如使用 IDM/迅雷 下载，若遇 403 请将引用页(Referer)填入：\n' + (vrefer || (_p + '//' + _h)));
                    } else {
                        prompt('请手动复制直链：', rawUrl);
                    }
                }
            }

            // 2. 触发下载
            if (target.classList.contains('unrival-download-btn')) {
                e.preventDefault();
                const rawUrl = decodeURIComponent(target.getAttribute('data-url') || '');
                const rawName = decodeURIComponent(target.getAttribute('data-name') || 'resource');
                if (rawUrl) {
                    downloadMedia(rawUrl, rawName);
                }
            }
        });
    }

    const missionList = {};

    const loopjob = () => {
        if (_w.top.unrivalScriptList && _w.top.unrivalScriptList.length > 1) {
            logs.addLog('您同时开启了多个刷课脚本，可能导致异常记录！', 'red');
        }
        if (stop) return;

        let missionli = missionList;
        if (Object.keys(missionli).length === 0) {
            setTimeout(loopjob, 500);
            return;
        }
        for (let itemName in missionli) {
            if (missionli[itemName]['running']) {
                setTimeout(loopjob, 500);
                return;
            }
        }
        for (let itemName in missionli) {
            if (!missionli[itemName]['done']) {
                switch (missionli[itemName]['type']) {
                    case 'video':
                        doVideo(missionli[itemName]);
                        break;
                    case 'document':
                        doDocument(missionli[itemName]);
                        break;
                    case 'work':
                        doWork(missionli[itemName]);
                        break;
                }
                setTimeout(loopjob, 500);
                return;
            }
        }
        if (busyThread <= 0) {
            notifyAllDoneOrJump(false);
        } else {
            setTimeout(loopjob, 500);
        }
    };

    let readyCheckRetries = 0;
    const readyCheck = () => {
        setTimeout(function () {
            try {
                let isBgActive = (_w.top && _w.top.backNow == 1) || GM_getValue('unrivalbacknow', '0') === '1';
                if (isBgActive) {
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
                }
                let bgBtn = _d.getElementById('backGround');
                if (bgBtn) {
                    bgBtn.setAttribute('class', isBgActive ? 'btn btn-success btn-sm' : 'btn btn-default btn-sm');
                    bgBtn.innerText = isBgActive ? '已激活挂机' : '激活挂机';
                }
                if (_w.top.unrivalReviewMode == '1') {
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                    _d.getElementById('reviewModeButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalReviewMode]);
                }
                if (_w.top.unrivalDoWork == '1') {
                    logs.addLog('自动做章节测试已开启', 'green');
                    _d.getElementById('autoDoWorkButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalDoWork]);
                }
                _d.getElementById('autoSubmitButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalAutoSubmit]);
                _d.getElementById('autoSaveButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalAutoSave]);
            } catch (e) {
                console.log(e);
                if (readyCheckRetries < 20) {
                    readyCheckRetries++;
                    readyCheck();
                }
            }
        }, 500);
    };

    readyCheck();

    let pageData;
    try {
        pageData = JSON.parse(param);
    } catch (e) {
        notifyAllDoneOrJump(true);
        return;
    }

    const data = pageData['defaults'];
    const jobList = [];
    const classIdFromData = data['clazzId'];
    const chapterId = data['knowledgeid'];
    const reportUrl = data['reportUrl'];
    UID = UID || data['userid'];
    FID = FID || data['fid'];

    for (let i = 0, l = pageData['attachments'].length; i < l; i++) {
        let item = pageData['attachments'][i];
        if (item['job'] !== true || item['isPassed'] === true) {
            if (_w.top.unrivalReviewMode == '1' && item['type'] === 'video') {
                jobList.push(item);
            }
            continue;
        } else {
            jobList.push(item);
        }
    }

    const video_getReady = (item) => {
        let statusUrl = _p + '//' + _h + '/ananas/status/' + item['property']['objectid'] + '?k=' +
            FID + '&flag=normal&_dc=' + String(Math.round(new Date())),
            doubleSpeed = item['property']['doublespeed'];
        busyThread += 1;
        GM_xmlhttpRequest({
            method: "get",
            headers: {
                'Host': _h,
                'Referer': vrefer,
                'Sec-Fetch-Site': 'same-origin'
            },
            url: statusUrl,
            timeout: 10000,
            onload: function (res) {
                try {
                    busyThread -= 1;
                    let videoInfo = JSON.parse(res.responseText),
                        duration = videoInfo['duration'],
                        dtoken = videoInfo['dtoken'];
                    const rawName = (item['property'] && item['property']['name']) || '未知视频';
                    const safeName = escapeHtml(rawName);
                    if (duration === undefined) {
                        _d.getElementById('joblist').innerHTML += `
                        <div class="panel panel-default">
                            <div class="panel-body">[无效视频] ${safeName}</div>
                        </div>`;
                        return;
                    }
                    missionList['m' + item['jobid']] = {
                        'module': item['property']['module'],
                        'type': 'video',
                        'dtoken': dtoken,
                        'duration': duration,
                        'objectId': item['property']['objectid'],
                        'rt': item['property']['rt'] || '0.9',
                        'otherInfo': item['otherInfo'],
                        'doublespeed': doubleSpeed,
                        'jobid': item['jobid'],
                        'name': item['property']['name'],
                        'done': false,
                        'running': false
                    };
                    const vObjId = (item['property'] && item['property']['objectid']) || item['objectid'] || '';
                    const realVideoUrl = videoInfo['httphd'] || videoInfo['http'] || videoInfo['download'] || '';
                    const finalVideoUrl = realVideoUrl || (vObjId ? `https://d0.ananas.chaoxing.com/download/${vObjId}` : '');
                    const vName = (item['property'] && item['property']['name']) || 'video.mp4';
                    let vDownloadLink = '';
                    if (finalVideoUrl) {
                        vDownloadLink = `
                            <span style="float:right;font-size:12px;">
                                <a href="javascript:void(0);" class="unrival-download-btn" data-url="${encodeURIComponent(finalVideoUrl)}" data-name="${encodeURIComponent(vName)}" style="color:#337ab7;font-weight:600;text-decoration:none;margin-right:8px;" title="使用油猴直接下载到本地">下载</a>
                                <a href="${finalVideoUrl}" target="_blank" rel="noopener" referrerpolicy="no-referrer-when-downgrade" style="color:#8a6d3b;text-decoration:none;margin-right:8px;" title="在新标签页播放预览">播放</a>
                                <a href="javascript:void(0);" class="unrival-copy-link" data-url="${encodeURIComponent(finalVideoUrl)}" style="color:#5cb85c;text-decoration:none;" title="复制直链至 IDM/下载器">复制直链</a>
                            </span>`;
                    }
                    _d.getElementById('joblist').innerHTML += `
                        <div class="panel panel-default">
                            <div class="panel-body">${vDownloadLink}[视频] ${safeName}</div>
                        </div>`;
                } catch (e) {
                    logs.addLog('解析视频状态异常：' + (e.message || e), 'red');
                }
            },
            onerror: function (err) {
                busyThread -= 1;
                logs.addLog('获取任务详情失败：' + (err.error || '网络错误'), 'red');
            },
            ontimeout: function () {
                busyThread -= 1;
                logs.addLog('获取任务详情超时，已自动跳过该任务', 'red');
            }
        });
    };

    const doVideo = (item) => {
        if (rate <= 0) {
            missionList['m' + item['jobid']]['running'] = true;
            logs.addLog('倍速不合法，视频已跳过', 'orange');
            markMissionDone(missionList, item['jobid'], 5000);
            return;
        }
        let videojs_id = String(parseInt(Math.random() * 9999999));
        _d.cookie = 'videojs_id=' + videojs_id + ';path=/';
        logs.addLog('开始学习：' + item['name'] + '，倍速：' + String(rate) + '倍');
        logs.addLog('观看信息每60秒上报一次，请耐心等待', 'green');

        let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : disableMonitor;
        if (curDisableMonitor == 1) {
            logs.addLog('已开启解除多端学习监控', 'orange');
        }

        const mod = (item['module'] || (item['property'] && item['property']['module']) || '').toLowerCase();
        const isAudio = mod.includes('audio') || mod.includes('mp3') || mod.includes('m4a');
        let dtype = isAudio ? 'Audio' : 'Video';
        let rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');

        let playTime = 0,
            playsTime = 0,
            isdrag = '3',
            times = 0,
            first = true,
            lastTickTime = Date.now(),
            lastReportTime = 0,
            loop = createWorkerTimer(function () {
                if (rate <= 0) {
                    loop.stop();
                    logs.addLog('倍速不合法，视频已跳过', 'orange');
                    markMissionDone(missionList, item['jobid'], 5000);
                    return;
                }
                rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');
                dtype = isAudio ? 'Audio' : 'Video';

                let now = Date.now();
                let deltaSec = (now - lastTickTime) / 1000;
                lastTickTime = now;
                if (deltaSec <= 0 || deltaSec > 5) deltaSec = 1;
                playsTime += deltaSec * rate;
                playTime = Math.min(item['duration'], Math.ceil(playsTime));

                if (first || playTime >= item['duration'] || now - lastReportTime >= 29500 || times === 0 || times % 30 === 0) {
                    lastReportTime = now;
                    if (first) playTime = 0;
                    if (playTime >= item['duration']) {
                        loop.stop();
                        playTime = item['duration'];
                        isdrag = '4';
                    } else if (playTime > 0) {
                        isdrag = '0';
                    }

                    // 本地计算 MD5 签名
                    let strEc = `[${classIdFromData}][${UID}][${item['jobid']}][${item['objectId']}][${playTime * 1000}][d_yHJ!$pdA~5][${item['duration'] * 1000}][0_${item['duration']}]`;
                    let enc = '';
                    if (typeof jq !== 'undefined' && jq && typeof jq.md5 === 'function') {
                        enc = jq.md5(strEc);
                    } else {
                        enc = localMd5(strEc);
                    }
                    if (!enc || enc.length !== 32) {
                        enc = localMd5(strEc);
                    }

                    let reportsUrl = reportUrl + '/' + item['dtoken'] +
                        '?clazzId=' + classIdFromData + '&playingTime=' + playTime +
                        '&duration=' + item['duration'] + '&clipTime=0_' + item['duration'] +
                        '&objectId=' + item['objectId'] + '&otherInfo=' + item['otherInfo'] +
                        '&jobid=' + item['jobid'] + '&userid=' + UID + '&isdrag=' + isdrag +
                        '&view=pc&enc=' + enc + '&rt=' + rt + '&dtype=' + dtype +
                        '&_t=' + String(Math.round(new Date()));

                    busyThread += 1;
                    var _bold_playTime = playTime;
                    GM_xmlhttpRequest({
                        method: "get",
                        headers: {
                            'Host': _h,
                            'Referer': vrefer,
                            'Sec-Fetch-Site': 'same-origin',
                            'Content-Type': 'application/json'
                        },
                        url: reportsUrl,
                        timeout: 15000,
                        onload: function (res) {
                            try {
                                let today = new Date(),
                                    todayStr = today.getFullYear() + 'd' + today.getMonth() + 'd' + today.getDate(),
                                    timelong = GM_getValue('unrivaltimelong', {});
                                if (timelong[UID] === undefined || timelong[UID]['today'] !== todayStr) {
                                    timelong[UID] = { 'time': 0, 'today': todayStr };
                                } else {
                                    timelong[UID]['time']++;
                                }
                                GM_setValue('unrivaltimelong', timelong);
                                busyThread -= 1;
                                if (timelong[UID]['time'] / 60 > 22 && item['doublespeed'] === 0 && _w.top.unrivalReviewMode == '0') {
                                    loop.stop();
                                    logs.addLog('今日学习时间过长，已暂停，建议明日继续学习', 'red');
                                    markMissionDone(missionList, item['jobid'], 5000);
                                    return;
                                }
                                let ispass = JSON.parse(res.responseText);
                                first = false;
                                if (ispass['isPassed'] && _w.top.unrivalReviewMode == '0') {
                                    logs.addLog('视频任务已完成', 'green');
                                    markMissionDone(missionList, item['jobid']);
                                    loop.stop();
                                    return;
                                } else if (isdrag === '4') {
                                    if (_w.top.unrivalReviewMode == '1') {
                                        logs.addLog('视频已观看完毕', 'green');
                                    } else {
                                        logs.addLog('视频已观看完毕，等待超星更新进度', 'orange');
                                    }
                                    markMissionDone(missionList, item['jobid']);
                                    try {
                                        loop.stop();
                                    } catch (e) { }
                                } else {
                                    logs.addLog(item['name'] + ' 已观看 ' + _bold_playTime + ' 秒，剩余大约 ' + String(item['duration'] - _bold_playTime) + ' 秒');
                                }
                            } catch (e) {
                                if (res.responseText && res.responseText.indexOf('验证码') >= 0) {
                                    logs.addLog('已被超星风控，请 <a href="' + reportsUrl + '" target="_blank">点击此处手动处理</a>，60秒后自动刷新', 'red');
                                    missionList['m' + item['jobid']]['running'] = false;
                                    loop.stop();
                                    stop = true;
                                    setTimeout(function () { _l.reload(); }, 60000);
                                    return;
                                }
                                logs.addLog('超星服务器响应异常，将在10秒后重试', 'red');
                                times = -10;
                            }
                        },
                        onerror: function (err) {
                            busyThread -= 1;
                            logs.addLog('观看任务汇报失败：' + (err.error || '网络错误'), 'red');
                            missionList['m' + item['jobid']]['running'] = false;
                            loop.stop();
                        },
                        ontimeout: function () {
                            busyThread -= 1;
                            logs.addLog('观看任务汇报超时，正在等待下次重试...', 'orange');
                        }
                    });
                }
                times += 1;
            }, 1000);
        missionList['m' + item['jobid']]['running'] = true;
    };

    const doDocument = (item) => {
        missionList['m' + item['jobid']]['running'] = true;
        logs.addLog('开始学习文档：' + item['name']);
        setTimeout(function () {
            busyThread += 1;
            GM_xmlhttpRequest({
                method: "get",
                url: _p + '//' + _h + '/ananas/job/document?jobid=' + item['jobid'] +
                    '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' +
                    classIdFromData + '&jtoken=' + item['jtoken'],
                onload: function (res) {
                    try {
                        busyThread -= 1;
                        let ispass = JSON.parse(res.responseText);
                        if (ispass['status']) {
                            logs.addLog('文档任务已完成', 'green');
                        } else {
                            logs.addLog('文档任务未完成，可能是超星网络延迟', 'red');
                        }
                    } catch (e) {
                        logs.addLog('文档任务解析错误', 'red');
                    }
                    markMissionDone(missionList, item['jobid']);
                },
                onerror: function (err) {
                    busyThread -= 1;
                    logs.addLog('文档任务请求错误', 'red');
                    markMissionDone(missionList, item['jobid']);
                }
            });
        }, parseInt(Math.random() * 2000 + 4000, 10));
    };

    const doWork = (item) => {
        missionList['m' + item['jobid']]['running'] = true;
        logs.addLog('开始刷章节测试：' + item['name']);
        logs.addLog('您设置的答题合格正确率为：' + String(accuracy) + '%，只有达到此标准才会自动提交', 'blue');

        // 重置并展示答题结果速览面板
        _w.top.unrivalWorkResults = [];
        const quizSummaryPanel = _d.getElementById('quizSummaryPanel');
        if (quizSummaryPanel) {
            quizSummaryPanel.style.display = 'block';
        }
        if (typeof renderQuizSummary === 'function') {
            renderQuizSummary([]);
        }

        _d.getElementById('workPanel').style.display = 'block';
        _d.getElementById('frame_content').src = _p + '//' + _h + '/work/phone/work?workId=' + item['jobid']
            .replace('work-', '') + '&courseId=' + courseId + '&clazzId=' + classIdFromData + '&knowledgeId=' +
            chapterId + '&jobId=' + item['jobid'] + '&enc=' + item['enc'];
        _w.top.unrivalWorkLogs = [];
        _w.top.unrivalWorkInfo = '';
        _w.top.unrivalDoneWorkId = '';

        let lastResultsLen = 0;
        let workInfoTimer = setInterval(function () {
            const workMsgs = typeof drainWorkLogs === 'function' ? drainWorkLogs() : [];
            for (const m of workMsgs) {
                logs.addLog(m);
            }
            if (typeof drainWorkLogs !== 'function' && _w.top.unrivalWorkInfo != '') {
                logs.addLog(_w.top.unrivalWorkInfo);
                _w.top.unrivalWorkInfo = '';
            }
            if (Array.isArray(_w.top.unrivalWorkResults) && _w.top.unrivalWorkResults.length !== lastResultsLen) {
                lastResultsLen = _w.top.unrivalWorkResults.length;
                if (typeof renderQuizSummary === 'function') {
                    renderQuizSummary(_w.top.unrivalWorkResults);
                }
            }
        }, 100);

        let checkcross = setInterval(function () {
            if (_w.top.unrivalWorkDone == false) {
                clearInterval(checkcross);
                return;
            }
            let ifW = _d.getElementById('frame_content').contentWindow;
            try {
                ifW.location.href;
            } catch (e) {
                if (e.message.indexOf('cross-origin') !== -1) {
                    clearInterval(checkcross);
                    _w.top.unrivalWorkDone = true;
                    return;
                }
            }
        }, 2000);

        let workDoneInterval = createWorkerTimer(function () {
            if (_w.top.unrivalWorkDone) {
                _w.top.unrivalWorkDone = false;
                workDoneInterval.stop();
                clearInterval(workInfoTimer);
                clearInterval(checkcross);
                _w.top.unrivalDoneWorkId = '';
                if (Array.isArray(_w.top.unrivalWorkResults) && typeof renderQuizSummary === 'function') {
                    renderQuizSummary(_w.top.unrivalWorkResults);
                }
                _d.getElementById('workPanel').style.display = 'none';
                _d.getElementById('frame_content').src = '';
                markMissionDone(missionList, item['jobid'], 5000);
            }
        }, 500);
    };

    if (jobList.length <= 0) {
        notifyAllDoneOrJump(true);
        return;
    }

    for (let i = 0, l = jobList.length; i < l; i++) {
        let item = jobList[i];
        if (item['type'] === 'video') {
            video_getReady(item);
        } else if (item['type'] === 'document') {
            const dObjId = (item['property'] && item['property']['objectid']) || item['objectid'] || '';
            const dUrl = dObjId ? `https://d0.ananas.chaoxing.com/download/${dObjId}` : '';
            const rawDocName = (item['property'] && item['property']['name']) || 'document';
            const safeDocName = escapeHtml(rawDocName);
            const dDownloadLink = dUrl ? `
                <span style="float:right;font-size:12px;">
                    <a href="javascript:void(0);" class="unrival-download-btn" data-url="${encodeURIComponent(dUrl)}" data-name="${encodeURIComponent(rawDocName)}" style="color:#337ab7;font-weight:600;text-decoration:none;margin-right:8px;" title="使用油猴直接下载到本地">下载</a>
                    <a href="${dUrl}" target="_blank" rel="noopener" referrerpolicy="no-referrer-when-downgrade" style="color:#8a6d3b;text-decoration:none;margin-right:8px;" title="在新标签页打开预览">预览</a>
                    <a href="javascript:void(0);" class="unrival-copy-link" data-url="${encodeURIComponent(dUrl)}" style="color:#5cb85c;text-decoration:none;" title="复制直链至 IDM/下载器">复制直链</a>
                </span>` : '';
            missionList['m' + item['jobid']] = {
                'type': 'document',
                'jtoken': item['jtoken'],
                'jobid': item['jobid'],
                'name': item['property']['name'],
                'done': false,
                'running': false
            };
            _d.getElementById('joblist').innerHTML += `
                <div class="panel panel-default">
                    <div class="panel-body">${dDownloadLink}[文档] ${safeDocName}</div>
                </div>`;
        } else if (item['type'] === 'workid' && _w.top.unrivalDoWork == '1') {
            const rawTitle = (item['property'] && (item['property']['title'] || item['property']['name'])) || '章节测试';
            const safeTitle = escapeHtml(rawTitle);
            missionList['m' + item['jobid']] = {
                'type': 'work',
                'workid': item['property']['workid'],
                'jobid': item['jobid'],
                'name': rawTitle,
                'enc': item['enc'],
                'done': false,
                'running': false
            };
            _d.getElementById('joblist').innerHTML += `
                <div class="panel panel-default">
                    <div class="panel-body">[测试] ${safeTitle}</div>
                </div>`;
        } else {
            try {
                let rawJobName = (item['property'] && (item['property']['name'] || item['property']['title'])) || '未知任务';
                let safeJobName = escapeHtml(rawJobName);
                _d.getElementById('joblist').innerHTML += `
                    <div class="panel panel-default">
                        <div class="panel-body">已跳过：${safeJobName}</div>
                    </div>`;
            } catch (e) { }
        }
    }

    loopjob();
}


    // ==================== 模块: pages/studentstudy.js ====================
// ==========================================
// 路由模块: mycourse/studentstudy (外层课程框架、后台静音保活、自动切章)
// ==========================================

function initStudentStudyPage() {
    let savedBackNow = parseInt(GM_getValue('unrivalbacknow', '0'), 10);
    _w.top.backNow = (_w.top.backNow !== undefined && _w.top.backNow !== null) ? _w.top.backNow : savedBackNow;
    if (_w.top.backNow == 1) {
        if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
    }

    setInterval(function () {
        try {
            _w.jQuery.fn.viewer.Constructor.prototype.show = () => { };
        } catch (e) { }
    }, 1000);

    try {
        _w.unrivalScriptList.push('unrivalxxt');
    } catch (e) {
        _w.unrivalScriptList = ['unrivalxxt'];
    }

    function checkOffline() {
        let dleft = _d.getElementsByClassName('left');
        if (dleft.length === 1) {
            let img = dleft[0].getElementsByTagName('img');
            if (img.length === 1 && img[0].src.indexOf('loading.gif') !== -1) {
                return true;
            }
        }
        return false;
    }

    setInterval(function () {
        if (checkOffline()) {
            setTimeout(function () {
                if (checkOffline()) {
                    _l.reload();
                }
            }, 10000);
        }
    }, 3000);

    let titleTimer = null;
    _d.addEventListener('visibilitychange', function () {
        var c = 0;
        if (titleTimer) {
            clearInterval(titleTimer);
            titleTimer = null;
        }
        let isBackNow = (_w.top && _w.top.backNow !== undefined && _w.top.backNow !== null) ? _w.top.backNow : parseInt(GM_getValue('unrivalbacknow', '0'), 10);
        if (!isBackNow) {
            _d.title = '⚠️请先激活挂机';
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
            return;
        } else {
            _d.title = '学生学习页面';
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
        }
        if (_d.hidden) {
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
            titleTimer = setInterval(function () {
                if (c) {
                    _d.title = '🙈挂机中';
                    c = 0;
                } else {
                    _d.title = '🙉挂机中';
                    c = 1;
                }
                if (!_d.hidden) {
                    clearInterval(titleTimer);
                    titleTimer = null;
                    _d.title = '学生学习页面';
                }
            }, 1300);
        } else {
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
        }
    });

    _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
    _w.getTeacherAjax = (courseid, classid, cid) => {
        if (cid == getQueryVariable('chapterId')) {
            return;
        }
        _w.top.unrivalPageRd = '';
        _w.unrivalgetTeacherAjax(courseid, classid, cid);
    };

    let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10);
    if (curDisableMonitor == 1) {
        _w.appendChild = _w.Element.prototype.appendChild;
        _w.Element.prototype.appendChild = function () {
            try {
                if (arguments[0].src && arguments[0].src.indexOf('detect.chaoxing.com') > 0) {
                    return;
                }
            } catch (e) { }
            _w.appendChild.apply(this, arguments);
        };
    }

    _w.jump = false;
    setInterval(function () {
        if (getQueryVariable('mooc2') == '1') {
            let tabs = _d.getElementsByClassName('posCatalog_select');
            for (let i = 0, l = tabs.length; i < l; i++) {
                if (tabs[i].getAttribute('onclick') == null) {
                    tabs[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                        "','" + tabs[i].getAttribute('id').replace('cur', '') + "');");
                }
            }
        } else {
            let ncells = _d.getElementsByClassName('ncells');
            if (ncells && ncells.length > 0) {
                let h5s = ncells[0].getElementsByTagName('h5');
                for (let i = 0, l = h5s.length; i < l; i++) {
                    if (h5s[i].getAttribute('onclick') == null) {
                        h5s[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                            "','" + h5s[i].getAttribute('id').replace('cur', '') + "');");
                    }
                }
            }
        }
    }, 1000);

    createWorkerTimer(function () {
        let but = null;
        if (_w.jump) {
            _w.jump = false;
            _w.top.unrivalDoneWorkId = '';
            let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : parseInt(GM_getValue('unrivaljumptype', '1'), 10);
            _w.jjump = (rd) => {
                if (rd != _w.top.unrivalPageRd) {
                    return;
                }
                try {
                    setTimeout(function () {
                        if (curJump == 1) { // 遍历模式
                            if (getQueryVariable('mooc2') == '1') {
                                but = _d.getElementsByClassName('jb_btn jb_btn_92 fs14 prev_next next');
                                if (!but || but.length === 0) but = _d.getElementsByClassName('jb_btn next');
                            } else {
                                but = _d.getElementsByClassName('orientationright');
                                if (!but || but.length === 0) but = _d.querySelectorAll('.nextchapter, .next-chapter, a.next, [title="下一节"], [title="下一章"]');
                            }
                            try {
                                setTimeout(function () {
                                    if (rd != _w.top.unrivalPageRd) {
                                        return;
                                    }
                                    if (but && but.length > 0) {
                                        but[0].click();
                                    }
                                }, 2000);
                            } catch (e) { }
                            return;
                        }
                        if (getQueryVariable('mooc2') == '1') {
                            let ul = _d.getElementsByClassName('prev_ul')[0],
                                lis = ul ? ul.getElementsByTagName('li') : [];
                            for (let i = 0, l = lis.length; i < l; i++) {
                                if (lis[i].getAttribute('class') == 'active') {
                                    if (i + 1 >= l) {
                                        break;
                                    } else {
                                        try {
                                            lis[i + 1].click();
                                        } catch (e) { }
                                        return;
                                    }
                                }
                            }
                            let tabs = _d.getElementsByClassName('posCatalog_select');
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].getAttribute('class') == 'posCatalog_select posCatalog_active') {
                                    while (i + 1 < tabs.length) {
                                        let nextTab = tabs[i + 1];
                                        if ((nextTab.innerHTML.includes('icon_Completed prevTips') && _w.top
                                            .unrivalReviewMode == '0') || nextTab.innerHTML.includes('catalog_points_er prevTips')) {
                                            i++;
                                            continue;
                                        }
                                        if (nextTab.id.indexOf('cur') < 0) {
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function () {
                                            if (rd != _w.top.unrivalPageRd) {
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        }, 2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        } else {
                            let div = _d.getElementsByClassName('tabtags')[0],
                                spans = div ? div.getElementsByTagName('span') : [];
                            for (let i = 0, l = spans.length; i < l; i++) {
                                if (spans[i].getAttribute('class') && spans[i].getAttribute('class').indexOf('currents') >= 0) {
                                    if (i + 1 == l) {
                                        break;
                                    } else {
                                        try {
                                            spans[i + 1].click();
                                        } catch (e) { }
                                        return;
                                    }
                                }
                            }
                            let tabs = _d.getElementsByTagName('span'),
                                newTabs = [];
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].getAttribute('style') != null && tabs[i]
                                    .getAttribute('style').indexOf('cursor:pointer;height:18px;') >= 0) {
                                    newTabs.push(tabs[i]);
                                }
                            }
                            tabs = newTabs;
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].parentNode && tabs[i].parentNode.getAttribute('class') == 'currents') {
                                    while (i + 1 < tabs.length) {
                                        let nextTab = tabs[i + 1].parentNode;
                                        if ((nextTab.innerHTML.includes('roundpoint  blue') && _w.top
                                            .unrivalReviewMode == '0') || nextTab.innerHTML.includes('roundpoint  orange')) {
                                            i++;
                                            continue;
                                        }
                                        if (nextTab.getAttribute('onclick') == null) {
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function () {
                                            if (rd != _w.top.unrivalPageRd) {
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        }, 2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    }, 2000);
                } catch (e) { }
            };
            if (typeof _w.onReadComplete1 === 'function') {
                _w.onReadComplete1();
            }
            setTimeout(() => _w.jjump(_w.top.unrivalPageRd), 2856);
        }
    }, 500);
}


    // ==================== 模块: pages/homework.js ====================
// ==========================================
// 路由模块: work/phone/doHomeWork (测验作答、三级查题调度、提交与自动保存)
// ==========================================

function initHomeWorkPage() {
    const wIdE = _d.getElementById('workLibraryId') || _d.getElementById('oldWorkId');
    const wid = wIdE ? wIdE.value : '';

    if (_w.top) {
        _w.top.unrivalWorkResults = [];
    }

    _w.top.unrivalWorkDone = false;
    _w.aalert = _w.alert;
    _w.alert = (msg) => {
        if (msg === '保存成功' || (typeof msg === 'string' && msg.includes('保存成功'))) {
            _w.top.unrivalDoneWorkId = getQueryVariable('workId');
            _w.top.unrivalWorkDone = true;
            return;
        }
        _w.aalert(msg);
    };

    if (_w.top.unrivalDoneWorkId === getQueryVariable('workId')) {
        _w.top.unrivalWorkDone = true;
        return;
    }
    _w.confirm = (msg) => true;

    decryptFontIfNeeded(() => {
        const questionList = parseQuestionsFromDom();
        const questionsElement = _d.getElementsByClassName('Py-mian1');
        let questionNum = questionList.length;
        const totalQuestionNum = questionNum; // 记录总题目数

        let nowTime = -4000;
        let busyThread = questionList.length;
        const curRandomDo = (_w.top && _w.top.unrivalRandomDo !== undefined) ? _w.top.unrivalRandomDo : parseInt(GM_getValue('unrivalrandomdo', '1'), 10);
        const curAccuracy = GM_getValue('accuracy', 60);

        const onSingleAnswerCompleted = (res, quu) => {
            busyThread -= 1;
            const choiceEs = _d.getElementsByTagName('li');
            const cleanQId = quu['questionid'].replace('answer', '');

            applyQuestionAnswer(res, quu, {
                choiceEs,
                cleanQId,
                questionsElement,
                curRandomDo,
                curAccuracy,
                onAnswerMatched: () => {
                    questionNum -= 1;
                }
            });
        };

        // 独立局部 const qu 避免异步循环闭包变量污染
        for (let i = 0, l = questionList.length; i < l; i++) {
            nowTime += parseInt(Math.random() * 2000 + 2500, 10);
            setTimeout(function () {
                const qu = questionList[i];
                searchQuestionAnswer(qu, function (resultData) {
                    onSingleAnswerCompleted(resultData, qu);
                }, wid);
            }, nowTime);
        }

        const workInterval = setInterval(function () {
            if (busyThread > 0) return;
            clearInterval(workInterval);

            // 正确率计算与 NaN 保护
            let currentAccuracy = totalQuestionNum > 0 ? Math.floor(((totalQuestionNum - questionNum) / totalQuestionNum) * 100) : 100;

            if (currentAccuracy >= curAccuracy && _w.top.unrivalAutoSubmit == '1') {
                _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                pushWorkLog('正确率符合标准 (' + currentAccuracy + '% >= ' + curAccuracy + '%)，已提交测试');
                setTimeout(function () {
                    if (typeof _w.submitCheckTimes === 'function') _w.submitCheckTimes();
                    else if (typeof submitCheckTimes === 'function') submitCheckTimes();

                    if (typeof _w.escapeBlank === 'function') _w.escapeBlank();
                    else if (typeof escapeBlank === 'function') escapeBlank();

                    if (typeof _w.submitAction === 'function') _w.submitAction();
                    else if (typeof submitAction === 'function') submitAction();

                    // 60秒仅做日志提示，不强行清空 iframe 或擅自改动状态
                    setTimeout(function () {
                        if (!_w.top.unrivalWorkDone) {
                            pushWorkLog('提示：测验提交操作已等待超过60秒，如页面未自动跳转请手动确认。');
                        }
                    }, 60000);
                }, parseInt(Math.random() * 2000 + 3000, 10));
            } else if (_w.top.unrivalAutoSave == '1') {
                pushWorkLog('正确率(' + currentAccuracy + '%)未达提交标准或未开启自动提交，已自动保存答案');
                setTimeout(function () {
                    _w.top.unrivalDoneWorkId = getQueryVariable('workId');
                    if (typeof _w.noSubmit === 'function') {
                        _w.noSubmit();
                    } else if (typeof noSubmit === 'function') {
                        noSubmit();
                    }
                    setTimeout(function () {
                        if (!_w.top.unrivalWorkDone) {
                            pushWorkLog('提示：测验保存操作已等待超过60秒，如未提示保存成功请手动确认。');
                        }
                    }, 60000);
                }, 2000);
            } else {
                pushWorkLog('当前正确率：' + currentAccuracy + '%，用户设置为不自动保存，请手动处理作业');
            }
        }, 1000);
    });
}


    // ==================== 模块: pages/misc.js ====================
// ==========================================
// 路由模块: 其他次要页面 (已批阅页、学习统计、课程章节统计)
// ==========================================

function initMiscPages() {
    if (_l.href.includes('work/phone/selectWorkQuestionYiPiYue')) {
        _w.top.unrivalWorkDone = true;
        _w.top.unrivalDoneWorkId = getQueryVariable('workId');
    } else if (_l.href.includes('stat2-ans.chaoxing.com/task/s/index')) {
        if (_w.top === _w) return;
        let pageC = _d.getElementsByClassName('page-container studentStatistic')[0];
        if (pageC) pageC.setAttribute('class', 'studentStatistic');
        let taskL = _d.getElementsByClassName('page-item item-task-list minHeight390')[0];
        if (taskL) taskL.remove();
        let subN = _d.getElementsByClassName('subNav clearfix')[0];
        if (subN) subN.remove();
        setInterval(function () {
            _l.reload();
        }, 90000);
    } else if (_l.pathname.includes('/mycourse/studentcourse')) {
        try {
            const getParam = (key) => {
                const params = new URLSearchParams(_l.search);
                return params.get(key) || params.get(key.toLowerCase()) || params.get(key.toUpperCase()) || '';
            };

            const cId = getParam('courseId') || getParam('courseid');
            const clId = getParam('clazzId') || getParam('clazzid');
            let uid = UID || getParam('cpi') || getParam('userId') || getParam('uid') || (typeof getCookie === 'function' ? (getCookie('_uid') || getCookie('UID')) : '') || '';

            const statUrl = `${_p}//${_h}/moocAnalysis/chapterStatisticByUser?courseId=${cId}&clazzid=${clId}${uid ? '&userId=' + uid : ''}`;

            const injectStatLink = () => {
                try {
                    const ztLogo = _d.querySelector('.zt_logo') || _d.querySelector('.course_title') || _d.querySelector('.cur_title');
                    if (!ztLogo) return;

                    const totalItems = _d.querySelectorAll('.chapter_item, .icon').length;
                    const unfinishedItems = _d.querySelectorAll('em:not(.openlock)').length;
                    let statText = '📊 章节统计';
                    if (unfinishedItems > 0) {
                        statText += ` (待完成: ${unfinishedItems})`;
                    } else if (totalItems > 0) {
                        statText += ` (已全部完成)`;
                    }

                    let statLink = _d.getElementById('cxCourseStatLink');
                    if (!statLink) {
                        statLink = _d.createElement('a');
                        statLink.id = 'cxCourseStatLink';
                        statLink.target = '_blank';
                        statLink.rel = 'noopener';
                        statLink.title = '点击打开课程章节学习统计';
                        statLink.style.cssText = 'margin-left: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 14px; font-size: 12px; font-weight: 500; text-decoration: none; vertical-align: middle; cursor: pointer; transition: all 0.2s;';
                        statLink.onmouseover = function () { this.style.backgroundColor = '#dbeafe'; };
                        statLink.onmouseout = function () { this.style.backgroundColor = '#eff6ff'; };
                        ztLogo.parentNode.insertBefore(statLink, ztLogo.nextSibling);
                    }
                    statLink.href = statUrl;
                    statLink.innerText = statText;
                } catch (err) {
                    console.error('[StatLink Inject Error]', err);
                }
            };

            injectStatLink();
            setTimeout(injectStatLink, 1000);
            setTimeout(injectStatLink, 3000);
        } catch (e) {
            console.error('[initMiscPages studentcourse error]', e);
        }
    }
}


    // ==================== 模块: main.js ====================
// ==========================================
// 入口分发器: 根据当前 location.href 唤醒对应子页面模块
// ==========================================

if (_l.href.indexOf("knowledge/cards") > 0) {
    initCardsPage();
} else if (_l.href.includes("mycourse/studentstudy")) {
    initStudentStudyPage();
} else if (_l.href.indexOf("work/phone/doHomeWork") > 0) {
    initHomeWorkPage();
} else if (_l.pathname.includes("/mycourse/studentcourse")) {
    initMiscPages();
} else {
    initMiscPages();
}


})();
