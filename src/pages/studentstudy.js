// ==========================================
// 路由模块: mycourse/studentstudy (外层课程框架、后台静音保活、自动切章)
// ==========================================

function initStudentStudyPage() {
    let savedBackNow = parseInt(GM_getValue('unrivalbacknow', '0'), 10);
    _w.top.backNow = (_w.top.backNow !== undefined && _w.top.backNow !== null) ? _w.top.backNow : savedBackNow;
    if (_w.top.backNow == 1) {
        if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
    }

    setInterval(function () {
        try {
            _w.jQuery.fn.viewer.Constructor.prototype.show = () => { };
        } catch (e) { }
    }, 1000);

    try {
        _w.unrivalScriptList.push('unrivalxxt');
    } catch (e) {
        _w.unrivalScriptList = ['unrivalxxt'];
    }

    function checkOffline() {
        let dleft = _d.getElementsByClassName('left');
        if (dleft.length === 1) {
            let img = dleft[0].getElementsByTagName('img');
            if (img.length === 1 && img[0].src.indexOf('loading.gif') !== -1) {
                return true;
            }
        }
        return false;
    }

    setInterval(function () {
        if (checkOffline()) {
            setTimeout(function () {
                if (checkOffline()) {
                    _l.reload();
                }
            }, 10000);
        }
    }, 3000);

    let titleTimer = null;
    _d.addEventListener('visibilitychange', function () {
        var c = 0;
        if (titleTimer) {
            clearInterval(titleTimer);
            titleTimer = null;
        }
        let isBackNow = (_w.top && _w.top.backNow !== undefined && _w.top.backNow !== null) ? _w.top.backNow : parseInt(GM_getValue('unrivalbacknow', '0'), 10);
        if (!isBackNow) {
            _d.title = '⚠️请先激活挂机';
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
            return;
        } else {
            _d.title = '学生学习页面';
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
        }
        if (_d.hidden) {
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.start();
            titleTimer = setInterval(function () {
                if (c) {
                    _d.title = '🙈挂机中';
                    c = 0;
                } else {
                    _d.title = '🙉挂机中';
                    c = 1;
                }
                if (!_d.hidden) {
                    clearInterval(titleTimer);
                    titleTimer = null;
                    _d.title = '学生学习页面';
                }
            }, 1300);
        } else {
            if (typeof keepAliveAudio !== 'undefined') keepAliveAudio.stop();
        }
    });

    _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
    _w.getTeacherAjax = (courseid, classid, cid) => {
        if (cid == getQueryVariable('chapterId')) {
            return;
        }
        _w.top.unrivalPageRd = '';
        _w.unrivalgetTeacherAjax(courseid, classid, cid);
    };

    let curDisableMonitor = (_w.top && _w.top.unrivalDisableMonitor !== undefined) ? _w.top.unrivalDisableMonitor : parseInt(GM_getValue('unrivaldisablemonitor', '0'), 10);
    if (curDisableMonitor == 1) {
        _w.appendChild = _w.Element.prototype.appendChild;
        _w.Element.prototype.appendChild = function () {
            try {
                if (arguments[0].src && arguments[0].src.indexOf('detect.chaoxing.com') > 0) {
                    return;
                }
            } catch (e) { }
            _w.appendChild.apply(this, arguments);
        };
    }

    _w.jump = false;
    setInterval(function () {
        if (getQueryVariable('mooc2') == '1') {
            let tabs = _d.getElementsByClassName('posCatalog_select');
            for (let i = 0, l = tabs.length; i < l; i++) {
                if (tabs[i].getAttribute('onclick') == null) {
                    tabs[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                        "','" + tabs[i].getAttribute('id').replace('cur', '') + "');");
                }
            }
        } else {
            let ncells = _d.getElementsByClassName('ncells');
            if (ncells && ncells.length > 0) {
                let h5s = ncells[0].getElementsByTagName('h5');
                for (let i = 0, l = h5s.length; i < l; i++) {
                    if (h5s[i].getAttribute('onclick') == null) {
                        h5s[i].setAttribute('onclick', "getTeacherAjax('" + courseId + "','" + classId +
                            "','" + h5s[i].getAttribute('id').replace('cur', '') + "');");
                    }
                }
            }
        }
    }, 1000);

    createWorkerTimer(function () {
        let but = null;
        if (_w.jump) {
            _w.jump = false;
            _w.top.unrivalDoneWorkId = '';
            let curJump = (_w.top && _w.top.unrivalJumpType !== undefined) ? _w.top.unrivalJumpType : parseInt(GM_getValue('unrivaljumptype', '1'), 10);
            _w.jjump = (rd) => {
                if (rd != _w.top.unrivalPageRd) {
                    return;
                }
                try {
                    setTimeout(function () {
                        if (curJump == 1) { // 遍历模式
                            if (getQueryVariable('mooc2') == '1') {
                                but = _d.getElementsByClassName('jb_btn jb_btn_92 fs14 prev_next next');
                                if (!but || but.length === 0) but = _d.getElementsByClassName('jb_btn next');
                            } else {
                                but = _d.getElementsByClassName('orientationright');
                                if (!but || but.length === 0) but = _d.querySelectorAll('.nextchapter, .next-chapter, a.next, [title="下一节"], [title="下一章"]');
                            }
                            try {
                                setTimeout(function () {
                                    if (rd != _w.top.unrivalPageRd) {
                                        return;
                                    }
                                    if (but && but.length > 0) {
                                        but[0].click();
                                    }
                                }, 2000);
                            } catch (e) { }
                            return;
                        }
                        if (getQueryVariable('mooc2') == '1') {
                            let ul = _d.getElementsByClassName('prev_ul')[0],
                                lis = ul ? ul.getElementsByTagName('li') : [];
                            for (let i = 0, l = lis.length; i < l; i++) {
                                if (lis[i].getAttribute('class') == 'active') {
                                    if (i + 1 >= l) {
                                        break;
                                    } else {
                                        try {
                                            lis[i + 1].click();
                                        } catch (e) { }
                                        return;
                                    }
                                }
                            }
                            let tabs = _d.getElementsByClassName('posCatalog_select');
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].getAttribute('class') == 'posCatalog_select posCatalog_active') {
                                    while (i + 1 < tabs.length) {
                                        let nextTab = tabs[i + 1];
                                        if ((nextTab.innerHTML.includes('icon_Completed prevTips') && _w.top
                                            .unrivalReviewMode == '0') || nextTab.innerHTML.includes('catalog_points_er prevTips')) {
                                            i++;
                                            continue;
                                        }
                                        if (nextTab.id.indexOf('cur') < 0) {
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function () {
                                            if (rd != _w.top.unrivalPageRd) {
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        }, 2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        } else {
                            let div = _d.getElementsByClassName('tabtags')[0],
                                spans = div ? div.getElementsByTagName('span') : [];
                            for (let i = 0, l = spans.length; i < l; i++) {
                                if (spans[i].getAttribute('class') && spans[i].getAttribute('class').indexOf('currents') >= 0) {
                                    if (i + 1 == l) {
                                        break;
                                    } else {
                                        try {
                                            spans[i + 1].click();
                                        } catch (e) { }
                                        return;
                                    }
                                }
                            }
                            let tabs = _d.getElementsByTagName('span'),
                                newTabs = [];
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].getAttribute('style') != null && tabs[i]
                                    .getAttribute('style').indexOf('cursor:pointer;height:18px;') >= 0) {
                                    newTabs.push(tabs[i]);
                                }
                            }
                            tabs = newTabs;
                            for (let i = 0, l = tabs.length; i < l; i++) {
                                if (tabs[i].parentNode && tabs[i].parentNode.getAttribute('class') == 'currents') {
                                    while (i + 1 < tabs.length) {
                                        let nextTab = tabs[i + 1].parentNode;
                                        if ((nextTab.innerHTML.includes('roundpoint  blue') && _w.top
                                            .unrivalReviewMode == '0') || nextTab.innerHTML.includes('roundpoint  orange')) {
                                            i++;
                                            continue;
                                        }
                                        if (nextTab.getAttribute('onclick') == null) {
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function () {
                                            if (rd != _w.top.unrivalPageRd) {
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        }, 2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    }, 2000);
                } catch (e) { }
            };
            if (typeof _w.onReadComplete1 === 'function') {
                _w.onReadComplete1();
            }
            setTimeout(() => _w.jjump(_w.top.unrivalPageRd), 2856);
        }
    }, 500);
}
