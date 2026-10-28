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
