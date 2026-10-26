// ==========================================
// 路由模块: 其他次要页面 (已批阅页、学习统计、课程章节统计)
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
    } else if (_l.pathname.includes('/mycourse/studentcourse')) {
        try {
            const getParam = (key) => {
                const params = new URLSearchParams(_l.search);
                return params.get(key) || params.get(key.toLowerCase()) || params.get(key.toUpperCase()) || '';
            };

            const cId = getParam('courseId') || getParam('courseid');
            const clId = getParam('clazzId') || getParam('clazzid');
            let uid = UID || getParam('cpi') || getParam('userId') || getParam('uid') || (typeof getCookie === 'function' ? (getCookie('_uid') || getCookie('UID')) : '') || '';

            const statUrl = `${_p}//${_h}/moocAnalysis/chapterStatisticByUser?courseId=${cId}&clazzid=${clId}${uid ? '&userId=' + uid : ''}`;

            const injectStatLink = () => {
                try {
                    const ztLogo = _d.querySelector('.zt_logo') || _d.querySelector('.course_title') || _d.querySelector('.cur_title');
                    if (!ztLogo) return;

                    const totalItems = _d.querySelectorAll('.chapter_item, .icon').length;
                    const unfinishedItems = _d.querySelectorAll('em:not(.openlock)').length;
                    let statText = '📊 章节统计';
                    if (unfinishedItems > 0) {
                        statText += ` (待完成: ${unfinishedItems})`;
                    } else if (totalItems > 0) {
                        statText += ` (已全部完成)`;
                    }

                    let statLink = _d.getElementById('cxCourseStatLink');
                    if (!statLink) {
                        statLink = _d.createElement('a');
                        statLink.id = 'cxCourseStatLink';
                        statLink.target = '_blank';
                        statLink.rel = 'noopener';
                        statLink.title = '点击打开课程章节学习统计';
                        statLink.style.cssText = 'margin-left: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 14px; font-size: 12px; font-weight: 500; text-decoration: none; vertical-align: middle; cursor: pointer; transition: all 0.2s;';
                        statLink.onmouseover = function () { this.style.backgroundColor = '#dbeafe'; };
                        statLink.onmouseout = function () { this.style.backgroundColor = '#eff6ff'; };
                        ztLogo.parentNode.insertBefore(statLink, ztLogo.nextSibling);
                    }
                    statLink.href = statUrl;
                    statLink.innerText = statText;
                } catch (err) {
                    console.error('[StatLink Inject Error]', err);
                }
            };

            injectStatLink();
            setTimeout(injectStatLink, 1000);
            setTimeout(injectStatLink, 3000);
        } catch (e) {
            console.error('[initMiscPages studentcourse error]', e);
        }
    }
}
