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
