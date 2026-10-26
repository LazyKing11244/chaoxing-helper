// ==========================================
// 本地持久化配置读取与全局状态机初始化
// ==========================================

let jumpType = parseInt(GM_getValue('unrivaljumptype', '1'), 10); // 0:智能模式，1:遍历模式，2:不跳转
let disableMonitor = parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10); // 0:无操作，1:解除多端学习监控
let randomDo = parseInt(GM_getValue('unrivalrandomdo', '1'), 10); // 0:关闭盲猜，1:开启盲猜
let backNow = parseInt(GM_getValue('unrivalbacknow', '0'), 10); // 0:未激活挂机，1:已激活挂机
let backGround = 0; // 是否对接超星挂机小助手，需要先安装对应脚本

// 自动登录配置（仅支持手机号+密码登录）
let autoLogin = 0;
let phoneNumber = '';
let password = '';

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
