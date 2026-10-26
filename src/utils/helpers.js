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
