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

const bgLogs = {
    logArry: [],
    addLog: function (str, color = "black") {
        if (this.logArry.length >= 50) {
            this.logArry.splice(0, 1);
        }
        const nowTime = new Date(),
            nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2),
            nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2),
            nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2),
            logElement = _d.getElementById('log');
        let logStr = "";
        this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" + nowSec + "] " + str + "</span>");
        for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
            logStr += this.logArry[logI] + "<br>";
        }
        if (logElement) {
            logElement.innerHTML = logStr;
            logElement.scrollTop = logElement.scrollHeight;
        }
    }
};
