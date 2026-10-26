// ==========================================
// 路由模块: knowledge/cards (任务调度、视频/音频/文档/测验 iframe 控制)
// ==========================================

function initCardsPage() {
    let spans = _d.getElementsByTagName('span');
    for (let i = 0, l = spans.length; i < l; i++) {
        if (spans[i].innerHTML.indexOf('章节未开放') !== -1) {
            if (_l.href.indexOf("ut=s") !== -1) {
                _l.href = _l.href.replace("ut=s", "ut=t").replace(/&cpi=[0-9]{1,10}/, '');
            } else if (_l.href.indexOf("ut=t") !== -1) {
                spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！';
                return;
            }
            break;
        }
    }
    _w.top.unrivalPageRd = String(Math.random());

    let busyThread = 0;
    const getStr = (str, start, end) => {
        let res = str.substring(str.indexOf(start), str.indexOf(end)).replace(start, '');
        return res;
    };
    const scripts = _d.getElementsByTagName('script');
    let param = null;
    for (let i = 0, l = scripts.length; i < l; i++) {
        if (scripts[i].innerHTML.indexOf('mArg = "";') !== -1 && scripts[i].innerHTML.indexOf('==UserScript==') === -1) {
            param = getStr(scripts[i].innerHTML, 'try{\n    mArg = ', ';\n}catch(e){');
        }
    }
    if (param === null) return;

    let vrefer;
    try {
        vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
    } catch (e) {
        vrefer = _p + '//' + _h + '/ananas/modules/video/index.html?v=2022-1118-1729';
    }
    GM_setValue('vrefer', vrefer);
    GM_setValue('host', _h);

    _d.getElementsByTagName("html")[0].innerHTML = CARDS_PANEL_HTML;
    bindPanelEvents();

    const fallbackOpenUrl = (url) => {
        try {
            const tempA = _d.createElement('a');
            tempA.href = url;
            tempA.target = '_blank';
            tempA.rel = 'noopener';
            tempA.referrerPolicy = 'no-referrer-when-downgrade';
            _d.body.appendChild(tempA);
            tempA.click();
            _d.body.removeChild(tempA);
        } catch (e) {
            window.open(url, '_blank');
        }
    };

    const downloadMedia = (url, name) => {
        if (!url) {
            alert('未获取到该资源的有效直链！');
            return;
        }
        let fileName = (name || 'resource').trim();
        if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
            fileName += '.mp4';
        }
        logs.addLog('正在发起资源下载：' + fileName, 'blue');

        if (typeof GM_download === 'function') {
            try {
                GM_download({
                    url: url,
                    name: fileName,
                    saveAs: false,
                    headers: {
                        'Referer': vrefer || (_p + '//' + _h + '/ananas/modules/video/index.html')
                    },
                    onload: function () {
                        logs.addLog('资源下载完成：' + fileName, 'green');
                    },
                    onerror: function (err) {
                        const errMsg = (err && (err.error || err.details)) || '未授权或跨域';
                        logs.addLog('油猴下载受阻(' + errMsg + ')，已转为直接打开直链', 'orange');
                        fallbackOpenUrl(url);
                    },
                    ontimeout: function () {
                        logs.addLog('下载连接超时，已转为直接打开直链', 'orange');
                        fallbackOpenUrl(url);
                    }
                });
                return;
            } catch (e) {
                logs.addLog('调用 GM_download 异常，启用备用通道', 'orange');
            }
        }

        fallbackOpenUrl(url);
    };

    // 绑定任务列表中下载与直链复制按钮事件委托
    if (!_d.__unrivalMediaActionsBound) {
        _d.__unrivalMediaActionsBound = true;
        _d.addEventListener('click', function (e) {
            const target = e.target;
            if (!target || !target.classList) return;

            // 1. 复制直链
            if (target.classList.contains('unrival-copy-link')) {
                e.preventDefault();
                const rawUrl = decodeURIComponent(target.getAttribute('data-url') || '');
                if (rawUrl) {
                    if (typeof GM_setClipboard === 'function') {
                        GM_setClipboard(rawUrl);
                        alert('直链已成功复制到剪贴板！\n如使用 IDM/迅雷 下载，若遇 403 请将引用页(Referer)填入：\n' + (vrefer || (_p + '//' + _h)));
                    } else {
                        prompt('请手动复制直链：', rawUrl);
                    }
                }
            }

            // 2. 触发下载
            if (target.classList.contains('unrival-download-btn')) {
                e.preventDefault();
                const rawUrl = decodeURIComponent(target.getAttribute('data-url') || '');
                const rawName = decodeURIComponent(target.getAttribute('data-name') || 'resource');
                if (rawUrl) {
                    downloadMedia(rawUrl, rawName);
                }
            }
        });
    }

    const missionList = {};

    const loopjob = () => {
        if (_w.top.unrivalScriptList && _w.top.unrivalScriptList.length > 1) {
            logs.addLog('您同时开启了多个刷课脚本，可能导致异常记录！', 'red');
        }
        if (stop) return;

        let missionli = missionList;
        if (Object.keys(missionli).length === 0) {
            setTimeout(loopjob, 500);
            return;
        }
        for (let itemName in missionli) {
            if (missionli[itemName]['running']) {
                setTimeout(loopjob, 500);
                return;
            }
        }
        for (let itemName in missionli) {
            if (!missionli[itemName]['done']) {
                switch (missionli[itemName]['type']) {
                    case 'video':
                        doVideo(missionli[itemName]);
                        break;
                    case 'document':
                        doDocument(missionli[itemName]);
                        break;
                    case 'work':
                        doWork(missionli[itemName]);
                        break;
                }
                setTimeout(loopjob, 500);
                return;
            }
        }
        if (busyThread <= 0) {
            let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
            if (curJump != 2) {
                _w.top.jump = true;
                logs.addLog('所有任务处理完毕，5秒后自动进入下一章', 'green');
            } else {
                logs.addLog('所有任务处理完毕，用户设置为不跳转，脚本已就绪', 'green');
            }
        } else {
            setTimeout(loopjob, 500);
        }
    };

    const readyCheck = () => {
        setTimeout(function () {
            try {
                let isBgActive = (_w.top && _w.top.backNow == 1) || GM_getValue('unrivalbacknow', '0') === '1';
                if (isBgActive) {
                    if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
                }
                let bgBtn = _d.getElementById('backGround');
                if (bgBtn) {
                    bgBtn.setAttribute('class', isBgActive ? 'btn btn-success btn-sm' : 'btn btn-default btn-sm');
                    bgBtn.innerText = isBgActive ? '已激活挂机' : '激活挂机';
                }
                if (_w.top.unrivalReviewMode == '1') {
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过', 'green');
                    _d.getElementById('reviewModeButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalReviewMode]);
                }
                if (_w.top.unrivalDoWork == '1') {
                    logs.addLog('自动做章节测试已开启', 'green');
                    _d.getElementById('autoDoWorkButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalDoWork]);
                }
                _d.getElementById('autoSubmitButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalAutoSubmit]);
                _d.getElementById('autoSaveButton').setAttribute('class', ['btn btn-default btn-sm', 'btn btn-success btn-sm'][_w.top.unrivalAutoSave]);
            } catch (e) {
                console.log(e);
                readyCheck();
            }
        }, 500);
    };

    readyCheck();

    let pageData;
    try {
        pageData = JSON.parse(param);
    } catch (e) {
        let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
        if (curJump != 2) {
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动进入下一章', 'green');
        } else {
            logs.addLog('此页无任务，用户设置为不跳转，脚本已就绪', 'green');
        }
        return;
    }

    const data = pageData['defaults'];
    const jobList = [];
    const classIdFromData = data['clazzId'];
    const chapterId = data['knowledgeid'];
    const reportUrl = data['reportUrl'];
    UID = UID || data['userid'];
    FID = FID || data['fid'];

    for (let i = 0, l = pageData['attachments'].length; i < l; i++) {
        let item = pageData['attachments'][i];
        if (item['job'] !== true || item['isPassed'] === true) {
            if (_w.top.unrivalReviewMode == '1' && item['type'] === 'video') {
                jobList.push(item);
            }
            continue;
        } else {
            jobList.push(item);
        }
    }

    const video_getReady = (item) => {
        let statusUrl = _p + '//' + _h + '/ananas/status/' + item['property']['objectid'] + '?k=' +
            FID + '&flag=normal&_dc=' + String(Math.round(new Date())),
            doubleSpeed = item['property']['doublespeed'];
        busyThread += 1;
        GM_xmlhttpRequest({
            method: "get",
            headers: {
                'Host': _h,
                'Referer': vrefer,
                'Sec-Fetch-Site': 'same-origin'
            },
            url: statusUrl,
            timeout: 10000,
            onload: function (res) {
                try {
                    busyThread -= 1;
                    let videoInfo = JSON.parse(res.responseText),
                        duration = videoInfo['duration'],
                        dtoken = videoInfo['dtoken'];
                    if (duration === undefined) {
                        _d.getElementById('joblist').innerHTML += `
                        <div class="panel panel-default">
                            <div class="panel-body">[无效视频] ${item['property']['name']}</div>
                        </div>`;
                        return;
                    }
                    missionList['m' + item['jobid']] = {
                        'module': item['property']['module'],
                        'type': 'video',
                        'dtoken': dtoken,
                        'duration': duration,
                        'objectId': item['property']['objectid'],
                        'rt': item['property']['rt'] || '0.9',
                        'otherInfo': item['otherInfo'],
                        'doublespeed': doubleSpeed,
                        'jobid': item['jobid'],
                        'name': item['property']['name'],
                        'done': false,
                        'running': false
                    };
                    const vObjId = (item['property'] && item['property']['objectid']) || item['objectid'] || '';
                    const realVideoUrl = videoInfo['httphd'] || videoInfo['http'] || videoInfo['download'] || '';
                    const finalVideoUrl = realVideoUrl || (vObjId ? `https://d0.ananas.chaoxing.com/download/${vObjId}` : '');
                    const vName = (item['property'] && item['property']['name']) || 'video.mp4';
                    let vDownloadLink = '';
                    if (finalVideoUrl) {
                        vDownloadLink = `
                            <span style="float:right;font-size:12px;">
                                <a href="javascript:void(0);" class="unrival-download-btn" data-url="${encodeURIComponent(finalVideoUrl)}" data-name="${encodeURIComponent(vName)}" style="color:#337ab7;font-weight:600;text-decoration:none;margin-right:8px;" title="使用油猴直接下载到本地">下载</a>
                                <a href="${finalVideoUrl}" target="_blank" rel="noopener" referrerpolicy="no-referrer-when-downgrade" style="color:#8a6d3b;text-decoration:none;margin-right:8px;" title="在新标签页播放预览">播放</a>
                                <a href="javascript:void(0);" class="unrival-copy-link" data-url="${encodeURIComponent(finalVideoUrl)}" style="color:#5cb85c;text-decoration:none;" title="复制直链至 IDM/下载器">复制直链</a>
                            </span>`;
                    }
                    _d.getElementById('joblist').innerHTML += `
                        <div class="panel panel-default">
                            <div class="panel-body">${vDownloadLink}[视频] ${item['property']['name']}</div>
                        </div>`;
                } catch (e) { }
            },
            onerror: function (err) {
                busyThread -= 1;
                logs.addLog('获取任务详情失败：' + (err.error || '网络错误'), 'red');
            },
            ontimeout: function () {
                busyThread -= 1;
                logs.addLog('获取任务详情超时，已自动跳过该任务', 'red');
            }
        });
    };

    const doVideo = (item) => {
        if (rate <= 0) {
            missionList['m' + item['jobid']]['running'] = true;
            logs.addLog('倍速不合法，视频已跳过', 'orange');
            setTimeout(function () {
                missionList['m' + item['jobid']]['running'] = false;
                missionList['m' + item['jobid']]['done'] = true;
            }, 5000);
            return;
        }
        let videojs_id = String(parseInt(Math.random() * 9999999));
        _d.cookie = 'videojs_id=' + videojs_id + ';path=/';
        logs.addLog('开始学习：' + item['name'] + '，倍速：' + String(rate) + '倍');
        logs.addLog('观看信息每60秒上报一次，请耐心等待', 'green');

        let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : disableMonitor;
        if (curDisableMonitor) {
            logs.addLog('已开启解除多端学习监控', 'orange');
        }

        const mod = (item['module'] || (item['property'] && item['property']['module']) || '').toLowerCase();
        const isAudio = mod.includes('audio') || mod.includes('mp3') || mod.includes('m4a');
        let dtype = isAudio ? 'Audio' : 'Video';
        let rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');

        let playTime = 0,
            playsTime = 0,
            isdrag = '3',
            times = 0,
            first = true,
            lastTickTime = Date.now(),
            lastReportTime = 0,
            loop = createWorkerTimer(function () {
                if (rate <= 0) {
                    loop.stop();
                    logs.addLog('倍速不合法，视频已跳过', 'orange');
                    setTimeout(function () {
                        missionList['m' + item['jobid']]['running'] = false;
                        missionList['m' + item['jobid']]['done'] = true;
                    }, 5000);
                    return;
                }
                rt = isAudio ? '' : (missionList['m' + item['jobid']]['rt'] || '0.9');
                dtype = isAudio ? 'Audio' : 'Video';

                let now = Date.now();
                let deltaSec = (now - lastTickTime) / 1000;
                lastTickTime = now;
                if (deltaSec <= 0 || deltaSec > 5) deltaSec = 1;
                playsTime += deltaSec * rate;
                playTime = Math.min(item['duration'], Math.ceil(playsTime));

                if (first || playTime >= item['duration'] || now - lastReportTime >= 29500 || times === 0 || times % 30 === 0) {
                    lastReportTime = now;
                    if (first) playTime = 0;
                    if (playTime >= item['duration']) {
                        loop.stop();
                        playTime = item['duration'];
                        isdrag = '4';
                    } else if (playTime > 0) {
                        isdrag = '0';
                    }

                    // 本地计算 MD5 签名
                    let strEc = `[${classIdFromData}][${UID}][${item['jobid']}][${item['objectId']}][${playTime * 1000}][d_yHJ!$pdA~5][${item['duration'] * 1000}][0_${item['duration']}]`;
                    let enc = '';
                    if (typeof jq !== 'undefined' && jq && typeof jq.md5 === 'function') {
                        enc = jq.md5(strEc);
                    } else {
                        enc = localMd5(strEc);
                    }
                    if (!enc || enc.length !== 32) {
                        enc = localMd5(strEc);
                    }

                    let reportsUrl = reportUrl + '/' + item['dtoken'] +
                        '?clazzId=' + classIdFromData + '&playingTime=' + playTime +
                        '&duration=' + item['duration'] + '&clipTime=0_' + item['duration'] +
                        '&objectId=' + item['objectId'] + '&otherInfo=' + item['otherInfo'] +
                        '&jobid=' + item['jobid'] + '&userid=' + UID + '&isdrag=' + isdrag +
                        '&view=pc&enc=' + enc + '&rt=' + rt + '&dtype=' + dtype +
                        '&_t=' + String(Math.round(new Date()));

                    busyThread += 1;
                    var _bold_playTime = playTime;
                    GM_xmlhttpRequest({
                        method: "get",
                        headers: {
                            'Host': _h,
                            'Referer': vrefer,
                            'Sec-Fetch-Site': 'same-origin',
                            'Content-Type': 'application/json'
                        },
                        url: reportsUrl,
                        timeout: 15000,
                        onload: function (res) {
                            try {
                                let today = new Date(),
                                    todayStr = today.getFullYear() + 'd' + today.getMonth() + 'd' + today.getDate(),
                                    timelong = GM_getValue('unrivaltimelong', {});
                                if (timelong[UID] === undefined || timelong[UID]['today'] !== todayStr) {
                                    timelong[UID] = { 'time': 0, 'today': todayStr };
                                } else {
                                    timelong[UID]['time']++;
                                }
                                GM_setValue('unrivaltimelong', timelong);
                                busyThread -= 1;
                                if (timelong[UID]['time'] / 60 > 22 && item['doublespeed'] === 0 && _w.top.unrivalReviewMode == '0') {
                                    loop.stop();
                                    logs.addLog('今日学习时间过长，已暂停，建议明日继续学习', 'red');
                                    setTimeout(function () {
                                        missionList['m' + item['jobid']]['running'] = false;
                                        missionList['m' + item['jobid']]['done'] = true;
                                    }, 5000);
                                    return;
                                }
                                let ispass = JSON.parse(res.responseText);
                                first = false;
                                if (ispass['isPassed'] && _w.top.unrivalReviewMode == '0') {
                                    logs.addLog('视频任务已完成', 'green');
                                    missionList['m' + item['jobid']]['running'] = false;
                                    missionList['m' + item['jobid']]['done'] = true;
                                    loop.stop();
                                    return;
                                } else if (isdrag === '4') {
                                    if (_w.top.unrivalReviewMode == '1') {
                                        logs.addLog('视频已观看完毕', 'green');
                                    } else {
                                        logs.addLog('视频已观看完毕，等待超星更新进度', 'orange');
                                    }
                                    missionList['m' + item['jobid']]['running'] = false;
                                    missionList['m' + item['jobid']]['done'] = true;
                                    try {
                                        loop.stop();
                                    } catch (e) { }
                                } else {
                                    logs.addLog(item['name'] + ' 已观看 ' + _bold_playTime + ' 秒，剩余大约 ' + String(item['duration'] - _bold_playTime) + ' 秒');
                                }
                            } catch (e) {
                                if (res.responseText && res.responseText.indexOf('验证码') >= 0) {
                                    logs.addLog('已被超星风控，请 <a href="' + reportsUrl + '" target="_blank">点击此处手动处理</a>，60秒后自动刷新', 'red');
                                    missionList['m' + item['jobid']]['running'] = false;
                                    loop.stop();
                                    stop = true;
                                    setTimeout(function () { _l.reload(); }, 60000);
                                    return;
                                }
                                logs.addLog('超星服务器响应异常，将在10秒后重试', 'red');
                                times = -10;
                            }
                        },
                        onerror: function (err) {
                            busyThread -= 1;
                            logs.addLog('观看任务汇报失败：' + (err.error || '网络错误'), 'red');
                            missionList['m' + item['jobid']]['running'] = false;
                            loop.stop();
                        },
                        ontimeout: function () {
                            busyThread -= 1;
                            logs.addLog('观看任务汇报超时，正在等待下次重试...', 'orange');
                        }
                    });
                }
                times += 1;
            }, 1000);
        missionList['m' + item['jobid']]['running'] = true;
    };

    const doDocument = (item) => {
        missionList['m' + item['jobid']]['running'] = true;
        logs.addLog('开始学习文档：' + item['name']);
        setTimeout(function () {
            busyThread += 1;
            GM_xmlhttpRequest({
                method: "get",
                url: _p + '//' + _h + '/ananas/job/document?jobid=' + item['jobid'] +
                    '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' +
                    classIdFromData + '&jtoken=' + item['jtoken'],
                onload: function (res) {
                    try {
                        busyThread -= 1;
                        let ispass = JSON.parse(res.responseText);
                        if (ispass['status']) {
                            logs.addLog('文档任务已完成', 'green');
                        } else {
                            logs.addLog('文档任务未完成，可能是超星网络延迟', 'red');
                        }
                    } catch (e) {
                        logs.addLog('文档任务解析错误', 'red');
                    }
                    missionList['m' + item['jobid']]['running'] = false;
                    missionList['m' + item['jobid']]['done'] = true;
                },
                onerror: function (err) {
                    busyThread -= 1;
                    logs.addLog('文档任务请求错误', 'red');
                    missionList['m' + item['jobid']]['running'] = false;
                    missionList['m' + item['jobid']]['done'] = true;
                }
            });
        }, parseInt(Math.random() * 2000 + 4000, 10));
    };

    const doWork = (item) => {
        missionList['m' + item['jobid']]['running'] = true;
        logs.addLog('开始刷章节测试：' + item['name']);
        logs.addLog('您设置的答题合格正确率为：' + String(accuracy) + '%，只有达到此标准才会自动提交', 'blue');

        // 重置并展示答题结果速览面板
        _w.top.unrivalWorkResults = [];
        const quizSummaryPanel = _d.getElementById('quizSummaryPanel');
        if (quizSummaryPanel) {
            quizSummaryPanel.style.display = 'block';
        }
        if (typeof renderQuizSummary === 'function') {
            renderQuizSummary([]);
        }

        _d.getElementById('workPanel').style.display = 'block';
        _d.getElementById('frame_content').src = _p + '//' + _h + '/work/phone/work?workId=' + item['jobid']
            .replace('work-', '') + '&courseId=' + courseId + '&clazzId=' + classIdFromData + '&knowledgeId=' +
            chapterId + '&jobId=' + item['jobid'] + '&enc=' + item['enc'];
        _w.top.unrivalWorkInfo = '';
        _w.top.unrivalDoneWorkId = '';

        let lastResultsLen = 0;
        let workInfoTimer = setInterval(function () {
            if (_w.top.unrivalWorkInfo != '') {
                logs.addLog(_w.top.unrivalWorkInfo);
                _w.top.unrivalWorkInfo = '';
            }
            if (Array.isArray(_w.top.unrivalWorkResults) && _w.top.unrivalWorkResults.length !== lastResultsLen) {
                lastResultsLen = _w.top.unrivalWorkResults.length;
                if (typeof renderQuizSummary === 'function') {
                    renderQuizSummary(_w.top.unrivalWorkResults);
                }
            }
        }, 100);

        let checkcross = setInterval(function () {
            if (_w.top.unrivalWorkDone == false) {
                clearInterval(checkcross);
                return;
            }
            let ifW = _d.getElementById('frame_content').contentWindow;
            try {
                ifW.location.href;
            } catch (e) {
                if (e.message.indexOf('cross-origin') !== -1) {
                    clearInterval(checkcross);
                    _w.top.unrivalWorkDone = true;
                    return;
                }
            }
        }, 2000);

        let workDoneInterval = createWorkerTimer(function () {
            if (_w.top.unrivalWorkDone) {
                _w.top.unrivalWorkDone = false;
                workDoneInterval.stop();
                clearInterval(workInfoTimer);
                clearInterval(checkcross);
                _w.top.unrivalDoneWorkId = '';
                if (Array.isArray(_w.top.unrivalWorkResults) && typeof renderQuizSummary === 'function') {
                    renderQuizSummary(_w.top.unrivalWorkResults);
                }
                _d.getElementById('workPanel').style.display = 'none';
                _d.getElementById('frame_content').src = '';
                setTimeout(function () {
                    missionList['m' + item['jobid']]['running'] = false;
                    missionList['m' + item['jobid']]['done'] = true;
                }, 5000);
            }
        }, 500);
    };

    if (jobList.length <= 0) {
        let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : jumpType;
        if (curJump != 2) {
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动进入下一章', 'green');
        } else {
            logs.addLog('此页无任务，用户设置为不跳转，脚本已就绪', 'green');
        }
        return;
    }

    for (let i = 0, l = jobList.length; i < l; i++) {
        let item = jobList[i];
        if (item['type'] === 'video') {
            video_getReady(item);
        } else if (item['type'] === 'document') {
            const dObjId = (item['property'] && item['property']['objectid']) || item['objectid'] || '';
            const dUrl = dObjId ? `https://d0.ananas.chaoxing.com/download/${dObjId}` : '';
            const dName = (item['property'] && item['property']['name']) || 'document';
            const dDownloadLink = dUrl ? `
                <span style="float:right;font-size:12px;">
                    <a href="javascript:void(0);" class="unrival-download-btn" data-url="${encodeURIComponent(dUrl)}" data-name="${encodeURIComponent(dName)}" style="color:#337ab7;font-weight:600;text-decoration:none;margin-right:8px;" title="使用油猴直接下载到本地">下载</a>
                    <a href="${dUrl}" target="_blank" rel="noopener" referrerpolicy="no-referrer-when-downgrade" style="color:#8a6d3b;text-decoration:none;margin-right:8px;" title="在新标签页打开预览">预览</a>
                    <a href="javascript:void(0);" class="unrival-copy-link" data-url="${encodeURIComponent(dUrl)}" style="color:#5cb85c;text-decoration:none;" title="复制直链至 IDM/下载器">复制直链</a>
                </span>` : '';
            missionList['m' + item['jobid']] = {
                'type': 'document',
                'jtoken': item['jtoken'],
                'jobid': item['jobid'],
                'name': item['property']['name'],
                'done': false,
                'running': false
            };
            _d.getElementById('joblist').innerHTML += `
                <div class="panel panel-default">
                    <div class="panel-body">${dDownloadLink}[文档] ${item['property']['name']}</div>
                </div>`;
        } else if (item['type'] === 'workid' && _w.top.unrivalDoWork == '1') {
            missionList['m' + item['jobid']] = {
                'type': 'work',
                'workid': item['property']['workid'],
                'jobid': item['jobid'],
                'name': item['property']['title'] || item['property']['name'] || '章节测试',
                'enc': item['enc'],
                'done': false,
                'running': false
            };
            _d.getElementById('joblist').innerHTML += `
                <div class="panel panel-default">
                    <div class="panel-body">[测试] ${item['property']['title']}</div>
                </div>`;
        } else {
            try {
                let jobName = item['property']['name'] || item['property']['title'] || '未知任务';
                _d.getElementById('joblist').innerHTML += `
                    <div class="panel panel-default">
                        <div class="panel-body">已跳过：${jobName}</div>
                    </div>`;
            } catch (e) { }
        }
    }

    loopjob();
}
