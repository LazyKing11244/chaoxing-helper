// ==========================================
// 路由模块: 其他次要页面 (已批阅页、学习统计)
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
    }
}
