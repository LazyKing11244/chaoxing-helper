// ==========================================
// 路由模块: 其他次要页面 (已批阅页、学习统计、自动登录、挂机小助手背景页)
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
    } else if (_l.href.includes('passport2.') && _l.href.includes('login?refer=http') && autoLogin == 1) {
        if (!(/^1[3456789]\d{9}$/.test(phoneNumber))) {
            alert('自动登录的手机号填写错误，无法登陆');
            return;
        }
        if (password === '') {
            alert('未填写登录密码，无法登陆');
            return;
        }
        GM_xmlhttpRequest({
            method: "get",
            url: 'https://passport2-api.chaoxing.com/v11/loginregister?cx_xxt_passport=json&uname=' +
                phoneNumber + '&code=' + encodeURIComponent(password),
            onload: function (res) {
                try {
                    let ispass = JSON.parse(res.responseText);
                    if (ispass['status']) {
                        _l.href = decodeURIComponent(getQueryVariable('refer'));
                    } else {
                        alert(ispass['mes']);
                    }
                } catch (err) {
                    alert('登陆失败');
                }
            },
            onerror: function () {
                alert('登陆错误');
            }
        });
    } else if (_l.href.includes('unrivalxxtbackground')) {
        _d.getElementsByTagName("html")[0].innerHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>学习通挂机小助手</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;">学习通挂机小助手</h3>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">
                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'></div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;
        bgLogs.addLog('此页面不必保持在最前端，后台会自动进行任务', 'green');
        setInterval(function () {
            bgLogs.addLog('此页面不必保持在最前端，后台会自动进行任务', 'green');
            bgLogs.addLog('如想禁用后台刷视频功能，请关闭脚本并重启浏览器', 'blue');
        }, 120000);

        GM_addValueChangeListener('unrivalxxtbackgroundinfo', function (name, old_value, new_value) {
            if (old_value !== new_value) {
                bgLogs.addLog(new_value);
            }
        });

        setInterval(function () {
            if (Math.round(new Date() / 1000) - parseInt(GM_getValue('unrivalBackgroundVideoEnable', '6')) > 15) {
                bgLogs.addLog('超星挂机小助手可能运行异常，如页面无反应，请尝试重启脚本猫或重启浏览器');
            }
        }, 10000);

        const loopShow = () => {
            let jobList = GM_getValue('unrivalBackgroundList', '1');
            let jobListEl = _d.getElementById('joblist');
            if (!jobListEl) return;
            if (jobList === '1') {
                jobListEl.innerHTML = '请将“超星挂机小助手”升级到最新版并重启浏览器';
            } else {
                try {
                    let jobHtml = '';
                    for (let i = 0, l = jobList.length; i < l; i++) {
                        let status = '';
                        if (jobList[i]['done']) {
                            status = '已完成';
                        } else if (parseInt(jobList[i]['playTime']) > 0) {
                            status = '进行中';
                        } else {
                            status = '等待中';
                        }
                        if (jobList[i]['review']) {
                            status += '：复习模式';
                        }
                        jobHtml += `
                            <div class="panel panel-default">
                                <div class="panel-body">[${status}] ${jobList[i]['name']}</div>
                            </div>`;
                    }
                    jobListEl.innerHTML = jobHtml;
                } catch (e) {
                    jobListEl.innerHTML = '请将“超星挂机小助手”升级到最新版并重启浏览器！';
                }
            }
        };
        loopShow();
        setInterval(loopShow, 10000);
    }
}
