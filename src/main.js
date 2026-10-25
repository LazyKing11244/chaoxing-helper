// ==========================================
// 入口分发器: 根据当前 location.href 唤醒对应子页面模块
// ==========================================

if (_l.href.indexOf("knowledge/cards") > 0) {
    initCardsPage();
} else if (_l.href.includes("mycourse/studentstudy")) {
    initStudentStudyPage();
} else if (_l.href.indexOf("work/phone/doHomeWork") > 0) {
    initHomeWorkPage();
} else {
    initMiscPages();
}
