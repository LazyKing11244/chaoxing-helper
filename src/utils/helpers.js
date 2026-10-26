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
