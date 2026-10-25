// ==========================================
// 通用工具函数与字符串/DOM降噪处理
// ==========================================

function getQueryVariable(variable) {
    const q = _l.search.substring(1);
    const v = q.split("&");
    let r = false;
    for (let i = 0, l = v.length; i < l; i++) {
        const p = v[i].split("=");
        if (p[0] === variable) r = p[1];
    }
    return r;
}

function getCookie(name) {
    return `; ${document.cookie}`.split(`; ${name}=`).pop().split(';').shift();
}

// 将富文本题干中的 img 标签替换为纯文本 URL，避免标签干扰
function handleImgs(s) {
    if (!s || typeof s !== 'string') return '';
    const imgEs = s.match(/(<img([^>]*)>)/g);
    if (imgEs) {
        for (let j = 0, k = imgEs.length; j < k; j++) {
            const urls = imgEs[j].match(/http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/);
            if (urls) {
                const url = urls[0].replace(/http[s]?:\/\//, '');
                s = s.replaceAll(imgEs[j], url);
            }
        }
    }
    return s;
}

// 去除标点符号与 HTML 标签的标准化修剪
function trim(s) {
    if (!s || typeof s !== 'string') return '';
    return handleImgs(s)
        .replaceAll('javascript:void(0);', '')
        .replaceAll("&nbsp;", ' ')
        .replaceAll("，", ',')
        .replaceAll("。", '.')
        .replaceAll("：", ':')
        .replaceAll("；", ';')
        .replaceAll("？", '?')
        .replaceAll("（", '(')
        .replaceAll("）", ')')
        .replaceAll("“", '"')
        .replaceAll("”", '"')
        .replaceAll("！", '!')
        .replaceAll("-", ' ')
        .replace(/(<([^>]+)>)/ig, '')
        .replace(/^\s+/ig, '')
        .replace(/\s+$/ig, '');
}

// 答案与选项比对专用高强度降噪清洗（转小写并剔除所有不可见字符与常见标点）
function cleanText(s) {
    if (!s || typeof s !== 'string') return '';
    return trim(s)
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[\u200b-\u200d\uFEFF]/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/[，,。\.：:；;？\?（\(）\)“”"！!\-_\s]/g, '')
        .toLowerCase();
}
