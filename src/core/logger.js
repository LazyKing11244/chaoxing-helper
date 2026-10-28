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
