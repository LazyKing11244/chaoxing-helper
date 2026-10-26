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
