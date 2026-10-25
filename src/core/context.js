// ==========================================
// 核心运行环境上下文与全局变量嗅探
// ==========================================

const _w = unsafeWindow;
const _d = _w.document;
const _l = _w.location;
const _p = _l.protocol;
const _h = _l.host;

const isCat = GM_info.scriptHandler === 'ScriptCat';
const isFf = _w.navigator.userAgent.includes("Firefox");
const isMobile = _w.navigator.userAgent.includes("Android");

let cVersion = 999;
if (!isFf) {
    try {
        cVersion = parseInt(navigator.userAgent.match(/Chrome\/[0-9]{2,3}./)[0].replace('Chrome/', '').replace('.', ''));
    } catch (e) { }
}

let stop = false;
